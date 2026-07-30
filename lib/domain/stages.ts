import { addMonths } from "date-fns";

/**
 * Opportunity stages — the single source of truth for the stage vocabulary.
 *
 * Every section of the application (Sourcing, Map, geographic reports,
 * Pipeline, trip agent) reads stage metadata from here. Nothing may define its
 * own stage list, colours, ordering, or scores.
 *
 * `prisma/schema.prisma` mirrors these keys as the `OpportunityStage` enum.
 * `stages.test.ts` reads the schema file and fails if the two ever drift.
 *
 * This module deliberately does NOT import the generated Prisma client: it has
 * to be usable before `prisma generate` has run, and keeping it dependency-free
 * is what lets the whole test suite run without a database.
 */

export const OPPORTUNITY_STAGES = [
  "NOT_RESPONDED",
  "POSITIVE_RESPONSE",
  "DATA_RECEIVED",
  "IOI",
  "LOI",
  "DD",
  "CLOSED_LOST",
  "CLOSED_WON",
  "TOUCH_BASE_LATER",
] as const;

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

/** ACTIVE = in play · DORMANT = deliberately parked · CLOSED = terminal. */
export type StageCategory = "ACTIVE" | "DORMANT" | "CLOSED";

export type StageConfig = {
  label: string;
  /** Display order in tables, legends, and distribution charts. */
  order: number;
  category: StageCategory;
  /** Marker and badge colour. Must be distinguishable on an OSM basemap. */
  colorHex: string;
  /** Appears as a column on the Pipeline kanban board. */
  inPipeline: boolean;
  /**
   * Contribution to the trip-agent priority score, 0-15 (ADR-017).
   *
   * Positive Response scores highest — for a *sourcing* trip the most valuable
   * meeting is an engaged owner not yet in process. LOI/DD companies are
   * managed through the structured deal process, not through sourcing travel.
   *
   * Changing these values requires a new ADR and re-running the three trip
   * scenario tests, whose assertions depend on this ordering.
   */
  stageScore: number;
  /** False = hard-excluded from sourcing trips regardless of every other factor. */
  tripEligible: boolean;
};

export const STAGE_CONFIG = {
  NOT_RESPONDED: {
    label: "Not Responded",
    order: 1,
    category: "ACTIVE",
    colorHex: "#94a3b8",
    inPipeline: false,
    stageScore: 5,
    tripEligible: true,
  },
  POSITIVE_RESPONSE: {
    label: "Positive Response",
    order: 2,
    category: "ACTIVE",
    colorHex: "#22c55e",
    inPipeline: false,
    stageScore: 15,
    tripEligible: true,
  },
  DATA_RECEIVED: {
    label: "Data Received",
    order: 3,
    category: "ACTIVE",
    colorHex: "#14b8a6",
    inPipeline: true,
    stageScore: 14,
    tripEligible: true,
  },
  IOI: {
    label: "IOI",
    order: 4,
    category: "ACTIVE",
    colorHex: "#3b82f6",
    inPipeline: true,
    stageScore: 13,
    tripEligible: true,
  },
  LOI: {
    label: "LOI",
    order: 5,
    category: "ACTIVE",
    colorHex: "#8b5cf6",
    inPipeline: true,
    stageScore: 11,
    tripEligible: true,
  },
  DD: {
    label: "DD",
    order: 6,
    category: "ACTIVE",
    colorHex: "#f59e0b",
    inPipeline: true,
    stageScore: 10,
    tripEligible: true,
  },
  CLOSED_LOST: {
    label: "Closed Lost",
    order: 7,
    category: "CLOSED",
    colorHex: "#71717a",
    inPipeline: false,
    stageScore: 0,
    // The relationship was closed out. Scheduling a sourcing visit would be
    // the single most obvious sign the recommendations are not trustworthy.
    tripEligible: false,
  },
  CLOSED_WON: {
    label: "Closed Won",
    order: 8,
    category: "CLOSED",
    colorHex: "#15803d",
    inPipeline: false,
    stageScore: 2,
    // Already acquired — no longer a sourcing target.
    tripEligible: false,
  },
  TOUCH_BASE_LATER: {
    label: "Touch Base Later",
    order: 9,
    category: "DORMANT",
    colorHex: "#ec4899",
    inPipeline: false,
    stageScore: 9,
    tripEligible: true,
  },
} as const satisfies Record<OpportunityStage, StageConfig>;

/** Kanban columns, left to right. */
export const PIPELINE_STAGES = OPPORTUNITY_STAGES.filter(
  (stage) => STAGE_CONFIG[stage].inPipeline,
).sort((a, b) => STAGE_CONFIG[a].order - STAGE_CONFIG[b].order);

export const ACTIVE_STAGES = OPPORTUNITY_STAGES.filter(
  (stage) => STAGE_CONFIG[stage].category === "ACTIVE",
);

export const CLOSED_STAGES = OPPORTUNITY_STAGES.filter(
  (stage) => STAGE_CONFIG[stage].category === "CLOSED",
);

export function stageLabel(stage: OpportunityStage): string {
  return STAGE_CONFIG[stage].label;
}

export function stageColor(stage: OpportunityStage): string {
  return STAGE_CONFIG[stage].colorHex;
}

export function isTripEligible(stage: OpportunityStage): boolean {
  return STAGE_CONFIG[stage].tripEligible;
}

/** Stages ordered for display in tables, legends, and distribution charts. */
export const STAGES_IN_DISPLAY_ORDER = [...OPPORTUNITY_STAGES].sort(
  (a, b) => STAGE_CONFIG[a].order - STAGE_CONFIG[b].order,
);

// --- Touch-base periods ----------------------------------------------------

export const TOUCH_BASE_PERIODS = [
  "ONE_MONTH",
  "THREE_MONTHS",
  "SIX_MONTHS",
  "TWELVE_MONTHS",
] as const;

export type TouchBasePeriod = (typeof TOUCH_BASE_PERIODS)[number];

export const TOUCH_BASE_CONFIG = {
  ONE_MONTH: { label: "1 Month", months: 1 },
  THREE_MONTHS: { label: "3 Months", months: 3 },
  SIX_MONTHS: { label: "6 Months", months: 6 },
  TWELVE_MONTHS: { label: "12 Months", months: 12 },
} as const satisfies Record<TouchBasePeriod, { label: string; months: number }>;

/**
 * Next follow-up date implied by moving a company to Touch Base Later.
 *
 * Pure: the caller supplies `from`, so this is deterministic and testable and
 * never reads the clock itself.
 *
 * Uses date-fns rather than `setMonth`, which overflows — a naive
 * `new Date("2026-01-31").setMonth(+1)` yields 3 March, silently pushing a
 * follow-up past its due month. date-fns clamps to 28 February instead.
 */
export function touchBaseFollowUpDate(period: TouchBasePeriod, from: Date): Date {
  return addMonths(from, TOUCH_BASE_CONFIG[period].months);
}
