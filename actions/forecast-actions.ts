"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forecastSchema } from "@/lib/validations/forecast";

export async function upsertForecast(prospectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const data = forecastSchema.parse({
    forecastedRevenueGrowthPct: formData.get("forecastedRevenueGrowthPct"),
    forecastedARR: formData.get("forecastedARR"),
    forecastedEBITDA: formData.get("forecastedEBITDA"),
    forecastedEBITDAMargin: formData.get("forecastedEBITDAMargin"),
    marginImprovementOpportunity: formData.get("marginImprovementOpportunity"),
    marginImprovementPts: formData.get("marginImprovementPts"),
    keyAssumptions: formData.get("keyAssumptions"),
    horizonYears: formData.get("horizonYears"),
  });

  const cleaned = {
    forecastedRevenueGrowthPct: data.forecastedRevenueGrowthPct ?? null,
    forecastedARR: data.forecastedARR ?? null,
    forecastedEBITDA: data.forecastedEBITDA ?? null,
    forecastedEBITDAMargin: data.forecastedEBITDAMargin ?? null,
    marginImprovementOpportunity: data.marginImprovementOpportunity || null,
    marginImprovementPts: data.marginImprovementPts ?? null,
    keyAssumptions: data.keyAssumptions || null,
    horizonYears: data.horizonYears ?? null,
  };

  await prisma.prospectForecast.upsert({
    where: { prospectId },
    update: cleaned,
    create: { ...cleaned, createdById: session.user.id, prospectId },
  });

  revalidatePath(`/prospects/${prospectId}/forecast`);
  redirect(`/prospects/${prospectId}/forecast`);
}
