import type { SupabaseClient } from "@supabase/supabase-js";
import { daysSince, formatTurkishDate, togetherLabel } from "@/lib/dates";

const MODULES = [
  { id: "profile", label: "Profil ve favoriler" },
  { id: "games", label: "Oyunlar" },
  { id: "watch", label: "Dizi ve film" },
  { id: "study", label: "Çalışma" },
  { id: "books", label: "Kitaplar" },
  { id: "memories", label: "Anılar" },
  { id: "trips", label: "Geziler" },
] as const;

const LOVE_LABELS: Record<string, string> = {
  words: "sözel onay",
  time: "kaliteli zaman",
  gifts: "hediyeler",
  service: "hizmet davranışları",
  touch: "fiziksel temas",
};

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

function dayIndex(key: string, length: number) {
  if (length <= 0) return 0;
  const stamp = key.split("-").reduce((sum, part) => sum + Number(part), 0);
  return stamp % length;
}

export async function buildCoupleContext(supabase: SupabaseClient, coupleId: string) {
  const { data: settings } = await supabase.from("ai_sharing_settings").select("module, enabled").eq("couple_id", coupleId);
  const enabled = new Set((settings ?? []).filter((row) => row.enabled).map((row) => row.module as string));
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const lines: string[] = [];
  const fallback: string[] = [];

  const { data: couple } = await supabase
    .from("couples")
    .select("name, relationship_start")
    .eq("id", coupleId)
    .maybeSingle();

  if (couple?.name) lines.push(`Çift adı: ${couple.name}`);
  if (couple?.relationship_start) {
    const days = daysSince(couple.relationship_start);
    const together = days === null ? "" : ` ${togetherLabel(days)}`;
    lines.push(`Birlikte olunan gün: ${formatTurkishDate(couple.relationship_start)}.${together}`);
    fallback.push(`Birlikte: ${formatTurkishDate(couple.relationship_start)} tarihinden beri${together ? `, ${together}` : ""}.`);
  }

  const { data: dates } = await supabase
    .from("important_dates")
    .select("title, occurs_on, kind")
    .eq("couple_id", coupleId)
    .order("occurs_on")
    .limit(8);
  if (dates?.length) {
    lines.push(`Önemli tarihler: ${dates.map((item) => `${item.title} (${formatTurkishDate(item.occurs_on)})`).join("; ")}`);
    fallback.push(`Tarih: ${dates[0].title}, ${formatTurkishDate(dates[0].occurs_on)}.`);
  }

  if (enabled.has("profile")) {
    const [{ data: profiles }, { data: details }] = await Promise.all([
      supabase.from("profiles").select("id, display_name").eq("couple_id", coupleId),
      supabase.from("partner_details").select("user_id, nickname, favorite_food, favorite_drink, favorite_color, favorite_music, love_language, dislikes").eq("couple_id", coupleId),
    ]);
    const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
    const profileLines = (details ?? []).map((detail) => {
      const name = detail.nickname || names.get(detail.user_id) || "biri";
      const bits = [
        detail.favorite_food ? `yiyecek ${detail.favorite_food}` : "",
        detail.favorite_drink ? `içecek ${detail.favorite_drink}` : "",
        detail.favorite_color ? `renk ${detail.favorite_color}` : "",
        detail.favorite_music ? `müzik ${detail.favorite_music}` : "",
        detail.love_language ? `sevgi dili ${LOVE_LABELS[detail.love_language] ?? detail.love_language}` : "",
        detail.dislikes ? `hoşlanmadığı ${detail.dislikes}` : "",
      ].filter(Boolean);
      return bits.length ? `${name}: ${bits.join(", ")}` : "";
    }).filter(Boolean);
    if (profileLines.length) lines.push(`Profiller: ${profileLines.join(" | ")}`);
  }

  if (enabled.has("games")) {
    const [{ data: games }, { data: duos }] = await Promise.all([
      supabase.from("games").select("title, status, platform").eq("couple_id", coupleId),
      supabase.from("game_duos").select("kind, player_a_label, hero_a, lane_a, player_b_label, hero_b, lane_b").eq("couple_id", coupleId),
    ]);
    if (games?.length) lines.push(`Oyunlar: ${games.map((game) => game.title).join(", ")}`);
    if (duos?.length) {
      const pick = duos[dayIndex(todayKey, duos.length)];
      lines.push(`Kayıtlı ikili sayısı: ${duos.length}. Bugünün adayı: ${pick.kind ?? "ikili"}, ${pick.player_a_label} ${pick.hero_a} (${pick.lane_a}), ${pick.player_b_label} ${pick.hero_b} (${pick.lane_b}).`);
      const samples = duos.slice(0, 6).map((duo) => `${duo.kind}: ${duo.hero_a}/${duo.hero_b}`);
      lines.push(`Örnek ikililer: ${samples.join("; ")}`);
      fallback.push(`Dene: ${pick.kind ?? "İkili"} — ${pick.player_a_label} ${pick.hero_a} ${pick.lane_a}, ${pick.player_b_label} ${pick.hero_b} ${pick.lane_b}.`);
    }
  }

  if (enabled.has("watch")) {
    const [{ count: watched }, { count: planned }, { data: nextItems }] = await Promise.all([
      supabase.from("watch_items").select("id", { count: "exact", head: true }).eq("couple_id", coupleId).eq("status", "watched"),
      supabase.from("watch_items").select("id", { count: "exact", head: true }).eq("couple_id", coupleId).eq("status", "planned"),
      supabase.from("watch_items").select("title, media_type, release_year, runtime_label, notes").eq("couple_id", coupleId).eq("status", "planned").order("release_year", { ascending: true }).limit(8),
    ]);
    lines.push(`İzleme: ${watched ?? 0} izlendi, ${planned ?? 0} izlenecek.`);
    if (nextItems?.length) {
      lines.push(`Sıradaki izlenmemişler: ${nextItems.map((item) => `${item.title} (${item.release_year ?? "?"}, ${item.media_type === "series" ? "dizi" : "film"})`).join("; ")}`);
      const first = nextItems[0];
      fallback.push(`İzle: ${first.title}${first.release_year ? ` (${first.release_year})` : ""}${first.runtime_label ? `, ${first.runtime_label}` : ""}.`);
    }
  }

  if (enabled.has("books")) {
    const { data } = await supabase.from("books").select("title, author, status").eq("couple_id", coupleId).limit(8);
    if (data?.length) lines.push(`Kitaplar: ${data.map((book) => book.title).join(", ")}`);
  }

  if (enabled.has("study")) {
    const { data } = await supabase.from("study_goals").select("title, completed_count, target_count").eq("couple_id", coupleId).limit(8);
    if (data?.length) lines.push(`Çalışma hedefleri: ${data.map((goal) => `${goal.title} ${goal.completed_count}/${goal.target_count}`).join("; ")}`);
  }

  if (enabled.has("memories")) {
    const { data } = await supabase.from("memories").select("title, happened_on, mood").eq("couple_id", coupleId).order("happened_on", { ascending: false }).limit(5);
    if (data?.length) lines.push(`Son anılar: ${data.map((memory) => `${memory.title} (${formatTurkishDate(memory.happened_on)})`).join("; ")}`);
  }

  if (enabled.has("trips")) {
    const { data } = await supabase.from("trips").select("title, place, starts_on, budget_amount").eq("couple_id", coupleId).limit(5);
    if (data?.length) lines.push(`Geziler: ${data.map((trip) => trip.title).join(", ")}`);
  }

  lines.push("Canlı konum bu özette yoktur.");

  return {
    brief: lines.join("\n").slice(0, 7000),
    fallback: fallback.length ? fallback.join("\n") : "Bugün için kayıtlı bir öneri çıkaracak liste yok.",
  };
}
