"use server";

import { redirect } from "next/navigation";
import { toUserMessage } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import {
  createCoupleSchema,
  joinCoupleSchema,
  type CreateCoupleInput,
  type JoinCoupleInput,
} from "@/lib/validations/auth";

export async function joinCurrentUser(code: string) {
  const parsed = joinCoupleSchema.safeParse({ code });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Davet kodunu kontrol et." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Giriş gerekli." };
  }

  const { error } = await supabase.rpc("join_couple", {
    raw_invite: parsed.data.code.toUpperCase(),
  });

  if (error) {
    return { error: toUserMessage(error.message) };
  }

  return { ok: true as const };
}

export async function createCouple(values: CreateCoupleInput) {
  const parsed = createCoupleSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formu kontrol et." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_couple", {
    couple_name: parsed.data.name,
    start_date: parsed.data.startDate || null,
  });

  if (error) {
    return { error: toUserMessage(error.message) };
  }

  redirect("/");
}

export async function joinCouple(values: JoinCoupleInput) {
  const result = await joinCurrentUser(values.code);
  if ("error" in result) {
    return result;
  }

  redirect("/");
}
