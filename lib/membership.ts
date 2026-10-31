import { toUserMessage } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

export async function requireMembership() {
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
