"use client";

import { useState } from "react";
import { attachMemoryPhoto, saveMemory } from "@/lib/actions/modules";
import { createClient } from "@/lib/supabase/client";
import { formatTurkishDate } from "@/lib/dates";
import { DeleteButton } from "@/components/modules/delete-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Memory = {
  id: string;
  title: string;
  happened_on: string;
  body: string | null;
  tags: string[];
  mood: string | null;
  couple_id: string;
};
type Media = { id: string; memory_id: string; storage_path: string; url: string | null };

export function MemoriesBoard({
  memories,
  media,
  todayLastYear,
}: {
  memories: Memory[];
  media: Media[];
  todayLastYear: Memory[];
}) {
  const [error, setError] = useState<string | null>(null);

  async function upload(memory: Memory, file: File) {
    const supabase = createClient();
    const path = `${memory.couple_id}/${memory.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.]+/g, "-")}`;
    const { error: uploadError } = await supabase.storage.from("memories").upload(path, file, { upsert: false });
    if (uploadError) {
      setError("Fotoğraf yüklenemedi. SQL betiğindeki depolama iznini kontrol et.");
      return;
    }
    const result = await attachMemoryPhoto(memory.id, path);
    setError(result.error ?? null);
  }

  return (
    <div className="grid gap-4">
      {todayLastYear.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Bugün geçen yıl</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {todayLastYear.map((memory) => (
              <p key={memory.id}>{memory.title}{memory.body ? ` — ${memory.body}` : ""}</p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Anı ekle</CardTitle></CardHeader>
        <CardContent>
          <form
            className="grid gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const result = await saveMemory({
                title: String(form.get("title") ?? ""),
                happenedOn: String(form.get("date") ?? ""),
                body: String(form.get("body") ?? ""),
                tags: String(form.get("tags") ?? ""),
                mood: String(form.get("mood") ?? ""),
              });
              setError(result.error ?? null);
              if (!result.error) event.currentTarget.reset();
            }}
          >
            <Input name="title" placeholder="Başlık" className="h-11" required />
            <div className="grid grid-cols-2 gap-2">
              <Input name="date" type="date" className="h-11" />
              <Input name="mood" placeholder="Ruh hali" className="h-11" />
            </div>
            <Textarea name="body" placeholder="Ne oldu?" />
            <Input name="tags" placeholder="Etiketler, virgülle" className="h-11" />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="h-11">Kaydet</Button>
          </form>
        </CardContent>
      </Card>

      {memories.length === 0 ? <p className="text-sm text-muted-foreground">Henüz anı yok.</p> : null}
      {memories.map((memory) => (
        <Card key={memory.id}>
          <CardHeader>
            <CardTitle>{memory.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p className="text-muted-foreground">
              {formatTurkishDate(memory.happened_on)}
              {memory.mood ? ` · ${memory.mood}` : ""}
            </p>
            {memory.body ? <p>{memory.body}</p> : null}
            {memory.tags.length > 0 ? <p className="text-muted-foreground">{memory.tags.join(" · ")}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              {media.filter((item) => item.memory_id === memory.id && item.url).map((item) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={item.id} src={item.url ?? ""} alt="" className="h-32 w-full rounded-lg object-cover" />
              ))}
            </div>
            <label className="text-sm text-primary">
              Fotoğraf ekle
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-foreground"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload(memory, file);
                }}
              />
            </label>
            <DeleteButton table="memories" id={memory.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
