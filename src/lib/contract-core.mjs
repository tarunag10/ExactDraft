import { isAddress, zeroAddress } from "viem";

export function parseContractAddress(value) {
  const candidate = value?.trim();
  if (!candidate) return { address: undefined, issue: "missing" };
  if (!isAddress(candidate) || candidate.toLowerCase() === zeroAddress) {
    return { address: undefined, issue: "invalid" };
  }
  return { address: candidate, issue: undefined };
}

export function isValidAgreementIdCore(value) {
  if (!/^[1-9]\d*$/.test(value)) return false;
  try {
    return BigInt(value) < (1n << 256n);
  } catch {
    return false;
  }
}

export function isFutureExpiryTimestamp(expirySeconds, nowSeconds = Math.floor(Date.now() / 1000)) {
  return Number.isSafeInteger(expirySeconds) && Number.isSafeInteger(nowSeconds) && expirySeconds > nowSeconds;
}

export function pendingTransactionKey(chainId, address, operation, agreementId) {
  const scope = operation === "create" ? "" : `:${agreementId}`;
  return `exactdraft:pending:${chainId}:${address.toLowerCase()}:${operation}${scope}`;
}

export function isAgreementNotFoundError(error) {
  for (let current = error, depth = 0; current && depth < 8; current = current.cause, depth += 1) {
    const text = [
      current.name,
      current.message,
      current.data?.errorName,
      current.data?.data,
      current.data,
    ].join(" ");
    if (/AgreementNotFound|0x9cc59cb9/i.test(text)) return true;
  }
  return false;
}
