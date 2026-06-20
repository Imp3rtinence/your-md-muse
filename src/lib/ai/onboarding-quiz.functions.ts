import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * G10: Dynamisches Onboarding — KI erzeugt eine personalisierte Folgefrage
 * auf Basis der bisher gewählten Interessen.
 */
export const dynamicOnboardingQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { interests: string[] }) => d)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const gateway = createLovableAiGatewayProvider(key);

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: z.object({
          question: z.string().describe("max 8 Wörter, du-Form, konkret"),
          options: z
            .array(z.object({ id: z.string(), label: z.string(), emoji: z.string() }))
            .min(3)
            .max(4),
        }),
      }),
      prompt: `Du machst das Onboarding der Jugend-App Komma persönlicher.
Bisherige Interessen: ${data.interests.join(", ") || "(unbekannt)"}.

Stell EINE konkrete Folgefrage, die hilft, bessere Challenges vorzuschlagen.
Beispiele für gute Folgefragen:
- "Was fühlt sich gerade leichter an?" → drinnen / draußen / egal
- "Wie viel Zeit hast du?" → 5 Min / 30 Min / Wochenprojekt
- "Lieber allein oder mit anderen?" → allein / zu zweit / Crew

Sprache: deutsch, jugendlich, kein Druck.
Optionen: 3-4 kurze Antworten, jede mit passendem Emoji, id ist ein kurzes englisches Slug.`,
    });

    return output;
  });
