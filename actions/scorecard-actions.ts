"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scorecardSchema, computeOverallScore, SCORECARD_FACTORS } from "@/lib/validations/scorecard";

export async function upsertScorecard(prospectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const raw: Record<string, unknown> = {};
  for (const factor of SCORECARD_FACTORS) {
    raw[factor.key] = formData.get(factor.key);
    raw[factor.notesKey] = formData.get(factor.notesKey);
  }
  const data = scorecardSchema.parse(raw);
  const overallScore = computeOverallScore(data);

  await prisma.scorecard.upsert({
    where: { prospectId },
    update: { ...data, overallScore, scoredById: session.user.id },
    create: { ...data, overallScore, scoredById: session.user.id, prospectId },
  });

  revalidatePath(`/prospects/${prospectId}/scorecard`);
  redirect(`/prospects/${prospectId}/scorecard`);
}
