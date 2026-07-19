import type { Hex } from "viem";

export async function sha256File(file: File): Promise<Hex> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `0x${hash}` as Hex;
}

export function formatHash(hash: string) {
  if (hash.length < 18) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export function formatWallet(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
