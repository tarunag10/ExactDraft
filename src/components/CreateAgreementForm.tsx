"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, isAddress, type Hex } from "viem";
import { useAccount, useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { LocalFileHash } from "@/src/components/LocalFileHash";
import { TransactionNotice } from "@/src/components/TransactionNotice";
import { contractAddress, exactDraftAbi } from "@/src/lib/contract";
import { formatHash } from "@/src/lib/hash";
import { monadTestnet } from "@/src/lib/monad";

function initialExpiry() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function errorMessage(error: Error | null | undefined) {
  if (!error) return undefined;
  if (error.message.toLowerCase().includes("user rejected")) return "The wallet rejected this transaction.";
  return error.message.replace(/^Error: /, "");
}

export function CreateAgreementForm() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState<Hex>();
  const [counterparty, setCounterparty] = useState("");
  const [reference, setReference] = useState("");
  const [expiresAt, setExpiresAt] = useState(initialExpiry);
  const [formError, setFormError] = useState<string>();
  const [agreementId, setAgreementId] = useState<string>();
  const { writeContract, data: transactionHash, error: writeError, isPending } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({
    hash: transactionHash,
    query: { enabled: Boolean(transactionHash) },
  });

  useEffect(() => {
    if (!receipt) return;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: exactDraftAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "AgreementCreated") {
          setAgreementId(String((decoded.args as { agreementId: bigint }).agreementId));
          break;
        }
      } catch {
        // Logs from other contracts in the receipt are expected to be undecodable with this ABI.
      }
    }
  }, [receipt]);

  const expiryTimestamp = useMemo(() => Math.floor(new Date(expiresAt).getTime() / 1000), [expiresAt]);
  const isWrongNetwork = isConnected && chainId !== monadTestnet.id;
  const isReady = Boolean(fileHash && counterparty && reference.trim() && expiresAt);

  function handleFile(hash: Hex | undefined, name: string) {
    setFileHash(hash);
    setFileName(name);
    setFormError(undefined);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    setAgreementId(undefined);
    if (!isConnected || !address) return setFormError("Connect the proposer wallet before creating an agreement.");
    if (isWrongNetwork) return setFormError("Switch your wallet to Monad testnet before creating an agreement.");
    if (!contractAddress) return setFormError("The contract address is not configured. Deploy ExactDraft and set NEXT_PUBLIC_EXACTDRAFT_CONTRACT_ADDRESS.");
    if (!fileHash) return setFormError("Select a local document so its SHA-256 digest can be calculated.");
    if (!isAddress(counterparty)) return setFormError("Enter a valid Ethereum wallet address for the counterparty.");
    if (counterparty.toLowerCase() === address.toLowerCase()) return setFormError("The counterparty must be a different wallet.");
    if (!reference.trim()) return setFormError("Add a short reference so both parties know which draft is being checked.");
    if (!Number.isSafeInteger(expiryTimestamp) || expiryTimestamp <= Math.floor(Date.now() / 1000)) return setFormError("Choose an expiry time in the future.");
    if (reference.trim().length > 140) return setFormError("Keep the reference to 140 characters or fewer.");

    writeContract({
      address: contractAddress,
      abi: exactDraftAbi,
      functionName: "createAgreement",
      args: [fileHash, counterparty, reference.trim(), BigInt(expiryTimestamp)],
    });
  }

  const transactionError = errorMessage(writeError) ?? errorMessage(receiptError) ?? formError;

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
          <span id="counterparty-help" className="mt-2 block text-xs text-[#68736d]">Only this wallet can later attest to the matching local copy.</span>
        </label>
        <label>
          <span className="mono-label mb-2 block text-[10px] font-bold text-[#68736d]">Reference</span>
          <input className="field" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="e.g. term sheet / draft 04" maxLength={140} />
        </label>
        <label>
          <span className="mono-label mb-2 block text-[10px] font-bold text-[#68736d]">Expires at</span>
          <input className="field" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
        </label>
      </div>

      <div className="rounded-xl bg-[#edf1eb] px-4 py-3 text-xs leading-5 text-[#52625a]">
        The chain will record the digest, wallets, reference, and timestamps. It will never receive the selected file.
      </div>

      <button type="submit" disabled={isPending || isConfirming || !isReady || isWrongNetwork || !isConnected} className="w-full rounded-xl bg-[#173d35] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#28594d] disabled:cursor-not-allowed disabled:opacity-45">
        {isPending ? "Confirm in wallet…" : isConfirming ? "Waiting for Monad…" : "Create onchain agreement"}
      </button>

      {!isConnected ? <p className="text-center text-xs font-semibold text-[#775014]">Connect the proposer wallet to continue.</p> : null}
      {isWrongNetwork ? <p className="text-center text-xs font-semibold text-[#8c302c]">Wrong network — switch to Monad testnet first.</p> : null}
      {!contractAddress ? <p className="text-center text-xs font-semibold text-[#8c302c]">Contract address missing from environment configuration.</p> : null}
      <p id="create-form-status" role="status" aria-live="polite" className="min-h-5 text-center text-xs text-[#b83f39]">{transactionError}</p>

      {isConfirmed && transactionHash ? (
        <div className="rounded-xl border border-[#b9d9bf] bg-[#f1fbf2] p-4 text-sm text-[#205c3b]">
          <p className="font-bold">Agreement recorded on Monad.</p>
          {agreementId ? <p className="mt-1">Agreement ID: <span className="font-mono font-bold">{agreementId}</span></p> : null}
          <TransactionNotice hash={transactionHash} label="Open creation transaction" />
          {agreementId ? <a href={`/agreement/${agreementId}`} className="ml-4 font-bold underline underline-offset-4">Open review record</a> : null}
        </div>
      ) : null}
    </form>
  );
}
