import { prisma } from "@/lib/prisma";
import { upsertThesis } from "@/actions/thesis-actions";
import { ThesisForm } from "@/components/prospects/ThesisForm";

export default async function ThesisTab({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = await params;
  const thesis = await prisma.acquisitionThesis.findUnique({ where: { prospectId } });
  const action = upsertThesis.bind(null, prospectId);

  return <ThesisForm action={action} defaultValues={thesis ?? undefined} />;
}
