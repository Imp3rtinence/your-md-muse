import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * G7: Die KI erfindet ein seltenes, individuelles Badge auf Basis des Verhaltens
 * der Person der letzten 30 Tage und vergibt es einmalig.
 * Idempotent: Wenn die Person diese Woche bereits ein personal badge bekam, no-op.
 */
export const tryAwardPersonalBadge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Schon eins diese Woche?
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: recent } = await (supabase as any)
      .from("user_badges")
      .select("badge_slug, awarded_at, badges!inner(is_personal, owner_user_id)")
      .eq("user_id", userId)
      .gte("awarded_at", weekAgo);
    if ((recent ?? []).some((r: any) => r.badges?.is_personal && r.badges?.owner_user_id === userId)) {
      return { awarded: false, reason: "already_this_week" as const };
    }

    // Aktivität der letzten 30 Tage sammeln
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [{ data: subs }, { data: events }, { data: prof }] = await Promise.all([
      (supabase as any)
        .from("submissions")
        .select("created_at, challenge_id, challenges(category, tags, difficulty)")
        .eq("user_id", userId)
        .gte("created_at", monthAgo),
      (supabase as any)
        .from("aura_events")
        .select("amount, kind, created_at")
        .eq("user_id", userId)
        .gte("created_at", monthAgo),
      (supabase as any).from("profiles").select("username, display_name, interests").eq("id", userId).single(),
    ]);

    const submissionCount = (subs ?? []).length;
    if (submissionCount < 3) return { awarded: false, reason: "not_enough_activity" as const };

    const categories = (subs ?? []).map((s: any) => s.challenges?.category).filter(Boolean);
    const tags = (subs ?? []).flatMap((s: any) => s.challenges?.tags ?? []);
    const difficulties = (subs ?? []).map((s: any) => s.challenges?.difficulty).filter(Boolean);
    const totalAura = (events ?? []).reduce((a: number, e: any) => a + (e.amount ?? 0), 0);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");
    const gateway = createLovableAiGatewayProvider(key);

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: z.object({
          name: z.string().describe("max 4 Wörter, deutsch, poetisch"),
          description: z.string().describe("1 kurzer Satz, was diese Person besonders macht"),
          icon: z.string().describe("genau 1 Emoji"),
          reason: z.string().describe("1 Satz, warum die KI dieses Badge erfunden hat"),
        }),
      }),
      prompt: `Du erfindest ein einzigartiges, persönliches Badge für @${prof?.username}.
Aktivität letzte 30 Tage:
- Beweise: ${submissionCount}
- Aura gesammelt: ${totalAura}
- Kategorien: ${categories.join(", ") || "(keine)"}
- Tags: ${tags.slice(0, 20).join(", ") || "(keine)"}
- Schwierigkeiten: ${difficulties.join(", ") || "(keine)"}
- Interessen: ${(prof?.interests ?? []).join(", ") || "(keine)"}

Erfinde ein Badge, das diese Person als Mensch beschreibt — kein Standard-"Streak-3", sondern etwas Charakterliches.
Beispiele für den Stil: "Mutmacher der Nachbarschaft", "Stille Skizzenheldin", "Sonntagsrenner".`,
    });

    // Eindeutiger Slug
    const slug = `personal-${userId.slice(0, 8)}-${Date.now()}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: badgeErr } = await supabaseAdmin.from("badges").insert({
      slug,
      name: output.name,
      description: output.description,
      icon: output.icon,
      is_personal: true,
      owner_user_id: userId,
      ai_reason: output.reason,
    });
    if (badgeErr) throw badgeErr;

    const { error: ubErr } = await supabaseAdmin.from("user_badges").insert({
      user_id: userId,
      badge_slug: slug,
    });
    if (ubErr) throw ubErr;

    return { awarded: true, badge: { ...output, slug } };
  });
