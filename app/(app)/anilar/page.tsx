import { MemoriesBoard } from "@/components/modules/memories-board";
import { StatusCard } from "@/components/status-card";
import { requireMembership } from "@/lib/membership";

export default async function MemoriesPage() {
  const context = await requireMembership();
  if (!context.ok) return <StatusCard title="Henüz hazır değil" description={context.error} />;

  const { data: memories, error } = await context.supabase
    .from("memories")
    .select("id, title, happened_on, body, tags, mood, couple_id")
    .eq("couple_id", context.coupleId)
    .order("happened_on", { ascending: false });

  if (error) return <StatusCard title="Henüz hazır değil" description="Anı tablosu yok. Son SQL betiğini çalıştır." />;

  const { data: mediaRows } = await context.supabase
    .from("memory_media")
    .select("id, memory_id, storage_path")
    .eq("couple_id", context.coupleId);

  const media = await Promise.all(
    (mediaRows ?? []).map(async (row) => {
      const { data } = await context.supabase.storage.from("memories").createSignedUrl(row.storage_path, 60 * 60);
      return { ...row, url: data?.signedUrl ?? null };
    }),
  );

  const today = new Date();
  const key = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const lastYear = today.getFullYear() - 1;
  const todayLastYear = (memories ?? []).filter((memory) => memory.happened_on === `${lastYear}-${key}`);

  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Anılar</h1>
      <MemoriesBoard memories={memories ?? []} media={media} todayLastYear={todayLastYear} />
    </div>
  );
}
