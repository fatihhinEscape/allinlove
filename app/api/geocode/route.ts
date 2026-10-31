import { NextResponse } from "next/server";
import { requireMembership } from "@/lib/membership";

export async function GET(request: Request) {
  const context = await requireMembership();
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ error: "Yer adı yaz." }, { status: 400 });
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { "User-Agent": "allinlove/1.0" } },
  );
  if (!response.ok) {
    return NextResponse.json({ error: "Harita servisi yanıt vermedi." }, { status: 502 });
  }

  const results = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const first = results[0];
  if (!first?.lat || !first.lon) {
    return NextResponse.json({ error: "Bu adla yer bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ latitude: Number(first.lat), longitude: Number(first.lon) });
}
