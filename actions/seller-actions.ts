"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sellerRelationshipSchema } from "@/lib/validations/seller";

export async function upsertSellerRelationship(prospectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const data = sellerRelationshipSchema.parse({
    ownerName: formData.get("ownerName"),
    ownerAge: formData.get("ownerAge"),
    yearsOwned: formData.get("yearsOwned"),
    expectedSuccessionTimeline: formData.get("expectedSuccessionTimeline"),
    successorIdentified: formData.get("successorIdentified"),
    ownershipChangeHistory: formData.get("ownershipChangeHistory"),
    sellerStatedObjectives: formData.get("sellerStatedObjectives"),
    sellerPriceExpectationLow: formData.get("sellerPriceExpectationLow"),
    sellerPriceExpectationHigh: formData.get("sellerPriceExpectationHigh"),
    sellerWillingnessNotes: formData.get("sellerWillingnessNotes"),
    otherSuccessionSignals: formData.get("otherSuccessionSignals"),
  });

  const cleaned = {
    ownerName: data.ownerName || null,
    ownerAge: data.ownerAge ?? null,
    yearsOwned: data.yearsOwned ?? null,
    expectedSuccessionTimeline: data.expectedSuccessionTimeline ?? null,
    successorIdentified: data.successorIdentified ?? null,
    ownershipChangeHistory: data.ownershipChangeHistory || null,
    sellerStatedObjectives: data.sellerStatedObjectives || null,
    sellerPriceExpectationLow: data.sellerPriceExpectationLow ?? null,
    sellerPriceExpectationHigh: data.sellerPriceExpectationHigh ?? null,
    sellerWillingnessNotes: data.sellerWillingnessNotes || null,
    otherSuccessionSignals: data.otherSuccessionSignals || null,
  };

  await prisma.sellerRelationship.upsert({
    where: { prospectId },
    update: { ...cleaned, lastReviewedById: session.user.id, lastReviewedAt: new Date() },
    create: { ...cleaned, lastReviewedById: session.user.id, lastReviewedAt: new Date(), prospectId },
  });

  revalidatePath(`/prospects/${prospectId}/seller`);
  redirect(`/prospects/${prospectId}/seller`);
}
