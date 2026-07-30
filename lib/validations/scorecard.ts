import { z } from "zod";

const score = z.coerce.number().int().min(1, "Score must be 1-10").max(10, "Score must be 1-10");
const notes = z.string().trim().optional().or(z.literal(""));

export const scorecardSchema = z.object({
  financialAttractivenessScore: score,
  customerRetentionScore: score,
  recurringRevenueQualityScore: score,
  strategicFitScore: score,
  verticalAttractivenessScore: score,
  sellerWillingnessScore: score,
  keyRisksScore: score,
  valuationReturnsScore: score,

  financialAttractivenessNotes: notes,
  customerRetentionNotes: notes,
  recurringRevenueQualityNotes: notes,
  strategicFitNotes: notes,
  verticalAttractivenessNotes: notes,
  sellerWillingnessNotes: notes,
  keyRisksNotes: notes,
  valuationReturnsNotes: notes,
});

export type ScorecardInput = z.infer<typeof scorecardSchema>;

export const SCORECARD_FACTORS = [
  { key: "financialAttractivenessScore", notesKey: "financialAttractivenessNotes", label: "Financial attractiveness" },
  { key: "customerRetentionScore", notesKey: "customerRetentionNotes", label: "Customer retention" },
  { key: "recurringRevenueQualityScore", notesKey: "recurringRevenueQualityNotes", label: "Recurring revenue quality" },
  { key: "strategicFitScore", notesKey: "strategicFitNotes", label: "Strategic & portfolio fit" },
  { key: "verticalAttractivenessScore", notesKey: "verticalAttractivenessNotes", label: "Vertical attractiveness" },
  { key: "sellerWillingnessScore", notesKey: "sellerWillingnessNotes", label: "Seller willingness" },
  { key: "keyRisksScore", notesKey: "keyRisksNotes", label: "Key risks (higher = lower risk)" },
  { key: "valuationReturnsScore", notesKey: "valuationReturnsNotes", label: "Valuation & expected returns" },
] as const;

export function computeOverallScore(data: ScorecardInput): number {
  const total = SCORECARD_FACTORS.reduce((sum, factor) => sum + data[factor.key], 0);
  return Math.round((total / SCORECARD_FACTORS.length) * 10) / 10;
}
