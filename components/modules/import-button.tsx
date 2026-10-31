"use client";

import { useState } from "react";
import { importStarterLists } from "@/lib/actions/modules";
import { Button } from "@/components/ui/button";

export function ImportButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        className="h-11"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await importStarterLists();
          setPending(false);
          setMessage(result.error ?? "Mobile Legends ikilileri ve Marvel listesi yüklendi.");
        }}
      >
        {pending ? "Yükleniyor…" : "Excel listelerini yükle"}
      </Button>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
