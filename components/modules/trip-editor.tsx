"use client";

import { useState } from "react";
import { saveChecklistItem, saveTripDay, saveTripPlace, toggleChecklist } from "@/lib/actions/modules";
import { PlaceMap } from "@/components/map/place-map";
import { DeleteButton } from "@/components/modules/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";

type Day = { id: string; day_date: string | null; plan: string };
type Place = { id: string; name: string; latitude: number | null; longitude: number | null; notes: string | null };
type Check = { id: string; label: string; done: boolean; kind: string };

export function TripEditor({
  tripId,
  days,
  places,
  checklist,
}: {
  tripId: string;
  days: Day[];
  places: Place[];
  checklist: Check[];
}) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const points = places.flatMap((place) =>
    place.latitude !== null && place.longitude !== null
      ? [{ id: place.id, name: place.name, latitude: place.latitude, longitude: place.longitude }]
      : [],
  );

  async function findPlace(name: string) {
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(name)}`);
    const payload = (await response.json()) as { latitude?: number; longitude?: number; error?: string };
    if (payload.latitude && payload.longitude) {
      setLatitude(String(payload.latitude));
      setLongitude(String(payload.longitude));
      setNotice("Konum bulundu. Kaydetmeden önce kontrol et.");
      return;
    }
    setNotice(payload.error ?? "Konum bulunamadı.");
  }

  return (
    <div className="grid gap-4">
      <PlaceMap points={points} />
      <Card>
        <CardHeader><CardTitle>Günlük program</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {days.map((day) => (
            <div key={day.id} className="flex items-start justify-between gap-2 text-sm">
              <p>{day.day_date ? `${day.day_date}: ` : ""}{day.plan}</p>
              <DeleteButton table="trip_days" id={day.id} />
            </div>
          ))}
          <form className="grid gap-2" onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const result = await saveTripDay({ tripId, dayDate: String(form.get("date") ?? ""), plan: String(form.get("plan") ?? "") });
            if (!result.error) event.currentTarget.reset();
          }}>
            <Input name="date" type="date" className="h-11" />
            <Textarea name="plan" placeholder="O gün ne yapacağız?" />
            <Button type="submit" className="h-11">Günü ekle</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Gidilecek yerler</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {places.map((place) => (
            <div key={place.id} className="flex items-start justify-between gap-2 text-sm">
              <p>{place.name}{place.notes ? ` — ${place.notes}` : ""}</p>
              <DeleteButton table="trip_places" id={place.id} />
            </div>
          ))}
          <form className="grid gap-2" onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const name = String(form.get("name") ?? "");
            const result = await saveTripPlace({
              tripId,
              name,
              latitude,
              longitude,
              notes: String(form.get("notes") ?? ""),
            });
            setNotice(result.error ?? null);
            if (!result.error) {
              event.currentTarget.reset();
              setLatitude("");
              setLongitude("");
            }
          }}>
            <Input name="name" placeholder="Yer adı" className="h-11" />
            <Button type="button" variant="secondary" onClick={(event) => {
              const form = event.currentTarget.form;
              const name = String(new FormData(form ?? undefined).get("name") ?? "");
              if (name) findPlace(name);
            }}>Haritada bul</Button>
            <div className="grid grid-cols-2 gap-2">
              <Input value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="Enlem" className="h-11" />
              <Input value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="Boylam" className="h-11" />
            </div>
            <Input name="notes" placeholder="Not" className="h-11" />
            {notice ? <p className="text-sm">{notice}</p> : null}
            <Button type="submit" className="h-11">Yeri kaydet</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Yapılacaklar ve bavul</CardTitle></CardHeader>
        <CardContent className="grid gap-2">
          {checklist.map((item) => (
            <label key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={item.done} onChange={(event) => toggleChecklist(item.id, event.target.checked)} />
                <span className={item.done ? "line-through" : ""}>{item.label}</span>
              </span>
              <span className="text-muted-foreground">{item.kind === "packing" ? "Bavul" : "İş"}</span>
            </label>
          ))}
          <form className="grid grid-cols-[1fr_120px_auto] gap-2" onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const result = await saveChecklistItem({
              tripId,
              label: String(form.get("label") ?? ""),
              kind: String(form.get("kind") ?? ""),
            });
            if (!result.error) event.currentTarget.reset();
          }}>
            <Input name="label" placeholder="Madde" className="h-11" />
            <SelectField name="kind" defaultValue="todo">
              <option value="todo">Yapılacak</option>
              <option value="packing">Bavul</option>
            </SelectField>
            <Button type="submit" className="h-11">Ekle</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
