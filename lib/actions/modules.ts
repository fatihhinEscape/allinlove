"use server";

import { revalidatePath } from "next/cache";
import mlbbDuos from "@/data/mlbb-duos.json";
import marvelWatch from "@/data/marvel-watch.json";
import { requireMembership } from "@/lib/membership";
import { toUserMessage } from "@/lib/messages";
import { embedText } from "@/lib/openai/embeddings";

const DELETABLE = [
  "games",
  "game_duos",
  "watch_items",
  "study_sessions",
  "study_goals",
  "books",
  "book_notes",
  "memories",
  "memory_media",
  "trips",
  "trip_days",
  "trip_places",
  "trip_checklist",
] as const;

type Deletable = (typeof DELETABLE)[number];

function clean(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : null;
}

function score(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  if (!text) return null;
  const number = Number(text);
  if (!Number.isInteger(number) || number < 1 || number > 10) {
    return { error: "Puan 1 ile 10 arasında olsun." as const };
  }
  return number;
}

function refresh(paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

export async function deleteOwned(table: Deletable, id: string) {
  if (!DELETABLE.includes(table) || !id) {
    return { error: "Kayıt bulunamadı." };
  }
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from(table).delete().eq("id", id).eq("couple_id", context.coupleId);
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/birlikte", "/anilar", "/geziler"]);
  return { ok: true as const };
}

export async function saveGame(values: {
  title: string;
  platform: string;
  status: string;
  score: string;
  playMinutes: string;
  notes: string;
}) {
  const title = clean(values.title);
  if (!title) return { error: "Oyun adı yaz." };
  const parsedScore = score(values.score);
  if (typeof parsedScore === "object" && parsedScore) return parsedScore;
  const minutes = clean(values.playMinutes);
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("games").insert({
    couple_id: context.coupleId,
    title,
    platform: clean(values.platform),
    status: values.status === "playing" || values.status === "finished" ? values.status : "wishlist",
    score: parsedScore,
    play_minutes: minutes ? Number(minutes) : null,
    notes: clean(values.notes),
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/birlikte/oyunlar"]);
  return { ok: true as const };
}

export async function saveDuo(values: {
  gameId: string;
  kind: string;
  heroA: string;
  laneA: string;
  heroB: string;
  laneB: string;
}) {
  if (!clean(values.heroA) && !clean(values.heroB)) return { error: "En az bir kahraman yaz." };
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("game_duos").insert({
    couple_id: context.coupleId,
    game_id: values.gameId || null,
    kind: clean(values.kind),
    player_a_label: "Şeyda",
    hero_a: clean(values.heroA),
    lane_a: clean(values.laneA),
    player_b_label: "Fatih",
    hero_b: clean(values.heroB),
    lane_b: clean(values.laneB),
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/birlikte/oyunlar"]);
  return { ok: true as const };
}

export async function saveWatch(values: {
  title: string;
  mediaType: string;
  status: string;
  releaseYear: string;
  runtimeLabel: string;
  studio: string;
  seasonNumber: string;
  episodeNumber: string;
  scoreA: string;
  scoreB: string;
  comment: string;
  notes: string;
}) {
  const title = clean(values.title);
  if (!title) return { error: "Yapım adı yaz." };
  const scoreA = score(values.scoreA);
  const scoreB = score(values.scoreB);
  if (typeof scoreA === "object" && scoreA) return scoreA;
  if (typeof scoreB === "object" && scoreB) return scoreB;
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const status = values.status === "watching" || values.status === "watched" ? values.status : "planned";
  const { error } = await context.supabase.from("watch_items").insert({
    couple_id: context.coupleId,
    title,
    media_type: values.mediaType === "series" ? "series" : "film",
    status,
    release_year: clean(values.releaseYear) ? Number(values.releaseYear) : null,
    runtime_label: clean(values.runtimeLabel),
    studio: clean(values.studio),
    season_number: clean(values.seasonNumber) ? Number(values.seasonNumber) : null,
    episode_number: clean(values.episodeNumber) ? Number(values.episodeNumber) : null,
    score_a: scoreA,
    score_b: scoreB,
    comment: clean(values.comment),
    notes: clean(values.notes),
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/birlikte/izleme"]);
  return { ok: true as const };
}

export async function setWatchStatus(id: string, status: "planned" | "watching" | "watched") {
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("watch_items").update({ status }).eq("id", id).eq("couple_id", context.coupleId);
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/birlikte/izleme"]);
  return { ok: true as const };
}

export async function saveStudySession(values: { topic: string; durationMinutes: string; studiedOn: string; notes: string }) {
  const topic = clean(values.topic);
  const minutes = Number(values.durationMinutes);
  if (!topic || !Number.isFinite(minutes) || minutes <= 0) return { error: "Konu ve süreyi yaz." };
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("study_sessions").insert({
    couple_id: context.coupleId,
    topic,
    duration_minutes: minutes,
    studied_on: values.studiedOn || new Date().toISOString().slice(0, 10),
    notes: clean(values.notes),
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/birlikte/calisma"]);
  return { ok: true as const };
}

export async function saveStudyGoal(values: { title: string; targetCount: string }) {
  const title = clean(values.title);
  const target = Number(values.targetCount);
  if (!title || !Number.isFinite(target) || target <= 0) return { error: "Hedef adı ve adet yaz." };
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("study_goals").insert({
    couple_id: context.coupleId,
    title,
    target_count: target,
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/birlikte/calisma"]);
  return { ok: true as const };
}

export async function bumpStudyGoal(id: string, nextCount: number) {
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase
    .from("study_goals")
    .update({ completed_count: Math.max(0, nextCount) })
    .eq("id", id)
    .eq("couple_id", context.coupleId);
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/birlikte/calisma"]);
  return { ok: true as const };
}

export async function saveBook(values: {
  title: string;
  author: string;
  status: string;
  pagesRead: string;
  pageCount: string;
  scoreA: string;
  scoreB: string;
  notes: string;
}) {
  const title = clean(values.title);
  if (!title) return { error: "Kitap adı yaz." };
  const scoreA = score(values.scoreA);
  const scoreB = score(values.scoreB);
  if (typeof scoreA === "object" && scoreA) return scoreA;
  if (typeof scoreB === "object" && scoreB) return scoreB;
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("books").insert({
    couple_id: context.coupleId,
    title,
    author: clean(values.author),
    status: values.status === "reading" || values.status === "finished" ? values.status : "planned",
    pages_read: Number(values.pagesRead) || 0,
    page_count: clean(values.pageCount) ? Number(values.pageCount) : null,
    score_a: scoreA,
    score_b: scoreB,
    notes: clean(values.notes),
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/birlikte/kitaplar"]);
  return { ok: true as const };
}

export async function saveBookNote(values: { bookId: string; quote: string; note: string }) {
  if (!values.bookId || (!clean(values.quote) && !clean(values.note))) return { error: "Alıntı veya not yaz." };
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const content = [clean(values.quote), clean(values.note)].filter(Boolean).join("\n");
  const { data, error } = await context.supabase
    .from("book_notes")
    .insert({
      couple_id: context.coupleId,
      book_id: values.bookId,
      quote: clean(values.quote),
      note: clean(values.note),
      created_by: context.user.id,
    })
    .select("id")
    .single();
  if (error) return { error: toUserMessage(error.message) };
  await embedText({
    supabase: context.supabase,
    coupleId: context.coupleId,
    userId: context.user.id,
    module: "books",
    sourceType: "book_note",
    sourceId: data.id,
    content,
  });
  refresh(["/birlikte/kitaplar"]);
  return { ok: true as const };
}

export async function saveMemory(values: { title: string; happenedOn: string; body: string; tags: string; mood: string }) {
  const title = clean(values.title);
  if (!title) return { error: "Anı başlığı yaz." };
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const tags = (values.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
  const { data, error } = await context.supabase
    .from("memories")
    .insert({
      couple_id: context.coupleId,
      title,
      happened_on: values.happenedOn || new Date().toISOString().slice(0, 10),
      body: clean(values.body),
      tags,
      mood: clean(values.mood),
      created_by: context.user.id,
    })
    .select("id")
    .single();
  if (error) return { error: toUserMessage(error.message) };
  await embedText({
    supabase: context.supabase,
    coupleId: context.coupleId,
    userId: context.user.id,
    module: "memories",
    sourceType: "memory",
    sourceId: data.id,
    content: `${title}\n${clean(values.body) ?? ""}`,
  });
  refresh(["/anilar", "/"]);
  return { ok: true as const };
}

export async function attachMemoryPhoto(memoryId: string, storagePath: string) {
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("memory_media").insert({
    couple_id: context.coupleId,
    memory_id: memoryId,
    storage_path: storagePath,
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/anilar"]);
  return { ok: true as const };
}

export async function saveTrip(values: { title: string; place: string; startsOn: string; endsOn: string; budget: string; notes: string }) {
  const title = clean(values.title);
  if (!title) return { error: "Gezi adı yaz." };
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("trips").insert({
    couple_id: context.coupleId,
    title,
    place: clean(values.place),
    starts_on: clean(values.startsOn),
    ends_on: clean(values.endsOn),
    budget_amount: clean(values.budget) ? Number(values.budget) : null,
    notes: clean(values.notes),
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/geziler"]);
  return { ok: true as const };
}

export async function saveTripDay(values: { tripId: string; dayDate: string; plan: string }) {
  if (!values.tripId || !clean(values.plan)) return { error: "Günün planını yaz." };
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("trip_days").insert({
    couple_id: context.coupleId,
    trip_id: values.tripId,
    day_date: clean(values.dayDate),
    plan: values.plan.trim(),
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/geziler"]);
  return { ok: true as const };
}

export async function saveTripPlace(values: { tripId: string; name: string; latitude: string; longitude: string; notes: string }) {
  if (!values.tripId || !clean(values.name)) return { error: "Yer adı yaz." };
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("trip_places").insert({
    couple_id: context.coupleId,
    trip_id: values.tripId,
    name: values.name.trim(),
    latitude: clean(values.latitude) ? Number(values.latitude) : null,
    longitude: clean(values.longitude) ? Number(values.longitude) : null,
    notes: clean(values.notes),
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/geziler"]);
  return { ok: true as const };
}

export async function saveChecklistItem(values: { tripId: string; label: string; kind: string }) {
  if (!values.tripId || !clean(values.label)) return { error: "Madde yaz." };
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("trip_checklist").insert({
    couple_id: context.coupleId,
    trip_id: values.tripId,
    label: values.label.trim(),
    kind: values.kind === "packing" ? "packing" : "todo",
    created_by: context.user.id,
  });
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/geziler"]);
  return { ok: true as const };
}

export async function toggleChecklist(id: string, done: boolean) {
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("trip_checklist").update({ done }).eq("id", id).eq("couple_id", context.coupleId);
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/geziler"]);
  return { ok: true as const };
}

export async function saveLocation(values: { latitude: number | null; longitude: number | null; sharingEnabled: boolean }) {
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("locations").upsert(
    {
      couple_id: context.coupleId,
      user_id: context.user.id,
      latitude: values.latitude,
      longitude: values.longitude,
      sharing_enabled: values.sharingEnabled,
      created_by: context.user.id,
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: toUserMessage(error.message) };
  return { ok: true as const };
}

export async function setSharingModule(module: string, enabled: boolean) {
  const allowed = ["profile", "games", "watch", "study", "books", "memories", "trips"];
  if (!allowed.includes(module)) return { error: "Bu modül paylaşılamaz." };
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { error } = await context.supabase.from("ai_sharing_settings").upsert(
    {
      couple_id: context.coupleId,
      module,
      enabled,
      created_by: context.user.id,
    },
    { onConflict: "couple_id,module" },
  );
  if (error) return { error: toUserMessage(error.message) };
  refresh(["/asistan"]);
  return { ok: true as const };
}

export async function importStarterLists() {
  const context = await requireMembership();
  if (!context.ok) return { error: context.error };
  const { data: existingGames } = await context.supabase.from("games").select("id").eq("title", "Mobile Legends").limit(1);
  if (!existingGames?.length) {
    const { data: game, error } = await context.supabase
      .from("games")
      .insert({
        couple_id: context.coupleId,
        title: "Mobile Legends",
        platform: "Mobil",
        status: "playing",
        notes: "Excel'deki ikili kahraman listesi.",
        created_by: context.user.id,
      })
      .select("id")
      .single();
    if (error || !game) return { error: error ? toUserMessage(error.message) : "Oyun eklenemedi." };
    const duos = mlbbDuos.map((row) => ({
      couple_id: context.coupleId,
      game_id: game.id,
      kind: row.kind,
      player_a_label: "Şeyda",
      hero_a: row.heroA,
      lane_a: row.laneA,
      player_b_label: "Fatih",
      hero_b: row.heroB,
      lane_b: row.laneB,
      created_by: context.user.id,
    }));
    const { error: duoError } = await context.supabase.from("game_duos").insert(duos);
    if (duoError) return { error: toUserMessage(duoError.message) };
  }

  const { count } = await context.supabase.from("watch_items").select("id", { count: "exact", head: true });
  if (!count) {
    const items = marvelWatch.map((row) => ({
      couple_id: context.coupleId,
      title: row.title,
      media_type: row.typeLabel.toLocaleLowerCase("tr").includes("dizi") ? "series" : "film",
      status: row.watched ? "watched" : "planned",
      release_year: Number(row.year) || null,
      runtime_label: row.runtime || null,
      studio: row.studio && row.studio !== "-" ? row.studio : null,
      notes: row.notes && row.notes !== "-" ? row.notes : null,
      created_by: context.user.id,
    }));
    for (let index = 0; index < items.length; index += 50) {
      const { error } = await context.supabase.from("watch_items").insert(items.slice(index, index + 50));
      if (error) return { error: toUserMessage(error.message) };
    }
  }

  refresh(["/birlikte", "/birlikte/oyunlar", "/birlikte/izleme"]);
  return { ok: true as const };
}
