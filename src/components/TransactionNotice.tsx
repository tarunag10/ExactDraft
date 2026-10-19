import { ExternalLink } from "lucide-react";
import { explorerTxUrl, monadTestnet } from "@/src/lib/networks";

export function TransactionNotice({ hash, label = "View transaction", chainId = monadTestnet.id }: { hash?: string; label?: string; chainId?: number }) {
  if (!hash) return null;
  const url = explorerTxUrl(hash, chainId);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[#205c3b] underline decoration-[#9fc9aa] underline-offset-4 hover:text-[#173d35]">
      {label} <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}
