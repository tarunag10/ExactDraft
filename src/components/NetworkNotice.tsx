"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { getNetworkConfig, monadTestnet } from "@/src/lib/networks";

export function NetworkNotice({ targetChainId: requestedChainId }: { targetChainId?: number }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending, error } = useSwitchChain();
  const targetChainId = requestedChainId ?? (getNetworkConfig(chainId ?? 0) ? chainId! : monadTestnet.id);
  const targetNetwork = getNetworkConfig(targetChainId)!;

  if (!isConnected || chainId === targetChainId) return null;

  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#edc37b] bg-[#fff5dc] px-4 py-3 text-sm text-[#6d481d]">
      <span>Your wallet is on the wrong network. This record uses {targetNetwork.label} (chain ID {targetChainId}).</span>
      <button type="button" onClick={() => switchChain({ chainId: targetChainId })} disabled={isPending} className="rounded-full bg-[#6d481d] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
        {isPending ? "Switching…" : "Switch network"}
      </button>
      {error ? <span className="basis-full text-xs text-[#b83f39]">Network switch was rejected.</span> : null}
    </div>
  );
}
