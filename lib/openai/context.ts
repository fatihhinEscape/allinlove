import type { SupabaseClient } from "@supabase/supabase-js";

const MODULES = [
  { id: "profile", label: "Profil ve favoriler" },
  { id: "games", label: "Oyunlar" },
  { id: "watch", label: "Dizi ve film" },
  { id: "study", label: "Çalışma" },
  { id: "books", label: "Kitaplar" },
  { id: "memories", label: "Anılar" },
  { id: "trips", label: "Geziler" },
] as const;

export function sharingModules() {
  return MODULES;
}

export async function ensureSharingSettings(supabase: SupabaseClient, coupleId: string, userId: string) {
  const { data } = await supabase.from("ai_sharing_settings").select("module").eq("couple_id", coupleId);
  if (data && data.length > 0) return;
  await supabase.from("ai_sharing_settings").insert(
    MODULES.map((module) => ({
      couple_id: coupleId,
      module: module.id,
      enabled: true,
      created_by: userId,
    })),
  );
}

export async function buildCoupleBrief(supabase: SupabaseClient, coupleId: string) {
  const { data: settings } = await supabase.from("ai_sharing_settings").select("module, enabled").eq("couple_id", coupleId);
  const enabled = new Set((settings ?? []).filter((row) => row.enabled).map((row) => row.module as string));
  const parts: string[] = [];

  if (enabled.has("profile")) {
    const { data } = await supabase.from("partner_details").select("nickname, favorite_food, favorite_drink, favorite_music, love_language, dislikes").eq("couple_id", coupleId);
    if (data?.length) parts.push(`Profiller: ${JSON.stringify(data)}`);
  }
  if (enabled.has("games")) {
    const { data } = await supabase.from("games").select("title, status, platform").eq("couple_id", coupleId).limit(12);
    if (data?.length) parts.push(`Oyunlar: ${JSON.stringify(data)}`);
  }
  if (enabled.has("watch")) {
    const { data } = await supabase
      .from("watch_items")
      .select("title, media_type, status, release_year")
      .eq("couple_id", coupleId)
      .eq("status", "planned")
      .limit(12);
    if (data?.length) parts.push(`İzlenmemiş yapımlar: ${JSON.stringify(data)}`);
  }
  if (enabled.has("books")) {
    const { data } = await supabase.from("books").select("title, author, status").eq("couple_id", coupleId).limit(8);
    if (data?.length) parts.push(`Kitaplar: ${JSON.stringify(data)}`);
  }
  if (enabled.has("study")) {
    const { data } = await supabase.from("study_goals").select("title, completed_count, target_count").eq("couple_id", coupleId).limit(8);
    if (data?.length) parts.push(`Çalışma hedefleri: ${JSON.stringify(data)}`);
  }
  if (enabled.has("memories")) {
    const { data } = await supabase.from("memories").select("title, happened_on, mood").eq("couple_id", coupleId).order("happened_on", { ascending: false }).limit(6);
    if (data?.length) parts.push(`Son anılar: ${JSON.stringify(data)}`);
  }
  if (enabled.has("trips")) {
    const { data } = await supabase.from("trips").select("title, place, starts_on, budget_amount").eq("couple_id", coupleId).limit(6);
    if (data?.length) parts.push(`Geziler: ${JSON.stringify(data)}`);
  }

  return parts.join("\n").slice(0, 6000);
}
