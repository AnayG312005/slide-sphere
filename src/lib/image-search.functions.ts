import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUserId } from "./auth.server";

const Input = z.object({
  query: z.string().min(2).max(200),
  count: z.number().int().min(1).max(10).optional(),
});

export type SearchedImage = {
  url: string;
  thumb: string;
  source: "pexels" | "unsplash";
  credit: string;
  link: string;
};

async function searchPexels(q: string, n: number): Promise<SearchedImage[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch(
      `https://api.pexels.com/v1/search?per_page=${n}&orientation=landscape&query=${encodeURIComponent(q)}`,
      { headers: { Authorization: key } }
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j.photos ?? []).slice(0, n).map((p: any) => ({
      url: p.src?.large2x ?? p.src?.large ?? p.src?.original,
      thumb: p.src?.medium ?? p.src?.small ?? p.src?.tiny,
      source: "pexels" as const,
      credit: p.photographer ?? "Pexels",
      link: p.url ?? "https://pexels.com",
    })).filter((i: SearchedImage) => !!i.url);
  } catch { return []; }
}

async function searchUnsplash(q: string, n: number): Promise<SearchedImage[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  try {
    const r = await fetch(
      `https://api.unsplash.com/search/photos?per_page=${n}&orientation=landscape&content_filter=high&query=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j.results ?? []).slice(0, n).map((p: any) => ({
      url: p.urls?.regular,
      thumb: p.urls?.small ?? p.urls?.thumb,
      source: "unsplash" as const,
      credit: p.user?.name ?? "Unsplash",
      link: p.links?.html ?? "https://unsplash.com",
    })).filter((i: SearchedImage) => !!i.url);
  } catch { return []; }
}

export const searchStockImages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    await requireUserId();
    const n = data.count ?? 5;
    const [pexels, unsplash] = await Promise.all([
      searchPexels(data.query, n),
      searchUnsplash(data.query, n),
    ]);
    // Interleave for variety, then cap to n.
    const out: SearchedImage[] = [];
    for (let i = 0; i < Math.max(pexels.length, unsplash.length) && out.length < n; i++) {
      if (pexels[i]) out.push(pexels[i]);
      if (out.length < n && unsplash[i]) out.push(unsplash[i]);
    }
    return { images: out.slice(0, n) };
  });
