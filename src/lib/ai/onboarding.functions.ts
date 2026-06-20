import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const Output = z.object({
  summary: z.string().describe("Ein motivierender Zweizeiler an die Person, du-Form, jugendlich, kein Druck."),
  top_categories: z.array(z.enum(["creative", "active", "friendly", "skill", "learning"])).min(1).max(3),
  suggested_challenges: z
    .array(
      z.object({
        title: z.string().describe("Kurzer, konkreter Titel der Challenge"),
        description: z.string().describe("1-2 Sätze, was zu tun ist"),
        category: z.enum(["creative", "active", "friendly", "skill", "learning"]),
        duration_minutes: z.number().int().min(5).max(120),
      }),
    )
    .length(3),
  suggested_crew_kinds: z.array(z.enum(["friends", "school", "sport", "neighborhood", "other"])).max(3),
});

export const analyzeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { interests: string[]; context: string | null }) => d)
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const gateway = createLovableAiGatewayProvider(key);
    const prompt = `Du bist die KI hinter der Jugend-App "Komma". Eine neue Person hat das Onboarding abgeschlossen.
Interessen: ${data.interests.join(", ") || "(keine)"}
Kontext: ${data.context ?? "(unklar)"}

Erstelle ein kurzes KI-Profil und drei konkrete, sichere, machbare Start-Challenges (offline-tauglich, kein Geld nötig).
Verfügbare Kategorien: creative, active, friendly, skill, learning.
Crew-Arten: friends, school, sport, neighborhood, other.
Antwort NUR als JSON nach dem geforderten Schema.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt: `${prompt}\n\nAntworte ausschliesslich mit einem JSON-Objekt in dieser Form (keine Markdown-Codeblöcke):
{
  "summary": "...",
  "top_categories": ["creative" | "active" | "friendly" | "skill" | "learning", ...],
  "suggested_challenges": [
    { "title": "...", "description": "...", "category": "creative|active|friendly|skill|learning", "duration_minutes": 15 },
    ... (genau 3)
  ],
  "suggested_crew_kinds": ["friends"|"school"|"sport"|"neighborhood"|"other", ...]
}`,
    });

    const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = Output.parse(JSON.parse(cleaned));

    const { supabase, userId } = context;
    const { error } = await (supabase as any)
      .from("user_ai_profile")
      .upsert({
        user_id: userId,
        summary: parsed.summary,
        traits: { interests: data.interests, context: data.context },
        top_categories: parsed.top_categories,
        suggested_challenges: parsed.suggested_challenges,
        suggested_crew_kinds: parsed.suggested_crew_kinds,
      });
    if (error) throw error;

    return parsed;
  });

export const getMyAiProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("user_ai_profile")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data as null | {
      summary: string | null;
      top_categories: string[];
      suggested_challenges: { title: string; description: string; category: string; duration_minutes: number }[];
      suggested_crew_kinds: string[];
    };
  });
