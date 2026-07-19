import type { AgreementStatus } from "@/src/lib/contract";

const styles: Record<AgreementStatus, string> = {
  pending: "bg-[#fff1cf] text-[#775014]",
  accepted: "bg-[#d7f1df] text-[#205c3b]",
  cancelled: "bg-[#ecefed] text-[#5d6862]",
  expired: "bg-[#f9dedb] text-[#8c302c]",
};

export function StatusBadge({ status }: { status: AgreementStatus }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[status]}`}>{status}</span>;
}
