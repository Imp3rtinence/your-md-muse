import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * Sanfter Hinweis-Check für Challenge-Texte. Blockt NICHT — gibt nur Risk-Stufe + freundlichen Hinweis zurück.
 * Komma steht für Free Speech: der User entscheidet selbst.
 */
export const moderationHint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string }) => d)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key || !data.text.trim()) return { risk: "safe" as const, hint: null };

    const gateway = createLovableAiGatewayProvider(key);
    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        output: Output.object({
          schema: z.object({
            risk: z.enum(["safe", "risky"]),
            hint: z.string().nullable(),
          }),
        }),
        prompt: `Du checkst Texte für die Jugend-App Komma. Bewerte freundlich, ob ein Posting potenziell heikel ist
(z.B. Selbstgefährdung, Drogen, Gewalt, sexueller Inhalt, persönliche Daten).
- safe = alles ok
- risky = potenziell heikel
Bei risky: schreibe einen kurzen, respektvollen Hinweis (max 18 Wörter, du-Form), KEIN Verbot.
Sonst hint=null.

Text:
"""
${data.text.slice(0, 2000)}
"""`,
      });
      return output;
    } catch {
      // Niemals blocken bei Fehler
      return { risk: "safe" as const, hint: null };
    }
  });
