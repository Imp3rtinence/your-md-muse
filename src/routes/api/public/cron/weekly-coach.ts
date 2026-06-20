import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

/**
 * Wöchentlicher KI-Coach: erstellt für jede aktive Person einen kurzen Rückblick + Vorschlag.
 * Cron: Sonntag 18:00.
 */
export const Route = createFileRoute("/api/public/cron/weekly-coach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apikey || !expected || apikey !== expected) return new Response("Unauthorized", { status: 401 });

        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!lovableKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        // Aktive User: alle Profile mit Submission in den letzten 7 Tagen, oder mit aura_event
        const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
        const { data: events } = await supabase
          .from("aura_events")
          .select("user_id, amount")
          .gte("created_at", weekAgo);

        const byUser = new Map<string, { aura: number; events: number }>();
        for (const e of events ?? []) {
          const cur = byUser.get(e.user_id) ?? { aura: 0, events: 0 };
          cur.aura += (e as any).amount ?? 0;
          cur.events += 1;
          byUser.set(e.user_id, cur);
        }
        if (byUser.size === 0) return Response.json({ recaps: 0 });

        const userIds = [...byUser.keys()];
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, username, league_tier, is_ai_bot, interests")
          .in("id", userIds);

        const realUsers = (profs ?? []).filter((p: any) => !p.is_ai_bot);
        const gateway = createLovableAiGatewayProvider(lovableKey);

        const weekStart = new Date();
        weekStart.setUTCHours(0, 0, 0, 0);
        weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay()); // letzten Sonntag

        let count = 0;
        for (const p of realUsers as any[]) {
          const stats = byUser.get(p.id)!;
          try {
            const { output } = await generateText({
              model: gateway("google/gemini-3-flash-preview"),
              output: Output.object({
                schema: z.object({
                  summary: z.string(),
                  suggestion: z.string(),
                }),
              }),
              prompt: `Du bist der Komma-Coach. Schreibe einen kurzen Wochenrückblick für @${p.username}.
Stats diese Woche: ${stats.events} Aktionen, +${stats.aura} Aura, Liga-Tier ${p.league_tier ?? 1}.
Interessen: ${(p.interests ?? []).join(", ") || "(unbekannt)"}.

- summary: 1-2 motivierende Sätze, du-Form, jugendlich, ohne Floskeln
- suggestion: 1 konkrete Idee für nächste Woche (1 kurzer Satz)`,
            });

            await supabase.from("weekly_recaps").upsert({
              user_id: p.id,
              week_start: weekStart.toISOString().slice(0, 10),
              summary: output.summary,
              suggestion: output.suggestion,
              stats: { aura: stats.aura, events: stats.events, league_tier: p.league_tier },
            });
            count += 1;
          } catch {
            // skip einzelne Fehler
          }
        }

        return Response.json({ recaps: count });
      },
    },
  },
});
