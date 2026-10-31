import { GamesBoard } from "@/components/modules/games-board";
import { StatusCard } from "@/components/status-card";
import { requireMembership } from "@/lib/membership";

export default async function GamesPage() {
  const context = await requireMembership();
  if (!context.ok) return <StatusCard title="Henüz hazır değil" description={context.error} />;

  const [{ data: games, error }, { data: duos }] = await Promise.all([
    context.supabase.from("games").select("id, title, platform, status, score, play_minutes, notes").eq("couple_id", context.coupleId).order("created_at"),
    context.supabase.from("game_duos").select("id, game_id, kind, player_a_label, hero_a, lane_a, player_b_label, hero_b, lane_b").eq("couple_id", context.coupleId).order("created_at"),
  ]);

  if (error) return <StatusCard title="Henüz hazır değil" description="Oyun tablosu yok. Son SQL betiğini çalıştır." />;
  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Oyunlar</h1>
      <GamesBoard games={games ?? []} duos={duos ?? []} />
    </div>
  );
}
