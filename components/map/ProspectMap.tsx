"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";

export type MapProspect = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stageName: string;
  stageColor: string;
};

export function ProspectMap({ prospects }: { prospects: MapProspect[] }) {
  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {prospects.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.latitude, p.longitude]}
          radius={8}
          pathOptions={{ color: p.stageColor, fillColor: p.stageColor, fillOpacity: 0.8 }}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.stageName}</p>
              <Link href={`/prospects/${p.id}`} className="text-sm underline underline-offset-2">
                View profile
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
