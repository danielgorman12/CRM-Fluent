import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ProspectMapLoader } from "@/components/map/ProspectMapLoader";
import { StageLegend } from "@/components/map/StageLegend";
import type { StageCategory } from "@/lib/generated/prisma/enums";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const view = params.view === "historical" ? "historical" : "active";
  const categories: StageCategory[] =
    view === "historical" ? ["CLOSED_WON", "CLOSED_LOST"] : ["ACTIVE"];

  const [prospects, stages] = await Promise.all([
    prisma.prospect.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        currentStage: { category: { in: categories } },
      },
      include: { currentStage: true },
    }),
    prisma.stageDefinition.findMany({ orderBy: { order: "asc" } }),
  ]);

  const mapProspects = prospects
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude as number,
      longitude: p.longitude as number,
      stageName: p.currentStage.name,
      stageColor: p.currentStage.colorHex,
    }));

  const relevantStages = stages.filter((s) => categories.includes(s.category));

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Geographic Sourcing Map</h1>
        <div className="flex gap-2">
          <Button
            variant={view === "active" ? "default" : "outline"}
            size="sm"
            render={<Link href="/map?view=active">Active prospects</Link>}
          />
          <Button
            variant={view === "historical" ? "default" : "outline"}
            size="sm"
            render={<Link href="/map?view=historical">Closed acquisitions</Link>}
          />
        </div>
      </div>

      <StageLegend stages={relevantStages} />

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
        <ProspectMapLoader prospects={mapProspects} />
      </div>
    </div>
  );
}
