"use client";

import { useEffect, useMemo, useState } from "react";
import { isAddress, type Address, type Hex } from "viem";
import { useAccount, useBytecode, usePublicClient, useWriteContract } from "wagmi";
import { LocalFileHash } from "@/src/components/LocalFileHash";
import { TransactionNotice } from "@/src/components/TransactionNotice";
import { contractAddressErrorFor, contractAddressFor, exactDraftAbi } from "@/src/lib/contract";
import { formatHash, isValidReference } from "@/src/lib/hash";
import { getNetworkConfig, monadTestnet } from "@/src/lib/networks";
import { agreementPath } from "@/src/lib/network-core.mjs";
import { useTrackedTransaction } from "@/src/lib/useTrackedTransaction";
import { findContractEvent, submitSimulatedTransaction } from "@/src/lib/transaction-core.mjs";

function initialExpiry() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function errorMessage(error: Error | null | undefined) {
  if (!error) return undefined;
  if (error.message.toLowerCase().includes("user rejected")) return "The wallet rejected this transaction.";
  if (/insufficient funds/i.test(error.message)) return "The wallet does not have enough testnet funds for this transaction.";
  if (/revert|contract function/i.test(error.message)) return "The contract rejected these details. Check the wallet, reference, expiry and agreement rules.";
  return "Could not complete the transaction. Check your wallet network and connection, then try again.";
}

export function CreateAgreementForm() {
  const { address, isConnected, chainId } = useAccount();
  const activeNetwork = getNetworkConfig(chainId ?? monadTestnet.id) ?? getNetworkConfig(monadTestnet.id)!;
  const activeChainId = activeNetwork.chain.id;
  const contractAddress = contractAddressFor(activeChainId);
  const contractAddressError = contractAddressErrorFor(activeChainId);
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState<Hex>();
  const [counterparty, setCounterparty] = useState("");
  const [reference, setReference] = useState("");
  const [expiresAt, setExpiresAt] = useState(initialExpiry);
  const [formError, setFormError] = useState<string>();
  const [agreementId, setAgreementId] = useState<string>();
  const [isSimulating, setIsSimulating] = useState(false);
  const [creationEventMissing, setCreationEventMissing] = useState(false);
  const publicClient = usePublicClient({ chainId: activeChainId });
  const { data: bytecode, isError: bytecodeError, isLoading: isCheckingBytecode, refetch: refetchBytecode } = useBytecode({
    address: contractAddress,
    chainId: activeChainId,
    query: { enabled: Boolean(contractAddress), retry: 1 },
  });
  const hasContract = Boolean(bytecode && bytecode !== "0x");
  const isWrongNetwork = isConnected && !getNetworkConfig(chainId ?? 0);
  const { writeContractAsync, isPending } = useWriteContract();
  const [submittedTx, setSubmittedTx] = useState<{ hash: Hex; chainId: number; address: Address }>();
  const receiptState = useTrackedTransaction(submittedTx?.hash, submittedTx?.chainId ?? activeChainId, submittedTx?.address ?? contractAddress, "create");
  const { data: receipt, isLoading: isConfirming } = receiptState;
  const transactionHash = receiptState.transactionHash;
  const receiptUnresolved = Boolean(receiptState.trackedHash && !receipt && receiptState.replacement?.reason !== "cancelled");
  const isWaiting = isSimulating || isPending || isConfirming || receiptUnresolved;

  useEffect(() => {
    if (!receipt) return;
    const event = findContractEvent(receipt, exactDraftAbi, submittedTx?.address ?? contractAddress, "AgreementCreated");
    if (event) setAgreementId(String(event.args.agreementId));
    if (receipt.status === "success") setCreationEventMissing(!event);
  }, [receipt, submittedTx?.address, contractAddress]);

  const expiryTimestamp = useMemo(() => Math.floor(new Date(expiresAt).getTime() / 1000), [expiresAt]);
  const isReady = Boolean(fileHash && counterparty && isValidReference(reference) && expiresAt && hasContract);

  function handleFile(hash: Hex | undefined, name: string) {
    setFileHash(hash);
    setFileName(name);
    setFormError(undefined);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    setAgreementId(undefined);
    setCreationEventMissing(false);
    if (!isConnected || !address) return setFormError("Connect the proposer wallet before creating an agreement.");
    if (isWrongNetwork) return setFormError("Switch your wallet to Monad or BOT Chain testnet before creating an agreement.");
    if (!contractAddress) return setFormError(contractAddressError ?? "ExactDraft contract configuration is invalid.");
    if (!hasContract || !publicClient) return setFormError(`ExactDraft contract code could not be verified on ${activeNetwork.label}.`);
    if (!fileHash) return setFormError("Select a local document so its SHA-256 digest can be calculated.");
    if (!isAddress(counterparty)) return setFormError("Enter a valid Ethereum wallet address for the counterparty.");
    if (counterparty.toLowerCase() === address.toLowerCase()) return setFormError("The counterparty must be a different wallet.");
    if (!isValidReference(reference)) return setFormError("Enter a reference of 1–140 UTF-8 bytes. This reference is public; use an opaque code, not a client or document name.");
    if (!Number.isSafeInteger(expiryTimestamp) || expiryTimestamp <= Math.floor(Date.now() / 1000)) return setFormError("Choose an expiry time in the future.");

    const request = {
      address: contractAddress,
      abi: exactDraftAbi,
      functionName: "createAgreement",
      args: [fileHash, counterparty, reference.trim(), BigInt(expiryTimestamp)],
      account: address,
      chainId: activeChainId,
    } as const;
    setIsSimulating(true);
    try {
      const hash = await submitSimulatedTransaction(publicClient, writeContractAsync, request);
      setSubmittedTx(undefined);
      setSubmittedTx({ hash, chainId: activeChainId, address: contractAddress });
    } catch (error) {
      setFormError(errorMessage(error instanceof Error ? error : undefined) ?? "Could not simulate or submit this transaction.");
    } finally {
      setIsSimulating(false);
    }
  }

  const receiptError = receipt?.status === "reverted"
    ? "The transaction was mined but reverted. No agreement was created."
    : receiptState.error
      ? errorMessage(receiptState.error)
      : receiptState.replacement?.reason === "cancelled"
        ? "The pending transaction was replaced by a cancellation."
        : undefined;
  const transactionError = formError ?? receiptError;
  const isConfirmed = receipt?.status === "success" && Boolean(agreementId) && !creationEventMissing;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-describedby="create-form-status">
      <LocalFileHash onHash={handleFile} />
      {fileHash ? (
        <div className="rounded-xl border border-[#b9d9bf] bg-[#f1fbf2] px-4 py-3" role="status" aria-live="polite">
          <p className="mono-label text-[10px] font-bold text-[#205c3b]">Local digest ready</p>
          <p className="mt-1 break-all font-mono text-xs text-[#173d35]">{formatHash(fileHash)}</p>
          <p className="mt-1 text-xs text-[#68736d]">{fileName} · 32 bytes stored onchain after confirmation</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mono-label mb-2 block text-[10px] font-bold text-[#68736d]">Counterparty wallet</span>
          <input className="field font-mono text-sm" value={counterparty} onChange={(event) => setCounterparty(event.target.value)} placeholder="0x…" inputMode="text" autoComplete="off" aria-describedby="counterparty-help" />
          <span id="counterparty-help" className="mt-2 block text-xs text-[#68736d]">Only this wallet can submit the registered digest as an acknowledgement. The chain cannot verify that a file was selected.</span>
        </label>
        <label>
          <span className="mono-label mb-2 block text-[10px] font-bold text-[#68736d]">Reference</span>
          <input className="field" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="e.g. case-7f2a" maxLength={140} aria-describedby="reference-help" />
          <span id="reference-help" className="mt-2 block text-xs leading-5 text-[#68736d]">Public and permanent onchain. Use an opaque code, not a client name or confidential title. Limit: 140 UTF-8 bytes.</span>
        </label>
        <label>
          <span className="mono-label mb-2 block text-[10px] font-bold text-[#68736d]">Expires at</span>
          <input className="field" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
        </label>
      </div>

      <div className="rounded-xl bg-[#edf1eb] px-4 py-3 text-xs leading-5 text-[#52625a]">
        The chain publicly records the digest, wallet addresses, reference, and timestamps. This app does not upload the selected file. A public digest may reveal a match if someone already knows or can guess the document.
      </div>

      <button type="submit" disabled={isWaiting || creationEventMissing || !isReady || !isConnected || isWrongNetwork} className="w-full rounded-xl bg-[#173d35] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#28594d] disabled:cursor-not-allowed disabled:opacity-45">
        {isSimulating ? "Checking agreement…" : isPending ? "Confirm in wallet…" : isConfirming || receiptUnresolved ? `Waiting for ${activeNetwork.chain.name}…` : "Create onchain agreement"}
      </button>

      {!isConnected ? <p className="text-center text-xs font-semibold text-[#775014]">Connect the proposer wallet to continue.</p> : null}
      {isWrongNetwork ? <p className="text-center text-xs font-semibold text-[#8c302c]">Wrong network — switch to Monad or BOT Chain testnet first.</p> : null}
      {contractAddressError ? <p className="text-center text-xs font-semibold text-[#8c302c]">{contractAddressError}</p> : null}
      {contractAddress && isCheckingBytecode ? <p className="text-center text-xs text-[#68736d]">Checking the configured contract on {activeNetwork.label}…</p> : null}
      {contractAddress && bytecodeError ? <p className="text-center text-xs font-semibold text-[#8c302c]">Could not verify the contract code on {activeNetwork.label}. <button type="button" onClick={() => void refetchBytecode()} className="underline underline-offset-4">Retry</button></p> : null}
      {contractAddress && !isCheckingBytecode && !bytecodeError && !hasContract ? <p className="text-center text-xs font-semibold text-[#8c302c]">No contract is deployed at the configured address on {activeNetwork.label}.</p> : null}
      <p id="create-form-status" role="status" aria-live="polite" className="min-h-5 text-center text-xs text-[#b83f39]">{transactionError}</p>
      {receiptState.error && receiptState.trackedHash ? <div className="text-center text-xs"><button type="button" onClick={() => void receiptState.refetch()} className="font-semibold underline underline-offset-4">Retry confirmation check</button> <TransactionNotice hash={transactionHash} chainId={activeChainId} label="Open pending transaction" /></div> : null}

      {isConfirmed && transactionHash ? (
        <div className="rounded-xl border border-[#b9d9bf] bg-[#f1fbf2] p-4 text-sm text-[#205c3b]">
          <p className="font-bold">Agreement recorded on {activeNetwork.chain.name}.</p>
          {agreementId ? <p className="mt-1">Agreement ID: <span className="font-mono font-bold">{agreementId}</span></p> : null}
          <TransactionNotice hash={transactionHash} chainId={activeChainId} label="Open creation transaction" />
          {agreementId ? <a href={agreementPath(activeNetwork.slug, agreementId)} className="ml-4 font-bold underline underline-offset-4">Open review record</a> : null}
        </div>
      ) : null}
      {creationEventMissing ? <p role="alert" className="rounded-xl bg-[#fff5dc] p-4 text-sm text-[#775014]">Transaction confirmed, but no ExactDraft creation event was found. No review link was generated. <TransactionNotice hash={transactionHash} chainId={activeChainId} label="Inspect transaction" /></p> : null}
    </form>
  );
}
