"use server";

import { revalidatePath } from "next/cache";
import { toUserMessage } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import {
  coupleSettingsSchema,
  importantDateSchema,
  partnerDetailsSchema,
  type CoupleSettingsValues,
  type ImportantDateValues,
  type PartnerDetailsValues,
} from "@/lib/validations/profile";

async function requireMembership() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Giriş gerekli." };
  }

  const { data: membership, error } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: toUserMessage(error.message) };
  }

  if (!membership) {
    return { ok: false as const, error: "Önce bir çifte katıl." };
  }

  return { ok: true as const, supabase, user, coupleId: membership.couple_id as string };
}

export async function updateCoupleSettings(values: CoupleSettingsValues) {
  const parsed = coupleSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formu kontrol et." };
  }

  const context = await requireMembership();
  if (!context.ok) {
    return { error: context.error };
  }

  const { error } = await context.supabase
    .from("couples")
    .update({
      name: parsed.data.name,
      relationship_start: parsed.data.startDate,
    })
    .eq("id", context.coupleId);

  if (error) {
    return { error: toUserMessage(error.message) };
  }

  revalidatePath("/");
  revalidatePath("/profil");
  return { ok: true as const };
}

export async function updateMyDetails(values: PartnerDetailsValues) {
  const parsed = partnerDetailsSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formu kontrol et." };
  }

  const context = await requireMembership();
  if (!context.ok) {
    return { error: context.error };
  }

  const { error: profileError } = await context.supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", context.user.id);

  if (profileError) {
    return { error: toUserMessage(profileError.message) };
  }

  const details = {
    couple_id: context.coupleId,
    user_id: context.user.id,
    nickname: parsed.data.nickname,
    birthday: parsed.data.birthday,
    favorite_food: parsed.data.favoriteFood,
    favorite_drink: parsed.data.favoriteDrink,
    favorite_color: parsed.data.favoriteColor,
    favorite_music: parsed.data.favoriteMusic,
    love_language: parsed.data.loveLanguage,
    dislikes: parsed.data.dislikes,
    notes: parsed.data.notes,
    created_by: context.user.id,
  };

  const { error } = await context.supabase.from("partner_details").upsert(details, { onConflict: "user_id" });
  if (error) {
    return { error: toUserMessage(error.message) };
  }

  revalidatePath("/");
  revalidatePath("/profil");
  return { ok: true as const };
}

export async function addImportantDate(values: ImportantDateValues) {
  const parsed = importantDateSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formu kontrol et." };
  }

  const context = await requireMembership();
  if (!context.ok) {
    return { error: context.error };
  }

  const { error } = await context.supabase.from("important_dates").insert({
    couple_id: context.coupleId,
    title: parsed.data.title,
    occurs_on: parsed.data.occursOn,
    kind: parsed.data.kind,
    notes: parsed.data.notes,
    created_by: context.user.id,
  });

  if (error) {
    return { error: toUserMessage(error.message) };
  }

  revalidatePath("/");
  revalidatePath("/profil");
  return { ok: true as const };
}

export async function deleteImportantDate(id: string) {
  if (!id) {
    return { error: "Kayıt bulunamadı." };
  }

  const context = await requireMembership();
  if (!context.ok) {
    return { error: context.error };
  }

  const { error } = await context.supabase.from("important_dates").delete().eq("id", id).eq("couple_id", context.coupleId);
  if (error) {
    return { error: toUserMessage(error.message) };
  }

  revalidatePath("/");
  revalidatePath("/profil");
  return { ok: true as const };
}
