import { prisma } from "@/lib/prisma";

export type DashboardFilters = {
  period?: string;
  country?: string;
  verticalId?: string;
  dealOwnerId?: string;
  activityType?: string;
  stageId?: string;
};

export const PERIOD_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
] as const;

function periodStartDate(period?: string): Date | undefined {
  const days = Number(period);
  if (!period || period === "all" || Number.isNaN(days)) return undefined;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// KPI counts for one time window. Called twice — current and preceding period —
// so the cards can show a change figure.
async function computeKpis(filters: DashboardFilters, since?: Date, until?: Date) {
  const prospectWhere = {
    ...(filters.country ? { country: filters.country } : {}),
    ...(filters.verticalId ? { verticalId: filters.verticalId } : {}),
    ...(filters.dealOwnerId ? { dealOwnerId: filters.dealOwnerId } : {}),
    ...(filters.stageId ? { currentStageId: filters.stageId } : {}),
  };

  const scopedProspects = await prisma.prospect.findMany({
    where: prospectWhere,
    select: { id: true },
  });
  let prospectIds = scopedProspects.map((p) => p.id);

  const dateRange = since || until ? { ...(since ? { gte: since } : {}), ...(until ? { lt: until } : {}) } : undefined;

  const activityWhere = {
    prospectId: { in: prospectIds },
    ...(dateRange ? { activityDate: dateRange } : {}),
    ...(filters.activityType ? { activityType: filters.activityType as never } : {}),
  };

  // If an outreach-method filter is active, narrow the funnel's prospect set
  // to those actually contacted via that method, so the stage-based funnel
  // stages stay consistent with the outreach-based ones above them.
  if (filters.activityType) {
    const matching = await prisma.sourcingActivity.findMany({
      where: activityWhere,
      select: { prospectId: true },
      distinct: ["prospectId"],
    });
    prospectIds = matching.map((a) => a.prospectId);
  }

  const [emailsSent, repliesReceived, contactedProspects, stages] = await Promise.all([
    prisma.sourcingActivity.count({ where: { ...activityWhere, activityType: "EMAIL" } }),
    prisma.sourcingActivity.count({ where: { ...activityWhere, resultedInResponse: true } }),
    prisma.sourcingActivity.findMany({
      where: activityWhere,
      select: { prospectId: true },
      distinct: ["prospectId"],
    }),
    prisma.stageDefinition.findMany({ orderBy: { order: "asc" } }),
  ]);

  const respondedProspects = await prisma.sourcingActivity.findMany({
    where: { ...activityWhere, resultedInResponse: true },
    select: { prospectId: true },
    distinct: ["prospectId"],
  });

  const discussionsStage = stages.find((s) => s.name === "Initial Discussions");
  const loiStage = stages.find((s) => s.name === "LOI Submitted");
  const closedWonStage = stages.find((s) => s.category === "CLOSED_WON");

  async function countReachedStage(minOrder: number | undefined) {
    if (minOrder === undefined || prospectIds.length === 0) return 0;
    const stageIdsAtOrAbove = stages.filter((s) => s.order >= minOrder).map((s) => s.id);
    const rows = await prisma.prospectStageHistory.findMany({
      where: {
        prospectId: { in: prospectIds },
        stageId: { in: stageIdsAtOrAbove },
        ...(dateRange ? { enteredAt: dateRange } : {}),
      },
      select: { prospectId: true },
      distinct: ["prospectId"],
    });
    return rows.length;
  }

  const [progressingToDiscussions, loisSubmitted, acquisitionsCompleted] = await Promise.all([
    countReachedStage(discussionsStage?.order),
    countReachedStage(loiStage?.order),
    countReachedStage(closedWonStage?.order),
  ]);

  const loiAcceptedStage = stages.find((s) => s.name === "LOI Accepted");
  const loisAccepted = await countReachedStage(loiAcceptedStage?.order);

  const prospectsContacted = contactedProspects.length;
  const responseRate = prospectsContacted > 0 ? (respondedProspects.length / prospectsContacted) * 100 : 0;

  return {
    prospectsContacted,
    emailsSent,
    repliesReceived,
    responseRate,
    progressingToDiscussions,
    loisSubmitted,
    loisAccepted,
    acquisitionsCompleted,
    responded: respondedProspects.length,
  };
}

export type Kpis = Awaited<ReturnType<typeof computeKpis>>;

export async function getDashboardData(filters: DashboardFilters) {
  const since = periodStartDate(filters.period);

  // Compare against the equally-long window immediately before this one. With
  // no period selected there's no bounded range to compare against, so the
  // cards show no change figure rather than a misleading one.
  let previousSince: Date | undefined;
  if (since) {
    const days = Number(filters.period);
    previousSince = new Date(since);
    previousSince.setDate(previousSince.getDate() - days);
  }

  const [current, previous] = await Promise.all([
    computeKpis(filters, since),
    previousSince ? computeKpis(filters, previousSince, since) : Promise.resolve(null),
  ]);

  // Conversion stages, rendered as bars rather than a funnel.
  const conversion = [
    { label: "Outreach", count: current.prospectsContacted },
    { label: "Response", count: current.responded },
    { label: "Discussions", count: current.progressingToDiscussions },
    { label: "LOI", count: current.loisSubmitted },
    { label: "Closed", count: current.acquisitionsCompleted },
  ];

  return { kpis: current, previous, conversion };
}

export type ChartPoint = { label: string; outreach: number; responses: number };
export type SlicePoint = { label: string; value: number; color: string };

// Outreach volume over time, split into total activities vs those that got a
// reply — the two-series grouped bars on the dashboard.
export async function getActivityChart(filters: DashboardFilters): Promise<ChartPoint[]> {
  const since = periodStartDate(filters.period);

  const prospects = await prisma.prospect.findMany({
    where: {
      ...(filters.country ? { country: filters.country } : {}),
      ...(filters.verticalId ? { verticalId: filters.verticalId } : {}),
      ...(filters.dealOwnerId ? { dealOwnerId: filters.dealOwnerId } : {}),
    },
    select: { id: true },
  });

  const activities = await prisma.sourcingActivity.findMany({
    where: {
      prospectId: { in: prospects.map((p) => p.id) },
      ...(since ? { activityDate: { gte: since } } : {}),
      ...(filters.activityType ? { activityType: filters.activityType as never } : {}),
    },
    select: { activityDate: true, resultedInResponse: true },
    orderBy: { activityDate: "asc" },
  });

  if (activities.length === 0) return [];

  // Bucket by month when the range is long, otherwise by day, so the axis stays
  // readable whichever period is selected.
  const spanDays =
    (activities[activities.length - 1].activityDate.getTime() - activities[0].activityDate.getTime()) /
    86_400_000;
  const byMonth = spanDays > 62;

  const buckets = new Map<string, ChartPoint>();
  for (const activity of activities) {
    const d = activity.activityDate;
    const key = byMonth
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : d.toISOString().slice(0, 10);
    const label = byMonth
      ? d.toLocaleDateString(undefined, { month: "short", year: "2-digit" })
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

    const bucket = buckets.get(key) ?? { label, outreach: 0, responses: 0 };
    bucket.outreach += 1;
    if (activity.resultedInResponse) bucket.responses += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

// Pipeline distribution for the donut. Uses each stage's own colour so the
// donut, board and map all read the same way.
export async function getStageDistribution(filters: DashboardFilters): Promise<SlicePoint[]> {
  const [stages, prospects] = await Promise.all([
    prisma.stageDefinition.findMany({ orderBy: { order: "asc" } }),
    prisma.prospect.findMany({
      where: {
        ...(filters.country ? { country: filters.country } : {}),
        ...(filters.verticalId ? { verticalId: filters.verticalId } : {}),
        ...(filters.dealOwnerId ? { dealOwnerId: filters.dealOwnerId } : {}),
      },
      select: { currentStageId: true },
    }),
  ]);

  return stages
    .map((stage) => ({
      label: stage.name,
      value: prospects.filter((p) => p.currentStageId === stage.id).length,
      color: stage.colorHex,
    }))
    .filter((slice) => slice.value > 0);
}

export type BoardCard = {
  id: string;
  name: string;
  vertical: string | null;
  location: string | null;
  arr: number | null;
  dealOwner: string;
};

export type BoardColumn = {
  stageId: string;
  stageName: string;
  colorHex: string;
  cards: BoardCard[];
};

// Prospects grouped into pipeline columns for the Kanban board. Returns plain
// serializable values — Prisma's Decimal can't cross into a client component.
//
// Applies the prospect-level filters only: the period and outreach-method
// filters describe activities, and the stage filter would collapse the board to
// a single column, which defeats the point of a board.
export async function getPipelineBoard(filters: DashboardFilters): Promise<BoardColumn[]> {
  const [stages, prospects] = await Promise.all([
    prisma.stageDefinition.findMany({ orderBy: { order: "asc" } }),
    prisma.prospect.findMany({
      where: {
        ...(filters.country ? { country: filters.country } : {}),
        ...(filters.verticalId ? { verticalId: filters.verticalId } : {}),
        ...(filters.dealOwnerId ? { dealOwnerId: filters.dealOwnerId } : {}),
      },
      include: { vertical: true, dealOwner: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return stages.map((stage) => ({
    stageId: stage.id,
    stageName: stage.name,
    colorHex: stage.colorHex,
    cards: prospects
      .filter((p) => p.currentStageId === stage.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        vertical: p.vertical?.name ?? null,
        location: [p.city, p.region, p.country].filter(Boolean).join(", ") || null,
        arr: p.currentARR === null ? null : Number(p.currentARR),
        dealOwner: p.dealOwner.name,
      })),
  }));
}

export async function getDashboardFilterOptions() {
  const [countries, verticals, users, stages] = await Promise.all([
    prisma.prospect.findMany({
      where: { country: { not: null } },
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    }),
    prisma.vertical.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.stageDefinition.findMany({ orderBy: { order: "asc" } }),
  ]);

  return {
    countries: countries.map((c) => c.country as string),
    verticals,
    users,
    stages,
  };
}
