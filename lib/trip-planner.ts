import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocode";

export const RADIUS_OPTIONS = [50, 100, 250, 500] as const;
export const UNIT_OPTIONS = [
  { value: "mi", label: "miles" },
  { value: "km", label: "kilometres" },
] as const;

export type TripUnit = (typeof UNIT_OPTIONS)[number]["value"];

export type TripRequest = {
  destination: string;
  startDate: string;
  endDate: string;
  radius: number;
  unit: TripUnit;
  perDay: number;
  /** Limit to one team member's deals — usually whoever is travelling. */
  dealOwnerId?: string;
};

export type TripStop = {
  id: string;
  name: string;
  location: string | null;
  vertical: string | null;
  stageName: string;
  stageColor: string;
  dealOwner: string;
  arr: number | null;
  latitude: number;
  longitude: number;
  distance: number;
  /** 0-100 overall priority, with the three contributing factors behind it. */
  priority: number;
  factors: { distance: number; momentum: number; scorecard: number };
  scorecardScore: number | null;
};

export type TripDay = {
  date: string;
  label: string;
  stops: TripStop[];
  /** Furthest apart any two stops are, so an implausible day is visible. */
  spread: number;
};

export type TripPlan =
  | { ok: false; reason: "no-destination" | "geocode-failed" | "bad-dates" }
  | {
      ok: true;
      destination: { label: string; latitude: number; longitude: number };
      days: TripDay[];
      considered: number;
      excluded: number;
    };

const EARTH_RADIUS = { mi: 3958.8, km: 6371 };

function haversine(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
  unit: TripUnit,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS[unit] * Math.asin(Math.sqrt(h));
}

function datesBetween(startDate: string, endDate: string): Date[] {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const days: Date[] = [];
  // Cap the trip length so a mistyped year can't generate thousands of days.
  for (let d = new Date(start); d <= end && days.length < 21; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export async function planTrip(request: TripRequest): Promise<TripPlan> {
  if (!request.destination.trim()) return { ok: false, reason: "no-destination" };

  const days = datesBetween(request.startDate, request.endDate);
  if (days.length === 0) return { ok: false, reason: "bad-dates" };

  // Reuse the same server-side Nominatim helper the prospect form uses.
  const point = await geocodeLocation({ city: request.destination });
  if (!point) return { ok: false, reason: "geocode-failed" };

  const prospects = await prisma.prospect.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(request.dealOwnerId ? { dealOwnerId: request.dealOwnerId } : {}),
    },
    include: { vertical: true, dealOwner: true, currentStage: true, scorecard: true },
  });

  // Closed deals aren't worth a visit, so they're never trip candidates.
  const open = prospects.filter((p) => p.currentStage.category === "ACTIVE");
  const excluded = prospects.length - open.length;

  const activeStages = await prisma.stageDefinition.findMany({
    where: { category: "ACTIVE" },
    orderBy: { order: "asc" },
  });
  const maxStageOrder = activeStages.at(-1)?.order ?? 1;
  const minStageOrder = activeStages[0]?.order ?? 1;

  const candidates: TripStop[] = [];
  for (const p of open) {
    const latitude = p.latitude as number;
    const longitude = p.longitude as number;
    const distance = haversine(point, { latitude, longitude }, request.unit);
    if (distance > request.radius) continue;

    // Each factor is 0-1 so the weighting below is easy to reason about, and
    // the breakdown can be shown rather than just a single opaque number.
    const distanceFactor = 1 - distance / request.radius;
    const stageSpan = Math.max(1, maxStageOrder - minStageOrder);
    const momentumFactor = (p.currentStage.order - minStageOrder) / stageSpan;
    const scorecardScore = p.scorecard ? Number(p.scorecard.overallScore) : null;
    // No scorecard yet shouldn't look like a bad score, so it sits mid-scale.
    const scorecardFactor = scorecardScore === null ? 0.5 : scorecardScore / 10;

    candidates.push({
      id: p.id,
      name: p.name,
      location: [p.city, p.region, p.country].filter(Boolean).join(", ") || null,
      vertical: p.vertical?.name ?? null,
      stageName: p.currentStage.name,
      stageColor: p.currentStage.colorHex,
      dealOwner: p.dealOwner.name,
      arr: p.currentARR === null ? null : Number(p.currentARR),
      latitude,
      longitude,
      distance,
      priority: Math.round(
        (distanceFactor * 0.35 + momentumFactor * 0.35 + scorecardFactor * 0.3) * 100,
      ),
      factors: {
        distance: Math.round(distanceFactor * 100),
        momentum: Math.round(momentumFactor * 100),
        scorecard: Math.round(scorecardFactor * 100),
      },
      scorecardScore,
    });
  }

  candidates.sort((a, b) => b.priority - a.priority);

  // Build each day around a geographic cluster rather than slicing the priority
  // list: the highest-priority prospect left anchors the day, then the nearest
  // remaining prospects to that anchor fill it. Chunking by priority alone put
  // stops hundreds of miles apart on the same day.
  const remaining = [...candidates];
  const tripDays: TripDay[] = [];

  for (const date of days) {
    const stops: TripStop[] = [];
    const anchor = remaining.shift();

    if (anchor) {
      stops.push(anchor);
      remaining.sort(
        (a, b) =>
          haversine(anchor, a, request.unit) - haversine(anchor, b, request.unit),
      );
      stops.push(...remaining.splice(0, Math.max(0, request.perDay - 1)));
      // Visit nearest-to-base first so the day runs outward.
      stops.sort((a, b) => a.distance - b.distance);
    }

    let spread = 0;
    for (const a of stops) {
      for (const b of stops) {
        spread = Math.max(spread, haversine(a, b, request.unit));
      }
    }

    tripDays.push({
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      stops,
      spread,
    });

    // Restore priority order for the next day's anchor.
    remaining.sort((a, b) => b.priority - a.priority);
  }

  return {
    ok: true,
    destination: { label: request.destination, ...point },
    days: tripDays,
    considered: candidates.length,
    excluded,
  };
}
