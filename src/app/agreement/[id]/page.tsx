import { notFound } from "next/navigation";
import { AgreementReview } from "@/src/components/AgreementReview";

export default async function AgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  return <AgreementReview agreementId={id} />;
}
