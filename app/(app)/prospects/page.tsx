import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  columnsFor,
  formatMetric,
  loadScreenRows,
  parseScreenFilters,
  sortRows,
  type ColumnGroup,
} from "@/lib/screening";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/prospects/StageBadge";
import { SortHeader } from "@/components/prospects/SortHeader";
import { ScreenFilters } from "@/components/prospects/ScreenFilters";

const GROUPS: Array<ColumnGroup | "all"> = ["financial", "growth", "valuation", "scorecard", "all"];

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const str = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);

  const rawGroup = str("cols");
  const group: ColumnGroup | "all" = GROUPS.includes(rawGroup as ColumnGroup | "all")
    ? (rawGroup as ColumnGroup | "all")
    : "financial";

  const sort = str("sort") ?? "arr";
  const dir: "asc" | "desc" = str("dir") === "asc" ? "asc" : "desc";
  const filters = parseScreenFilters(params);

  const [rows, verticals, stages, users, countryRows] = await Promise.all([
    loadScreenRows(filters),
    prisma.vertical.findMany({ orderBy: { name: "asc" } }),
    prisma.stageDefinition.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.prospect.findMany({
      where: { country: { not: null } },
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    }),
  ]);

  const columns = columnsFor(group);
  const sorted = sortRows(rows, sort, dir);

  // Preserved across sort links and the column switcher.
  const filterParams: Record<string, string | undefined> = {
    cols: group,
    sort,
    dir,
    verticalId: str("verticalId"),
    stageId: str("stageId"),
    dealOwnerId: str("dealOwnerId"),
    country: str("country"),
    closed: str("closed"),
    minArr: str("minArr"),
    minEbitdaMargin: str("minEbitdaMargin"),
    minNetRetention: str("minNetRetention"),
    minScore: str("minScore"),
    maxEbitdaMultiple: str("maxEbitdaMultiple"),
  };

  const exportSearch = new URLSearchParams();
  for (const [key, value] of Object.entries(filterParams)) {
    if (value) exportSearch.set(key, value);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospect Screening</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sorted.length} {sorted.length === 1 ? "prospect" : "prospects"} matching · click any
            metric to sort
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<a href={`/api/export/prospects?${exportSearch.toString()}`}>Export CSV</a>}
          />
          <Button render={<Link href="/prospects/new">New prospect</Link>} />
        </div>
      </div>

      <ScreenFilters
        verticals={verticals}
        stages={stages}
        users={users}
        countries={countryRows.map((c) => c.country as string)}
        current={filterParams}
        group={group}
      />

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">No prospects match these filters</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Threshold filters also exclude prospects with no value recorded for that metric.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-muted/40 text-xs">
              <tr className="border-b">
                <th className="sticky left-0 z-10 bg-muted/40 px-4 py-2.5 text-left">
                  <SortHeader
                    columnKey="name"
                    label="Company"
                    currentSort={sort}
                    currentDir={dir}
                    params={filterParams}
                    align="left"
                  />
                </th>
                <th className="px-3 py-2.5 text-left">
                  <SortHeader
                    columnKey="stage"
                    label="Stage"
                    currentSort={sort}
                    currentDir={dir}
                    params={filterParams}
                    align="left"
                  />
                </th>
                <th className="px-3 py-2.5 text-left">
                  <SortHeader
                    columnKey="vertical"
                    label="Vertical"
                    currentSort={sort}
                    currentDir={dir}
                    params={filterParams}
                    align="left"
                  />
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2.5 text-right">
                    <SortHeader
                      columnKey={col.key}
                      label={col.label}
                      currentSort={sort}
                      currentDir={dir}
                      params={filterParams}
                      hint={col.lowerIsBetter ? "lower is better" : undefined}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="sticky left-0 z-10 bg-background px-4 py-2.5">
                    <Link href={`/prospects/${row.id}`} className="font-medium hover:underline">
                      {row.name}
                    </Link>
                    {row.location && (
                      <p className="text-xs text-muted-foreground">{row.location}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <StageBadge name={row.stageName} colorHex={row.stageColor} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                    {row.vertical ?? "—"}
                  </td>
                  {columns.map((col) => {
                    const value = row.metrics[col.key] ?? null;
                    return (
                      <td
                        key={col.key}
                        className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${
                          value === null ? "text-muted-foreground" : ""
                        } ${sort === col.key ? "font-semibold" : ""}`}
                      >
                        {formatMetric(value, col.format)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
