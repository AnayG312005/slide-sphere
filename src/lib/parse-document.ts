// Client-side document parsing. Keeps parsing off the Cloudflare Worker so
// we don't fight Node-only PDF libs on the edge. The extracted plain text is
// then folded into the generator prompt as the authoritative source.

const MAX_CHARS = 30_000; // ~7-8k tokens; enough for a 50-page report.

export interface ParsedDocument {
  filename: string;
  charCount: number;
  truncated: boolean;
  text: string;
}

async function parsePdf(file: File): Promise<string> {
  // Dynamic import so pdfjs (large) is only loaded when a PDF is attached.
  const pdfjs = await import("pdfjs-dist");
  // Vite-friendly worker URL. `?url` returns the built asset URL.
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ");
    parts.push(line);
    if (parts.join("\n\n").length > MAX_CHARS * 1.2) break;
  }
  return parts.join("\n\n");
}

async function parseDocx(file: File): Promise<string> {
  // @ts-expect-error - no bundled types for the browser build
  const mammoth = await import("mammoth/mammoth.browser.js");
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return res.value ?? "";
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const name = file.name.toLowerCase();
  let text = "";
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    text = await parsePdf(file);
  } else if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    text = await parseDocx(file);
  } else {
    throw new Error("Unsupported file. Upload a PDF or DOCX.");
  }

  const clean = text.replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
  const truncated = clean.length > MAX_CHARS;
  return {
    filename: file.name,
    charCount: clean.length,
    truncated,
    text: truncated ? clean.slice(0, MAX_CHARS) : clean,
  };
}

export function composeSourcedPrompt(userPrompt: string, doc: ParsedDocument | null): string {
  const prompt = userPrompt.trim();
  if (!doc) return prompt;
  const instruction = prompt
    ? `USER INSTRUCTION (styling / intent — how to present the source):\n${prompt}\n\n`
    : "";
  const truncNote = doc.truncated ? " (truncated to fit context)" : "";
  return `${instruction}SOURCE DOCUMENT — this is the authoritative content. Extract facts, structure, terminology, statistics, and conclusions from this document. Do not invent information not present here.\n\nFile: ${doc.filename}${truncNote}\n---\n${doc.text}\n---`;
}
