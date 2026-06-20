import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

/**
 * Tägliche KI-Challenge-Generierung.
 * Wird von pg_cron aufgerufen — sicher durch apikey-Header (Supabase Anon Key).
 * Wählt zufällige Bots, generiert passende Challenges, schreibt sie als deren Posts.
 */
export const Route = createFileRoute("/api/public/cron/generate-challenges")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Auth: nur Aufrufe mit gültigem apikey-Header akzeptieren
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || !expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!lovableKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // 2. Supabase-Admin laden (write-Zugriff für Bot-Inserts)
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        // 3. Bots aus DB lesen
        const { data: bots, error: botsError } = await supabase
          .from("profiles")
          .select("id, username, display_name, bot_persona")
          .eq("is_ai_bot", true);
        if (botsError) return new Response(botsError.message, { status: 500 });
        if (!bots || bots.length === 0) return Response.json({ created: 0, note: "no bots" });

        // 4. Trending-Interessen aus user_ai_profile (letzte 7 Tage)
        const { data: profiles } = await supabase
          .from("user_ai_profile")
          .select("top_categories")
          .gte("updated_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
          .limit(100);
        const interestPool = (profiles ?? [])
          .flatMap((p: any) => (Array.isArray(p.top_categories) ? p.top_categories : []))
          .slice(0, 30);

        // 5. KI-Aufruf — strukturierter Output
        const gateway = createLovableAiGatewayProvider(lovableKey);
        const today = new Date();
        const weekday = today.toLocaleDateString("de-DE", { weekday: "long" });

        const specialties = bots.map((b: any) => ({
          username: b.username,
          specialty: b.bot_persona?.specialty ?? "alltag",
        }));

        const { output } = await generateText({
          model: gateway("google/gemini-3-flash-preview"),
          output: Output.object({
            schema: z.object({
              challenges: z.array(z.object({
                bot_username: z.string(),
                title: z.string(),
                description: z.string(),
                category: z.enum(["creative", "active", "friendly", "skill", "learning"]),
              })).min(5).max(10),
            }),
          }),
          prompt: `Du bist der Content-Kurator für Komma, eine jugendliche App für kleine Mut-, Kreativ- und Bewegungs-Challenges (Zielgruppe 12-22).

Erzeuge heute (${weekday}) zwischen 5 und 8 neue Challenges. Jede Challenge wird von einem unserer Community-Bots gepostet — wähle bot_username passend zur Spezialität:

${specialties.map((s) => `- @${s.username} (${s.specialty})`).join("\n")}

Aktuelle Community-Interessen: ${interestPool.length ? interestPool.join(", ") : "kreativ, bewegung, natur, mut"}

Regeln:
- Titel: max 6 Wörter, knackig, deutsch, ohne Emojis
- Beschreibung: 1-2 kurze Sätze, motivierend, du-Form
- category MUSS einer dieser Werte sein: creative, active, friendly, skill, learning
- Vielfalt: nicht alle gleiche category, nicht alle gleicher Bot
- Sicher und altersgerecht (kein Alkohol, keine Gefahren)
- Klein und machbar in 1 Tag`,
        });

        // 6. Inserts vorbereiten + ausführen
        const botByName = new Map(bots.map((b: any) => [b.username, b.id as string]));
        const rows = output.challenges
          .map((c) => {
            const creator_id = botByName.get(c.bot_username);
            if (!creator_id) return null;
            return {
              creator_id,
              title: c.title.slice(0, 80),
              description: c.description.slice(0, 500),
              category: c.category,
              visibility: "public" as const,
              created_by_ai: true,
              expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);

        if (rows.length === 0) return Response.json({ created: 0 });

        const { error: insertError, data: inserted } = await supabase
          .from("challenges")
          .insert(rows)
          .select("id");

        if (insertError) return new Response(insertError.message, { status: 500 });

        // Embeddings für jede frische Challenge nachziehen (best-effort)
        const insertedIds = (inserted ?? []).map((r: any) => r.id);
        await Promise.allSettled(insertedIds.map(async (cid, i) => {
          const src = rows[i];
          const text = `${src.title} — ${src.description} — ${src.category}`;
          const er = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Lovable-API-Key": lovableKey },
            body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text }),
          });
          if (!er.ok) return;
          const ejson = await er.json();
          const vec = ejson?.data?.[0]?.embedding;
          if (!Array.isArray(vec)) return;
          await supabase.from("challenges").update({ embedding: `[${vec.join(",")}]` as any }).eq("id", cid);
        }));

        return Response.json({ created: inserted?.length ?? 0, weekday });
      },
    },
  },
});
