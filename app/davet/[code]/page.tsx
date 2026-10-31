import { redirect } from "next/navigation";
import { joinCurrentUser } from "@/lib/actions/couple";
import { safeInviteCode } from "@/lib/invite";
import { createClient } from "@/lib/supabase/server";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = safeInviteCode(rawCode);

  if (!code) {
    redirect("/cift?hata=Davet%20kodu%208%20karakter%20olmal%C4%B1.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/kayit?davet=${code}`);
  }

  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    redirect("/");
  }

  const result = await joinCurrentUser(code);
  if ("error" in result && result.error) {
    redirect(`/cift?hata=${encodeURIComponent(result.error)}`);
  }

  redirect("/");
}
