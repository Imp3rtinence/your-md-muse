import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const LANGS = ["en", "tr", "ar", "uk", "fr", "es", "it", "pl", "ru"] as const;
export type Lang = (typeof LANGS)[number];

/**
 * Übersetzt eine Challenge in die gewünschte Sprache. Cacht in `challenge_translations`.
 */
export const translateChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { challenge_id: string; lang: Lang }) => {
    if (!LANGS.includes(d.lang)) throw new Error("Sprache nicht unterstützt");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Cache?
    const { data: cached } = await (supabase as any)
      .from("challenge_translations")
      .select("title, description")
      .eq("challenge_id", data.challenge_id)
      .eq("lang", data.lang)
      .maybeSingle();
    if (cached) return cached as { title: string; description: string };

    const { data: ch, error } = await (supabase as any)
      .from("challenges")
      .select("title, description")
      .eq("id", data.challenge_id)
      .single();
    if (error || !ch) throw error ?? new Error("Challenge nicht gefunden");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const gateway = createLovableAiGatewayProvider(key);

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: z.object({ title: z.string(), description: z.string() }),
      }),
      prompt: `Übersetze diese Challenge in die Sprache mit ISO-Code "${data.lang}".
Behalte Ton (jugendlich, motivierend, du-Form/Äquivalent), keine Emojis hinzufügen, keine Erklärungen.

Titel: ${ch.title}
Beschreibung: ${ch.description}`,
    });

    // Service-Client um Cache zu schreiben (RLS-Insert wäre sonst blockiert)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("challenge_translations").upsert({
      challenge_id: data.challenge_id,
      lang: data.lang,
      title: output.title,
      description: output.description,
    });

    return output;
  });

export const SUPPORTED_LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];
