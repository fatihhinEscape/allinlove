"use client";

import { useState } from "react";
import { setSharingModule } from "@/lib/actions/modules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Setting = { module: string; label: string; enabled: boolean };
type Message = { role: "user" | "assistant"; content: string };

export function AssistantPanel({ initialSettings }: { initialSettings: Setting[] }) {
  const [settings, setSettings] = useState(initialSettings);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prompts = [
    "Bu hafta sonu için kayıtlı veriden bir aktivite öner.",
    "İzleme listemizden sıradaki filmi veya diziyi seç.",
    "Mobile Legends ikililerimizden bugün deneyeceğimiz birini söyle.",
    "Yıl dönümü ve önemli tarihlerimize göre bir fikir ver.",
  ];

  async function send(text?: string) {
    const content = (text ?? draft).trim();
    if (!content || pending) return;
    setDraft("");
    setPending(true);
    setError(null);
    setMessages((current) => [...current, { role: "user", content }]);
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, conversationId }),
    });
    const payload = (await response.json()) as { reply?: string; conversationId?: string; error?: string };
    setPending(false);
    if (payload.error || !payload.reply) {
      setError(payload.error ?? "Yanıt alınamadı.");
      return;
    }
    if (payload.conversationId) setConversationId(payload.conversationId);
    setMessages((current) => [...current, { role: "assistant", content: payload.reply ?? "" }]);
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Aşk Danışmanı</CardTitle>
          <CardDescription>Yalnızca açtığın modüllerdeki kayıtlara bakar. Konum paylaşılmaz.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            {settings.map((setting) => (
              <label key={setting.module} className="flex items-center justify-between gap-3 text-sm">
                <span>{setting.label}</span>
                <input
                  type="checkbox"
                  checked={setting.enabled}
                  onChange={async (event) => {
                    const enabled = event.target.checked;
                    setSettings((current) => current.map((item) => item.module === setting.module ? { ...item, enabled } : item));
                    await setSharingModule(setting.module, enabled);
                  }}
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <Button key={prompt} type="button" variant="outline" className="h-auto px-3 py-2 text-left whitespace-normal" disabled={pending} onClick={() => send(prompt)}>
                {prompt}
              </Button>
            ))}
          </div>
          <div className="grid max-h-96 gap-3 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sorular yalnızca kayıtlı listelerden yanıtlanır.</p>
            ) : null}
            {messages.map((message, index) => (
              <p key={index} className={message.role === "user" ? "text-sm" : "rounded-lg bg-muted px-3 py-2 text-sm"}>
                {message.content}
              </p>
            ))}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Bir şey sor" />
          <Button type="button" className="h-11" disabled={pending} onClick={() => send()}>
            {pending ? "Bakıyor…" : "Gönder"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
