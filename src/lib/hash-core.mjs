export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_REFERENCE_BYTES = 140;

export async function sha256FileCore(file, maxSizeBytes) {
  if (file.size > maxSizeBytes) {
    throw new Error(`Choose a file smaller than ${maxSizeBytes / 1024 / 1024} MB.`);
  }
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `0x${hash}`;
}

export function isValidReferenceCore(reference, maxBytes) {
  const value = reference.trim();
  return value.length > 0 && new TextEncoder().encode(value).length <= maxBytes;
}
