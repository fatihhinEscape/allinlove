"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, ImageIcon, Map, Sparkles } from "lucide-react";

const items = [
  { href: "/", label: "Ana", icon: House },
  { href: "/birlikte", label: "Birlikte", icon: Heart },
  { href: "/anilar", label: "Anılar", icon: ImageIcon },
  { href: "/geziler", label: "Geziler", icon: Map },
  { href: "/asistan", label: "Asistan", icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={active ? "flex flex-col items-center gap-1 px-1 py-2 text-xs text-primary" : "flex flex-col items-center gap-1 px-1 py-2 text-xs text-muted-foreground"}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
