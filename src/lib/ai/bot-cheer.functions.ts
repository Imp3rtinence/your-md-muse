import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * Lässt einen zufälligen Bot einen netten, kurzen Kommentar zur frischen Submission posten.
 */
export const botCheerSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { challenge_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false };

    // Bot auswählen
    const { data: bots } = await (supabase as any)
      .from("profiles")
      .select("id, username, bot_persona")
      .eq("is_ai_bot", true);
    if (!bots || bots.length === 0) return { ok: false };
    const bot = bots[Math.floor(Math.random() * bots.length)];

    // Challenge-Titel holen
    const { data: ch } = await (supabase as any)
      .from("challenges")
      .select("title, category")
      .eq("id", data.challenge_id)
      .single();
    if (!ch) return { ok: false };

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt: `Du bist @${bot.username}, ein lockerer Community-Bot der Jugend-App Komma. Spezialität: ${bot.bot_persona?.specialty ?? "alltag"}.
Jemand hat gerade die Challenge "${ch.title}" abgeschlossen.
Schreibe einen sehr kurzen, freundlichen, ehrlichen Kommentar (max 12 Wörter, deutsch, du-Form, gerne 1 Emoji, kein Hashtag, kein Punkt am Ende nötig).`,
    });

    // Mit supabaseAdmin als Bot kommentieren (RLS hindert direkten Insert sonst)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const body = text.trim().replace(/^["']|["']$/g, "").slice(0, 280);
    await supabaseAdmin.from("comments").insert({
      challenge_id: data.challenge_id,
      user_id: bot.id,
      body,
    });
    return { ok: true };
  });
