import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "MonadVision",
      url: "https://testnet.monadvision.com",
    },
  },
  testnet: true,
});

export const MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";
export const MONAD_EXPLORER_URL = "https://testnet.monadvision.com";

export function explorerTxUrl(hash: string) {
  return `${MONAD_EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddressUrl(address: string) {
  return `${MONAD_EXPLORER_URL}/address/${address}`;
}
