import { redirect } from "next/navigation";
import { CoupleSetup } from "@/components/couple/couple-setup";
import { StatusCard } from "@/components/status-card";
import { toUserMessage } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

export default async function CouplePage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: membership, error } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return <StatusCard title="Henüz hazır değil" description={toUserMessage(error.message)} />;
  }

  if (membership) {
    redirect("/");
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-3xl">Çiftini kur</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bir çiftte en fazla iki kişi olur.</p>
      </div>
      <CoupleSetup initialError={params.hata} />
    </div>
  );
}
