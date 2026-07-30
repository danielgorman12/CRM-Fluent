import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTripDate, planTrip, type TripUnit } from "@/lib/trip-planner";
import { TripForm } from "@/components/trips/TripForm";
import { ItineraryDay } from "@/components/trips/ItineraryDay";
import { TripMapLoader } from "@/components/trips/TripMapLoader";
import { SaveTripForm } from "@/components/trips/SaveTripForm";
import type { TripMapStop } from "@/components/trips/TripMap";

const FAILURE_MESSAGES = {
  "no-destination": "Enter a destination to plan a trip.",
  "geocode-failed":
    "Couldn't find that place. Try adding a state or country — for example \"Boise, ID, USA\".",
  "bad-dates": "Check the dates — the end date needs to be on or after the start date.",
} as const;

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const str = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);

  const destination = str("destination");
  const unit: TripUnit = str("unit") === "km" ? "km" : "mi";
  const radius = Number(str("radius") ?? 250);
  const perDay = Number(str("perDay") ?? 3);

  const [users, savedTrips, plan] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.trip.findMany({
      include: { createdBy: true, _count: { select: { visits: true } } },
      orderBy: { startDate: "desc" },
      take: 10,
    }),
    destination
      ? planTrip({
          destination,
          startDate: str("startDate") ?? "",
          endDate: str("endDate") ?? "",
          radius: Number.isFinite(radius) ? radius : 250,
          unit,
          perDay: Number.isFinite(perDay) ? perDay : 3,
          dealOwnerId: str("dealOwnerId"),
        })
      : Promise.resolve(null),
  ]);

  const mapStops: TripMapStop[] =
    plan?.ok === true
      ? plan.days.flatMap((day) =>
          day.stops.map((stop, i) => ({
            id: stop.id,
            name: stop.name,
            latitude: stop.latitude,
            longitude: stop.longitude,
            stageColor: stop.stageColor,
            order: i + 1,
            dayLabel: day.label,
          })),
        )
      : [];

  const totalStops = mapStops.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sourcing Trip Planner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick where you&apos;re going and when, and get a day-by-day list of prospects worth
          visiting — ranked by proximity, deal momentum and scorecard.
        </p>
      </div>

      <TripForm
        users={users}
        current={{
          destination,
          startDate: str("startDate"),
          endDate: str("endDate"),
          radius: str("radius"),
          unit: str("unit"),
          perDay: str("perDay"),
          dealOwnerId: str("dealOwnerId"),
        }}
      />

      {plan === null && (
        <p className="text-sm text-muted-foreground">
          Enter a destination and dates above to build an itinerary.
        </p>
      )}

      {plan?.ok === false && (
        <div className="rounded-xl border border-dashed p-6">
          <p className="text-sm">{FAILURE_MESSAGES[plan.reason]}</p>
        </div>
      )}

      {plan?.ok === true && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                Prospects in range{" "}
                <span className="font-semibold text-foreground">{plan.considered}</span>
              </span>
              <span className="text-muted-foreground">
                Scheduled <span className="font-semibold text-foreground">{totalStops}</span>
              </span>
              <span className="text-muted-foreground">
                Across <span className="font-semibold text-foreground">{plan.days.length}</span>{" "}
                {plan.days.length === 1 ? "day" : "days"}
              </span>
              {plan.excluded > 0 && (
                <span className="text-muted-foreground">
                  Closed deals skipped{" "}
                  <span className="font-semibold text-foreground">{plan.excluded}</span>
                </span>
              )}
            </div>

            {totalStops > 0 && (
              <SaveTripForm
                params={{
                  destination,
                  startDate: str("startDate"),
                  endDate: str("endDate"),
                  radius: String(radius),
                  unit,
                  perDay: String(perDay),
                  dealOwnerId: str("dealOwnerId"),
                }}
                suggestedName={`${destination} · ${str("startDate") ?? ""}`}
              />
            )}
          </div>

          {plan.considered === 0 ? (
            <div className="rounded-xl border border-dashed p-6">
              <p className="text-sm">
                No active prospects within {radius} {unit} of {destination}. Try a wider radius, or
                check that nearby prospects have a location set.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
              <div className="min-w-0 space-y-4">
                {plan.days.map((day) => (
                  <ItineraryDay key={day.date} day={day} unit={unit} />
                ))}
              </div>

              <div className="h-80 overflow-hidden rounded-xl border lg:sticky lg:top-6 lg:h-[32rem]">
                <TripMapLoader
                  destination={plan.destination}
                  stops={mapStops}
                  radius={radius}
                  unit={unit}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {savedTrips.length > 0 && (
        <section className="border-t pt-6">
          <h2 className="text-sm font-semibold">Saved trips</h2>
          <ul className="mt-3 divide-y rounded-xl border">
            {savedTrips.map((trip) => (
              <li key={trip.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <Link
                  href={`/trips/${trip.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {trip.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatTripDate(trip.startDate)} – {formatTripDate(trip.endDate)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {trip._count.visits} {trip._count.visits === 1 ? "visit" : "visits"}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {trip.createdBy.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
