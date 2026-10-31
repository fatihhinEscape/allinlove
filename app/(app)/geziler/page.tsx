import Link from "next/link";
import { saveTrip } from "@/lib/actions/modules";
import { StatusCard } from "@/components/status-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireMembership } from "@/lib/membership";

export default async function TripsPage() {
  const context = await requireMembership();
  if (!context.ok) return <StatusCard title="Henüz hazır değil" description={context.error} />;

  const { data: trips, error } = await context.supabase
    .from("trips")
    .select("id, title, place, starts_on, ends_on, budget_amount")
    .eq("couple_id", context.coupleId)
    .order("starts_on", { ascending: false });

  if (error) return <StatusCard title="Henüz hazır değil" description="Gezi tablosu yok. Son SQL betiğini çalıştır." />;

  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl">Geziler</h1>
      {(trips ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Henüz gezi yok.</p> : null}
      <ul className="grid gap-2">
        {(trips ?? []).map((trip) => (
          <li key={trip.id}>
            <Link href={`/geziler/${trip.id}`} className="block rounded-xl border border-border bg-card px-4 py-3">
              <p className="font-medium">{trip.title}</p>
              <p className="text-sm text-muted-foreground">
                {trip.place ?? "Yer yok"}
                {trip.starts_on ? ` · ${trip.starts_on}` : ""}
                {trip.budget_amount ? ` · ${trip.budget_amount} TL` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <form action={createTrip} className="grid gap-2">
        <Input name="title" placeholder="Gezi adı" className="h-11" required />
        <Input name="place" placeholder="Yer" className="h-11" />
        <div className="grid grid-cols-2 gap-2">
          <Input name="startsOn" type="date" className="h-11" />
          <Input name="endsOn" type="date" className="h-11" />
        </div>
        <Input name="budget" placeholder="Bütçe (TL)" className="h-11" />
        <Textarea name="notes" placeholder="Not" />
        <Button type="submit" className="h-11">Gezi oluştur</Button>
      </form>
    </div>
  );
}

async function createTrip(formData: FormData) {
  "use server";
  await saveTrip({
    title: String(formData.get("title") ?? ""),
    place: String(formData.get("place") ?? ""),
    startsOn: String(formData.get("startsOn") ?? ""),
    endsOn: String(formData.get("endsOn") ?? ""),
    budget: String(formData.get("budget") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
}
