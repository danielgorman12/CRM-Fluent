"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { thesisSchema } from "@/lib/validations/thesis";

export async function upsertThesis(prospectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const data = thesisSchema.parse({
    whyCompanyAttractive: formData.get("whyCompanyAttractive"),
    whyVerticalAttractive: formData.get("whyVerticalAttractive"),
    synergies: formData.get("synergies"),
    keyRisks: formData.get("keyRisks"),
    whyOwnerMightSell: formData.get("whyOwnerMightSell"),
    whyNow: formData.get("whyNow"),
    recommendedNextAction: formData.get("recommendedNextAction"),
  });

  const cleaned = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value || null]),
  );

  await prisma.acquisitionThesis.upsert({
    where: { prospectId },
    update: { ...cleaned, updatedById: session.user.id },
    create: { ...cleaned, updatedById: session.user.id, prospectId },
  });

  revalidatePath(`/prospects/${prospectId}/thesis`);
  redirect(`/prospects/${prospectId}/thesis`);
}
