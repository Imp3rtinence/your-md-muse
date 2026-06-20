import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * "Erklär's mir" — erklärt eine Challenge nochmal in 1-2 super einfachen Sätzen.
 */
export const explainChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; description?: string | null }) => d)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt: `Erkläre diese Challenge in 1-2 super einfachen, kurzen Sätzen, du-Form, jugendlich, ohne Floskeln.
Titel: ${data.title}
Beschreibung: ${data.description ?? "(keine)"}
Antworte nur mit dem Erklärungstext, keine Anführungszeichen.`,
    });
    return { explanation: text.trim() };
  });
