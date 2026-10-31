"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function InvitePanel({ code, link }: { code: string; link: string }) {
  const [notice, setNotice] = useState<string | null>(null);

  async function copy(value: string, nextNotice: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(nextNotice);
    } catch {
      setNotice("Kopyalanamadı. Kodu seçip elle kopyala.");
    }
  }

  return (
    <div className="grid gap-3">
      <p className="text-center font-heading text-3xl tracking-[0.3em]">{code}</p>
      <p className="break-all text-center text-sm text-muted-foreground">{link}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="secondary" className="h-11" onClick={() => copy(code, "Kod kopyalandı.")}>
          Kodu kopyala
        </Button>
        <Button type="button" className="h-11" onClick={() => copy(link, "Bağlantı kopyalandı.")}>
          Bağlantıyı kopyala
        </Button>
      </div>
      {notice ? <p className="text-center text-sm">{notice}</p> : null}
    </div>
  );
}
