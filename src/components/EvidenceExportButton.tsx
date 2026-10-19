"use client";

import { useState } from "react";
import type { Address, Hex } from "viem";
import { contractAddressFor } from "@/src/lib/contract";
import { getNetworkConfig } from "@/src/lib/networks";
import { serializeAgreementEvidence } from "@/src/lib/evidence-core.mjs";
import type { EvidenceTransaction } from "@/src/lib/evidence-core.mjs";

type EvidenceRecord = {
  proposer: Address;
  counterparty: Address;
  fileHash: Hex;
  reference: string;
  createdAt: bigint;
  expiresAt: bigint;
  acceptedAt: bigint;
  status: number | bigint;
};

type TransactionReference = Omit<EvidenceTransaction, "type"> & {
  type: "created" | "accepted" | "cancelled";
};

type Props = {
  network: { chainId: number; name: string };
  contractAddress: Address;
  agreementId: bigint | number | string;
  record: EvidenceRecord;
  transactions?: TransactionReference[];
  loadTransactions?: () => Promise<TransactionReference[]>;
};

function transactionStatus(transactions: TransactionReference[] = []) {
  if (transactions.length === 0) return "No transaction status provided.";
  const statuses = transactions.map(({ status }) => status);
  const pending = statuses.filter((status) => status === "pending").length;
  const included = statuses.filter((status) => status === "included" || status === "finalized").length;
  if (pending && included) return "Some transactions are included; at least one remains pending.";
  if (pending) return "Pending — not yet included in a block.";
  if (statuses.every((status) => status === "finalized")) return "Transactions are marked finalized by the supplied receipt data.";
  if (included) return "Included in a block — inclusion alone does not establish finality.";
  return "Transaction references provided; inclusion status is unavailable.";
}

export function EvidenceExportButton({ network, contractAddress, agreementId, record, transactions, loadTransactions }: Props) {
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadedTransactions, setLoadedTransactions] = useState<TransactionReference[]>();
  const status = transactionStatus(loadedTransactions ?? transactions);

  async function downloadEvidence() {
    setError(undefined);
    setIsLoading(true);
    try {
      const configuredNetwork = getNetworkConfig(network.chainId);
      if (!configuredNetwork || configuredNetwork.chain.name !== network.name) {
        throw new Error("Evidence export is limited to a configured ExactDraft network.");
      }
      const configuredAddress = contractAddressFor(network.chainId);
      if (!configuredAddress || configuredAddress.toLowerCase() !== contractAddress.toLowerCase()) {
        throw new Error("The contract address does not match the configured deployment for this network.");
      }
      if (transactions?.some(({ type }) => !["created", "accepted", "cancelled"].includes(type))) {
        throw new Error("A transaction reference has an unsupported operation type.");
      }
      const resolvedTransactions = loadTransactions ? await loadTransactions() : transactions;
      setLoadedTransactions(resolvedTransactions);

      const json = serializeAgreementEvidence({
        network: { chainId: network.chainId, name: network.name },
        contractAddress,
        agreementId,
        record,
        transactions: resolvedTransactions,
      });
      const evidence = JSON.parse(json) as { network: { chainId: number }; agreementId: string };
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `exactdraft-evidence-${evidence.network.chainId}-${evidence.agreementId}.json`;
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the evidence download.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <p id="evidence-export-status" role="status" aria-live="polite" className="mb-2 text-xs text-[#68736d]">{isLoading ? "Loading onchain transaction references…" : status}</p>
      <button type="button" onClick={() => void downloadEvidence()} disabled={isLoading} aria-describedby="evidence-export-status evidence-export-error" className="rounded-lg border border-[#173d35] px-3 py-2 text-xs font-bold text-[#173d35] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173d35] disabled:cursor-wait disabled:opacity-50">
        {isLoading ? "Preparing evidence…" : "Download JSON evidence"}
      </button>
      <p id="evidence-export-error" role="alert" className="mt-2 min-h-4 text-xs text-[#8c302c]">{error}</p>
      <p className="mt-2 text-xs leading-5 text-[#68736d]">The export contains validated public chain fields only. It does not include the document, file bytes, or local filename.</p>
    </div>
  );
}
