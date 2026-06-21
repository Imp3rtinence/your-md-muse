// Sends transactional emails via Hostinger SMTP from info@komma.fun
// Called by the app via a TanStack server function (authenticated user only).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-komma-internal-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

const FROM_EMAIL = "info@komma.fun";
const FROM_NAME = "komma.fun";
const SMTP_HOST = "smtp.hostinger.com";
const SMTP_PORT = 465;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require either a signed-in user or an internal app call.
    const authHeader = req.headers.get("Authorization");
    const internalKey = req.headers.get("x-komma-internal-key");
    const expectedInternalKey = Deno.env.get("LOVABLE_API_KEY");
    const isInternalCall = Boolean(expectedInternalKey && internalKey === expectedInternalKey);

    if (!authHeader && !isInternalCall) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let senderId = "internal-registration";
    if (!isInternalCall) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader! } } }
      );
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      senderId = userData.user.id;
    }

    const body = (await req.json()) as SendEmailRequest;
    if (!body.to || !body.subject || !body.html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpPassword = Deno.env.get("HOSTINGER_SMTP_PASSWORD");
    if (!smtpPassword) {
      console.error("HOSTINGER_SMTP_PASSWORD not configured");
      return new Response(JSON.stringify({ error: "SMTP not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { SMTPClient } = await import("npm:emailjs@4.0.3");
    const client = new SMTPClient({
      user: FROM_EMAIL,
      password: smtpPassword,
      host: SMTP_HOST,
      port: SMTP_PORT,
      ssl: true,
    });

    const recipients = Array.isArray(body.to) ? body.to.join(", ") : body.to;

    await new Promise<void>((resolve, reject) => {
      client.send(
        {
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: recipients,
          "reply-to": body.replyTo ?? FROM_EMAIL,
          subject: body.subject,
          text: body.text ?? body.html.replace(/<[^>]+>/g, ""),
          attachment: [
            { data: body.html, alternative: true },
          ],
        } as any,
        (err) => (err ? reject(err) : resolve())
      );
    });

    console.log(`Email sent to ${recipients} (sender ${senderId})`);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-email failed", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
