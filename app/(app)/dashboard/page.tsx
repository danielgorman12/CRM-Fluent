import {
  getActivityChart,
  getDashboardData,
  getDashboardFilterOptions,
  getPipelineBoard,
  getStageDistribution,
} from "@/lib/dashboard-queries";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ConversionBars } from "@/components/dashboard/ConversionBars";
import { ActivityBarChart } from "@/components/dashboard/ActivityBarChart";
import { StageDonut } from "@/components/dashboard/StageDonut";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { ViewToggle } from "@/components/dashboard/ViewToggle";

function Panel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

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
  const view = str("view") === "board" ? "board" : "charts";

  const [data, filterOptions, activity, stages, board] = await Promise.all([
    getDashboardData(filters),
    getDashboardFilterOptions(),
    view === "charts" ? getActivityChart(filters) : Promise.resolve([]),
    view === "charts" ? getStageDistribution(filters) : Promise.resolve([]),
    view === "board" ? getPipelineBoard(filters) : Promise.resolve(null),
  ]);

  const { kpis, previous } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sourcing Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Outreach, conversion and pipeline across all acquisition targets.
        </p>
      </div>

      <FilterBar
        countries={filterOptions.countries}
        verticals={filterOptions.verticals}
        users={filterOptions.users}
        stages={filterOptions.stages}
        current={filters}
      />

      <div className="grid gap-6 divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <div className="lg:pr-6">
          <KpiCard
            label="Prospects contacted"
            value={kpis.prospectsContacted}
            current={kpis.prospectsContacted}
            previous={previous?.prospectsContacted}
          />
        </div>
        <div className="pt-6 sm:pt-0 lg:px-6">
          <KpiCard
            label="Response rate"
            value={`${kpis.responseRate.toFixed(0)}%`}
            current={kpis.responseRate}
            previous={previous?.responseRate}
          />
        </div>
        <div className="pt-6 sm:pt-0 lg:px-6">
          <KpiCard
            label="LOIs submitted"
            value={kpis.loisSubmitted}
            current={kpis.loisSubmitted}
            previous={previous?.loisSubmitted}
          />
        </div>
        <div className="pt-6 sm:pt-0 lg:pl-6">
          <KpiCard
            label="Acquisitions completed"
            value={kpis.acquisitionsCompleted}
            current={kpis.acquisitionsCompleted}
            previous={previous?.acquisitionsCompleted}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            Emails sent <span className="font-semibold text-foreground">{kpis.emailsSent}</span>
          </span>
          <span className="text-muted-foreground">
            Replies <span className="font-semibold text-foreground">{kpis.repliesReceived}</span>
          </span>
          <span className="text-muted-foreground">
            In discussions{" "}
            <span className="font-semibold text-foreground">{kpis.progressingToDiscussions}</span>
          </span>
          <span className="text-muted-foreground">
            LOIs accepted <span className="font-semibold text-foreground">{kpis.loisAccepted}</span>
          </span>
        </div>
        <ViewToggle current={view} params={filters} />
      </div>

      {view === "board" && board ? (
        <Panel title="Pipeline board" subtitle="Drag a card to move a prospect between stages.">
          <KanbanBoard columns={board} />
        </Panel>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Conversion by stage" subtitle="Prospects that have reached each stage.">
              <ConversionBars data={data.conversion} />
            </Panel>
            <Panel title="Pipeline distribution" subtitle="Where prospects sit right now.">
              <StageDonut data={stages} />
            </Panel>
          </div>
          <Panel title="Outreach activity" subtitle="Activities logged and replies received.">
            <ActivityBarChart data={activity} />
          </Panel>
        </div>
      )}
    </div>
  );
}
