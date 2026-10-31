import { NextResponse } from "next/server";
import { requireMembership } from "@/lib/membership";
import { buildCoupleBrief, ensureSharingSettings } from "@/lib/openai/context";
import { COUNSELOR_PROMPT } from "@/lib/openai/prompt";

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

export async function POST() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OpenAI anahtarı yok." }, { status: 500 });
  }

  const context = await requireMembership();
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: 401 });
  }

  await ensureSharingSettings(context.supabase, context.coupleId, context.user.id);
  const periodKey = todayKey();
  const { data: existing } = await context.supabase
    .from("ai_suggestions")
    .select("body")
    .eq("couple_id", context.coupleId)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (existing?.body) {
    return NextResponse.json({ body: existing.body });
  }

  const brief = await buildCoupleBrief(context.supabase, context.coupleId);
  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: COUNSELOR_PROMPT },
        {
          role: "user",
          content: `Bugün için tek bir öneri kartı yaz. En fazla 5 kısa madde. Kayıt:\n${brief || "Henüz kayıt yok. Genel bir ev etkinliği önerme, kayıt olmadığını söyle."}`,
        },
      ],
    }),
  });

  if (!completion.ok) {
    return NextResponse.json({ error: "Öneri hazırlanamadı." }, { status: 502 });
  }

  const payload = (await completion.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const body = payload.choices?.[0]?.message?.content?.trim();
  if (!body) {
    return NextResponse.json({ error: "Öneri boş geldi." }, { status: 502 });
  }

  await context.supabase.from("ai_suggestions").insert({
    couple_id: context.coupleId,
    period_key: periodKey,
    body,
    created_by: context.user.id,
  });

  return NextResponse.json({ body });
}
