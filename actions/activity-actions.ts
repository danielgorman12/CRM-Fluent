"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activitySchema } from "@/lib/validations/activity";

export async function createActivity(prospectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const data = activitySchema.parse({
    activityType: formData.get("activityType"),
    activityDate: formData.get("activityDate"),
    contactedById: formData.get("contactedById"),
    contactPersonName: formData.get("contactPersonName"),
    resultedInResponse: formData.get("resultedInResponse") === "on",
    outcomeNotes: formData.get("outcomeNotes"),
    followUpRequired: formData.get("followUpRequired") === "on",
    followUpDate: formData.get("followUpDate"),
    followUpNotes: formData.get("followUpNotes"),
  });

  await prisma.sourcingActivity.create({
    data: {
      prospectId,
      activityType: data.activityType,
      activityDate: new Date(data.activityDate),
      contactedById: data.contactedById,
      contactPersonName: data.contactPersonName || null,
      resultedInResponse: data.resultedInResponse ?? false,
      outcomeNotes: data.outcomeNotes || null,
      followUpRequired: data.followUpRequired ?? false,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      followUpNotes: data.followUpNotes || null,
    },
  });

  revalidatePath(`/prospects/${prospectId}/activity`);
  revalidatePath(`/prospects/${prospectId}/seller`);
  revalidatePath("/dashboard");
}
