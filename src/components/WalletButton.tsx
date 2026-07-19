"use client";

import { useConnect, useConnectors, useAccount, useDisconnect } from "wagmi";
import { formatWallet } from "@/src/lib/hash";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const connectors = useConnectors();
  const { connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const connector = connectors[0];

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="rounded-full border border-[#b9c8bd] bg-white px-4 py-2 text-sm font-semibold text-[#173d35] hover:border-[#173d35]"
        aria-label={`Disconnect wallet ${address}`}
      >
        {formatWallet(address)}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={!connector || isPending}
        onClick={() => connector && connect({ connector })}
        className="rounded-full bg-[#173d35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#28594d] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Opening wallet…" : "Connect wallet"}
      </button>
      {error ? <span className="max-w-48 text-right text-xs text-[#b83f39]">Wallet connection rejected.</span> : null}
    </div>
  );
}
