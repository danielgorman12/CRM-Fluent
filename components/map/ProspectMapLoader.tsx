"use client";

import dynamic from "next/dynamic";
import type { MapProspect } from "./ProspectMap";

// Leaflet touches `window`, so the map itself can only render client-side.
const ProspectMap = dynamic(() => import("./ProspectMap").then((m) => m.ProspectMap), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>,
});

export function ProspectMapLoader({ prospects }: { prospects: MapProspect[] }) {
  return <ProspectMap prospects={prospects} />;
}
