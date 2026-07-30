import { getDashboardData, getDashboardFilterOptions } from "@/lib/dashboard-queries";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FunnelChart } from "@/components/dashboard/FunnelChart";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    period: typeof params.period === "string" ? params.period : undefined,
    country: typeof params.country === "string" ? params.country : undefined,
    verticalId: typeof params.verticalId === "string" ? params.verticalId : undefined,
    dealOwnerId: typeof params.dealOwnerId === "string" ? params.dealOwnerId : undefined,
    activityType: typeof params.activityType === "string" ? params.activityType : undefined,
    stageId: typeof params.stageId === "string" ? params.stageId : undefined,
  };

  const [data, filterOptions] = await Promise.all([
    getDashboardData(filters),
    getDashboardFilterOptions(),
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

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Conversion funnel — Outreach → Response → Discussions → LOI → Closed
        </h2>
        <FunnelChart data={data.funnel} />
      </div>
    </div>
  );
}
