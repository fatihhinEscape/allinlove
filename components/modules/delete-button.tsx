"use client";

import { useState } from "react";
import { deleteOwned } from "@/lib/actions/modules";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  table,
  id,
}: {
  table: Parameters<typeof deleteOwned>[0];
  id: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await deleteOwned(table, id);
        setPending(false);
      }}
    >
      Sil
    </Button>
  );
}
