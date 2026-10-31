"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/map/leaflet-map";

const LeafletMap = dynamic(() => import("@/components/map/leaflet-map").then((module) => module.LeafletMap), {
  ssr: false,
});

export function PlaceMap({ points }: { points: MapPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">Koordinatı olan yerler haritada görünür.</p>;
  }
  return <LeafletMap points={points} />;
}
