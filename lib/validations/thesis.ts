import { z } from "zod";

const text = z.string().trim().optional().or(z.literal(""));

export const thesisSchema = z.object({
  whyCompanyAttractive: text,
  whyVerticalAttractive: text,
  synergies: text,
  keyRisks: text,
  whyOwnerMightSell: text,
  whyNow: text,
  recommendedNextAction: text,
});

export type ThesisInput = z.infer<typeof thesisSchema>;
