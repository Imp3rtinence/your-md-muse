import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SuggestionSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(["creative", "active", "friendly", "skill", "learning"]),
  duration_hours: z.number().int().min(12).max(168),
  tags: z.array(z.string()).max(5),
  difficulty: z.enum(["leicht", "mittel", "mutig"]),
});

export type ChallengeSuggestion = z.infer<typeof SuggestionSchema>;

/**
 * Nimmt ein User-Stichwort oder einen rohen Entwurf und schlägt eine ausgearbeitete Challenge vor.
 * Nichts wird gespeichert — der User entscheidet.
 */
export const suggestChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { keyword: string; current_title?: string; current_description?: string }) => d)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `Du bist Komma-Coach für die Jugend-App. Hilf, eine kleine, machbare Challenge auszuformulieren.

Eingabe von der Person:
- Stichwort/Idee: ${data.keyword || "(leer)"}
${data.current_title ? `- aktueller Titel: ${data.current_title}` : ""}
${data.current_description ? `- aktuelle Beschreibung: ${data.current_description}` : ""}

Schlage genau EINE Challenge vor. Regeln:
- title: max 6 Wörter, knackig, deutsch, ohne Emojis
- description: 1-2 Sätze, du-Form, motivierend, konkret
- category MUSS sein: creative | active | friendly | skill | learning
- duration_hours: realistische Frist (24 für Standard, 72 für mehr Aufwand, 168 für Wochenprojekt, 12 für Quickies)
- tags: 2-5 kurze deutsche Hashtag-Wörter (ohne #)
- difficulty: "leicht" | "mittel" | "mutig"
- sicher und altersgerecht (kein Alkohol, keine Gefahren)`;

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: SuggestionSchema }),
      prompt,
    });

    return output;
  });
