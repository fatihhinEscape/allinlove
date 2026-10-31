import { StudyBoard } from "@/components/modules/study-board";
import { StatusCard } from "@/components/status-card";
import { requireMembership } from "@/lib/membership";

export default async function StudyPage() {
  const context = await requireMembership();
  if (!context.ok) return <StatusCard title="Henüz hazır değil" description={context.error} />;

  const [{ data: sessions, error }, { data: goals }] = await Promise.all([
    context.supabase.from("study_sessions").select("id, topic, duration_minutes, studied_on").eq("couple_id", context.coupleId).order("studied_on", { ascending: false }).limit(12),
    context.supabase.from("study_goals").select("id, title, target_count, completed_count").eq("couple_id", context.coupleId).order("created_at"),
  ]);

  if (error) return <StatusCard title="Henüz hazır değil" description="Çalışma tablosu yok. Son SQL betiğini çalıştır." />;
  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Çalışma</h1>
      <StudyBoard sessions={sessions ?? []} goals={goals ?? []} />
    </div>
  );
}
