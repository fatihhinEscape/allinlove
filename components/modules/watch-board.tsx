"use client";

import { useMemo, useState } from "react";
import { saveWatch, setWatchStatus } from "@/lib/actions/modules";
import { DeleteButton } from "@/components/modules/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";

type Item = {
  id: string;
  title: string;
  media_type: string;
  status: "planned" | "watching" | "watched";
  release_year: number | null;
  runtime_label: string | null;
  studio: string | null;
  notes: string | null;
  score_a: number | null;
  score_b: number | null;
  comment: string | null;
  season_number: number | null;
  episode_number: number | null;
};

const statusLabel = { planned: "İzlenecek", watching: "İzleniyor", watched: "İzlendi" };
const nextStatus = { planned: "watching", watching: "watched", watched: "planned" } as const;

export function WatchBoard({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const visible = useMemo(
    () =>
      items.filter((item) => {
        const text = `${item.title} ${item.notes ?? ""} ${item.studio ?? ""}`.toLocaleLowerCase("tr");
        return (
          text.includes(query.toLocaleLowerCase("tr")) &&
          (status === "all" || item.status === status) &&
          (kind === "all" || item.media_type === kind)
        );
      }),
    [items, query, status, kind],
  );

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Yapım ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = await saveWatch({
                title: String(form.get("title") ?? ""),
                mediaType: String(form.get("mediaType") ?? ""),
                status: String(form.get("status") ?? ""),
                releaseYear: String(form.get("year") ?? ""),
                runtimeLabel: String(form.get("runtime") ?? ""),
                studio: String(form.get("studio") ?? ""),
                seasonNumber: String(form.get("season") ?? ""),
                episodeNumber: String(form.get("episode") ?? ""),
                scoreA: String(form.get("scoreA") ?? ""),
                scoreB: String(form.get("scoreB") ?? ""),
                comment: String(form.get("comment") ?? ""),
                notes: String(form.get("notes") ?? ""),
              });
              setError(result.error ?? null);
              if (!result.error) event.currentTarget.reset();
            }}
          >
            <Input name="title" placeholder="Ad" className="h-11" required />
            <div className="grid grid-cols-2 gap-2">
              <SelectField name="mediaType" defaultValue="film">
                <option value="film">Film</option>
                <option value="series">Dizi</option>
              </SelectField>
              <SelectField name="status" defaultValue="planned">
                <option value="planned">İzlenecek</option>
                <option value="watching">İzleniyor</option>
                <option value="watched">İzlendi</option>
              </SelectField>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input name="year" placeholder="Yıl" className="h-11" />
              <Input name="runtime" placeholder="Süre veya bölüm" className="h-11" />
              <Input name="season" placeholder="Sezon" className="h-11" />
              <Input name="episode" placeholder="Bölüm" className="h-11" />
              <Input name="scoreA" placeholder="Senin puanın" className="h-11" />
              <Input name="scoreB" placeholder="Partnerinin puanı" className="h-11" />
            </div>
            <Input name="comment" placeholder="Yorum" className="h-11" />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-11">Kaydet</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ara" className="h-11" />
        <div className="grid grid-cols-2 gap-2">
          <SelectField value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="all">Film ve dizi</option>
            <option value="film">Film</option>
            <option value="series">Dizi</option>
          </SelectField>
          <SelectField value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Tüm durumlar</option>
            <option value="planned">İzlenecek</option>
            <option value="watching">İzleniyor</option>
            <option value="watched">İzlendi</option>
          </SelectField>
        </div>
        <p className="text-sm text-muted-foreground">{visible.length} yapım</p>
      </div>

      <ul className="grid gap-2">
        {visible.map((item) => (
          <li key={item.id} className="rounded-xl border border-border bg-card px-3 py-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">
                  {item.media_type === "series" ? "Dizi" : "Film"}
                  {item.release_year ? ` · ${item.release_year}` : ""}
                  {item.runtime_label ? ` · ${item.runtime_label}` : ""}
                </p>
                {item.notes ? <p className="mt-1">{item.notes}</p> : null}
                {item.season_number || item.episode_number ? (
                  <p className="text-muted-foreground">Sezon {item.season_number ?? "-"} · Bölüm {item.episode_number ?? "-"}</p>
                ) : null}
                {item.score_a || item.score_b ? <p>Puan {item.score_a ?? "-"} / {item.score_b ?? "-"}</p> : null}
              </div>
              <DeleteButton table="watch_items" id={item.id} />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-2 h-9"
              onClick={() => setWatchStatus(item.id, nextStatus[item.status])}
            >
              {statusLabel[item.status]}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
