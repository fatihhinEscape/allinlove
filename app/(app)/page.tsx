import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { InvitePanel } from "@/components/home/invite-panel";
import { PersonCard } from "@/components/profile/person-card";
import { StatusCard } from "@/components/status-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCoupleContext } from "@/lib/couple";
import { daysSince, daysUntil, formatTurkishDate, nextOccurrence, togetherLabel, untilLabel } from "@/lib/dates";
import { getOrigin } from "@/lib/origin";
import { dateKindLabel } from "@/components/profile/person-card";

export default async function HomePage() {
  const context = await getCoupleContext();
  if (context.error !== null) {
    return <StatusCard title="Henüz hazır değil" description={context.error} />;
  }

  const { couple, me, partner, myDetails, partnerDetails, dates } = context;
  const days = couple.relationship_start ? daysSince(couple.relationship_start) : null;
  const anniversary = couple.relationship_start ? nextOccurrence(couple.relationship_start) : null;
  const origin = await getOrigin();

  const upcoming = [
    anniversary
      ? {
          id: "anniversary",
          title: "Yıl dönümü",
          kind: "anniversary",
          next: anniversary,
        }
      : null,
    ...dates.map((item) => {
      const next = nextOccurrence(item.occurs_on);
      return next ? { id: item.id, title: item.title, kind: item.kind, next } : null;
    }),
  ]
    .filter((item): item is { id: string; title: string; kind: string; next: Date } => Boolean(item))
    .sort((left, right) => left.next.getTime() - right.next.getTime())
    .slice(0, 4);

  const myName = myDetails?.nickname || me?.display_name;
  const partnerName = partnerDetails?.nickname || partner?.display_name;

  return (
    <div className="grid gap-4">
      <AppNav current="/" />
      <div>
        <p className="text-sm text-muted-foreground">Merhaba{myName ? `, ${myName}` : ""}</p>
        <h1 className="font-heading text-4xl">{couple.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {partnerName ? `${partnerName} burada.` : "Partnerin henüz katılmadı."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Birlikte</CardTitle>
          <CardDescription>
            {couple.relationship_start
              ? `${formatTurkishDate(couple.relationship_start)} tarihinden beri`
              : "İlişki tarihi eklenince sayaç burada görünür."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {days !== null ? <p className="font-heading text-3xl">{togetherLabel(days)}</p> : null}
          {anniversary ? (
            <p className="text-sm text-muted-foreground">
              Sonraki yıl dönümü {untilLabel(daysUntil(anniversary)).toLocaleLowerCase()}.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yaklaşan günler</CardTitle>
          <CardDescription>Yıl dönümü ve eklediğiniz tarihler.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tarih ekleyince burada sıralanır.</p>
          ) : (
            <ul className="grid gap-2">
              {upcoming.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span>
                    {item.title}
                    <span className="text-muted-foreground"> · {dateKindLabel(item.kind)}</span>
                  </span>
                  <span className="text-muted-foreground">{untilLabel(daysUntil(item.next))}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <PersonCard title="Sen" empty="Profilin hazır değil." person={me} details={myDetails} />
        <PersonCard
          title="Partnerin"
          empty="Partnerin katılınca bilgileri burada görünür."
          person={partner}
          details={partnerDetails}
        />
      </div>

      {partner ? null : couple.invite_code ? (
        <Card>
          <CardHeader>
            <CardTitle>Davet</CardTitle>
            <CardDescription>Bu kodu partnerinle paylaş. İkinci kişi katılınca kod kapanır.</CardDescription>
          </CardHeader>
          <CardContent>
            <InvitePanel code={couple.invite_code} link={`${origin}/davet/${couple.invite_code}`} />
          </CardContent>
        </Card>
      ) : null}

      <Link href="/profil" className={buttonVariants({ className: "h-11" })}>
        Profili düzenle
      </Link>
    </div>
  );
}
