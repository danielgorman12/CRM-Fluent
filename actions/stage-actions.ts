"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// The only write path for a prospect's stage: closes the currently-open
// history row and opens a new one in the same transaction as the
// denormalized `Prospect.currentStageId` update, so the map/list (which read
// currentStageId) and the dashboard funnel (which reads history) can never
// disagree with each other.
export async function changeProspectStage(prospectId: string, newStageId: string, notes?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.$transaction(async (tx) => {
    const openHistory = await tx.prospectStageHistory.findFirst({
      where: { prospectId, exitedAt: null },
      orderBy: { enteredAt: "desc" },
    });

    if (openHistory) {
      await tx.prospectStageHistory.update({
        where: { id: openHistory.id },
        data: { exitedAt: new Date() },
      });
    }

    await tx.prospectStageHistory.create({
      data: {
        prospectId,
        stageId: newStageId,
        changedById: session.user.id,
        notes: notes || null,
      },
    });

    await tx.prospect.update({
      where: { id: prospectId },
      data: { currentStageId: newStageId },
    });
  });

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
  revalidatePath("/dashboard");
  revalidatePath("/map");
}
