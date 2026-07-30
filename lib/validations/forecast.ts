import { z } from "zod";

const optionalNumber = z.coerce.number().finite().optional().or(z.literal("").transform(() => undefined));
const optionalInt = z.coerce.number().int().optional().or(z.literal("").transform(() => undefined));
const text = z.string().trim().optional().or(z.literal(""));

export const forecastSchema = z.object({
  forecastedRevenueGrowthPct: optionalNumber,
  forecastedARR: optionalNumber,
  forecastedEBITDA: optionalNumber,
  forecastedEBITDAMargin: optionalNumber,
  marginImprovementOpportunity: text,
  marginImprovementPts: optionalNumber,
  keyAssumptions: text,
  horizonYears: optionalInt,
});

export type ForecastInput = z.infer<typeof forecastSchema>;
