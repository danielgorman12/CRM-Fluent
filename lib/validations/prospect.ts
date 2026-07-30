import { z } from "zod";

const optionalNumber = z.coerce.number().finite().optional().or(z.literal("").transform(() => undefined));

export const prospectSchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  website: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  verticalId: z.string().trim().optional().or(z.literal("")),

  country: z.string().trim().optional().or(z.literal("")),
  region: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),

  currentARR: optionalNumber,
  currentEBITDA: optionalNumber,
  currentEBITDAMargin: optionalNumber,
  grossRetentionPct: optionalNumber,
  netRetentionPct: optionalNumber,
  customerRetentionNotes: z.string().trim().optional().or(z.literal("")),

  dealOwnerId: z.string().trim().min(1, "Deal owner is required"),
  currentStageId: z.string().trim().min(1, "Stage is required"),
});

export type ProspectInput = z.infer<typeof prospectSchema>;
