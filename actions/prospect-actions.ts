"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocode";
import { prospectSchema } from "@/lib/validations/prospect";

function parseFormData(formData: FormData) {
  return prospectSchema.parse({
    name: formData.get("name"),
    website: formData.get("website"),
    description: formData.get("description"),
    verticalId: formData.get("verticalId"),
    country: formData.get("country"),
    region: formData.get("region"),
    city: formData.get("city"),
    currentARR: formData.get("currentARR"),
    currentEBITDA: formData.get("currentEBITDA"),
    currentEBITDAMargin: formData.get("currentEBITDAMargin"),
    grossRetentionPct: formData.get("grossRetentionPct"),
    netRetentionPct: formData.get("netRetentionPct"),
    customerRetentionNotes: formData.get("customerRetentionNotes"),
    dealOwnerId: formData.get("dealOwnerId"),
    currentStageId: formData.get("currentStageId"),
  });
}

export async function createProspect(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const data = parseFormData(formData);
  const geocode = await geocodeLocation({ city: data.city, region: data.region, country: data.country });

  const prospect = await prisma.prospect.create({
    data: {
      name: data.name,
      website: data.website || null,
      description: data.description || null,
      verticalId: data.verticalId || null,
      country: data.country || null,
      region: data.region || null,
      city: data.city || null,
      latitude: geocode?.latitude,
      longitude: geocode?.longitude,
      geocodeStatus: geocode ? "GEOCODED" : "FAILED",
      geocodeSource: geocode ? "nominatim" : null,
      geocodedAt: geocode ? new Date() : null,
      currentARR: data.currentARR,
      currentEBITDA: data.currentEBITDA,
      currentEBITDAMargin: data.currentEBITDAMargin,
      grossRetentionPct: data.grossRetentionPct,
      netRetentionPct: data.netRetentionPct,
      customerRetentionNotes: data.customerRetentionNotes || null,
      dealOwnerId: data.dealOwnerId,
      currentStageId: data.currentStageId,
      createdById: session.user.id,
      stageHistory: {
        create: {
          stageId: data.currentStageId,
          changedById: session.user.id,
        },
      },
    },
  });

  revalidatePath("/prospects");
  redirect(`/prospects/${prospect.id}`);
}

export async function updateProspect(prospectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const data = parseFormData(formData);
  const existing = await prisma.prospect.findUniqueOrThrow({ where: { id: prospectId } });

  const locationChanged =
    existing.city !== (data.city || null) ||
    existing.region !== (data.region || null) ||
    existing.country !== (data.country || null);

  const geocode = locationChanged
    ? await geocodeLocation({ city: data.city, region: data.region, country: data.country })
    : null;

  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      name: data.name,
      website: data.website || null,
      description: data.description || null,
      verticalId: data.verticalId || null,
      country: data.country || null,
      region: data.region || null,
      city: data.city || null,
      ...(locationChanged
        ? {
            latitude: geocode?.latitude,
            longitude: geocode?.longitude,
            geocodeStatus: geocode ? "GEOCODED" : "FAILED",
            geocodeSource: geocode ? "nominatim" : null,
            geocodedAt: geocode ? new Date() : null,
          }
        : {}),
      currentARR: data.currentARR,
      currentEBITDA: data.currentEBITDA,
      currentEBITDAMargin: data.currentEBITDAMargin,
      grossRetentionPct: data.grossRetentionPct,
      netRetentionPct: data.netRetentionPct,
      customerRetentionNotes: data.customerRetentionNotes || null,
      dealOwnerId: data.dealOwnerId,
    },
  });

  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospectId}`);
  redirect(`/prospects/${prospectId}`);
}

export async function setManualLocation(prospectId: string, latitude: number, longitude: number) {
  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      latitude,
      longitude,
      geocodeStatus: "MANUAL",
      geocodeSource: "manual",
      geocodedAt: new Date(),
    },
  });
  revalidatePath(`/prospects/${prospectId}`);
}
