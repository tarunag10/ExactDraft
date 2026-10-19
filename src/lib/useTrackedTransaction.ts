"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import type { Address, Hex, ReplacementReturnType } from "viem";
import { pendingTransactionKey } from "@/src/lib/contract-core.mjs";

const PENDING_TRANSACTION_EVENT = "exactdraft:pending-transaction";

function subscribeToPendingTransactions(onStoreChange: () => void) {
  window.addEventListener(PENDING_TRANSACTION_EVENT, onStoreChange);
  return () => window.removeEventListener(PENDING_TRANSACTION_EVENT, onStoreChange);
}

function getStoredHash(key: string | undefined): Hex | undefined {
  if (!key) return undefined;
  const saved = window.sessionStorage.getItem(key);
  return saved && /^0x[0-9a-fA-F]{64}$/.test(saved) ? saved as Hex : undefined;
}

function notifyPendingTransactionChange() {
  window.dispatchEvent(new Event(PENDING_TRANSACTION_EVENT));
}

export function useTrackedTransaction(
  submittedHash: Hex | undefined,
  chainId: number,
  address: Address | undefined,
  operation: "create" | "accept" | "cancel",
) {
  const key = address ? pendingTransactionKey(chainId, address, operation) : undefined;
  const restoredHash = useSyncExternalStore(
    subscribeToPendingTransactions,
    () => getStoredHash(key),
    () => undefined,
  );
  const [replacement, setReplacement] = useState<ReplacementReturnType>();

  useEffect(() => {
    if (!key || !submittedHash) return;
    sessionStorage.setItem(key, submittedHash);
    notifyPendingTransactionChange();
  }, [key, submittedHash]);

  const hash = submittedHash ?? restoredHash;
  const receiptState = useWaitForTransactionReceipt({
    hash,
    chainId,
    onReplaced: (value) => {
      setReplacement(value);
      if (value.reason !== "cancelled" && key) {
        sessionStorage.setItem(key, value.transaction.hash);
        notifyPendingTransactionChange();
      }
      if (value.reason === "cancelled" && key) {
        sessionStorage.removeItem(key);
        notifyPendingTransactionChange();
      }
    },
    query: { enabled: Boolean(hash) },
  });

  useEffect(() => {
    if (!key || !receiptState.data) return;
    sessionStorage.removeItem(key);
    notifyPendingTransactionChange();
  }, [key, receiptState.data]);

  return {
    ...receiptState,
    trackedHash: hash,
    transactionHash: receiptState.data?.transactionHash ?? hash,
    replacement,
  };
}
