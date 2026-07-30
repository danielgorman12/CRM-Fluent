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

export async function getDashboardData(filters: DashboardFilters) {
  const since = periodStartDate(filters.period);

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

  const activityWhere = {
    prospectId: { in: prospectIds },
    ...(since ? { activityDate: { gte: since } } : {}),
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
        ...(since ? { enteredAt: { gte: since } } : {}),
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

  const funnel = [
    { label: "Outreach", count: prospectsContacted },
    { label: "Response", count: respondedProspects.length },
    { label: "Discussions", count: progressingToDiscussions },
    { label: "LOI Submitted", count: loisSubmitted },
    { label: "Closed", count: acquisitionsCompleted },
  ];

  return {
    kpis: {
      prospectsContacted,
      emailsSent,
      repliesReceived,
      responseRate,
      progressingToDiscussions,
      loisSubmitted,
      loisAccepted,
      acquisitionsCompleted,
    },
    funnel,
  };
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
