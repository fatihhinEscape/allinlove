import { NextResponse } from "next/server";
import { requireMembership } from "@/lib/membership";
import { buildCoupleContext, ensureSharingSettings } from "@/lib/openai/context";
import { COUNSELOR_PROMPT } from "@/lib/openai/prompt";

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

export async function POST(request: Request) {
  const context = await requireMembership();
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as { force?: unknown };
  const force = payload.force === true;
  await ensureSharingSettings(context.supabase, context.coupleId, context.user.id);
  const periodKey = todayKey();
  const { data: existing } = await context.supabase
    .from("ai_suggestions")
    .select("body")
    .eq("couple_id", context.coupleId)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (existing?.body && !force) {
    return NextResponse.json({ body: existing.body });
  }

  const { brief, fallback } = await buildCoupleContext(context.supabase, context.coupleId);
  let body = fallback;
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: COUNSELOR_PROMPT },
          {
            role: "user",
            content: `Bugünün kartını yaz. Yalnızca şu kayıttaki adları kullan. Kayıtta yoksa o maddeyi yazma.\n1) İzlenecek sıradaki yapım\n2) Denenecek bir oyun ikilisi\n3) Tarihe veya birlikte olunan güne bağlı kısa bir fikir\nEn fazla 5 kısa satır.\n\n${brief}`,
          },
        ],
      }),
    });
    if (completion.ok) {
      const result = (await completion.json()) as { choices?: Array<{ message?: { content?: string } }> };
      body = result.choices?.[0]?.message?.content?.trim() || fallback;
    }
  }

  await context.supabase.from("ai_suggestions").upsert(
    {
      couple_id: context.coupleId,
      period_key: periodKey,
      body,
      created_by: context.user.id,
    },
    { onConflict: "couple_id,period_key" },
  );

  return NextResponse.json({ body });
}
