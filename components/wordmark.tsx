import { Heart } from "lucide-react";

export function Wordmark() {
  return (
    <p className="flex items-center gap-2 font-heading text-3xl tracking-tight">
      <Heart className="size-5 fill-primary text-primary" aria-hidden="true" />
      allinlove
    </p>
  );
}
