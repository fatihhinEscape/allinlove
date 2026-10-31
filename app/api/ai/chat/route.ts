import { NextResponse } from "next/server";
import { requireMembership } from "@/lib/membership";
import { buildCoupleBrief, ensureSharingSettings } from "@/lib/openai/context";
import { COUNSELOR_PROMPT } from "@/lib/openai/prompt";

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OpenAI anahtarı yok." }, { status: 500 });
  }

  const context = await requireMembership();
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: 401 });
  }

  const body = (await request.json()) as { message?: unknown; conversationId?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "Mesajı kısalt." }, { status: 400 });
  }

  await ensureSharingSettings(context.supabase, context.coupleId, context.user.id);
  let conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
  if (!conversationId) {
    const { data, error } = await context.supabase
      .from("ai_conversations")
      .insert({ couple_id: context.coupleId, title: message.slice(0, 60), created_by: context.user.id })
      .select("id")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Sohbet açılamadı." }, { status: 500 });
    }
    conversationId = data.id;
  }

  await context.supabase.from("ai_messages").insert({
    couple_id: context.coupleId,
    conversation_id: conversationId,
    role: "user",
    content: message,
    created_by: context.user.id,
  });

  const { data: history } = await context.supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(12);

  const brief = await buildCoupleBrief(context.supabase, context.coupleId);
  let related = "";
  try {
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: message }),
    });
    if (embeddingResponse.ok) {
      const payload = (await embeddingResponse.json()) as { data?: Array<{ embedding: number[] }> };
      const embedding = payload.data?.[0]?.embedding;
      if (embedding) {
        const { data: matches } = await context.supabase.rpc("match_couple_embeddings", {
          query_embedding: embedding,
          match_count: 5,
        });
        if (Array.isArray(matches) && matches.length > 0) {
          related = matches.map((match: { content?: string }) => match.content).filter(Boolean).join("\n");
        }
      }
    }
  } catch {
    related = "";
  }

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.6,
      messages: [
        { role: "system", content: COUNSELOR_PROMPT },
        { role: "system", content: `Kayıtlı özet:\n${brief || "Kayıt yok."}\n\nİlgili notlar:\n${related || "Yok."}` },
        ...(history ?? []).map((item) => ({ role: item.role, content: item.content })),
      ],
    }),
  });

  if (!completion.ok) {
    return NextResponse.json({ error: "Danışman şu an yanıt veremedi." }, { status: 502 });
  }

  const payload = (await completion.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const reply = payload.choices?.[0]?.message?.content?.trim() || "Buna kayıtlı veriden bir yanıt çıkaramadım.";
  await context.supabase.from("ai_messages").insert({
    couple_id: context.coupleId,
    conversation_id: conversationId,
    role: "assistant",
    content: reply,
    created_by: context.user.id,
  });

  return NextResponse.json({ reply, conversationId });
}
