import { describe, expect, it } from "vitest";
import {
  ACTIVE_STAGES,
  CLOSED_STAGES,
  OPPORTUNITY_STAGES,
  PIPELINE_STAGES,
  STAGE_CONFIG,
  STAGES_IN_DISPLAY_ORDER,
  TOUCH_BASE_CONFIG,
  TOUCH_BASE_PERIODS,
  isTripEligible,
  touchBaseFollowUpDate,
} from "./stages";

describe("stage vocabulary", () => {
  it("defines exactly the nine stages in the product spec", () => {
    expect(OPPORTUNITY_STAGES).toHaveLength(9);
    expect([...OPPORTUNITY_STAGES].sort()).toEqual(
      [
        "CLOSED_LOST",
        "CLOSED_WON",
        "DATA_RECEIVED",
        "DD",
        "IOI",
        "LOI",
        "NOT_RESPONDED",
        "POSITIVE_RESPONSE",
        "TOUCH_BASE_LATER",
      ].sort(),
    );
  });

  it("gives every stage a config entry", () => {
    for (const stage of OPPORTUNITY_STAGES) {
      expect(STAGE_CONFIG[stage]).toBeDefined();
      expect(STAGE_CONFIG[stage].label.length).toBeGreaterThan(0);
    }
  });

  it("uses a unique display order per stage", () => {
    const orders = OPPORTUNITY_STAGES.map((s) => STAGE_CONFIG[s].order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("uses a unique colour per stage so map markers stay distinguishable", () => {
    const colors = OPPORTUNITY_STAGES.map((s) => STAGE_CONFIG[s].colorHex);
    expect(new Set(colors).size).toBe(colors.length);
    for (const color of colors) expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("stage scores (ADR-017)", () => {
  it("keeps every score within the 0-15 budget", () => {
    for (const stage of OPPORTUNITY_STAGES) {
      const { stageScore } = STAGE_CONFIG[stage];
      expect(stageScore).toBeGreaterThanOrEqual(0);
      expect(stageScore).toBeLessThanOrEqual(15);
    }
  });

  // This is the decision recorded in ADR-017. If someone reorders these
  // values, every generated itinerary changes and this test should fail
  // loudly rather than the change landing silently.
  it("ranks Positive Response above LOI and DD", () => {
    expect(STAGE_CONFIG.POSITIVE_RESPONSE.stageScore).toBeGreaterThan(
      STAGE_CONFIG.LOI.stageScore,
    );
    expect(STAGE_CONFIG.POSITIVE_RESPONSE.stageScore).toBeGreaterThan(
      STAGE_CONFIG.DD.stageScore,
    );
  });

  it("ranks Positive Response highest of all stages", () => {
    const best = [...OPPORTUNITY_STAGES].sort(
      (a, b) => STAGE_CONFIG[b].stageScore - STAGE_CONFIG[a].stageScore,
    )[0];
    expect(best).toBe("POSITIVE_RESPONSE");
  });

  it("scores an uncontacted prospect above a closed one", () => {
    expect(STAGE_CONFIG.NOT_RESPONDED.stageScore).toBeGreaterThan(
      STAGE_CONFIG.CLOSED_WON.stageScore,
    );
    expect(STAGE_CONFIG.NOT_RESPONDED.stageScore).toBeGreaterThan(
      STAGE_CONFIG.CLOSED_LOST.stageScore,
    );
  });
});

describe("trip eligibility", () => {
  it("hard-excludes both closed stages from sourcing trips", () => {
    expect(isTripEligible("CLOSED_LOST")).toBe(false);
    expect(isTripEligible("CLOSED_WON")).toBe(false);
  });

  it("admits every active and dormant stage", () => {
    for (const stage of OPPORTUNITY_STAGES) {
      if (STAGE_CONFIG[stage].category === "CLOSED") continue;
      expect(isTripEligible(stage)).toBe(true);
    }
  });
});

describe("derived stage groupings", () => {
  it("puts exactly the four deal stages on the pipeline board, in order", () => {
    expect(PIPELINE_STAGES).toEqual(["DATA_RECEIVED", "IOI", "LOI", "DD"]);
  });

  it("categorises every stage as active, dormant, or closed exactly once", () => {
    const dormant = OPPORTUNITY_STAGES.filter(
      (s) => STAGE_CONFIG[s].category === "DORMANT",
    );
    expect(ACTIVE_STAGES.length + CLOSED_STAGES.length + dormant.length).toBe(
      OPPORTUNITY_STAGES.length,
    );
    expect(CLOSED_STAGES).toEqual(["CLOSED_LOST", "CLOSED_WON"]);
    expect(dormant).toEqual(["TOUCH_BASE_LATER"]);
  });

  it("sorts display order ascending without dropping a stage", () => {
    expect(STAGES_IN_DISPLAY_ORDER).toHaveLength(OPPORTUNITY_STAGES.length);
    const orders = STAGES_IN_DISPLAY_ORDER.map((s) => STAGE_CONFIG[s].order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

describe("touch-base periods", () => {
  it("defines the four periods from the spec", () => {
    expect(TOUCH_BASE_PERIODS).toEqual([
      "ONE_MONTH",
      "THREE_MONTHS",
      "SIX_MONTHS",
      "TWELVE_MONTHS",
    ]);
  });

  it("computes the follow-up date for each period", () => {
    const from = new Date("2026-03-15T00:00:00Z");
    expect(touchBaseFollowUpDate("ONE_MONTH", from).toISOString()).toContain("2026-04-15");
    expect(touchBaseFollowUpDate("THREE_MONTHS", from).toISOString()).toContain("2026-06-15");
    expect(touchBaseFollowUpDate("SIX_MONTHS", from).toISOString()).toContain("2026-09-15");
    expect(touchBaseFollowUpDate("TWELVE_MONTHS", from).toISOString()).toContain("2027-03-15");
  });

  // A naive setMonth() would roll 31 January forward to 3 March, silently
  // pushing the follow-up out of its intended month.
  it("clamps month-end overflow instead of rolling into the next month", () => {
    const jan31 = new Date("2026-01-31T00:00:00Z");
    const result = touchBaseFollowUpDate("ONE_MONTH", jan31);
    expect(result.getUTCMonth()).toBe(1); // February, not March
  });

  it("does not mutate the date it is given", () => {
    const from = new Date("2026-03-15T00:00:00Z");
    const before = from.getTime();
    touchBaseFollowUpDate("TWELVE_MONTHS", from);
    expect(from.getTime()).toBe(before);
  });

  it("keeps period months positive and ascending", () => {
    const months = TOUCH_BASE_PERIODS.map((p) => TOUCH_BASE_CONFIG[p].months);
    expect(months).toEqual([...months].sort((a, b) => a - b));
    for (const m of months) expect(m).toBeGreaterThan(0);
  });
});
