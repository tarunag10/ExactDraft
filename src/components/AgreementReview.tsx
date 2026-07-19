"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Hex } from "viem";
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { LocalFileHash } from "@/src/components/LocalFileHash";
import { NetworkNotice } from "@/src/components/NetworkNotice";
import { SiteHeader } from "@/src/components/SiteHeader";
import { StatusBadge } from "@/src/components/StatusBadge";
import { TransactionNotice } from "@/src/components/TransactionNotice";
import { contractAddress, exactDraftAbi, normalizeAgreement, statusLabel } from "@/src/lib/contract";
import { formatHash, formatWallet } from "@/src/lib/hash";
import { explorerAddressUrl, monadTestnet } from "@/src/lib/monad";

function timestamp(value: bigint) {
  return value === 0n ? "—" : new Date(Number(value) * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function errorMessage(error: Error | null | undefined) {
  if (!error) return undefined;
  if (error.message.toLowerCase().includes("user rejected")) return "The wallet rejected this transaction.";
  return error.message.replace(/^Error: /, "");
}

export function AgreementReview({ agreementId }: { agreementId: string }) {
  const numericId = useMemo(() => (/^[1-9]\d*$/.test(agreementId) ? BigInt(agreementId) : undefined), [agreementId]);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [presentedHash, setPresentedHash] = useState<Hex>();
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState<string>();
  const [readTimedOut, setReadTimedOut] = useState(false);
  const { data, isLoading, isError: readFailed, error: readError, refetch } = useReadContract({
    address: contractAddress,
    abi: exactDraftAbi,
    functionName: "getAgreement",
    args: numericId ? [numericId] : undefined,
    query: { enabled: Boolean(contractAddress && numericId), refetchInterval: 15_000 },
  });
  const agreement = normalizeAgreement(data);
  const status = agreement ? statusLabel(agreement.status) : undefined;
  const isWrongNetwork = isConnected && chainId !== monadTestnet.id;
  const isCounterparty = Boolean(address && agreement && agreement.counterparty.toLowerCase() === address.toLowerCase());
  const isExactMatch = Boolean(presentedHash && agreement && presentedHash.toLowerCase() === agreement.fileHash.toLowerCase());
  const { writeContract, data: transactionHash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({ hash: transactionHash, query: { enabled: Boolean(transactionHash) } });

  useEffect(() => {
    if (isConfirmed) refetch();
  }, [isConfirmed, refetch]);

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

  function handleAccept() {
    setFormError(undefined);
    if (!isConnected || !address) return setFormError("Connect the counterparty wallet before accepting.");
    if (isWrongNetwork) return setFormError("Switch your wallet to Monad testnet before accepting.");
    if (!contractAddress || !numericId) return setFormError("This agreement is not ready to accept.");
    if (!agreement || status !== "pending") return setFormError("This agreement is no longer pending.");
    if (!isCounterparty) return setFormError("Only the designated counterparty wallet can accept this agreement.");
    if (!presentedHash || !isExactMatch) return setFormError("Select the exact local copy before accepting.");

    writeContract({ address: contractAddress, abi: exactDraftAbi, functionName: "acceptAgreement", args: [numericId, presentedHash] });
  }

  const transactionError = errorMessage(writeError) ?? errorMessage(receiptError) ?? formError;

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 lg:px-8">
        <NetworkNotice />
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#cfd9d0] pb-6">
          <div>
            <p className="mono-label text-[10px] font-bold text-[#68736d]">Agreement record / #{agreementId}</p>
            <h1 className="display-font mt-2 text-5xl leading-none text-[#173d35] sm:text-6xl">Review the copy.</h1>
          </div>
          <Link href="/" className="text-sm font-bold text-[#205c3b] underline decoration-[#9fc9aa] underline-offset-4">← Create another agreement</Link>
        </div>

        {!contractAddress ? (
          <div role="alert" className="paper-card rounded-2xl p-6 text-sm text-[#8c302c]">This app is not connected to a deployed ExactDraft contract yet. Set <code>NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS</code> after deployment.</div>
        ) : isLoading && !readTimedOut ? (
          <div role="status" aria-live="polite" className="paper-card rounded-2xl p-8 text-sm text-[#68736d]">Reading the agreement from Monad…</div>
        ) : readFailed || !agreement ? (
          <div role="alert" className="paper-card rounded-2xl p-8 text-sm text-[#8c302c]">
            <p>Could not read agreement #{agreementId} from Monad.</p>
            <p className="mt-2">{readTimedOut ? "Monad did not respond in time. Check the agreement ID, network, and contract configuration." : readError?.message ?? "Check the ID, network, and contract configuration."}</p>
            <button type="button" onClick={() => { setReadTimedOut(false); void refetch(); }} className="mt-5 rounded-full bg-[#173d35] px-4 py-2 text-xs font-bold text-white hover:bg-[#28594d]">Retry read</button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <section className="paper-card rounded-2xl p-6 sm:p-8" aria-labelledby="match-heading">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="mono-label text-[10px] font-bold text-[#68736d]">Private file check</p>
                    <h2 id="match-heading" className="display-font mt-2 text-4xl text-[#173d35]">Does your file match?</h2>
                  </div>
                  <StatusBadge status={status ?? "pending"} />
                </div>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[#52625a]">Select your own local copy. ExactDraft hashes it in this browser and compares the result with the 32-byte digest registered by the proposer.</p>
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
                  <button type="button" onClick={handleAccept} disabled={!isExactMatch || !isCounterparty || !isConnected || isWrongNetwork || status !== "pending" || isPending || isConfirming} className="w-full rounded-xl bg-[#173d35] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#28594d] disabled:cursor-not-allowed disabled:opacity-40">
                    {isPending ? "Confirm in wallet…" : isConfirming ? "Waiting for Monad…" : "Attest exact match"}
                  </button>
                  {isWrongNetwork ? <p className="text-center text-xs font-semibold text-[#8c302c]">Wrong network — switch to Monad testnet first.</p> : null}
                  <p role="status" aria-live="polite" className="min-h-5 text-center text-xs text-[#b83f39]">{transactionError}</p>
                </div>

                {isConfirmed && transactionHash ? <div className="mt-4 rounded-xl border border-[#b9d9bf] bg-[#f1fbf2] p-4 text-sm text-[#205c3b]"><p className="font-bold">Your attestation is confirmed on Monad.</p><TransactionNotice hash={transactionHash} label="Open acceptance transaction" /></div> : null}
              </section>

              <RecordCard agreement={agreement} status={status ?? "pending"} />
            </div>
            <p className="mt-8 text-center text-xs leading-5 text-[#68736d]">ExactDraft records wallet attestations and a file digest. It is not itself an electronic-signature service and does not provide legal advice.</p>
          </>
        )}
      </div>
    </main>
  );
}

function RecordCard({ agreement, status }: { agreement: NonNullable<ReturnType<typeof normalizeAgreement>>; status: ReturnType<typeof statusLabel> }) {
  return (
    <section className="paper-card rounded-2xl p-6 sm:p-8" aria-labelledby="record-heading">
      <p className="mono-label text-[10px] font-bold text-[#68736d]">Final verification record</p>
      <h2 id="record-heading" className="display-font mt-2 text-4xl text-[#173d35]">What the chain knows.</h2>
      <dl className="mt-8 divide-y divide-[#e1e6e0]">
        <RecordRow label="Reference" value={agreement.reference} />
        <RecordRow label="Status" value={<StatusBadge status={status} />} />
        <RecordRow label="Proposer" value={<a href={explorerAddressUrl(agreement.proposer)} target="_blank" rel="noreferrer" className="font-mono text-xs underline underline-offset-4">{formatWallet(agreement.proposer)} ↗</a>} />
        <RecordRow label="Counterparty" value={<a href={explorerAddressUrl(agreement.counterparty)} target="_blank" rel="noreferrer" className="font-mono text-xs underline underline-offset-4">{formatWallet(agreement.counterparty)} ↗</a>} />
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
