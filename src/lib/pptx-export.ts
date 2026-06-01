import PptxGenJS from "pptxgenjs";

export type ExportSlide = {
  title: string | null;
  body: string | null;
  bullets: string[] | null;
  notes: string | null;
  layout: string;
  image_url?: string | null;
};

/** Fetch a remote image and return a data URL (base64). PowerPoint/LibreOffice
 *  render embedded base64 reliably; raw URLs sometimes fail in exported files. */
async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportDeckToPptx(deckTitle: string, slides: ExportSlide[]) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = deckTitle;

  const accent = "E85D3A";
  const ink = "2D1A0F";
  const muted = "8A7363";
  const cream = "FAF7F1";

  // Resolve all images to base64 in parallel before building the deck.
  const dataUrls = await Promise.all(
    slides.map((s) => (s.image_url ? urlToDataUrl(s.image_url) : Promise.resolve(null)))
  );

  for (let idx = 0; idx < slides.length; idx++) {
    const s = slides[idx];
    const dataUrl = dataUrls[idx];
    const slide = pptx.addSlide();
    slide.background = { color: cream };

    if (s.layout === "title") {
      slide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: ink } });
      slide.addText(s.title || "Untitled", { x: 0.6, y: 2.4, w: 12, h: 2.5, fontSize: 60, fontFace: "Georgia", color: "FFFFFF", italic: true });
      slide.addText(s.body || "", { x: 0.6, y: 5.0, w: 12, h: 1, fontSize: 18, fontFace: "Calibri", color: "CFCFCF" });
    } else if (s.layout === "closing") {
      slide.background = { color: ink };
      slide.addText(s.title || "Thank you", { x: 0.6, y: 3.0, w: 12, h: 2, fontSize: 54, fontFace: "Georgia", color: "FFFFFF", align: "center", italic: true });
      slide.addText(s.body || "", { x: 0.6, y: 4.8, w: 12, h: 1, fontSize: 18, color: "CFCFCF", align: "center" });
    } else if (s.layout === "quote") {
      slide.addText(`"${s.body || s.title || ""}"`, { x: 1, y: 2.5, w: 11.3, h: 3, fontSize: 36, fontFace: "Georgia", color: ink, italic: true, align: "center" });
      slide.addShape("line", { x: 6.16, y: 5.6, w: 1, h: 0, line: { color: accent, width: 2 } });
    } else {
      const hasImage = !!dataUrl;
      const textW = hasImage ? 6.6 : 12;
      slide.addText(s.title || "Untitled", { x: 0.6, y: 0.6, w: textW, h: 1.2, fontSize: 36, fontFace: "Georgia", color: ink, italic: true });
      if (s.body) {
        slide.addText(s.body, { x: 0.6, y: 1.9, w: textW, h: 1.6, fontSize: 16, color: muted, fontFace: "Calibri" });
      }
      if (s.bullets && s.bullets.length) {
        slide.addText(
          s.bullets.map((b) => ({ text: b, options: { bullet: { code: "25CF" }, color: ink } })),
          { x: 0.6, y: 3.4, w: textW, h: 3.6, fontSize: 16, fontFace: "Calibri", paraSpaceAfter: 8 }
        );
      }
      if (hasImage && dataUrl) {
        slide.addImage({ data: dataUrl, x: 7.5, y: 0.6, w: 5.2, h: 6.3, sizing: { type: "cover", w: 5.2, h: 6.3 } });
      }
    }
    if (s.notes) slide.addNotes(s.notes);
    // Slide Sphere watermark — bottom-right of every slide.
    slide.addText("Slide Sphere", {
      x: 11.4, y: 7.15, w: 1.8, h: 0.25,
      fontSize: 8, fontFace: "Calibri", color: muted, align: "right",
      charSpacing: 4,
    });
  }

  await pptx.writeFile({ fileName: `${deckTitle.replace(/[^a-z0-9\-_ ]/gi, "").slice(0, 80) || "deck"}.pptx` });
}
