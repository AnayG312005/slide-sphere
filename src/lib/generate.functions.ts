import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { auth } from "@clerk/tanstack-react-start/server";
import { requireUserId } from "./auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveSlideImage, inferStyleHint } from "./image-pipeline.server";

async function requireUnlimitedIfPremiumSlides(slideCount: number) {
  if (slideCount <= 12) return;
  const session = await auth();
  const ok = typeof session.has === "function" && session.has({ plan: "unlimited" });
  if (!ok) {
    throw new Error("PREMIUM_REQUIRED: Upgrade to the Unlimited plan to generate 12–15 slide decks.");
  }
}

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
    await requireUnlimitedIfPremiumSlides(data.slideCount);
Analyze the user's brief: extract topic, audience, tone, purpose, complexity, slide count.

Then design a Gamma-style narrative arc using these story beats (skip/merge to fit the slide budget — never pad):
1. Cover  2. Introduction  3. Problem Statement  4. Core Concepts  5. Detailed Sections
6. Visual Examples / Case Studies  7. Challenges / Limitations  8. Future Scope
9. Conclusion  10. Thank You

Rules:
- First slide layout="title" (cover). Last slide layout="closing" (thank you / takeaway).
- Choose layout per slide content: "title", "content", "two-column" (compare/visual+text), "quote" (insight/statistic), "closing".
- Titles <= 8 words, action-oriented, no generic "Overview".
- Each summary is a single concrete sentence (<= 18 words) describing what the slide says — not what it is about.
- Vary layouts; avoid 3 identical layouts in a row.
- No duplicate titles. No filler ("Agenda", "Questions?") unless explicitly useful.`;
    const usr = `Brief: ${data.topic}
Audience: ${data.audience || "general professional audience"}
Tone: ${data.tone}
Visual style: ${data.style}
Density: ${data.density}
Target slides: ${data.slideCount}`;

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

    const densityHint = data.density === "minimal"
      ? "<= 2 short bullets (<= 6 words each), no body paragraph"
      : data.density === "extensive"
      ? "1 rich body paragraph (2-3 sentences) + 4-6 bullets (<= 12 words each)"
      : "short body sentence + 3-5 bullets (<= 10 words each)";
    const sys = `You are an elite presentation designer producing premium, Gamma-style decks.
For each outline slide, write final content optimized for projection:
- title: keep / lightly refine the outline title; <= 8 words.
- body: ${densityHint}. Skip body entirely for layout="title" or "quote".
- bullets: parallel grammar, concrete, no marketing fluff, no repetition across slides.
- notes: 2-3 sentence speaker note expanding the slide.
- imageQuery: 2-4 vivid semantic keywords for a stock photo that matches the slide's idea (NOT the deck topic). For title slide use hero-style keywords. For quote slide, atmospheric keywords. Never generic ("business", "technology") — be specific.
Maintain narrative continuity, remove duplicate ideas, ensure each slide carries ONE clear takeaway. Return slides in the same order as the outline.`;
    const usr = `Visual style: ${data.style}
Tone: ${data.tone}
Deck topic: ${data.topic}

Outline (preserve order, do NOT add or drop slides):
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

    // Hybrid image pipeline: Unsplash → Pexels → null, with ImageKit CDN passthrough.
    const styleHint = inferStyleHint(data.topic, data.tone);
    const resolved = await Promise.all(
      parsed.slides.map((s) =>
        resolveSlideImage({ query: (s.imageQuery || s.title || "").trim(), styleHint })
      )
    );
    const imageUrls = resolved.map((r) => r.url);
    const imageSources = resolved.map((r) => r.source);

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
      image_source: imageSources[i],
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
