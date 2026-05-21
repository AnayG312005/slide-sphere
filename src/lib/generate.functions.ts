import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId } from "./auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const STYLES = ["modern-corporate", "glassmorphism", "minimal-clean", "dark-futuristic", "startup-pitch", "creative-gradient"] as const;
const DENSITIES = ["minimal", "concise", "extensive"] as const;
const TONES = ["professional", "casual", "academic", "persuasive", "inspirational"] as const;

const CREDITS_PER_DECK = 5;

const OutlineInput = z.object({
  topic: z.string().min(3).max(1000),
  audience: z.string().max(200).optional(),
  tone: z.enum(TONES).default("professional"),
  slideCount: z.number().int().min(3).max(20).default(8),
  style: z.enum(STYLES).default("modern-corporate"),
  density: z.enum(DENSITIES).default("concise"),
});

const OutlineSlide = z.object({
  title: z.string(),
  summary: z.string().optional().default(""),
  layout: z.enum(["title", "content", "two-column", "quote", "closing"]).default("content"),
});
const OutlineSchema = z.object({
  deckTitle: z.string(),
  description: z.string().optional().default(""),
  slides: z.array(OutlineSlide).min(1),
});

async function callGemini(systemPrompt: string, userPrompt: string, schema: object, fnName: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI key not configured");
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{ type: "function", function: { name: fnName, parameters: schema } }],
      tool_choice: { type: "function", function: { name: fnName } },
    }),
  });
  if (response.status === 429) throw new Error("Rate limit exceeded. Please try again shortly.");
  if (response.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${text.slice(0, 200)}`);
  }
  const json = await response.json();
  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return a result");
  return JSON.parse(toolCall.function.arguments);
}

/** Step 1: generate the outline (no DB write, no credit charge yet). */
export const generateOutline = createServerFn({ method: "POST" })
  .inputValidator((d) => OutlineInput.parse(d))
  .handler(async ({ data }) => {
    await requireUserId();
    const sys = `You are an elite presentation strategist. Generate a tight, narrative outline for a slide deck. Return ONLY the outline (titles + 1-line summaries). First slide layout="title". Last slide layout="closing".`;
    const usr = `Topic: ${data.topic}
Audience: ${data.audience || "general professional audience"}
Tone: ${data.tone}
Style: ${data.style}
Content density: ${data.density}
Slides: ${data.slideCount}`;

    const schema = {
      type: "object",
      properties: {
        deckTitle: { type: "string" },
        description: { type: "string" },
        slides: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              layout: { type: "string", enum: ["title", "content", "two-column", "quote", "closing"] },
            },
            required: ["title", "layout"],
          },
        },
      },
      required: ["deckTitle", "slides"],
    };

    const parsed = OutlineSchema.parse(await callGemini(sys, usr, schema, "emit_outline"));
    return parsed;
  });

const FinalizeInput = z.object({
  topic: z.string().min(1),
  tone: z.enum(TONES).default("professional"),
  style: z.enum(STYLES).default("modern-corporate"),
  density: z.enum(DENSITIES).default("concise"),
  deckTitle: z.string().min(1),
  description: z.string().optional().default(""),
  slides: z.array(z.object({
    title: z.string().min(1),
    summary: z.string().optional().default(""),
    layout: z.enum(["title", "content", "two-column", "quote", "closing"]).default("content"),
  })).min(1).max(20),
});

const FullSlide = z.object({
  title: z.string(),
  body: z.string().optional().default(""),
  bullets: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(""),
  imageQuery: z.string().optional().default(""),
});
const FullDeck = z.object({ slides: z.array(FullSlide).min(1) });

/** Step 2: expand outline into full slides, fetch images, charge credits, persist. */
export const finalizeDeck = createServerFn({ method: "POST" })
  .inputValidator((d) => FinalizeInput.parse(d))
  .handler(async ({ data }) => {
    const userId = await requireUserId();

    // Pre-flight credit check (atomic deduct after success would risk wasted spend on AI failure)
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("credits").eq("clerk_user_id", userId).maybeSingle();
    if (!profile || profile.credits < CREDITS_PER_DECK) {
      throw new Error(`INSUFFICIENT_CREDITS: need ${CREDITS_PER_DECK}, have ${profile?.credits ?? 0}`);
    }

    const densityHint = data.density === "minimal" ? "very sparse, max 2 short bullets" : data.density === "extensive" ? "rich body paragraphs + 4-6 bullets" : "concise body + 3-5 bullets";
    const sys = `You are an elite presentation designer. For each outline slide, produce final content. ${densityHint}. Include an imageQuery (2-4 keywords) for fetching a stock photo. Return slides in the same order.`;
    const usr = `Style: ${data.style}
Tone: ${data.tone}
Topic: ${data.topic}

Outline:
${data.slides.map((s, i) => `${i + 1}. [${s.layout}] ${s.title} — ${s.summary}`).join("\n")}

Generate ${data.slides.length} fully-realized slides.`;

    const schema = {
      type: "object",
      properties: {
        slides: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              body: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
              notes: { type: "string" },
              imageQuery: { type: "string" },
            },
            required: ["title"],
          },
        },
      },
      required: ["slides"],
    };

    const parsed = FullDeck.parse(await callGemini(sys, usr, schema, "emit_full_deck"));

    // Fetch images via Unsplash (best-effort; optional)
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    const imageUrls: (string | null)[] = await Promise.all(
      parsed.slides.map(async (s) => {
        const query = (s.imageQuery || s.title).trim();
        if (!query || !unsplashKey) return null;
        try {
          const r = await fetch(`https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`, {
            headers: { Authorization: `Client-ID ${unsplashKey}` },
          });
          if (!r.ok) return null;
          const j = await r.json();
          const url = j.results?.[0]?.urls?.regular as string | undefined;
          if (!url) return null;
          // Optional ImageKit CDN passthrough
          const ikEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
          if (ikEndpoint) {
            return `${ikEndpoint.replace(/\/$/, "")}/tr:w-1600,q-80/${encodeURIComponent(url)}`;
          }
          return url;
        } catch {
          return null;
        }
      })
    );

    // Persist project + slides
    const { data: project, error: pErr } = await supabaseAdmin
      .from("projects").insert({
        clerk_user_id: userId,
        title: data.deckTitle,
        description: data.description,
        theme: "warm-sand",
        style: data.style,
        density: data.density,
        slide_count: data.slides.length,
        status: "ready",
      }).select().single();
    if (pErr) throw new Error(pErr.message);

    const slideRows = parsed.slides.map((s, i) => ({
      project_id: project.id,
      position: i,
      layout: data.slides[i]?.layout ?? "content",
      title: s.title,
      body: s.body,
      bullets: s.bullets,
      notes: s.notes,
      image_url: imageUrls[i],
      image_source: imageUrls[i] ? "unsplash" : null,
    }));
    const { error: sErr } = await supabaseAdmin.from("slides").insert(slideRows);
    if (sErr) throw new Error(sErr.message);

    // Deduct credits (atomic)
    const { data: remaining, error: cErr } = await supabaseAdmin.rpc("consume_credits", {
      _clerk_user_id: userId,
      _amount: CREDITS_PER_DECK,
      _reason: "deck_generated",
      _project_id: project.id,
    });
    if (cErr) throw new Error(cErr.message);

    return { projectId: project.id, creditsRemaining: remaining as number };
  });
