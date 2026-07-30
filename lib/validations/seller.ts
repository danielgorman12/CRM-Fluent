import { z } from "zod";

const text = z.string().trim().optional().or(z.literal(""));
const optionalNumber = z.coerce.number().finite().optional().or(z.literal("").transform(() => undefined));
const optionalInt = z.coerce.number().int().optional().or(z.literal("").transform(() => undefined));

export const SUCCESSION_TIMELINE_OPTIONS = [
  { value: "UNDER_1YR", label: "Under 1 year" },
  { value: "ONE_TO_3YR", label: "1–3 years" },
  { value: "THREE_TO_5YR", label: "3–5 years" },
  { value: "FIVE_PLUS_YR", label: "5+ years" },
  { value: "UNKNOWN", label: "Unknown" },
] as const;

export const SUCCESSOR_STATUS_OPTIONS = [
  { value: "NONE", label: "No successor" },
  { value: "FAMILY", label: "Family successor" },
  { value: "INTERNAL", label: "Internal (non-family) successor" },
  { value: "UNKNOWN", label: "Unknown" },
] as const;

export const sellerRelationshipSchema = z.object({
  ownerName: text,
  ownerAge: optionalInt,
  yearsOwned: optionalInt,
  expectedSuccessionTimeline: z.enum(["UNDER_1YR", "ONE_TO_3YR", "THREE_TO_5YR", "FIVE_PLUS_YR", "UNKNOWN"]).optional().or(z.literal("").transform(() => undefined)),
  successorIdentified: z.enum(["NONE", "FAMILY", "INTERNAL", "UNKNOWN"]).optional().or(z.literal("").transform(() => undefined)),
  ownershipChangeHistory: text,
  sellerStatedObjectives: text,
  sellerPriceExpectationLow: optionalNumber,
  sellerPriceExpectationHigh: optionalNumber,
  sellerWillingnessNotes: text,
  otherSuccessionSignals: text,
});

export type SellerRelationshipInput = z.infer<typeof sellerRelationshipSchema>;
