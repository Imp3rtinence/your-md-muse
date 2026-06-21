import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Sends a transactional email via Hostinger SMTP from info@komma.fun.
 * The actual SMTP delivery happens in the `send-email` edge function.
 */
export const sendEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SendEmailInput) => {
    if (!input?.to || !input?.subject || !input?.html) {
      throw new Error("to, subject and html are required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const { data: sessionData } = await context.supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token ?? ""}`,
        apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Email send failed (${res.status}): ${text}`);
    }
    return (await res.json()) as { ok: true };
  });
