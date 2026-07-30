import { prisma } from "@/lib/prisma";
import { upsertValuation } from "@/actions/valuation-actions";
import { ValuationForm } from "@/components/prospects/ValuationForm";

export default async function ValuationTab({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = await params;
  const valuation = await prisma.valuationAnalysis.findUnique({ where: { prospectId } });
  const action = upsertValuation.bind(null, prospectId);

  return <ValuationForm action={action} defaultValues={valuation ?? undefined} />;
}
