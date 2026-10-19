import { isValidAgreementIdCore } from "./contract-core.mjs";

export function agreementPath(slug, id) {
  if (!isValidAgreementIdCore(id)) return undefined;
  if (slug === "monad") return `/agreement/${id}`;
  if (slug === "bot") return `/bot/agreement/${id}`;
  return undefined;
}
