"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BODY, DEFAULT_SUBJECT, renderTemplate, type MergeContext } from "@/lib/outreach";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

// Called from the map: takes whichever prospects were selected and opens a draft.
export async function draftCampaignFromSelection(formData: FormData) {
  const user = await requireUser();

  const prospectIds = formData.getAll("prospectId").map(String).filter(Boolean);
  if (prospectIds.length === 0) return;

  const geographyNote = String(formData.get("geographyNote") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();

  const campaign = await prisma.campaign.create({
    data: {
      name: name || `Outreach · ${geographyNote ?? "selected prospects"}`,
      subject: DEFAULT_SUBJECT,
      body: DEFAULT_BODY,
      geographyNote,
      createdById: user.id,
      recipients: { create: prospectIds.map((prospectId) => ({ prospectId })) },
    },
  });

  revalidatePath("/outreach");
  redirect(`/outreach/${campaign.id}`);
}

export async function updateCampaign(campaignId: string, formData: FormData) {
  await requireUser();

  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (campaign.status === "SENT") throw new Error("A sent campaign can't be edited.");

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      name: String(formData.get("name") ?? campaign.name).trim() || campaign.name,
      subject: String(formData.get("subject") ?? ""),
      body: String(formData.get("body") ?? ""),
    },
  });

  revalidatePath(`/outreach/${campaignId}`);
}

export async function removeRecipient(recipientId: string) {
  await requireUser();
  const recipient = await prisma.campaignRecipient.findUniqueOrThrow({
    where: { id: recipientId },
    include: { campaign: true },
  });
  if (recipient.campaign.status === "SENT") return;

  await prisma.campaignRecipient.delete({ where: { id: recipientId } });
  revalidatePath(`/outreach/${recipient.campaignId}`);
}

export async function deleteCampaign(campaignId: string) {
  await requireUser();
  // Recipients cascade; any activities already logged are kept, since those are
  // outreach history rather than part of the draft.
  await prisma.campaign.delete({ where: { id: campaignId } });
  revalidatePath("/outreach");
  redirect("/outreach");
}

// Marks the campaign sent: snapshots the merged content per recipient and logs
// an EMAIL activity against each prospect. This does NOT transmit email — see
// the note in lib/outreach.ts.
export async function markCampaignSent(campaignId: string) {
  const user = await requireUser();

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      recipients: {
        include: {
          prospect: { include: { sellerRelationship: true, vertical: true, currentStage: true } },
        },
      },
    },
  });

  if (campaign.status === "SENT") return;
  if (campaign.recipients.length === 0) throw new Error("Add at least one recipient first.");

  const sentAt = new Date();

  await prisma.$transaction(async (tx) => {
    for (const recipient of campaign.recipients) {
      const p = recipient.prospect;
      const context: MergeContext = {
        company: p.name,
        owner: p.sellerRelationship?.ownerName ?? "there",
        vertical: p.vertical?.name ?? "vertical market software",
        city: p.city ?? "",
        country: p.country ?? "",
        stage: p.currentStage.name,
        sender: user.name ?? "",
      };

      const renderedSubject = renderTemplate(campaign.subject, context);
      const renderedBody = renderTemplate(campaign.body, context);

      const activity = await tx.sourcingActivity.create({
        data: {
          prospectId: p.id,
          activityType: "EMAIL",
          activityDate: sentAt,
          contactedById: user.id,
          contactPersonName: p.sellerRelationship?.ownerName ?? null,
          resultedInResponse: false,
          outcomeNotes: `Campaign: ${campaign.name} — ${renderedSubject}`,
        },
      });

      await tx.campaignRecipient.update({
        where: { id: recipient.id },
        data: { renderedSubject, renderedBody, sentAt, loggedActivityId: activity.id },
      });
    }

    await tx.campaign.update({
      where: { id: campaignId },
      data: { status: "SENT", sentAt },
    });
  });

  revalidatePath(`/outreach/${campaignId}`);
  revalidatePath("/outreach");
  revalidatePath("/dashboard");
}
