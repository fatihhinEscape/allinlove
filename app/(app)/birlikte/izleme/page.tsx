import { WatchBoard } from "@/components/modules/watch-board";
import { StatusCard } from "@/components/status-card";
import { requireMembership } from "@/lib/membership";

export default async function WatchPage() {
  const context = await requireMembership();
  if (!context.ok) return <StatusCard title="Henüz hazır değil" description={context.error} />;

  const { data, error } = await context.supabase
    .from("watch_items")
    .select("id, title, media_type, status, release_year, runtime_label, studio, notes, score_a, score_b, comment, season_number, episode_number")
    .eq("couple_id", context.coupleId)
    .order("release_year", { ascending: true });

  if (error) return <StatusCard title="Henüz hazır değil" description="İzleme tablosu yok. Son SQL betiğini çalıştır." />;
  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Dizi ve film</h1>
      <WatchBoard items={data ?? []} />
    </div>
  );
}
