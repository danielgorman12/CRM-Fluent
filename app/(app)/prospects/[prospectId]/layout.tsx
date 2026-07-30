import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StageBadge } from "@/components/prospects/StageBadge";
import { ProspectTabsNav } from "@/components/prospects/ProspectTabsNav";

export default async function ProspectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = await params;
  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: { currentStage: true },
  });

  if (!prospect) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{prospect.name}</h1>
        <StageBadge name={prospect.currentStage.name} colorHex={prospect.currentStage.colorHex} />
      </div>
      <div className="border-b">
        <ProspectTabsNav prospectId={prospectId} />
      </div>
      <div className="pt-2">{children}</div>
    </div>
  );
}
