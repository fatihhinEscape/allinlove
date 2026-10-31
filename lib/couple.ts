import { redirect } from "next/navigation";
import { toUserMessage } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import type { CoupleRow, ImportantDateRow, PartnerDetailsRow, ProfileRow } from "@/types/couple";
import type { User } from "@supabase/supabase-js";

type CoupleContext =
  | { user: User; error: string }
  | {
      user: User;
      error: null;
      couple: CoupleRow;
      members: ProfileRow[];
      me: ProfileRow | null;
      partner: ProfileRow | null;
      myDetails: PartnerDetailsRow | null;
      partnerDetails: PartnerDetailsRow | null;
      dates: ImportantDateRow[];
    };

export async function getCoupleContext(): Promise<CoupleContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return { user, error: toUserMessage(membershipError.message) as string };
  }

  if (!membership) {
    redirect("/cift");
  }

  const { data: couple, error: coupleError } = await supabase
    .from("couples")
    .select("id, name, invite_code, relationship_start")
    .eq("id", membership.couple_id)
    .maybeSingle();

  if (coupleError || !couple) {
    return {
      user,
      error: coupleError ? toUserMessage(coupleError.message) : "Çift kaydı okunamadı.",
    };
  }

  const [{ data: people, error: peopleError }, { data: details, error: detailsError }, { data: dates, error: datesError }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name, couple_id").eq("couple_id", couple.id),
      supabase.from("partner_details").select("*").eq("couple_id", couple.id),
      supabase.from("important_dates").select("*").eq("couple_id", couple.id).order("occurs_on", { ascending: true }),
    ]);

  if (peopleError) {
    return { user, error: toUserMessage(peopleError.message) };
  }

  if (detailsError) {
    return { user, error: toUserMessage(detailsError.message) };
  }

  if (datesError) {
    return { user, error: toUserMessage(datesError.message) };
  }

  const members = (people ?? []) as ProfileRow[];
  const me = members.find((person) => person.id === user.id) ?? null;
  const partner = members.find((person) => person.id !== user.id) ?? null;
  const myDetails = ((details ?? []) as PartnerDetailsRow[]).find((row) => row.user_id === user.id) ?? null;
  const partnerDetails =
    ((details ?? []) as PartnerDetailsRow[]).find((row) => row.user_id !== user.id) ?? null;

  return {
    user,
    couple: couple as CoupleRow,
    members,
    me,
    partner,
    myDetails,
    partnerDetails,
    dates: (dates ?? []) as ImportantDateRow[],
    error: null,
  };
}
