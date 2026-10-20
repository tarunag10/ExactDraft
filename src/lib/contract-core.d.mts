import type { Address } from "viem";

export function parseContractAddress(value: string | undefined): {
  address: Address | undefined;
  issue: "missing" | "invalid" | undefined;
};
export function isValidAgreementIdCore(value: string): boolean;
export function isFutureExpiryTimestamp(expirySeconds: number, nowSeconds?: number): boolean;
export function pendingTransactionKey(chainId: number, address: Address, operation: "create" | "accept" | "cancel", agreementId?: string): string;
export function isAgreementNotFoundError(error: unknown): boolean;
