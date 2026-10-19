"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Hex } from "viem";
import { useAccount, useBytecode, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { LocalFileHash } from "@/src/components/LocalFileHash";
import { NetworkNotice } from "@/src/components/NetworkNotice";
import { SiteHeader } from "@/src/components/SiteHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { TransactionNotice } from "@/src/components/TransactionNotice";
import { contractAddressErrorFor, contractAddressFor, exactDraftAbi, isValidAgreementId, normalizeAgreement, statusLabel } from "@/src/lib/contract";
import { isAgreementNotFoundError } from "@/src/lib/contract-core.mjs";
import { formatHash, formatWallet } from "@/src/lib/hash";
import { explorerAddressUrl } from "@/src/lib/networks";
import { getNetworkConfig } from "@/src/lib/networks";
import { useTrackedTransaction } from "@/src/lib/useTrackedTransaction";
import { findContractEvent, submitSimulatedTransaction } from "@/src/lib/transaction-core.mjs";

function timestamp(value: bigint) {
  return value === 0n ? "—" : new Date(Number(value) * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function errorMessage(error: Error | null | undefined) {
  if (!error) return undefined;
  if (error.message.toLowerCase().includes("user rejected")) return "The wallet rejected this transaction.";
  if (/insufficient funds/i.test(error.message)) return "The wallet does not have enough testnet funds for this transaction.";
  if (/revert|contract function/i.test(error.message)) return "The contract rejected this acknowledgement. Check the agreement status, wallet and file match.";
  return "Could not complete the transaction. Check your wallet network and connection, then try again.";
}

export function AgreementReview({ agreementId, targetChainId }: { agreementId: string; targetChainId: number }) {
  const network = getNetworkConfig(targetChainId)!;
  const contractAddress = contractAddressFor(targetChainId);
  const contractAddressError = contractAddressErrorFor(targetChainId);
  const numericId = useMemo(() => (isValidAgreementId(agreementId) ? BigInt(agreementId) : undefined), [agreementId]);
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: targetChainId });
  const [presentedHash, setPresentedHash] = useState<Hex>();
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState<string>();
  const [readTimedOut, setReadTimedOut] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const { data: bytecode, isError: bytecodeError, isLoading: isCheckingBytecode, refetch: refetchBytecode } = useBytecode({
    address: contractAddress,
    chainId: targetChainId,
    query: { enabled: Boolean(contractAddress), retry: 1 },
  });
  const hasContract = Boolean(bytecode && bytecode !== "0x");
  const { data, isLoading, isError: readFailed, error: readError, refetch } = useReadContract({
    address: contractAddress,
    abi: exactDraftAbi,
    functionName: "getAgreement",
    args: numericId ? [numericId] : undefined,
    chainId: targetChainId,
    query: { enabled: Boolean(contractAddress && hasContract && numericId), refetchInterval: 15_000 },
  });
  const agreement = normalizeAgreement(data);
  const status = agreement ? statusLabel(agreement.status) : undefined;
  const isWrongNetwork = isConnected && chainId !== targetChainId;
  const isCounterparty = Boolean(address && agreement && agreement.counterparty.toLowerCase() === address.toLowerCase());
  const isExactMatch = Boolean(presentedHash && agreement && presentedHash.toLowerCase() === agreement.fileHash.toLowerCase());
  const { writeContractAsync, isPending } = useWriteContract();
  const [submittedHash, setSubmittedHash] = useState<Hex>();
  const receiptState = useTrackedTransaction(submittedHash, targetChainId, contractAddress, "accept");
  const { data: receipt, isLoading: isConfirming } = receiptState;
  const transactionHash = receiptState.transactionHash;
  const isConfirmed = receipt?.status === "success";
  const receiptUnresolved = Boolean(receiptState.trackedHash && !receipt && receiptState.replacement?.reason !== "cancelled");
  const hasAcceptanceEvent = Boolean(findContractEvent(receipt, exactDraftAbi, contractAddress, "AgreementAccepted", numericId));
  const acknowledgementConfirmed = isConfirmed && hasAcceptanceEvent;

  useEffect(() => {
    if (acknowledgementConfirmed) refetch();
  }, [acknowledgementConfirmed, refetch]);

  useEffect(() => {
    if (!isLoading) {
      setReadTimedOut(false);
      return;
    }

    const timeout = window.setTimeout(() => setReadTimedOut(true), 12_000);
    return () => window.clearTimeout(timeout);
  }, [isLoading]);

  function handleFile(hash: Hex | undefined, name: string) {
    setPresentedHash(hash);
    setFileName(name);
    setFormError(undefined);
  }

  async function handleAccept() {
    setFormError(undefined);
    if (!isConnected || !address) return setFormError("Connect the counterparty wallet before accepting.");
    if (isWrongNetwork) return setFormError(`Switch your wallet to ${network.label} before accepting.`);
    if (!contractAddress || !numericId || !publicClient || !hasContract) return setFormError(`ExactDraft contract code could not be verified on ${network.label}.`);
    if (!agreement || status !== "pending") return setFormError("This agreement is no longer pending.");
    if (!isCounterparty) return setFormError("Only the designated counterparty wallet can accept this agreement.");
    if (!presentedHash || !isExactMatch) return setFormError("Select the exact local copy before accepting.");

    const request = {
      address: contractAddress,
      abi: exactDraftAbi,
      functionName: "acceptAgreement",
      args: [numericId, presentedHash],
      account: address,
      chainId: targetChainId,
    } as const;
    setIsSimulating(true);
    try {
      const hash = await submitSimulatedTransaction(publicClient, writeContractAsync, request);
      setSubmittedHash(undefined);
      setSubmittedHash(hash);
    } catch (error) {
      setFormError(errorMessage(error instanceof Error ? error : undefined) ?? "Could not simulate or submit this transaction.");
    } finally {
      setIsSimulating(false);
    }
  }

  const receiptError = receipt?.status === "reverted"
    ? "The transaction was mined but reverted. The acknowledgement was not recorded."
    : receiptState.error
      ? errorMessage(receiptState.error)
      : receiptState.replacement?.reason === "cancelled"
        ? "The pending transaction was replaced by a cancellation."
        : undefined;
  const transactionError = formError ?? receiptError ?? (isConfirmed && !hasAcceptanceEvent
    ? "Transaction confirmed without an ExactDraft acknowledgement event. Open the transaction to inspect it."
    : undefined);

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 lg:px-8">
        <NetworkNotice targetChainId={targetChainId} />
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#cfd9d0] pb-6">
          <div>
            <p className="mono-label text-[10px] font-bold text-[#68736d]">Agreement record / #{agreementId}</p>
            <h1 className="display-font mt-2 text-5xl leading-none text-[#173d35] sm:text-6xl">Review the copy.</h1>
          </div>
          <Link href="/" className="text-sm font-bold text-[#205c3b] underline decoration-[#9fc9aa] underline-offset-4">← Create another agreement</Link>
        </div>

        {contractAddressError ? (
          <div role="alert" className="paper-card rounded-2xl p-6 text-sm text-[#8c302c]">{contractAddressError} Set <code>{network.contractEnvName}</code> to a valid deployed address.</div>
        ) : bytecodeError ? (
          <div role="alert" className="paper-card rounded-2xl p-6 text-sm text-[#8c302c]">Could not check contract code on {network.label}. <button type="button" onClick={() => void refetchBytecode()} className="underline underline-offset-4">Retry</button></div>
        ) : isCheckingBytecode ? (
          <div role="status" className="paper-card rounded-2xl p-8 text-sm text-[#68736d]">Checking the configured contract on {network.label}…</div>
        ) : !hasContract ? (
          <div role="alert" className="paper-card rounded-2xl p-6 text-sm text-[#8c302c]">No contract is deployed at the configured address on {network.label}.</div>
        ) : isLoading && !readTimedOut ? (
          <div role="status" aria-live="polite" className="paper-card rounded-2xl p-8 text-sm text-[#68736d]">Reading the agreement from {network.chain.name}…</div>
        ) : readFailed || !agreement ? (
          <div role="alert" className="paper-card rounded-2xl p-8 text-sm text-[#8c302c]">
            <p>{isAgreementNotFoundError(readError) ? `No agreement #${agreementId} exists at this contract on ${network.label}.` : readTimedOut ? `${network.chain.name} did not respond in time. The RPC read timed out.` : `Could not read agreement #${agreementId} from ${network.label}. Check the RPC connection and retry.`}</p>
            <button type="button" onClick={() => { setReadTimedOut(false); void refetch(); }} className="mt-5 rounded-full bg-[#173d35] px-4 py-2 text-xs font-bold text-white hover:bg-[#28594d]">Retry read</button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <section className="paper-card rounded-2xl p-6 sm:p-8" aria-labelledby="match-heading">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="mono-label text-[10px] font-bold text-[#68736d]">Local file comparison</p>
                    <h2 id="match-heading" className="display-font mt-2 text-4xl text-[#173d35]">Does your file match?</h2>
                  </div>
                  <StatusBadge status={status ?? "pending"} />
                </div>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[#52625a]">Select your own local copy (up to 25 MB). ExactDraft hashes it in this browser and compares it with the proposer’s registered digest. A matching digest is not proof that a wallet holder possessed or read the document.</p>
                <div className="mt-8">
                  <LocalFileHash onHash={handleFile} label="Counterparty file" />
                </div>

                {presentedHash ? (
                  <div className={`mt-6 rounded-2xl border p-5 ${isExactMatch ? "border-[#8fc89d] bg-[#eaf8ed]" : "border-[#e7aaa5] bg-[#fff0ee]"}`} role="status" aria-live="polite">
                    <p className={`text-lg font-black ${isExactMatch ? "text-[#205c3b]" : "text-[#8c302c]"}`}>{isExactMatch ? "Exact match" : "Mismatch"}</p>
                    <p className={`mt-1 text-sm leading-5 ${isExactMatch ? "text-[#376d4b]" : "text-[#9f4a45]"}`}>{isExactMatch ? "The local SHA-256 digest is identical to the registered digest." : "This local file is different. Acceptance is locked until the digest matches exactly."}</p>
                    <p className="mt-3 break-all font-mono text-xs text-[#52625a]">{fileName} · {formatHash(presentedHash)}</p>
                  </div>
                ) : null}

                <div className="mt-6 space-y-3">
                  {!isConnected ? <p className="rounded-xl bg-[#fff5dc] px-4 py-3 text-xs font-semibold text-[#775014]">Connect the designated counterparty wallet to accept.</p> : null}
                  {isConnected && !isCounterparty ? <p className="rounded-xl bg-[#fff5dc] px-4 py-3 text-xs font-semibold text-[#775014]">Connected wallet {formatWallet(address)} is not the designated counterparty.</p> : null}
                  {status !== "pending" ? <p className="rounded-xl bg-[#edf1eb] px-4 py-3 text-xs font-semibold text-[#52625a]">This agreement is {status} and cannot be accepted again.</p> : null}
                  <button type="button" onClick={handleAccept} disabled={!isExactMatch || !isCounterparty || !isConnected || isWrongNetwork || status !== "pending" || isSimulating || isPending || isConfirming || receiptUnresolved || isConfirmed} className="w-full rounded-xl bg-[#173d35] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#28594d] disabled:cursor-not-allowed disabled:opacity-40">
                    {isSimulating ? "Checking agreement…" : isPending ? "Confirm in wallet…" : isConfirming || receiptUnresolved ? `Waiting for ${network.chain.name}…` : "Attest exact match"}
                  </button>
                  {isWrongNetwork ? <p className="text-center text-xs font-semibold text-[#8c302c]">Wrong network — switch to {network.label} first.</p> : null}
                  <p role="status" aria-live="polite" className="min-h-5 text-center text-xs text-[#b83f39]">{transactionError}</p>
                  {receiptState.error && receiptState.trackedHash ? <div className="text-center text-xs"><button type="button" onClick={() => void receiptState.refetch()} className="font-semibold underline underline-offset-4">Retry confirmation check</button> <TransactionNotice hash={transactionHash} chainId={targetChainId} label="Open pending transaction" /></div> : null}
                  {isConfirmed && !hasAcceptanceEvent ? <div role="alert" className="text-center text-xs text-[#775014]">The transaction has no matching ExactDraft acknowledgement event. <TransactionNotice hash={transactionHash} chainId={targetChainId} label="Inspect transaction" /></div> : null}
                </div>

                {acknowledgementConfirmed && transactionHash ? <div className="mt-4 rounded-xl border border-[#b9d9bf] bg-[#f1fbf2] p-4 text-sm text-[#205c3b]"><p className="font-bold">Your attestation is confirmed on {network.chain.name}.</p><TransactionNotice hash={transactionHash} chainId={targetChainId} label="Open acceptance transaction" /></div> : null}
              </section>

              <RecordCard agreement={agreement} status={status ?? "pending"} chainId={targetChainId} />
            </div>
            <p className="mt-8 text-center text-xs leading-5 text-[#68736d]">The digest, wallet addresses, reference, and timestamps are public onchain and may reveal a match to a known document. ExactDraft records wallet acknowledgements; it does not verify identity, authority, possession, or reading, and is not an electronic-signature service or legal advice.</p>
          </>
        )}
      </div>
    </main>
  );
}

function RecordCard({ agreement, status, chainId }: { agreement: NonNullable<ReturnType<typeof normalizeAgreement>>; status: ReturnType<typeof statusLabel>; chainId: number }) {
  return (
    <section className="paper-card rounded-2xl p-6 sm:p-8" aria-labelledby="record-heading">
      <p className="mono-label text-[10px] font-bold text-[#68736d]">Final verification record</p>
      <h2 id="record-heading" className="display-font mt-2 text-4xl text-[#173d35]">What the chain knows.</h2>
      <dl className="mt-8 divide-y divide-[#e1e6e0]">
        <RecordRow label="Reference" value={agreement.reference} />
        <RecordRow label="Status" value={<StatusBadge status={status} />} />
        <RecordRow label="Proposer" value={<a href={explorerAddressUrl(agreement.proposer, chainId)} target="_blank" rel="noreferrer" className="font-mono text-xs underline underline-offset-4">{formatWallet(agreement.proposer)} ↗</a>} />
        <RecordRow label="Counterparty" value={<a href={explorerAddressUrl(agreement.counterparty, chainId)} target="_blank" rel="noreferrer" className="font-mono text-xs underline underline-offset-4">{formatWallet(agreement.counterparty)} ↗</a>} />
        <RecordRow label="SHA-256 / bytes32" value={<span className="break-all font-mono text-xs">{agreement.fileHash}</span>} />
        <RecordRow label="Created" value={timestamp(agreement.createdAt)} />
        <RecordRow label="Expires" value={timestamp(agreement.expiresAt)} />
        <RecordRow label="Accepted" value={timestamp(agreement.acceptedAt)} />
      </dl>
    </section>
  );
}

function RecordRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="grid gap-2 py-3 sm:grid-cols-[9rem_1fr] sm:items-center"><dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#68736d]">{label}</dt><dd className="text-sm text-[#173d35]">{value}</dd></div>;
}
