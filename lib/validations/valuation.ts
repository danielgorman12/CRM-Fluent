import { z } from "zod";

const optionalNumber = z.coerce.number().finite().optional().or(z.literal("").transform(() => undefined));
const text = z.string().trim().optional().or(z.literal(""));

export const valuationSchema = z.object({
  indicativePriceRangeLow: optionalNumber,
  indicativePriceRangeHigh: optionalNumber,
  revenueMultipleLow: optionalNumber,
  revenueMultipleHigh: optionalNumber,
  ebitdaMultipleLow: optionalNumber,
  ebitdaMultipleHigh: optionalNumber,
  forecastedPurchasePrice: optionalNumber,
  expectedROCE: optionalNumber,
  valuationNotes: text,
});

export type ValuationInput = z.infer<typeof valuationSchema>;
