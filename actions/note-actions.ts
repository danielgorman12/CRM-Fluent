"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchGranolaNotes } from "@/lib/granola";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function syncGranolaNotes(prospectId: string) {
  await requireUser();

  const prospect = await prisma.prospect.findUniqueOrThrow({
    where: { id: prospectId },
    include: { sellerRelationship: true, vertical: true, currentStage: true },
  });

  const notes = await fetchGranolaNotes({
    prospectId: prospect.id,
    prospectName: prospect.name,
    ownerName: prospect.sellerRelationship?.ownerName ?? null,
    vertical: prospect.vertical?.name ?? null,
    stageName: prospect.currentStage.name,
  });

  // Upsert on the provider's id so re-syncing refreshes existing notes instead
  // of duplicating them — a sync can be run as often as you like.
  for (const note of notes) {
    const payload = {
      prospectId,
      source: "GRANOLA" as const,
      title: note.title,
      meetingDate: note.meetingDate,
      attendees: note.attendees || null,
      summary: note.summary,
      actionItems: note.actionItems || null,
      syncedAt: new Date(),
    };

    await prisma.meetingNote.upsert({
      where: { externalId: note.externalId },
      update: payload,
      create: { ...payload, externalId: note.externalId },
    });
  }

  revalidatePath(`/prospects/${prospectId}/notes`);
}

// Records a synced note as outreach activity, so meetings captured in Granola
// feed the dashboard funnel rather than sitting in a separate silo.
export async function logNoteAsActivity(noteId: string) {
  const userId = await requireUser();

  const note = await prisma.meetingNote.findUniqueOrThrow({ where: { id: noteId } });
  if (note.loggedActivityId) return;

  await prisma.$transaction(async (tx) => {
    const activity = await tx.sourcingActivity.create({
      data: {
        prospectId: note.prospectId,
        activityType: "MEETING",
        activityDate: note.meetingDate,
        contactedById: userId,
        contactPersonName: note.attendees,
        resultedInResponse: true,
        outcomeNotes: note.summary.slice(0, 500),
      },
    });

    await tx.meetingNote.update({
      where: { id: noteId },
      data: { loggedActivityId: activity.id },
    });
  });

  revalidatePath(`/prospects/${note.prospectId}/notes`);
  revalidatePath(`/prospects/${note.prospectId}/activity`);
  revalidatePath("/dashboard");
}
