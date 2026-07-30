"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planTrip, type TripUnit } from "@/lib/trip-planner";

// Trip dates are calendar dates, but Prisma maps DateTime to a Postgres
// `timestamp` without a zone, so values round-trip through whatever timezone
// the server runs in. Anchoring at midday UTC keeps the calendar date stable
// under any real-world offset (±12h); midnight would shift a day either side.
// Everything that formats these dates must pass timeZone: "UTC" — see
// formatTripDate in lib/trip-planner.ts.
function toDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

// Recomputes the itinerary server-side from the same inputs rather than trusting
// a stop list posted from the browser, then snapshots the result.
export async function saveTrip(formData: FormData) {
  const userId = await requireUser();

  const destination = String(formData.get("destination") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const unit: TripUnit = formData.get("unit") === "km" ? "km" : "mi";
  const radius = Number(formData.get("radius") ?? 250);
  const perDay = Number(formData.get("perDay") ?? 3);
  const dealOwnerId = String(formData.get("dealOwnerId") ?? "") || undefined;
  const name = String(formData.get("name") ?? "").trim();

  const plan = await planTrip({
    destination,
    startDate,
    endDate,
    radius,
    unit,
    perDay,
    dealOwnerId,
  });

  if (!plan.ok) throw new Error(`Can't save this trip: ${plan.reason}`);

  const visits = plan.days.flatMap((day) =>
    day.stops.map((stop, i) => ({
      prospectId: stop.id,
      visitDate: toDate(day.date),
      sortOrder: i,
      priority: stop.priority,
      distance: stop.distance,
    })),
  );

  if (visits.length === 0) throw new Error("Can't save a trip with no visits.");

  const trip = await prisma.trip.create({
    data: {
      name: name || `${destination} · ${startDate}`,
      destination,
      latitude: plan.destination.latitude,
      longitude: plan.destination.longitude,
      startDate: toDate(startDate),
      endDate: toDate(endDate),
      radius,
      unit: unit === "km" ? "KM" : "MI",
      perDay,
      createdById: userId,
      visits: { create: visits },
    },
  });

  revalidatePath("/trips");
  redirect(`/trips/${trip.id}`);
}

export async function deleteTrip(tripId: string) {
  await requireUser();
  // Visits cascade with the trip; logged activities are deliberately kept, so
  // deleting an itinerary never erases outreach history.
  await prisma.trip.delete({ where: { id: tripId } });
  revalidatePath("/trips");
  redirect("/trips");
}

export async function removeTripVisit(visitId: string) {
  await requireUser();
  const visit = await prisma.tripVisit.findUniqueOrThrow({ where: { id: visitId } });
  await prisma.tripVisit.delete({ where: { id: visitId } });
  revalidatePath(`/trips/${visit.tripId}`);
}

export async function moveTripVisit(visitId: string, formData: FormData) {
  await requireUser();
  const visitDate = String(formData.get("visitDate") ?? "");
  if (!visitDate) return;

  const visit = await prisma.tripVisit.findUniqueOrThrow({ where: { id: visitId } });
  await prisma.tripVisit.update({
    where: { id: visitId },
    data: { visitDate: toDate(visitDate) },
  });
  revalidatePath(`/trips/${visit.tripId}`);
}

// Writes a planned visit into the prospect's activity log, so a trip actually
// shows up in outreach history and the dashboard funnel.
export async function logTripVisit(visitId: string, formData: FormData) {
  const userId = await requireUser();

  const visit = await prisma.tripVisit.findUniqueOrThrow({
    where: { id: visitId },
    include: { prospect: { include: { sellerRelationship: true } } },
  });

  if (visit.loggedActivityId) return;

  const notes = String(formData.get("outcomeNotes") ?? "").trim();
  const responded = formData.get("resultedInResponse") === "on";

  await prisma.$transaction(async (tx) => {
    const activity = await tx.sourcingActivity.create({
      data: {
        prospectId: visit.prospectId,
        activityType: "MEETING",
        activityDate: visit.visitDate,
        contactedById: userId,
        contactPersonName: visit.prospect.sellerRelationship?.ownerName ?? null,
        resultedInResponse: responded,
        outcomeNotes: notes || "Site visit from sourcing trip",
      },
    });

    await tx.tripVisit.update({
      where: { id: visitId },
      data: { loggedActivityId: activity.id },
    });
  });

  revalidatePath(`/trips/${visit.tripId}`);
  revalidatePath(`/prospects/${visit.prospectId}/activity`);
  revalidatePath("/dashboard");
}
