import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatTripDate, TRIP_DATE_FORMAT } from "@/lib/trip-planner";
import { deleteTrip } from "@/actions/trip-actions";
import { Button } from "@/components/ui/button";
import { TripVisitRow, type VisitRow } from "@/components/trips/TripVisitRow";
import { TripMapLoader } from "@/components/trips/TripMapLoader";
import type { TripMapStop } from "@/components/trips/TripMap";

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayLabel(date: Date) {
  return date.toLocaleDateString(undefined, TRIP_DATE_FORMAT);
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      createdBy: true,
      visits: {
        include: { prospect: { include: { currentStage: true } }, loggedActivity: true },
        orderBy: [{ visitDate: "asc" }, { sortOrder: "asc" }],
      },
    },
  });

  if (!trip) notFound();

  const unit = trip.unit === "KM" ? "km" : "mi";

  // Every date in the trip window, so a visit can be moved to any day of it.
  const dayOptions: Array<{ value: string; label: string }> = [];
  for (
    let d = new Date(trip.startDate);
    d <= trip.endDate && dayOptions.length < 21;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    dayOptions.push({ value: isoDay(d), label: dayLabel(new Date(d)) });
  }

  const byDay = new Map<string, VisitRow[]>();
  for (const visit of trip.visits) {
    const key = isoDay(visit.visitDate);
    const row: VisitRow = {
      id: visit.id,
      prospectId: visit.prospectId,
      prospectName: visit.prospect.name,
      location:
        [visit.prospect.city, visit.prospect.region, visit.prospect.country]
          .filter(Boolean)
          .join(", ") || null,
      stageName: visit.prospect.currentStage.name,
      stageColor: visit.prospect.currentStage.colorHex,
      distance: visit.distance,
      priority: visit.priority,
      visitDate: key,
      logged: visit.loggedActivityId !== null,
      loggedOn: visit.loggedActivity ? formatTripDate(visit.loggedActivity.activityDate) : null,
    };
    byDay.set(key, [...(byDay.get(key) ?? []), row]);
  }

  const mapStops: TripMapStop[] = trip.visits
    .filter((v) => v.prospect.latitude !== null && v.prospect.longitude !== null)
    .map((v, i) => ({
      id: v.id,
      name: v.prospect.name,
      latitude: v.prospect.latitude as number,
      longitude: v.prospect.longitude as number,
      stageColor: v.prospect.currentStage.colorHex,
      order: i + 1,
      dayLabel: dayLabel(v.visitDate),
    }));

  const loggedCount = trip.visits.filter((v) => v.loggedActivityId !== null).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/trips"
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            ← Trip planner
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{trip.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {trip.destination} · {formatTripDate(trip.startDate)} –{" "}
            {formatTripDate(trip.endDate)} · within {trip.radius} {unit} · planned by{" "}
            {trip.createdBy.name}
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await deleteTrip(tripId);
          }}
        >
          <Button type="submit" variant="destructive" size="sm">
            Delete trip
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          Visits <span className="font-semibold text-foreground">{trip.visits.length}</span>
        </span>
        <span className="text-muted-foreground">
          Logged to activity{" "}
          <span className="font-semibold text-foreground">
            {loggedCount}/{trip.visits.length}
          </span>
        </span>
      </div>

      {trip.visits.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6">
          <p className="text-sm">
            Every visit has been removed from this trip.{" "}
            <Link href="/trips" className="underline underline-offset-2">
              Plan a new one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-4">
            {dayOptions.map((day) => {
              const visits = byDay.get(day.value) ?? [];
              return (
                <section key={day.value} className="rounded-xl border">
                  <header className="flex items-center justify-between border-b px-4 py-2.5">
                    <h2 className="text-sm font-semibold">{day.label}</h2>
                    <span className="text-xs text-muted-foreground">
                      {visits.length} {visits.length === 1 ? "visit" : "visits"}
                    </span>
                  </header>
                  {visits.length === 0 ? (
                    <p className="px-4 py-3.5 text-sm text-muted-foreground">
                      Nothing scheduled — move a visit here from another day.
                    </p>
                  ) : (
                    <ol className="divide-y">
                      {visits.map((visit, i) => (
                        <TripVisitRow
                          key={visit.id}
                          visit={visit}
                          unit={unit}
                          dayOptions={dayOptions}
                          index={i}
                        />
                      ))}
                    </ol>
                  )}
                </section>
              );
            })}
          </div>

          <div className="h-80 overflow-hidden rounded-xl border lg:sticky lg:top-6 lg:h-[32rem]">
            <TripMapLoader
              destination={{
                label: trip.destination,
                latitude: trip.latitude,
                longitude: trip.longitude,
              }}
              stops={mapStops}
              radius={trip.radius}
              unit={unit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
