"use client";

import "leaflet/dist/leaflet.css";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";
import type { TripUnit } from "@/lib/trip-planner";

export type TripMapStop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stageColor: string;
  order: number;
  dayLabel: string;
};

export function TripMap({
  destination,
  stops,
  radius,
  unit,
}: {
  destination: { label: string; latitude: number; longitude: number };
  stops: TripMapStop[];
  radius: number;
  unit: TripUnit;
}) {
  const radiusMetres = radius * (unit === "mi" ? 1609.34 : 1000);

  return (
    <MapContainer
      center={[destination.latitude, destination.longitude]}
      zoom={6}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Circle
        center={[destination.latitude, destination.longitude]}
        radius={radiusMetres}
        pathOptions={{ color: "#4c7fd4", weight: 1, fillOpacity: 0.05 }}
      />

      <CircleMarker
        center={[destination.latitude, destination.longitude]}
        radius={7}
        pathOptions={{ color: "#16244c", fillColor: "#16244c", fillOpacity: 1 }}
      >
        <Tooltip permanent direction="top" offset={[0, -8]}>
          {destination.label}
        </Tooltip>
      </CircleMarker>

      {stops.map((stop) => (
        <CircleMarker
          key={stop.id}
          center={[stop.latitude, stop.longitude]}
          radius={8}
          pathOptions={{ color: stop.stageColor, fillColor: stop.stageColor, fillOpacity: 0.85 }}
        >
          <Popup>
            <p className="font-medium">{stop.name}</p>
            <p className="text-xs">
              {stop.dayLabel} · stop {stop.order}
            </p>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
