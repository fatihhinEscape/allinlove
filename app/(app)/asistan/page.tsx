import { AssistantPanel } from "@/components/ai/assistant-panel";
import { StatusCard } from "@/components/status-card";
import { requireMembership } from "@/lib/membership";
import { ensureSharingSettings, sharingModules } from "@/lib/openai/context";

export default async function AssistantPage() {
  const context = await requireMembership();
  if (!context.ok) return <StatusCard title="Henüz hazır değil" description={context.error} />;

  await ensureSharingSettings(context.supabase, context.coupleId, context.user.id);
  const { data, error } = await context.supabase.from("ai_sharing_settings").select("module, enabled").eq("couple_id", context.coupleId);
  if (error) return <StatusCard title="Henüz hazır değil" description="Asistan tablosu yok. Son SQL betiğini çalıştır." />;

  const enabled = new Map((data ?? []).map((row) => [row.module, row.enabled]));
  const initialSettings = sharingModules().map((module) => ({
    module: module.id,
    label: module.label,
    enabled: enabled.get(module.id) ?? true,
  }));

  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Asistan</h1>
      <AssistantPanel initialSettings={initialSettings} />
    </div>
  );
}
