import { isValidAgreementIdCore } from "./contract-core.mjs";

export const NETWORKS = Object.freeze({
  monad: Object.freeze({ id: 10143, name: "Monad Testnet", symbol: "MON", rpcUrl: "https://testnet-rpc.monad.xyz", explorerUrl: "https://testnet.monadvision.com" }),
  bot: Object.freeze({ id: 968, name: "BOT Chain Testnet", symbol: "BOT", rpcUrl: "https://rpc.bohr.life", explorerUrl: "https://scan.bohr.life" }),
});

export function agreementPath(slug, id) {
  if (!isValidAgreementIdCore(id)) return undefined;
  if (slug === "monad") return `/agreement/${id}`;
  if (slug === "bot") return `/bot/agreement/${id}`;
  return undefined;
}
