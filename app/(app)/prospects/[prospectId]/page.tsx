import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PipelineProgress } from "@/components/prospects/PipelineProgress";
import { StageChangeForm } from "@/components/prospects/StageChangeForm";

function formatCurrency(value: unknown) {
  if (value === null || value === undefined) return "—";
  return `$${Number(value).toLocaleString()}`;
}

function formatPct(value: unknown) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString()}%`;
}

export default async function ProspectOverviewPage({
  params,
}: {
  params: Promise<{ prospectId: string }>;
}) {
  const { prospectId } = await params;

  const [prospect, allStages] = await Promise.all([
    prisma.prospect.findUnique({
      where: { id: prospectId },
      include: { vertical: true, currentStage: true, dealOwner: true, valuation: true },
    }),
    prisma.stageDefinition.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!prospect) notFound();

  const fields: Array<[string, string]> = [
    ["Vertical", prospect.vertical?.name ?? "—"],
    ["Location", [prospect.city, prospect.region, prospect.country].filter(Boolean).join(", ") || "—"],
    ["Deal owner", prospect.dealOwner.name],
    ["Current ARR", formatCurrency(prospect.currentARR)],
    ["Current EBITDA", formatCurrency(prospect.currentEBITDA)],
    ["EBITDA margin", formatPct(prospect.currentEBITDAMargin)],
    ["Gross retention", formatPct(prospect.grossRetentionPct)],
    ["Net retention", formatPct(prospect.netRetentionPct)],
    [
      "Indicative price range",
      prospect.valuation?.indicativePriceRangeLow || prospect.valuation?.indicativePriceRangeHigh
        ? `${formatCurrency(prospect.valuation.indicativePriceRangeLow)} – ${formatCurrency(prospect.valuation.indicativePriceRangeHigh)}`
        : "Not yet set",
    ],
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-4">
          {prospect.description && <p className="max-w-2xl text-sm text-muted-foreground">{prospect.description}</p>}
        </div>
        <Button variant="outline" render={<Link href={`/prospects/${prospectId}/edit`}>Edit</Link>} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Pipeline progress</h2>
        <PipelineProgress stages={allStages} currentStageId={prospect.currentStageId} />
      </div>

      <div className="max-w-2xl rounded-lg border p-4">
        <StageChangeForm
          prospectId={prospectId}
          currentStageId={prospect.currentStageId}
          stages={allStages}
        />
      </div>

      <dl className="grid max-w-2xl grid-cols-2 gap-x-8 gap-y-4 text-sm">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {prospect.customerRetentionNotes && (
        <div className="max-w-2xl">
          <h2 className="mb-1 text-sm font-medium text-muted-foreground">Customer retention notes</h2>
          <p className="text-sm">{prospect.customerRetentionNotes}</p>
        </div>
      )}
    </div>
  );
}
