"use client";

import { useEffect, useState } from "react";
import { saveLocation } from "@/lib/actions/modules";
import { createClient } from "@/lib/supabase/client";
import { PlaceMap } from "@/components/map/place-map";
import { Button } from "@/components/ui/button";

type LocationRow = {
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  sharing_enabled: boolean;
  updated_at: string;
  label: string;
};

export function LocationPanel({ coupleId, userId, initial }: { coupleId: string; userId: string; initial: LocationRow[] }) {
  const [rows, setRows] = useState(initial);
  const [sharing, setSharing] = useState(initial.find((row) => row.user_id === userId)?.sharing_enabled ?? false);
  const [error, setError] = useState<string | null>(null);
  const mine = rows.find((row) => row.user_id === userId);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`locations-${coupleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, async () => {
        const { data } = await supabase.from("locations").select("user_id, latitude, longitude, sharing_enabled, updated_at");
        if (data) {
          setRows((current) =>
            data.map((row) => ({
              ...row,
              label: current.find((item) => item.user_id === row.user_id)?.label ?? "Partner",
            })),
          );
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  useEffect(() => {
    if (!sharing || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        saveLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          sharingEnabled: true,
        });
      },
      () => setError("Konum izni verilmedi."),
      { enableHighAccuracy: true, maximumAge: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [sharing]);

  const points = rows.flatMap((row) =>
    row.sharing_enabled && row.latitude !== null && row.longitude !== null
      ? [{ id: row.user_id, name: row.label, latitude: row.latitude, longitude: row.longitude }]
      : [],
  );

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Konum paylaşımı varsayılan olarak kapalıdır. Bu sayfa açıkken güncellenir. Uygulama arka plandayken veya ekran kilitliyken konum alınamaz.
      </p>
      <PlaceMap points={points} />
      <ul className="grid gap-2 text-sm">
        {rows.map((row) => (
          <li key={row.user_id}>
            {row.label}: {row.sharing_enabled ? "paylaşıyor" : "kapalı"}
            {row.sharing_enabled ? ` · son güncelleme ${new Date(row.updated_at).toLocaleString("tr-TR")}` : ""}
          </li>
        ))}
        {rows.length === 0 ? <li>Henüz konum kaydı yok.</li> : null}
      </ul>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {sharing ? (
        <Button
          type="button"
          variant="destructive"
          className="h-11"
          onClick={async () => {
            setSharing(false);
            await saveLocation({
              latitude: mine?.latitude ?? null,
              longitude: mine?.longitude ?? null,
              sharingEnabled: false,
            });
          }}
        >
          Paylaşımı durdur
        </Button>
      ) : (
        <Button
          type="button"
          className="h-11"
          onClick={async () => {
            setError(null);
            setSharing(true);
            await saveLocation({ latitude: mine?.latitude ?? null, longitude: mine?.longitude ?? null, sharingEnabled: true });
          }}
        >
          Konumumu paylaş
        </Button>
      )}
    </div>
  );
}
