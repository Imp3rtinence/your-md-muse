import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * Erzeugt ein KI-Coverbild für eine Challenge via Lovable AI Gateway (Nano Banana).
 * Lädt es nach Supabase-Storage hoch und schreibt die URL auf die Challenge.
 */
export const generateHeroImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { challenge_id: string; title: string; description?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const gateway = createLovableAiGatewayProvider(key);

    // Lovable Gateway: image generation via /images/generations-style call.
    // Der OpenAI-compatible Provider unterstützt das via raw fetch.
    const prompt = `Buntes, jugendliches Cover-Bild im Sticker/Illustrations-Stil für eine Mut-/Spass-Challenge.
Thema: ${data.title}. ${data.description ?? ""}
Stil: flach, freundlich, modern, leuchtende Farben, kein Text, kein Logo, quadratisch.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!resp.ok) throw new Error(`Image gen failed: ${resp.status} ${await resp.text()}`);
    const json = await resp.json();
    const imagesB64: string[] = json?.choices?.[0]?.message?.images?.map((i: any) => i?.image_url?.url ?? i?.url) ?? [];
    const b64Url = imagesB64[0];
    if (!b64Url) throw new Error("No image returned");

    // b64Url ist data:image/png;base64,XXX
    const match = b64Url.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) throw new Error("Unexpected image format");
    const mime = match[1];
    const ext = mime.split("/")[1] ?? "png";
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `hero/${data.challenge_id}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("proofs")
      .upload(path, bytes, { contentType: mime, upsert: true });
    if (upErr) throw upErr;

    // Store storage path; client resolves via signed URL (useProofUrl)
    const { error: updErr } = await (context.supabase as any)
      .from("challenges")
      .update({ hero_image_url: path })
      .eq("id", data.challenge_id);
    if (updErr) throw updErr;

    return { path };
  });
