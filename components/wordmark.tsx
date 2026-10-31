import { Heart } from "lucide-react";
import Link from "next/link";

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 font-heading text-3xl tracking-tight">
      <Heart className="size-5 fill-primary text-primary" aria-hidden="true" />
      allinlove
    </Link>
  );
}
