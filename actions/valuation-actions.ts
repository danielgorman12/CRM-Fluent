"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { valuationSchema } from "@/lib/validations/valuation";

export async function upsertValuation(prospectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const data = valuationSchema.parse({
    indicativePriceRangeLow: formData.get("indicativePriceRangeLow"),
    indicativePriceRangeHigh: formData.get("indicativePriceRangeHigh"),
    revenueMultipleLow: formData.get("revenueMultipleLow"),
    revenueMultipleHigh: formData.get("revenueMultipleHigh"),
    ebitdaMultipleLow: formData.get("ebitdaMultipleLow"),
    ebitdaMultipleHigh: formData.get("ebitdaMultipleHigh"),
    forecastedPurchasePrice: formData.get("forecastedPurchasePrice"),
    expectedROCE: formData.get("expectedROCE"),
    valuationNotes: formData.get("valuationNotes"),
  });

  const cleaned = {
    indicativePriceRangeLow: data.indicativePriceRangeLow ?? null,
    indicativePriceRangeHigh: data.indicativePriceRangeHigh ?? null,
    revenueMultipleLow: data.revenueMultipleLow ?? null,
    revenueMultipleHigh: data.revenueMultipleHigh ?? null,
    ebitdaMultipleLow: data.ebitdaMultipleLow ?? null,
    ebitdaMultipleHigh: data.ebitdaMultipleHigh ?? null,
    forecastedPurchasePrice: data.forecastedPurchasePrice ?? null,
    expectedROCE: data.expectedROCE ?? null,
    valuationNotes: data.valuationNotes || null,
  };

  await prisma.valuationAnalysis.upsert({
    where: { prospectId },
    update: { ...cleaned, updatedById: session.user.id },
    create: { ...cleaned, updatedById: session.user.id, prospectId },
  });

  revalidatePath(`/prospects/${prospectId}/valuation`);
  revalidatePath(`/prospects/${prospectId}/forecast`);
  revalidatePath(`/prospects/${prospectId}`);
  redirect(`/prospects/${prospectId}/valuation`);
}
