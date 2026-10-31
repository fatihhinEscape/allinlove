"use server";

import { redirect } from "next/navigation";
import { safeInviteCode } from "@/lib/invite";
import { toUserMessage } from "@/lib/messages";
import { getOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations/auth";

function invitePath(inviteCode?: string) {
  const code = inviteCode ? safeInviteCode(inviteCode) : null;
  return code ? `/davet/${code}` : null;
}

export async function signIn(values: LoginInput, inviteCode?: string) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formu kontrol et." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: toUserMessage(error.message) };
  }

  redirect(invitePath(inviteCode) ?? "/");
}

export async function signUp(values: RegisterInput, inviteCode?: string) {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formu kontrol et." };
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { display_name: parsed.data.displayName },
    },
  });

  if (error) {
    return { error: toUserMessage(error.message) };
  }

  if (!data.session) {
    return { message: "Hesabın oluştu. E-postandaki bağlantıyı aç, sonra giriş yap." };
  }

  redirect(invitePath(inviteCode) ?? "/cift");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}
