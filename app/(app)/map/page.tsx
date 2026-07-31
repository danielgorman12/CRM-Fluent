import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ProspectMapLoader } from "@/components/map/ProspectMapLoader";
import { StageLegend } from "@/components/map/StageLegend";
import { GeoSelection, type SelectableProspect } from "@/components/map/GeoSelection";
import type { StageCategory } from "@/lib/generated/prisma/enums";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const str = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);

  const view = params.view === "historical" ? "historical" : "active";
  const categories: StageCategory[] =
    view === "historical" ? ["CLOSED_WON", "CLOSED_LOST"] : ["ACTIVE"];

  const country = str("country");
  const verticalId = str("verticalId");

  const [prospects, stages, countryRows, verticals] = await Promise.all([
    prisma.prospect.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        currentStage: { category: { in: categories } },
        ...(country ? { country } : {}),
        ...(verticalId ? { verticalId } : {}),
      },
      include: { currentStage: true, vertical: true },
      orderBy: { name: "asc" },
    }),
    prisma.stageDefinition.findMany({ orderBy: { order: "asc" } }),
    prisma.prospect.findMany({
      where: { country: { not: null } },
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    }),
    prisma.vertical.findMany({ orderBy: { name: "asc" } }),
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

  const selectable: SelectableProspect[] = prospects.map((p) => ({
    id: p.id,
    name: p.name,
    location: [p.city, p.region, p.country].filter(Boolean).join(", ") || null,
    stageName: p.currentStage.name,
    stageColor: p.currentStage.colorHex,
    arr: p.currentARR === null ? null : Number(p.currentARR),
  }));

  const relevantStages = stages.filter((s) => categories.includes(s.category));
  const activeVertical = verticals.find((v) => v.id === verticalId);
  const geographyNote =
    [country ?? "All countries", activeVertical?.name].filter(Boolean).join(" · ") || "All countries";

  // Filter links preserve the other filters.
  function filterHref(patch: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    const base: Record<string, string | undefined> = { view, country, verticalId, ...patch };
    for (const [key, value] of Object.entries(base)) {
      if (value) search.set(key, value);
    }
    return `/map?${search.toString()}`;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[36rem] flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Geographic Sourcing Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {prospects.length} {prospects.length === 1 ? "prospect" : "prospects"} in {geographyNote}{" "}
            · select companies to draft outreach
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "active" ? "default" : "outline"}
            size="sm"
            render={<Link href={filterHref({ view: "active" })}>Active prospects</Link>}
          />
          <Button
            variant={view === "historical" ? "default" : "outline"}
            size="sm"
            render={<Link href={filterHref({ view: "historical" })}>Closed acquisitions</Link>}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-muted/40 px-4 py-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Geography
        </span>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip href={filterHref({ country: undefined })} active={!country} label="All" />
          {countryRows.map((c) => (
            <FilterChip
              key={c.country}
              href={filterHref({ country: c.country as string })}
              active={country === c.country}
              label={c.country as string}
            />
          ))}
        </div>

        <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Vertical
        </span>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip href={filterHref({ verticalId: undefined })} active={!verticalId} label="All" />
          {verticals.map((v) => (
            <FilterChip
              key={v.id}
              href={filterHref({ verticalId: v.id })}
              active={verticalId === v.id}
              label={v.name}
            />
          ))}
        </div>
      </div>

      <StageLegend stages={relevantStages} />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="min-h-64 overflow-hidden rounded-xl border">
          <ProspectMapLoader prospects={mapProspects} />
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border">
          <GeoSelection prospects={selectable} geographyNote={geographyNote} />
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-transparent bg-brand text-brand-foreground"
          : "bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
