import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Erzeugt einen 1536-dim Vektor via Lovable AI Gateway (OpenAI-compatible /embeddings).
 * Server-only.
 */
async function embedText(text: string): Promise<number[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });
  if (!resp.ok) throw new Error(`Embedding failed: ${resp.status} ${await resp.text()}`);
  const json = await resp.json();
  const vec = json?.data?.[0]?.embedding;
  if (!Array.isArray(vec)) throw new Error("No embedding returned");
  return vec;
}

const toVectorLiteral = (v: number[]) => `[${v.join(",")}]`;

/** Embedding für eine Challenge berechnen + speichern. */
export const embedChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { challenge_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: ch } = await (context.supabase as any)
      .from("challenges")
      .select("title, description, tags, category")
      .eq("id", data.challenge_id)
      .single();
    if (!ch) return { ok: false };

    const text = [ch.title, ch.description, ch.category, ...(ch.tags ?? [])].filter(Boolean).join(" — ");
    const vec = await embedText(text);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("challenges")
      .update({ embedding: toVectorLiteral(vec) as any })
      .eq("id", data.challenge_id);
    return { ok: true };
  });

/** Embedding für eine Crew. */
export const embedCrew = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { crew_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: g } = await (context.supabase as any)
      .from("groups")
      .select("name, description, kind")
      .eq("id", data.crew_id)
      .single();
    if (!g) return { ok: false };
    const text = [g.name, g.description, g.kind].filter(Boolean).join(" — ");
    const vec = await embedText(text);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("groups").update({ embedding: toVectorLiteral(vec) as any }).eq("id", data.crew_id);
    return { ok: true };
  });

/** Embedding für eigenes User-Profil (auf Basis Onboarding-Profil) berechnen. */
export const embedMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: p } = await (context.supabase as any)
      .from("user_ai_profile")
      .select("summary, traits, top_categories")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!p) return { ok: false };
    const traits = p.traits ?? {};
    const text = [
      p.summary,
      Array.isArray(traits.interests) ? traits.interests.join(", ") : "",
      typeof traits.context === "string" ? traits.context : "",
      Array.isArray(p.top_categories) ? p.top_categories.join(", ") : "",
    ].filter(Boolean).join(" — ");
    if (!text) return { ok: false };
    const vec = await embedText(text);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_ai_profile")
      .update({ interest_embedding: toVectorLiteral(vec) as any })
      .eq("user_id", context.userId);
    return { ok: true };
  });

/** Semantische Suche: nutzt eine freie Query. */
export const searchChallenges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { query: string }) => d)
  .handler(async ({ data, context }) => {
    if (!data.query.trim()) return [];
    const vec = await embedText(data.query);
    const { data: rows, error } = await (context.supabase as any)
      .rpc("match_challenges", { query_embedding: toVectorLiteral(vec), match_count: 12 });
    if (error) throw error;
    return rows ?? [];
  });

/** Ähnliche Challenges zu einer gegebenen ID. */
export const similarChallenges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { challenge_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: ch } = await (context.supabase as any)
      .from("challenges").select("embedding").eq("id", data.challenge_id).single();
    if (!ch?.embedding) return [];
    const { data: rows, error } = await (context.supabase as any)
      .rpc("match_challenges", { query_embedding: ch.embedding, match_count: 5, exclude_id: data.challenge_id });
    if (error) throw error;
    return rows ?? [];
  });

/** Crew-Empfehlungen für mich. */
export const recommendCrews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: p } = await (context.supabase as any)
      .from("user_ai_profile")
      .select("interest_embedding")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!p?.interest_embedding) return [];
    const { data: rows, error } = await (context.supabase as any)
      .rpc("match_crews", { query_embedding: p.interest_embedding, match_count: 5 });
    if (error) throw error;
    return rows ?? [];
  });
