import { prisma } from "@/lib/prisma";

// Screening view over every prospect: profile financials, forecast, valuation
// and scorecard side by side, sortable on any metric.
//
// Sorting and filtering happen in memory rather than in SQL. The metrics live
// across five tables (some derived, like churn from retention), and an M&A
// sourcing list is dozens to low hundreds of rows — so one query plus an
// in-memory sort is simpler and gives exact control over null ordering. Revisit
// if the prospect count ever reaches the thousands.

export type ScreenRow = {
  id: string;
  name: string;
  vertical: string | null;
  stageName: string;
  stageColor: string;
  stageOrder: number;
  dealOwner: string;
  location: string | null;
  metrics: Record<string, number | null>;
};

export type ColumnGroup = "financial" | "growth" | "valuation" | "scorecard";

type Format = "currency" | "percent" | "multiple" | "score" | "number";

export type ScreenColumn = {
  key: string;
  label: string;
  group: ColumnGroup;
  format: Format;
  /** Lower is better — churn and purchase multiples, for instance. */
  lowerIsBetter?: boolean;
};

export const COLUMN_GROUPS: Array<{ value: ColumnGroup | "all"; label: string }> = [
  { value: "financial", label: "Financials" },
  { value: "growth", label: "Growth" },
  { value: "valuation", label: "Valuation" },
  { value: "scorecard", label: "Scorecard" },
  { value: "all", label: "All metrics" },
];

export const SCREEN_COLUMNS: ScreenColumn[] = [
  { key: "arr", label: "ARR", group: "financial", format: "currency" },
  { key: "ebitda", label: "EBITDA", group: "financial", format: "currency" },
  { key: "ebitdaMargin", label: "EBITDA margin", group: "financial", format: "percent" },
  { key: "grossRetention", label: "Gross retention", group: "financial", format: "percent" },
  { key: "netRetention", label: "Net retention", group: "financial", format: "percent" },
  { key: "grossChurn", label: "Gross churn", group: "financial", format: "percent", lowerIsBetter: true },

  { key: "growthPct", label: "Fcst growth", group: "growth", format: "percent" },
  { key: "forecastArr", label: "Fcst ARR", group: "growth", format: "currency" },
  { key: "forecastEbitdaMargin", label: "Fcst margin", group: "growth", format: "percent" },
  { key: "marginUpside", label: "Margin upside", group: "growth", format: "percent" },

  { key: "priceLow", label: "Price low", group: "valuation", format: "currency" },
  { key: "priceHigh", label: "Price high", group: "valuation", format: "currency" },
  { key: "revenueMultiple", label: "Rev multiple", group: "valuation", format: "multiple", lowerIsBetter: true },
  { key: "ebitdaMultiple", label: "EBITDA multiple", group: "valuation", format: "multiple", lowerIsBetter: true },
  { key: "expectedRoce", label: "Expected ROCE", group: "valuation", format: "percent" },

  { key: "overallScore", label: "Overall score", group: "scorecard", format: "score" },
  { key: "financialScore", label: "Financial", group: "scorecard", format: "score" },
  { key: "retentionScore", label: "Retention", group: "scorecard", format: "score" },
  { key: "recurringScore", label: "Recurring rev", group: "scorecard", format: "score" },
  { key: "fitScore", label: "Strategic fit", group: "scorecard", format: "score" },
  { key: "verticalScore", label: "Vertical", group: "scorecard", format: "score" },
  { key: "sellerScore", label: "Seller willing", group: "scorecard", format: "score" },
  { key: "riskScore", label: "Risk", group: "scorecard", format: "score" },
  { key: "returnsScore", label: "Returns", group: "scorecard", format: "score" },
];

export function columnsFor(group: ColumnGroup | "all"): ScreenColumn[] {
  return group === "all" ? SCREEN_COLUMNS : SCREEN_COLUMNS.filter((c) => c.group === group);
}

export function formatMetric(value: number | null, format: Format): string {
  if (value === null || Number.isNaN(value)) return "—";
  switch (format) {
    case "currency":
      if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
      return `$${value.toFixed(0)}`;
    case "percent":
      return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
    case "multiple":
      return `${value.toFixed(1)}×`;
    case "score":
      return value.toFixed(value % 1 === 0 ? 0 : 1);
    default:
      return value.toLocaleString();
  }
}

export type ScreenFilters = {
  verticalId?: string;
  stageId?: string;
  dealOwnerId?: string;
  country?: string;
  activeOnly?: boolean;
  minArr?: number;
  minEbitdaMargin?: number;
  minNetRetention?: number;
  minScore?: number;
  maxEbitdaMultiple?: number;
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export function parseScreenFilters(params: Record<string, string | string[] | undefined>): ScreenFilters {
  const str = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  return {
    verticalId: str("verticalId"),
    stageId: str("stageId"),
    dealOwnerId: str("dealOwnerId"),
    country: str("country"),
    // Default to open deals: screening is about what you could still buy.
    activeOnly: str("closed") !== "1",
    minArr: num(str("minArr")),
    minEbitdaMargin: num(str("minEbitdaMargin")),
    minNetRetention: num(str("minNetRetention")),
    minScore: num(str("minScore")),
    maxEbitdaMultiple: num(str("maxEbitdaMultiple")),
  };
}

const dec = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export async function loadScreenRows(filters: ScreenFilters): Promise<ScreenRow[]> {
  const prospects = await prisma.prospect.findMany({
    where: {
      ...(filters.verticalId ? { verticalId: filters.verticalId } : {}),
      ...(filters.stageId ? { currentStageId: filters.stageId } : {}),
      ...(filters.dealOwnerId ? { dealOwnerId: filters.dealOwnerId } : {}),
      ...(filters.country ? { country: filters.country } : {}),
      ...(filters.activeOnly ? { currentStage: { category: "ACTIVE" } } : {}),
    },
    include: {
      vertical: true,
      dealOwner: true,
      currentStage: true,
      scorecard: true,
      valuation: true,
      forecast: true,
    },
  });

  const rows: ScreenRow[] = prospects.map((p) => {
    const grossRetention = dec(p.grossRetentionPct);
    const revLow = dec(p.valuation?.revenueMultipleLow);
    const revHigh = dec(p.valuation?.revenueMultipleHigh);
    const ebLow = dec(p.valuation?.ebitdaMultipleLow);
    const ebHigh = dec(p.valuation?.ebitdaMultipleHigh);

    return {
      id: p.id,
      name: p.name,
      vertical: p.vertical?.name ?? null,
      stageName: p.currentStage.name,
      stageColor: p.currentStage.colorHex,
      stageOrder: p.currentStage.order,
      dealOwner: p.dealOwner.name,
      location: [p.city, p.region, p.country].filter(Boolean).join(", ") || null,
      metrics: {
        arr: dec(p.currentARR),
        ebitda: dec(p.currentEBITDA),
        ebitdaMargin: dec(p.currentEBITDAMargin),
        grossRetention,
        netRetention: dec(p.netRetentionPct),
        // Churn isn't stored; it's the complement of gross retention.
        grossChurn: grossRetention === null ? null : 100 - grossRetention,

        growthPct: dec(p.forecast?.forecastedRevenueGrowthPct),
        forecastArr: dec(p.forecast?.forecastedARR),
        forecastEbitdaMargin: dec(p.forecast?.forecastedEBITDAMargin),
        marginUpside: dec(p.forecast?.marginImprovementPts),

        priceLow: dec(p.valuation?.indicativePriceRangeLow),
        priceHigh: dec(p.valuation?.indicativePriceRangeHigh),
        // Show the midpoint when a range is given, so one column can be sorted.
        revenueMultiple: revLow !== null && revHigh !== null ? (revLow + revHigh) / 2 : (revLow ?? revHigh),
        ebitdaMultiple: ebLow !== null && ebHigh !== null ? (ebLow + ebHigh) / 2 : (ebLow ?? ebHigh),
        expectedRoce: dec(p.valuation?.expectedROCE),

        overallScore: dec(p.scorecard?.overallScore),
        financialScore: p.scorecard?.financialAttractivenessScore ?? null,
        retentionScore: p.scorecard?.customerRetentionScore ?? null,
        recurringScore: p.scorecard?.recurringRevenueQualityScore ?? null,
        fitScore: p.scorecard?.strategicFitScore ?? null,
        verticalScore: p.scorecard?.verticalAttractivenessScore ?? null,
        sellerScore: p.scorecard?.sellerWillingnessScore ?? null,
        riskScore: p.scorecard?.keyRisksScore ?? null,
        returnsScore: p.scorecard?.valuationReturnsScore ?? null,
      },
    };
  });

  // Threshold filters drop rows that don't meet them. A prospect missing the
  // metric is also dropped — you can't confirm it clears a bar you've set.
  return rows.filter((r) => {
    const m = r.metrics;
    if (filters.minArr !== undefined && (m.arr === null || m.arr < filters.minArr)) return false;
    if (
      filters.minEbitdaMargin !== undefined &&
      (m.ebitdaMargin === null || m.ebitdaMargin < filters.minEbitdaMargin)
    )
      return false;
    if (
      filters.minNetRetention !== undefined &&
      (m.netRetention === null || m.netRetention < filters.minNetRetention)
    )
      return false;
    if (filters.minScore !== undefined && (m.overallScore === null || m.overallScore < filters.minScore))
      return false;
    if (
      filters.maxEbitdaMultiple !== undefined &&
      (m.ebitdaMultiple === null || m.ebitdaMultiple > filters.maxEbitdaMultiple)
    )
      return false;
    return true;
  });
}

export function sortRows(rows: ScreenRow[], sortKey: string, direction: "asc" | "desc"): ScreenRow[] {
  const sorted = [...rows];
  const factor = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name) * factor;
    if (sortKey === "stage") return (a.stageOrder - b.stageOrder) * factor;
    if (sortKey === "vertical") return (a.vertical ?? "").localeCompare(b.vertical ?? "") * factor;
    if (sortKey === "owner") return a.dealOwner.localeCompare(b.dealOwner) * factor;

    const av = a.metrics[sortKey] ?? null;
    const bv = b.metrics[sortKey] ?? null;
    // Missing values sort last in both directions — a blank isn't a low score.
    if (av === null && bv === null) return a.name.localeCompare(b.name);
    if (av === null) return 1;
    if (bv === null) return -1;
    if (av === bv) return a.name.localeCompare(b.name);
    return (av - bv) * factor;
  });

  return sorted;
}
