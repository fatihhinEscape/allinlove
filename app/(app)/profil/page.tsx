import Link from "next/link";
import { CoupleSettingsForm } from "@/components/profile/couple-settings-form";
import { ImportantDatesForm } from "@/components/profile/important-dates-form";
import { MyDetailsForm } from "@/components/profile/my-details-form";
import { PersonCard } from "@/components/profile/person-card";
import { StatusCard } from "@/components/status-card";
import { getCoupleContext } from "@/lib/couple";

export default async function ProfilePage() {
  const context = await getCoupleContext();
  if (context.error !== null) {
    return <StatusCard title="Henüz hazır değil" description={context.error} />;
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-3xl">Profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İkinizin bilgileri ve önemli günler burada durur.{" "}
          <Link href="/konum" className="text-primary">Konum paylaşımı</Link>
        </p>
      </div>
      <CoupleSettingsForm name={context.couple.name} startDate={context.couple.relationship_start ?? ""} />
      <MyDetailsForm displayName={context.me?.display_name ?? ""} details={context.myDetails} />
      <PersonCard
        title="Partnerin"
        empty="Partnerin katılınca bilgileri burada görünür."
        person={context.partner}
        details={context.partnerDetails}
      />
      <ImportantDatesForm dates={context.dates} />
    </div>
  );
}
