"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { monadTestnet } from "@/src/lib/monad";

export function NetworkNotice() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending, error } = useSwitchChain();

  if (!isConnected || chainId === monadTestnet.id) return null;

  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#edc37b] bg-[#fff5dc] px-4 py-3 text-sm text-[#6d481d]">
      <span>Your wallet is on the wrong network. ExactDraft uses Monad testnet (chain ID {monadTestnet.id}).</span>
      <button type="button" onClick={() => switchChain({ chainId: monadTestnet.id })} disabled={isPending} className="rounded-full bg-[#6d481d] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
        {isPending ? "Switching…" : "Switch network"}
      </button>
      {error ? <span className="basis-full text-xs text-[#b83f39]">Network switch was rejected.</span> : null}
    </div>
  );
}
