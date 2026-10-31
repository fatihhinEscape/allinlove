import { redirect } from "next/navigation";
import { InvitePanel } from "@/components/home/invite-panel";
import { StatusCard } from "@/components/status-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { daysSince, formatTurkishDate, togetherLabel } from "@/lib/dates";
import { toUserMessage } from "@/lib/messages";
import { getOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
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

  if (!membership) {
    redirect("/cift");
  }

  const { data: couple, error: coupleError } = await supabase
    .from("couples")
    .select("id, name, invite_code, relationship_start")
    .eq("id", membership.couple_id)
    .maybeSingle();

  if (coupleError || !couple) {
    return (
      <StatusCard
        title="Çift bulunamadı"
        description={coupleError ? toUserMessage(coupleError.message) : "Çift kaydı okunamadı."}
      />
    );
  }

  const { data: people } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("couple_id", couple.id);

  const members = people ?? [];
  const me = members.find((person) => person.id === user.id);
  const partner = members.find((person) => person.id !== user.id);
  const days = couple.relationship_start ? daysSince(couple.relationship_start) : null;
  const origin = await getOrigin();

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Merhaba{me ? `, ${me.display_name}` : ""}</p>
        <h1 className="font-heading text-4xl">{couple.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Birlikte</CardTitle>
          <CardDescription>
            {partner ? `${partner.display_name} burada.` : "Partnerin henüz katılmadı."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1">
          {days !== null && couple.relationship_start ? (
            <>
              <p className="font-heading text-3xl">{togetherLabel(days)}</p>
              <p className="text-sm text-muted-foreground">{formatTurkishDate(couple.relationship_start)} tarihinden beri</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">İlişki tarihi eklenince sayaç burada görünecek.</p>
          )}
        </CardContent>
      </Card>

      {members.length < 2 && couple.invite_code ? (
        <Card>
          <CardHeader>
            <CardTitle>Davet</CardTitle>
            <CardDescription>Bu kodu partnerinle paylaş. İkinci kişi katılınca kod kapanır.</CardDescription>
          </CardHeader>
          <CardContent>
            <InvitePanel code={couple.invite_code} link={`${origin}/davet/${couple.invite_code}`} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>İkiniz de buradasınız</CardTitle>
            <CardDescription>Ortak listeler bir sonraki adımda eklenecek.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
