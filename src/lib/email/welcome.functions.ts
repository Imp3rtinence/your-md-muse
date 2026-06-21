import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { welcomeEmailHtml } from "@/lib/email/welcome-template";

/**
 * Sends the Komma welcome email to the currently signed-in user
 * if they haven't received it yet. Idempotent: stamps profiles.welcome_sent_at.
 */
export const sendMyWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile, error: profErr } = await (supabase as any)
      .from("profiles")
      .select("display_name, username, welcome_sent_at")
      .eq("id", userId)
      .maybeSingle();
    if (profErr) throw profErr;
    if (!profile) return { ok: false, reason: "no_profile" as const };
    if (profile.welcome_sent_at) return { ok: true, alreadySent: true as const };

    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) return { ok: false, reason: "no_email" as const };

    const displayName =
      (profile.display_name && profile.display_name.trim()) ||
      profile.username ||
      "Komma-Crew";

    const html = welcomeEmailHtml({
      displayName,
      ctaUrl: "https://komma.fun/home",
    });

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token ?? ""}`,
        apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
      },
      body: JSON.stringify({
        to: email,
        subject: "Willkommen bei Komma – machen statt scrollen ✦",
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Welcome email send failed", res.status, text);
      throw new Error(`Welcome email failed (${res.status})`);
    }

    await (supabase as any)
      .from("profiles")
      .update({ welcome_sent_at: new Date().toISOString() })
      .eq("id", userId);

    return { ok: true, sent: true as const };
  });
