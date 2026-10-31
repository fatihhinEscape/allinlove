"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/map/leaflet-map";

const LeafletMap = dynamic(() => import("@/components/map/leaflet-map").then((module) => module.LeafletMap), {
  ssr: false,
});

export function PlaceMap({
  points,
  empty = "Koordinatı olan yerler haritada görünür.",
}: {
  points: MapPoint[];
  empty?: string;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return <LeafletMap points={points} />;
}
