import { notFound } from "next/navigation";
import { AgreementReview } from "@/src/components/AgreementReview";
import { isValidAgreementId } from "@/src/lib/contract";
import { monadTestnet } from "@/src/lib/networks";

export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidAgreementId(id)) notFound();
  return <AgreementReview agreementId={id} targetChainId={monadTestnet.id} />;
}
