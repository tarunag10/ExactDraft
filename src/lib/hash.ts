import type { Hex } from "viem";
import { isValidReferenceCore, MAX_FILE_SIZE_BYTES, MAX_REFERENCE_BYTES, sha256FileCore } from "./hash-core.mjs";

export { MAX_FILE_SIZE_BYTES, MAX_REFERENCE_BYTES };

export async function sha256File(file: File): Promise<Hex> {
  return (await sha256FileCore(file, MAX_FILE_SIZE_BYTES)) as Hex;
}

export function isValidReference(reference: string) {
  return isValidReferenceCore(reference, MAX_REFERENCE_BYTES);
}

export function formatHash(hash: string) {
  if (hash.length < 18) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export function formatWallet(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
