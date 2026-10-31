import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-24">
      <header className="flex items-center justify-between gap-3 py-4">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Link href="/profil" className="text-sm text-muted-foreground">Profil</Link>
          <ThemeToggle />
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Çıkış
            </Button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomNav />
    </div>
  );
}
