"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SuggestionCard({ initial }: { initial: string | null }) {
  const [body, setBody] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bugünün önerisi</CardTitle>
        <CardDescription>Kayıtlı listenize ve profilinize bakar.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {body ? <p className="text-sm whitespace-pre-wrap">{body}</p> : <p className="text-sm text-muted-foreground">Henüz bir öneri kartı yok.</p>}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          type="button"
          variant="secondary"
          className="h-11"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            const response = await fetch("/api/ai/suggestions", { method: "POST" });
            const payload = (await response.json()) as { body?: string; error?: string };
            setPending(false);
            if (payload.body) setBody(payload.body);
            if (payload.error) setError(payload.error);
          }}
        >
          {pending ? "Hazırlanıyor…" : body ? "Yenile" : "Öneri oluştur"}
        </Button>
      </CardContent>
    </Card>
  );
}
