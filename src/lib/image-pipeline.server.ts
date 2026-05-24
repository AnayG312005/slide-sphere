// Hybrid image pipeline: Unsplash → Pexels → null, with ImageKit CDN passthrough.
// Runs on the server only. Best-effort: never throws; returns null if no image found.

type StyleHint = "educational" | "business" | "technology" | "creative" | "general";

function styleSuffix(hint: StyleHint): string {
  switch (hint) {
    case "educational": return "illustration diagram clean";
    case "business": return "professional corporate";
    case "technology": return "futuristic ui abstract";
    case "creative": return "vibrant artistic";
    default: return "";
  }
}

function ikWrap(url: string): string {
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!endpoint || !url) return url;
  // ImageKit web-proxy transform: resize, quality, auto-format.
  return `${endpoint.replace(/\/$/, "")}/tr:w-1600,q-80,f-auto/${encodeURIComponent(url)}`;
}

async function fetchUnsplash(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const r = await fetch(
      `https://api.unsplash.com/search/photos?per_page=3&orientation=landscape&content_filter=high&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    return (j.results?.[0]?.urls?.regular as string) ?? null;
  } catch { return null; }
}

async function fetchPexels(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch(
      `https://api.pexels.com/v1/search?per_page=3&orientation=landscape&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: key } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    return (j.photos?.[0]?.src?.large2x as string) ?? (j.photos?.[0]?.src?.large as string) ?? null;
  } catch { return null; }
}

export async function resolveSlideImage(opts: {
  query: string;
  styleHint?: StyleHint;
}): Promise<{ url: string | null; source: string | null }> {
  const base = (opts.query || "").trim();
  if (!base) return { url: null, source: null };
  const enhanced = [base, styleSuffix(opts.styleHint ?? "general")].filter(Boolean).join(" ");

  const u = await fetchUnsplash(enhanced);
  if (u) return { url: ikWrap(u), source: "unsplash" };

  const p = await fetchPexels(enhanced);
  if (p) return { url: ikWrap(p), source: "pexels" };

  // Final fallback: a deterministic placeholder via ImageKit if endpoint exists,
  // otherwise null so UI shows a gradient.
  return { url: null, source: null };
}

export function inferStyleHint(topic: string, tone: string): StyleHint {
  const t = (topic + " " + tone).toLowerCase();
  if (/(educat|learn|course|student|teach|academ|research)/.test(t)) return "educational";
  if (/(ai|software|tech|engineer|cloud|data|api|cyber|saas|product)/.test(t)) return "technology";
  if (/(market|sales|business|strategy|finance|invest|enterpr|corp)/.test(t)) return "business";
  if (/(design|brand|creative|art|film|story|content)/.test(t)) return "creative";
  return "general";
}
