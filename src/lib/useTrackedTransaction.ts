"use client";

import { useEffect, useState } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import type { Address, Hex, ReplacementReturnType } from "viem";
import { pendingTransactionKey } from "@/src/lib/contract-core.mjs";

export function useTrackedTransaction(
  submittedHash: Hex | undefined,
  chainId: number,
  address: Address | undefined,
  operation: "create" | "accept" | "cancel",
) {
  const key = address ? pendingTransactionKey(chainId, address, operation) : undefined;
  const [restoredHash, setRestoredHash] = useState<Hex>();
  const [replacement, setReplacement] = useState<ReplacementReturnType>();

  useEffect(() => {
    if (!key) return;
    const saved = sessionStorage.getItem(key);
    if (saved && /^0x[0-9a-fA-F]{64}$/.test(saved)) setRestoredHash(saved as Hex);
  }, [key]);

  useEffect(() => {
    if (!key || !submittedHash) return;
    sessionStorage.setItem(key, submittedHash);
    setRestoredHash(submittedHash);
  }, [key, submittedHash]);

  const hash = submittedHash ?? restoredHash;
  const receiptState = useWaitForTransactionReceipt({
    hash,
    chainId,
    onReplaced: (value) => {
      setReplacement(value);
      if (value.reason !== "cancelled" && key) sessionStorage.setItem(key, value.transaction.hash);
      if (value.reason === "cancelled" && key) sessionStorage.removeItem(key);
    },
    query: { enabled: Boolean(hash) },
  });

  useEffect(() => {
    if (!key || !receiptState.data) return;
    sessionStorage.removeItem(key);
    setRestoredHash(undefined);
  }, [key, receiptState.data]);

  return {
    ...receiptState,
    trackedHash: hash,
    transactionHash: receiptState.data?.transactionHash ?? hash,
    replacement,
  };
}
