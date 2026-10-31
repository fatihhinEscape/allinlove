import { notFound } from "next/navigation";
import { TripEditor } from "@/components/modules/trip-editor";
import { StatusCard } from "@/components/status-card";
import { requireMembership } from "@/lib/membership";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireMembership();
  if (!context.ok) return <StatusCard title="Henüz hazır değil" description={context.error} />;

  const { data: trip } = await context.supabase
    .from("trips")
    .select("id, title, place, notes, budget_amount")
    .eq("id", id)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!trip) notFound();

  const [{ data: days }, { data: places }, { data: checklist }] = await Promise.all([
    context.supabase.from("trip_days").select("id, day_date, plan").eq("trip_id", id).order("day_date"),
    context.supabase.from("trip_places").select("id, name, latitude, longitude, notes").eq("trip_id", id),
    context.supabase.from("trip_checklist").select("id, label, done, kind").eq("trip_id", id),
  ]);

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="font-heading text-3xl">{trip.title}</h1>
        <p className="text-sm text-muted-foreground">
          {trip.place ?? "Yer seçilmedi"}
          {trip.budget_amount ? ` · ${trip.budget_amount} TL` : ""}
        </p>
        {trip.notes ? <p className="mt-2 text-sm">{trip.notes}</p> : null}
      </div>
      <TripEditor tripId={trip.id} days={days ?? []} places={places ?? []} checklist={checklist ?? []} />
    </div>
  );
}
