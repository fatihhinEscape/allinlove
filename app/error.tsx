"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-3xl">Bir şeyler ters gitti</h1>
      <p className="text-sm text-muted-foreground">Sayfayı yeniden deneyebilirsin.</p>
      <Button type="button" className="h-11" onClick={() => reset()}>
        Tekrar dene
      </Button>
    </div>
  );
}
