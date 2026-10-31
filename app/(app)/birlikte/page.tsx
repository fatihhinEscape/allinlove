import Link from "next/link";
import { importStarterLists } from "@/lib/actions/modules";
import { StatusCard } from "@/components/status-card";
import { requireMembership } from "@/lib/membership";

const links = [
  { href: "/birlikte/oyunlar", title: "Oyunlar", text: "Mobile Legends ikilileri ve diğer oyunlar" },
  { href: "/birlikte/izleme", title: "Dizi ve film", text: "Marvel listesi, puan ve ilerleme" },
  { href: "/birlikte/kitaplar", title: "Kitaplar", text: "Sayfa, alıntı ve iki puan" },
  { href: "/birlikte/calisma", title: "Çalışma", text: "Seanslar, hedefler ve ilerleme" },
];

export default async function TogetherPage() {
  const context = await requireMembership();
  if (!context.ok) {
    return <StatusCard title="Henüz hazır değil" description={context.error} />;
  }

  const [{ count: games }, { count: watch }] = await Promise.all([
    context.supabase.from("games").select("id", { count: "exact", head: true }).eq("couple_id", context.coupleId),
    context.supabase.from("watch_items").select("id", { count: "exact", head: true }).eq("couple_id", context.coupleId),
  ]);
  if (!games || !watch) {
    await importStarterLists();
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-3xl">Birlikte</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ortak listeler burada durur.</p>
      </div>
      <div className="grid gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="rounded-xl border border-border bg-card px-4 py-4">
            <p className="font-heading text-xl">{link.title}</p>
            <p className="text-sm text-muted-foreground">{link.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
