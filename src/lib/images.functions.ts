import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId } from "./auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { internalError } from "./safe-error";

const STYLES = ["illustration", "photo", "abstract", "3d", "line-art"] as const;
type StyleKey = (typeof STYLES)[number];

const STYLE_SUFFIX: Record<StyleKey, string> = {
  illustration: "modern flat editorial illustration, clean composition, vibrant accents",
  photo: "ultra realistic professional photograph, natural lighting, sharp focus, 35mm",
  abstract: "abstract artistic composition, bold shapes, expressive color palette",
  "3d": "stylised 3D render, soft studio lighting, octane render, clean background",
  "line-art": "minimal black and white line art, thin even strokes, lots of negative space",
};

const Input = z.object({
  slideId: z.string().uuid(),
  prompt: z.string().min(3).max(500),
  style: z.enum(STYLES),
});

const BUCKET = "slide-images";
const SIGN_TTL = 60 * 60 * 24 * 365 * 5; // 5 years

export const regenerateSlideImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const userId = await requireUserId();

    // Ownership check
    const { data: slide } = await supabaseAdmin
      .from("slides").select("project_id").eq("id", data.slideId).maybeSingle();
    if (!slide) throw new Error("Slide not found");
    const { data: project } = await supabaseAdmin
      .from("projects").select("clerk_user_id").eq("id", slide.project_id).maybeSingle();
    if (!project || project.clerk_user_id !== userId) throw new Error("Forbidden");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI key not configured");

    const fullPrompt = `${data.prompt}. Style: ${STYLE_SUFFIX[data.style]}. 16:9 landscape composition, presentation-ready, no text, no watermark.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });
    if (aiRes.status === 429) throw new Error("Rate limit exceeded. Please try again shortly.");
    if (aiRes.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
    if (!aiRes.ok) {
      const t = await aiRes.text();
      throw internalError("regenerateSlideImage:ai", new Error(t.slice(0, 500)));
    }
    const json = await aiRes.json();
    const b64 = json?.data?.[0]?.b64_json as string | undefined;
    if (!b64) throw new Error("AI did not return an image");

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${userId}/${data.slideId}-${Date.now()}.png`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw internalError("regenerateSlideImage:upload", upErr);

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGN_TTL);
    if (signErr || !signed?.signedUrl) throw internalError("regenerateSlideImage:sign", signErr);

    const { error: updErr } = await supabaseAdmin
      .from("slides")
      .update({ image_url: signed.signedUrl, image_source: "ai" })
      .eq("id", data.slideId);
    if (updErr) throw internalError("regenerateSlideImage:update", updErr);

    return { image_url: signed.signedUrl };
  });
