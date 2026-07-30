import {
  getDashboardData,
  getDashboardFilterOptions,
  getPipelineBoard,
} from "@/lib/dashboard-queries";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { ViewToggle } from "@/components/dashboard/ViewToggle";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const str = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);

  const filters = {
    period: str("period"),
    country: str("country"),
    verticalId: str("verticalId"),
    dealOwnerId: str("dealOwnerId"),
    activityType: str("activityType"),
    stageId: str("stageId"),
  };
  const view = str("view") === "board" ? "board" : "funnel";

  const [data, filterOptions, board] = await Promise.all([
    getDashboardData(filters),
    getDashboardFilterOptions(),
    view === "board" ? getPipelineBoard(filters) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Outreach &amp; Conversion Dashboard</h1>

      <FilterBar
        countries={filterOptions.countries}
        verticals={filterOptions.verticals}
        users={filterOptions.users}
        stages={filterOptions.stages}
        current={filters}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Prospects contacted" value={data.kpis.prospectsContacted} />
        <KpiCard label="Emails sent" value={data.kpis.emailsSent} />
        <KpiCard label="Replies received" value={data.kpis.repliesReceived} />
        <KpiCard label="Response rate" value={`${data.kpis.responseRate.toFixed(0)}%`} />
        <KpiCard label="Progressed to discussions" value={data.kpis.progressingToDiscussions} />
        <KpiCard label="LOIs submitted" value={data.kpis.loisSubmitted} />
        <KpiCard label="LOIs accepted" value={data.kpis.loisAccepted} />
        <KpiCard label="Acquisitions completed" value={data.kpis.acquisitionsCompleted} />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {view === "board"
              ? "Pipeline board — prospects by stage"
              : "Conversion funnel — Outreach → Response → Discussions → LOI → Closed"}
          </h2>
          <ViewToggle current={view} params={filters} />
        </div>

        {view === "board" && board ? (
          <KanbanBoard columns={board} />
        ) : (
          <FunnelChart data={data.funnel} />
        )}
      </div>
    </div>
  );
}
