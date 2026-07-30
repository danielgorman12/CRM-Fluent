import { z } from "zod";

const text = z.string().trim().optional().or(z.literal(""));

export const activitySchema = z.object({
  activityType: z.enum(["EMAIL", "CALL", "MEETING", "OTHER"]),
  activityDate: z.string().min(1, "Date is required"),
  contactedById: z.string().trim().min(1, "Team member is required"),
  contactPersonName: text,
  resultedInResponse: z.coerce.boolean().optional(),
  outcomeNotes: text,
  followUpRequired: z.coerce.boolean().optional(),
  followUpDate: text,
  followUpNotes: text,
});

export type ActivityInput = z.infer<typeof activitySchema>;

export const ACTIVITY_TYPE_OPTIONS = [
  { value: "EMAIL", label: "Email" },
  { value: "CALL", label: "Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "OTHER", label: "Other" },
] as const;
