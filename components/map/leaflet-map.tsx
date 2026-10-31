"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMapType, Marker } from "leaflet";

export type MapPoint = { id: string; name: string; latitude: number; longitude: number };

export function LeafletMap({ points }: { points: MapPoint[] }) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapType | null>(null);

  useEffect(() => {
    let active = true;
    const markers: Marker[] = [];

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
      const icon = leaflet.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      points.forEach((point) => {
        const marker = leaflet.marker([point.latitude, point.longitude], { icon }).addTo(map);
        marker.bindPopup(point.name);
        markers.push(marker);
      });
      if (points.length === 1) {
        map.setView([points[0].latitude, points[0].longitude], 13);
      } else if (points.length > 1) {
        map.fitBounds(leaflet.latLngBounds(points.map((point) => [point.latitude, point.longitude])));
      }
    }

    draw();
    return () => {
      active = false;
      markers.forEach((marker) => marker.remove());
    };
  }, [points]);

  return <div ref={node} className="h-64 w-full overflow-hidden rounded-xl" />;
}
