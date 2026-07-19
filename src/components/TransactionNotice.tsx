import { ExternalLink } from "lucide-react";
import { explorerTxUrl } from "@/src/lib/monad";

export function TransactionNotice({ hash, label = "View transaction" }: { hash?: string; label?: string }) {
  if (!hash) return null;
  return (
    <a href={explorerTxUrl(hash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[#205c3b] underline decoration-[#9fc9aa] underline-offset-4 hover:text-[#173d35]">
      {label} <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}
