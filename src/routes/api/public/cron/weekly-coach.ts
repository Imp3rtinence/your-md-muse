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
        const provided = request.headers.get("x-cron-secret");
        const expected = process.env.CRON_SECRET;
        if (!expected || !provided || provided !== expected) return new Response("Unauthorized", { status: 401 });

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

            // G7: seltenes persönliches Badge versuchen
            if (stats.events >= 3) {
              try {
                await maybeAwardPersonalBadge(supabase, gateway, p);
              } catch {
                // optional
              }
            }
          } catch {
            // skip einzelne Fehler
          }
        }

        async function maybeAwardPersonalBadge(
          db: typeof supabase,
          gw: ReturnType<typeof createLovableAiGatewayProvider>,
          person: any,
        ) {
          const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
          // schon ein personal badge diese Woche?
          const { data: existing } = await db
            .from("badges")
            .select("slug")
            .eq("is_personal", true)
            .eq("owner_user_id", person.id)
            .gte("created_at", weekAgo);
          if ((existing ?? []).length > 0) return;

          const { data: subs } = await db
            .from("submissions")
            .select("challenge_id, challenges(category, tags, difficulty)")
            .eq("user_id", person.id)
            .gte("created_at", monthAgo);
          if (!subs || subs.length < 3) return;

          const cats = subs.map((s: any) => s.challenges?.category).filter(Boolean);
          const tags = subs.flatMap((s: any) => s.challenges?.tags ?? []);
          const diffs = subs.map((s: any) => s.challenges?.difficulty).filter(Boolean);

          const { output: b } = await generateText({
            model: gw("google/gemini-3-flash-preview"),
            output: Output.object({
              schema: z.object({
                name: z.string(),
                description: z.string(),
                icon: z.string(),
                reason: z.string(),
              }),
            }),
            prompt: `Erfinde ein persönliches Badge für @${person.username}.
Aktivität (30 Tage): ${subs.length} Beweise, Kategorien ${cats.join(", ")}, Tags ${tags.slice(0, 15).join(", ")}, Schwierigkeiten ${diffs.join(", ")}.
Interessen: ${(person.interests ?? []).join(", ")}.

- name: max 4 Wörter, deutsch, poetisch (kein Standard-Streak)
- description: 1 Satz, was die Person besonders macht
- icon: genau 1 Emoji
- reason: 1 Satz, warum die KI das Badge erfunden hat`,
          });

          const slug = `personal-${person.id.slice(0, 8)}-${Date.now()}`;
          await db.from("badges").insert({
            slug,
            name: b.name,
            description: b.description,
            icon: b.icon,
            is_personal: true,
            owner_user_id: person.id,
            ai_reason: b.reason,
          });
          await db.from("user_badges").insert({ user_id: person.id, badge_slug: slug });
        }

        return Response.json({ recaps: count });
      },
    },
  },
});
