"use client";

import { useState } from "react";
import type { Hex } from "viem";
import { sha256File } from "@/src/lib/hash";

export function LocalFileHash({
  onHash,
  label = "Select your local document",
}: {
  onHash: (hash: Hex | undefined, fileName: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(undefined);
    try {
      const hash = await sha256File(file);
      onHash(hash, file.name);
    } catch {
      onHash(undefined, "");
      setError("This browser could not calculate the file hash. Try the file again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="mono-label mb-2 block text-[10px] font-bold text-[#68736d]" htmlFor="local-file">
        {label}
      </label>
      <input id="local-file" type="file" onChange={handleFile} className="block w-full cursor-pointer rounded-xl border border-dashed border-[#aebbb1] bg-white px-4 py-3 text-sm text-[#68736d] file:mr-3 file:rounded-full file:border-0 file:bg-[#173d35] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:border-[#173d35]" aria-describedby="local-file-help local-file-status" />
      <p id="local-file-help" className="mt-2 text-xs leading-5 text-[#68736d]">SHA-256 is computed in memory by this browser. The file itself never leaves this device.</p>
      <p id="local-file-status" role="status" aria-live="polite" className="mt-1 text-xs font-semibold text-[#205c3b]">
        {busy ? "Calculating SHA-256 locally…" : ""}
      </p>
      {error ? <p role="alert" className="mt-1 text-xs text-[#b83f39]">{error}</p> : null}
    </div>
  );
}
