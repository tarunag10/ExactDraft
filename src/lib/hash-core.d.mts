export const MAX_FILE_SIZE_BYTES: number;
export const MAX_REFERENCE_BYTES: number;
export function sha256FileCore(file: File, maxSizeBytes: number): Promise<string>;
export function isValidReferenceCore(reference: string, maxBytes: number): boolean;
