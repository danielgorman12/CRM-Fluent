"use client";

import dynamic from "next/dynamic";
import type { TripUnit } from "@/lib/trip-planner";
import type { TripMapStop } from "./TripMap";

// Leaflet touches `window`, so the map only renders client-side.
const TripMap = dynamic(() => import("./TripMap").then((m) => m.TripMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function TripMapLoader(props: {
  destination: { label: string; latitude: number; longitude: number };
  stops: TripMapStop[];
  radius: number;
  unit: TripUnit;
}) {
  return <TripMap {...props} />;
}
