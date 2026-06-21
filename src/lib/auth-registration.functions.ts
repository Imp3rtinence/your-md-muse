import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { registrationEmailHtml } from "@/lib/email/welcome-template";

const registrationSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(200),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/),
});

export const registerWithEmailLink = createServerFn({ method: "POST" })
  .inputValidator((input) => registrationSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const redirectTo = "https://komma.fun/home";
    const metadata = { username: data.username, display_name: data.username };

    let linkResult = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: data.email,
      password: data.password,
      options: { data: metadata, redirectTo },
    });

    if (linkResult.error && /already|registered|exists/i.test(linkResult.error.message)) {
      linkResult = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: data.email,
        options: { data: metadata, redirectTo },
      });
    }

    if (linkResult.error) throw new Error(linkResult.error.message);

    const actionLink = linkResult.data.properties.action_link;
    const html = registrationEmailHtml({ displayName: data.username, ctaUrl: actionLink });

    const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
        "x-komma-internal-key": process.env.LOVABLE_API_KEY!,
      },
      body: JSON.stringify({
        to: data.email,
        subject: "Dein Komma-Link ist da ✦",
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Registration email send failed", res.status, text);
      throw new Error("Registrierungs-Mail konnte nicht gesendet werden.");
    }

    return { ok: true };
  });