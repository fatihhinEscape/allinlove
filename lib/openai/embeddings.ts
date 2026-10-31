import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function embedText(input: {
  supabase: SupabaseClient;
  coupleId: string;
  userId: string;
  module: string;
  sourceType: string;
  sourceId: string;
  content: string;
}) {
  const key = process.env.OPENAI_API_KEY;
  const text = input.content.trim();
  if (!key || text.length < 8) return;

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000),
      }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { data?: Array<{ embedding: number[] }> };
    const embedding = payload.data?.[0]?.embedding;
    if (!embedding) return;
    await input.supabase.from("embeddings").delete().eq("source_id", input.sourceId).eq("couple_id", input.coupleId);
    await input.supabase.from("embeddings").insert({
      couple_id: input.coupleId,
      module: input.module,
      source_type: input.sourceType,
      source_id: input.sourceId,
      content: text.slice(0, 2000),
      embedding,
      created_by: input.userId,
    });
  } catch {
    // Saving the note still succeeds when the embedding service is unavailable.
  }
}
