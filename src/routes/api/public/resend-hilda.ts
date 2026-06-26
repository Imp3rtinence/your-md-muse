import { createFileRoute } from "@tanstack/react-router";
import { registrationEmailHtml } from "@/lib/email/welcome-template";

export const Route = createFileRoute("/api/public/resend-hilda")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const secret = url.searchParams.get("k");
        if (secret !== process.env.LOVABLE_API_KEY) {
          return new Response("Forbidden", { status: 403 });
        }
        const email = url.searchParams.get("email");
        const username = url.searchParams.get("username") ?? "hilda";
        const origin = url.searchParams.get("origin") ?? "https://komma.fun";
        if (!email) return new Response("email required", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const linkResult = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: `${origin}/home` },
        });
        if (linkResult.error) {
          return new Response(`generateLink failed: ${linkResult.error.message}`, { status: 500 });
        }
        const { hashed_token, verification_type } = linkResult.data.properties;
        const actionLink = new URL(`${origin}/confirm`);
        actionLink.searchParams.set("token_hash", hashed_token);
        actionLink.searchParams.set("type", verification_type);
        actionLink.searchParams.set("next", `${origin}/home`);

        const html = registrationEmailHtml({ displayName: username, ctaUrl: actionLink.toString() });
        const res = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
            "x-komma-internal-key": process.env.LOVABLE_API_KEY!,
          },
          body: JSON.stringify({
            to: email,
            subject: "Dein Komma-Link ist da ✦",
            html,
          }),
        });
        const text = await res.text();
        return new Response(
          JSON.stringify({ ok: res.ok, status: res.status, body: text, link: actionLink.toString() }),
          { status: res.ok ? 200 : 500, headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
