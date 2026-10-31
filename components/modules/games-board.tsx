"use client";

import { useMemo, useState } from "react";
import { saveDuo, saveGame } from "@/lib/actions/modules";
import { DeleteButton } from "@/components/modules/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";

type Game = { id: string; title: string; platform: string | null; status: string; score: number | null; play_minutes: number | null; notes: string | null };
type Duo = {
  id: string;
  game_id: string | null;
  kind: string | null;
  player_a_label: string | null;
  hero_a: string | null;
  lane_a: string | null;
  player_b_label: string | null;
  hero_b: string | null;
  lane_b: string | null;
};

const statusLabel: Record<string, string> = { wishlist: "Listede", playing: "Oynuyoruz", finished: "Bitti" };

export function GamesBoard({ games, duos }: { games: Game[]; duos: Duo[] }) {
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");
  const mlbb = games.find((game) => game.title === "Mobile Legends");
  const visible = useMemo(
    () =>
      duos.filter((duo) => {
        const text = `${duo.hero_a} ${duo.hero_b} ${duo.lane_a} ${duo.lane_b}`.toLocaleLowerCase("tr");
        const kindOk = kind === "all" || duo.kind === kind;
        return kindOk && text.includes(query.toLocaleLowerCase("tr"));
      }),
    [duos, kind, query],
  );

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Oyun ekle</CardTitle>
          <CardDescription>Oynadığınız veya oynamak istediğiniz oyunlar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = await saveGame({
                title: String(form.get("title") ?? ""),
                platform: String(form.get("platform") ?? ""),
                status: String(form.get("status") ?? ""),
                score: String(form.get("score") ?? ""),
                playMinutes: String(form.get("playMinutes") ?? ""),
                notes: String(form.get("notes") ?? ""),
              });
              setError(result.error ?? null);
              if (!result.error) event.currentTarget.reset();
            }}
          >
            <Input name="title" placeholder="Oyun adı" className="h-11" required />
            <div className="grid grid-cols-2 gap-2">
              <Input name="platform" placeholder="Platform" className="h-11" />
              <SelectField name="status" defaultValue="wishlist">
                <option value="wishlist">Listede</option>
                <option value="playing">Oynuyoruz</option>
                <option value="finished">Bitti</option>
              </SelectField>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input name="score" placeholder="Puan 1-10" className="h-11" />
              <Input name="playMinutes" placeholder="Süre (dk)" className="h-11" />
            </div>
            <Input name="notes" placeholder="Not" className="h-11" />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-11">Kaydet</Button>
          </form>
        </CardContent>
      </Card>

      {games.length === 0 ? <p className="text-sm text-muted-foreground">Henüz oyun yok.</p> : null}
      {games.map((game) => (
        <Card key={game.id}>
          <CardHeader>
            <CardTitle>{game.title}</CardTitle>
            <CardDescription>
              {statusLabel[game.status] ?? game.status}
              {game.platform ? ` · ${game.platform}` : ""}
              {game.score ? ` · ${game.score}/10` : ""}
              {game.play_minutes ? ` · ${game.play_minutes} dk` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-start justify-between gap-3">
            <p className="text-sm">{game.notes}</p>
            <DeleteButton table="games" id={game.id} />
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>İkili seçimler</CardTitle>
          <CardDescription>Mobile Legends listesi: Şeyda ve Fatih.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kahraman ara" className="h-11" />
            <SelectField value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="all">Tümü</option>
              <option value="Romantik">Romantik</option>
              <option value="Kombo">Kombo</option>
            </SelectField>
          </div>
          {visible.length === 0 ? <p className="text-sm text-muted-foreground">Eşleşen ikili yok.</p> : null}
          <ul className="grid gap-2">
            {visible.map((duo) => (
              <li key={duo.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-muted-foreground">{duo.kind}</p>
                    <p>{duo.player_a_label}: {duo.hero_a} · {duo.lane_a}</p>
                    <p>{duo.player_b_label}: {duo.hero_b} · {duo.lane_b}</p>
                  </div>
                  <DeleteButton table="game_duos" id={duo.id} />
                </div>
              </li>
            ))}
          </ul>
          <form
            className="grid gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = await saveDuo({
                gameId: mlbb?.id ?? "",
                kind: String(form.get("kind") ?? ""),
                heroA: String(form.get("heroA") ?? ""),
                laneA: String(form.get("laneA") ?? ""),
                heroB: String(form.get("heroB") ?? ""),
                laneB: String(form.get("laneB") ?? ""),
              });
              setError(result.error ?? null);
              if (!result.error) event.currentTarget.reset();
            }}
          >
            <Label>Yeni ikili</Label>
            <SelectField name="kind" defaultValue="Romantik">
              <option value="Romantik">Romantik</option>
              <option value="Kombo">Kombo</option>
            </SelectField>
            <div className="grid grid-cols-2 gap-2">
              <Input name="heroA" placeholder="Şeyda kahraman" className="h-11" />
              <Input name="laneA" placeholder="Koridor" className="h-11" />
              <Input name="heroB" placeholder="Fatih kahraman" className="h-11" />
              <Input name="laneB" placeholder="Koridor" className="h-11" />
            </div>
            <Button type="submit" variant="secondary" className="h-11">İkili ekle</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
