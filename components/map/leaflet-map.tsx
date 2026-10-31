"use client";

import { useEffect, useRef } from "react";
import type { Layer, Map as LeafletMapType } from "leaflet";

export type MapPoint = { id: string; name: string; latitude: number; longitude: number };

export function LeafletMap({ points }: { points: MapPoint[] }) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapType | null>(null);

  const pointsKey = points.map((point) => `${point.id}:${point.latitude}:${point.longitude}:${point.name}`).join("|");

  useEffect(() => {
    let active = true;
    const markers: Layer[] = [];

    async function draw() {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (!active || !node.current) return;
      if (!mapRef.current) {
        mapRef.current = leaflet.map(node.current).setView([39.0, 35.0], 5);
        leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;
      markers.splice(0).forEach((marker) => marker.remove());
      points.forEach((point) => {
        const mine = point.name === "Sen";
        const marker = leaflet.circleMarker([point.latitude, point.longitude], {
          radius: 9,
          color: mine ? "#9d3d52" : "#5c6b73",
          fillColor: mine ? "#e7a0ab" : "#d7e3ea",
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        marker.bindPopup(point.name);
        markers.push(marker);
      });
      map.invalidateSize();
      if (points.length === 1) {
        map.setView([points[0].latitude, points[0].longitude], 14);
      } else if (points.length > 1) {
        map.fitBounds(leaflet.latLngBounds(points.map((point) => [point.latitude, point.longitude])), { padding: [24, 24] });
      }
    }

    draw();
    return () => {
      active = false;
      markers.forEach((marker) => marker.remove());
    };
    // pointsKey captures the coordinates that should redraw the markers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey]);

  return <div ref={node} className="h-64 w-full overflow-hidden rounded-xl" />;
}
