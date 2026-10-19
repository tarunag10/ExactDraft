// Legacy Monad URLs and callers remain mapped to the original deployment.
export { monadTestnet } from "./networks";
import { explorerAddressUrl as networkAddressUrl, explorerTxUrl as networkTxUrl, monadTestnet } from "./networks";

export const MONAD_RPC_URL = monadTestnet.rpcUrls.default.http[0];
export const MONAD_EXPLORER_URL = monadTestnet.blockExplorers.default.url;

export function explorerTxUrl(hash: string) {
  return networkTxUrl(hash, monadTestnet.id)!;
}

export function explorerAddressUrl(address: string) {
  return networkAddressUrl(address, monadTestnet.id)!;
}
