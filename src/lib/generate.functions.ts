import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId } from "./auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GenerateInput = z.object({
  topic: z.string().min(3).max(300),
  audience: z.string().max(200).optional(),
  tone: z.enum(["professional", "casual", "academic", "persuasive", "inspirational"]).default("professional"),
  slideCount: z.number().int().min(3).max(20).default(8),
  theme: z.string().default("warm-sand"),
});

const SlideSchema = z.object({
  title: z.string(),
  body: z.string().optional().default(""),
  bullets: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(""),
  layout: z.enum(["title", "content", "two-column", "quote", "closing"]).optional().default("content"),
});
const DeckSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(""),
  slides: z.array(SlideSchema).min(1),
});

export const generateDeck = createServerFn({ method: "POST" })
  .inputValidator((d) => GenerateInput.parse(d))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI key not configured");

    const systemPrompt = `You are an elite presentation designer. Generate a polished, well-structured slide deck. Return ONLY valid JSON matching the provided schema. Each slide should be concise, scannable, and audience-appropriate. Use bullets sparingly (3-5 per slide). First slide is always layout:"title". Last slide is layout:"closing".`;
    const userPrompt = `Topic: ${data.topic}
Audience: ${data.audience || "general professional audience"}
Tone: ${data.tone}
Number of slides: ${data.slideCount}

Generate a deck with title, short description, and exactly ${data.slideCount} slides.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_deck",
            description: "Emit the generated slide deck.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      body: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } },
                      notes: { type: "string" },
                      layout: { type: "string", enum: ["title", "content", "two-column", "quote", "closing"] },
                    },
                    required: ["title"],
                  },
                },
              },
              required: ["title", "slides"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_deck" } },
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
    if (!toolCall) throw new Error("AI did not return a deck");
    const parsed = DeckSchema.parse(JSON.parse(toolCall.function.arguments));

    // Persist
    const { data: project, error: pErr } = await supabaseAdmin
      .from("projects")
      .insert({
        clerk_user_id: userId,
        title: parsed.title,
        description: parsed.description,
        theme: data.theme,
        status: "ready",
      })
      .select()
      .single();
    if (pErr) throw new Error(pErr.message);

    const slideRows = parsed.slides.map((s, i) => ({
      project_id: project.id,
      position: i,
      layout: s.layout,
      title: s.title,
      body: s.body,
      bullets: s.bullets,
      notes: s.notes,
    }));
    const { error: sErr } = await supabaseAdmin.from("slides").insert(slideRows);
    if (sErr) throw new Error(sErr.message);

    return { projectId: project.id };
  });
