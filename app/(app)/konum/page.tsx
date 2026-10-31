import Link from "next/link";
import { LocationPanel } from "@/components/location/location-panel";
import { StatusCard } from "@/components/status-card";
import { requireMembership } from "@/lib/membership";

export default async function LocationPage() {
  const context = await requireMembership();
  if (!context.ok) return <StatusCard title="Henüz hazır değil" description={context.error} />;

  const [{ data: locations, error }, { data: profiles }] = await Promise.all([
    context.supabase.from("locations").select("user_id, latitude, longitude, sharing_enabled, updated_at").eq("couple_id", context.coupleId),
    context.supabase.from("profiles").select("id, display_name").eq("couple_id", context.coupleId),
  ]);

  if (error) return <StatusCard title="Henüz hazır değil" description="Konum tablosu yok. Son SQL betiğini çalıştır." />;

  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const initial = (locations ?? []).map((row) => ({
    ...row,
    label: row.user_id === context.user.id ? "Sen" : names.get(row.user_id) ?? "Partner",
  }));

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-3xl">Konum</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İsteğe bağlıdır. <Link href="/profil" className="text-primary">Profile dön</Link>
        </p>
      </div>
      <LocationPanel coupleId={context.coupleId} userId={context.user.id} initial={initial} />
    </div>
  );
}
