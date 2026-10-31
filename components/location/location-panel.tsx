"use client";

import { useEffect, useRef, useState } from "react";
import { saveLocation } from "@/lib/actions/modules";
import { createClient } from "@/lib/supabase/client";
import { PlaceMap } from "@/components/map/place-map";
import { Button } from "@/components/ui/button";

type Person = { id: string; name: string };

type LocationRow = {
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  sharing_enabled: boolean;
  updated_at: string;
};

function movedEnough(previous: { latitude: number; longitude: number } | null, latitude: number, longitude: number) {
  if (!previous) return true;
  const north = (latitude - previous.latitude) * 111_000;
  const east = (longitude - previous.longitude) * 111_000 * Math.cos((latitude * Math.PI) / 180);
  return Math.hypot(north, east) >= 30;
}

export function LocationPanel({
  coupleId,
  userId,
  people,
  initial,
}: {
  coupleId: string;
  userId: string;
  people: Person[];
  initial: LocationRow[];
}) {
  const [rows, setRows] = useState(initial);
  const [sharing, setSharing] = useState(initial.find((row) => row.user_id === userId)?.sharing_enabled ?? false);
  const [status, setStatus] = useState(sharing ? "Paylaşılıyor" : "Kapalı");
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastSent = useRef(0);
  const lastPoint = useRef<{ latitude: number; longitude: number } | null>(null);

  function applyMine(latitude: number | null, longitude: number | null, sharingEnabled: boolean) {
    setRows((current) => {
      const next = current.filter((row) => row.user_id !== userId);
      next.push({
        user_id: userId,
        latitude,
        longitude,
        sharing_enabled: sharingEnabled,
        updated_at: new Date().toISOString(),
      });
      return next;
    });
  }

  async function publish(latitude: number, longitude: number, force: boolean) {
    const now = Date.now();
    if (!force && now - lastSent.current < 20_000 && !movedEnough(lastPoint.current, latitude, longitude)) {
      return;
    }
    lastSent.current = now;
    lastPoint.current = { latitude, longitude };
    const result = await saveLocation({ latitude, longitude, sharingEnabled: true });
    if (result.error) {
      setError(result.error);
      return;
    }
    applyMine(latitude, longitude, true);
    setStatus("Paylaşılıyor");
  }

  function stopWatch() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`locations-${coupleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, async () => {
        const { data } = await supabase
          .from("locations")
          .select("user_id, latitude, longitude, sharing_enabled, updated_at");
        if (data) setRows(data);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  useEffect(() => stopWatch, []);

  function startSharing() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Bu tarayıcı konum desteklemiyor.");
      return;
    }
    setStatus("İzin bekleniyor");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSharing(true);
        publish(position.coords.latitude, position.coords.longitude, true);
        stopWatch();
        watchId.current = navigator.geolocation.watchPosition(
          (next) => publish(next.coords.latitude, next.coords.longitude, false),
          () => {
            setError("Konum alınamadı. İzni kontrol et.");
            setStatus("Kapalı");
            setSharing(false);
            stopWatch();
          },
          { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
        );
      },
      () => {
        setSharing(false);
        setStatus("Kapalı");
        setError("Konum izni verilmedi. Paylaşım kapalı kaldı.");
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  async function stopSharing() {
    stopWatch();
    setSharing(false);
    setStatus("Kapalı");
    const mine = rows.find((row) => row.user_id === userId);
    const result = await saveLocation({
      latitude: mine?.latitude ?? null,
      longitude: mine?.longitude ?? null,
      sharingEnabled: false,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    applyMine(mine?.latitude ?? null, mine?.longitude ?? null, false);
  }

  const names = new Map(people.map((person) => [person.id, person.name]));
  const points = rows.flatMap((row) =>
    row.sharing_enabled && row.latitude !== null && row.longitude !== null
      ? [{
          id: row.user_id,
          name: row.user_id === userId ? "Sen" : names.get(row.user_id) ?? "Partner",
          latitude: row.latitude,
          longitude: row.longitude,
        }]
      : [],
  );

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Paylaşım kapalı başlar ve istediğin an kapanır. Konum yalnızca bu sayfa açıkken güncellenir. Uygulama arkadayken veya ekran kilitliyken alınamaz.
      </p>
      <PlaceMap points={points} empty="Paylaşım açılınca konum burada görünür." />
      <ul className="grid gap-2 text-sm">
        {people.map((person) => {
          const row = rows.find((item) => item.user_id === person.id);
          const active = Boolean(row?.sharing_enabled && row.latitude !== null);
          const label = person.id === userId ? `${person.name} (sen)` : person.name;
          return (
            <li key={person.id}>
              {label}: {active ? "paylaşıyor" : "kapalı"}
              {active && row ? ` · ${new Date(row.updated_at).toLocaleString("tr-TR")}` : ""}
            </li>
          );
        })}
      </ul>
      <p className="text-sm">{status}</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {sharing ? (
        <Button type="button" variant="destructive" className="h-11" onClick={stopSharing}>
          Paylaşımı durdur
        </Button>
      ) : (
        <Button type="button" className="h-11" onClick={startSharing}>
          Konumumu paylaş
        </Button>
      )}
    </div>
  );
}
