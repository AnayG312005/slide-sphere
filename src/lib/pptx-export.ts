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

/** Pseudo-random but deterministic picker so a deck looks varied but stable on re-export. */
function pickVariant(seed: number, options: number) {
  // Simple hash
  const h = ((seed + 1) * 2654435761) >>> 0;
  return h % options;
}

export async function exportDeckToPptx(deckTitle: string, slides: ExportSlide[]) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = deckTitle;

  const accent = "E85D3A";
  const ink = "2D1A0F";
  const muted = "8A7363";
  const cream = "FAF7F1";

  const dataUrls = await Promise.all(
    slides.map((s) => (s.image_url ? urlToDataUrl(s.image_url) : Promise.resolve(null)))
  );

  // Watermark added to EVERY slide last so it sits on top.
  const addWatermark = (slide: PptxGenJS.Slide, onDark = false) => {
    slide.addText("SLIDE SPHERE", {
      x: 10.5, y: 7.12, w: 2.7, h: 0.3,
      fontSize: 9, fontFace: "Calibri", bold: true,
      color: onDark ? "FFFFFF" : accent,
      transparency: 40, // ~60% opacity
      align: "right",
      charSpacing: 6,
    });
  };

  for (let idx = 0; idx < slides.length; idx++) {
    const s = slides[idx];
    const dataUrl = dataUrls[idx];
    const slide = pptx.addSlide();
    slide.background = { color: cream };

    if (s.layout === "title") {
      slide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: ink } });
      if (dataUrl) {
        slide.addImage({ data: dataUrl, x: 0, y: 0, w: 13.33, h: 7.5, sizing: { type: "cover", w: 13.33, h: 7.5 }, transparency: 55 });
      }
      slide.addText(s.title || "Untitled", { x: 0.6, y: 2.4, w: 12, h: 2.5, fontSize: 60, fontFace: "Georgia", color: "FFFFFF", italic: true });
      slide.addText(s.body || "", { x: 0.6, y: 5.0, w: 12, h: 1, fontSize: 18, fontFace: "Calibri", color: "EFE6DC" });
      addWatermark(slide, true);
      if (s.notes) slide.addNotes(s.notes);
      continue;
    }

    if (s.layout === "closing") {
      slide.background = { color: ink };
      slide.addText(s.title || "Thank you", { x: 0.6, y: 3.0, w: 12, h: 2, fontSize: 54, fontFace: "Georgia", color: "FFFFFF", align: "center", italic: true });
      slide.addText(s.body || "", { x: 0.6, y: 4.8, w: 12, h: 1, fontSize: 18, color: "CFCFCF", align: "center" });
      addWatermark(slide, true);
      if (s.notes) slide.addNotes(s.notes);
      continue;
    }

    if (s.layout === "quote") {
      slide.addText(`"${s.body || s.title || ""}"`, { x: 1, y: 2.5, w: 11.3, h: 3, fontSize: 36, fontFace: "Georgia", color: ink, italic: true, align: "center" });
      slide.addShape("line", { x: 6.16, y: 5.6, w: 1, h: 0, line: { color: accent, width: 2 } });
      addWatermark(slide);
      if (s.notes) slide.addNotes(s.notes);
      continue;
    }

    // Content / two-column — pick from 6 layout variants dynamically
    const hasImage = !!dataUrl;
    // Estimate content density to inform sizing
    const bulletCount = s.bullets?.length ?? 0;
    const bodyLen = (s.body ?? "").length;
    const dense = bulletCount > 4 || bodyLen > 280;
    const bodyFs = dense ? 13 : 16;
    const bulletFs = dense ? 13 : 16;
    const paraSpace = dense ? 4 : 8;

    if (!hasImage) {
      // Text-only
      slide.addText(s.title || "Untitled", { x: 0.6, y: 0.6, w: 12.1, h: 1.2, fontSize: 36, fontFace: "Georgia", color: ink, italic: true });
      if (s.body) slide.addText(s.body, { x: 0.6, y: 1.9, w: 12.1, h: 1.6, fontSize: bodyFs, color: muted, fontFace: "Calibri" });
      if (s.bullets?.length) {
        slide.addText(
          s.bullets.map((b) => ({ text: b, options: { bullet: { code: "25CF" }, color: ink } })),
          { x: 0.6, y: 3.4, w: 12.1, h: 3.4, fontSize: bulletFs, fontFace: "Calibri", paraSpaceAfter: paraSpace }
        );
      }
      addWatermark(slide);
      if (s.notes) slide.addNotes(s.notes);
      continue;
    }

    const variant = pickVariant(idx, 6);

    const renderText = (x: number, y: number, w: number) => {
      slide.addText(s.title || "Untitled", { x, y, w, h: 1.2, fontSize: 32, fontFace: "Georgia", color: ink, italic: true });
      if (s.body) slide.addText(s.body, { x, y: y + 1.3, w, h: 1.4, fontSize: bodyFs, color: muted, fontFace: "Calibri" });
      if (s.bullets?.length) {
        slide.addText(
          s.bullets.map((b) => ({ text: b, options: { bullet: { code: "25CF" }, color: ink } })),
          { x, y: y + 2.8, w, h: 3.6, fontSize: bulletFs, fontFace: "Calibri", paraSpaceAfter: paraSpace }
        );
      }
    };

    switch (variant) {
      case 0: // Image right
        renderText(0.6, 0.6, 6.6);
        slide.addImage({ data: dataUrl!, x: 7.5, y: 0.6, w: 5.2, h: 6.3, sizing: { type: "cover", w: 5.2, h: 6.3 } });
        break;
      case 1: // Image left
        slide.addImage({ data: dataUrl!, x: 0.6, y: 0.6, w: 5.2, h: 6.3, sizing: { type: "cover", w: 5.2, h: 6.3 } });
        renderText(6.2, 0.6, 6.6);
        break;
      case 2: // Image top band
        slide.addImage({ data: dataUrl!, x: 0.6, y: 0.6, w: 12.1, h: 2.6, sizing: { type: "cover", w: 12.1, h: 2.6 } });
        renderText(0.6, 3.4, 12.1);
        break;
      case 3: // Image bottom band
        renderText(0.6, 0.6, 12.1);
        slide.addImage({ data: dataUrl!, x: 0.6, y: 4.7, w: 12.1, h: 2.2, sizing: { type: "cover", w: 12.1, h: 2.2 } });
        break;
      case 4: // Large image left (60%) — premium
        slide.addImage({ data: dataUrl!, x: 0, y: 0, w: 7.5, h: 7.5, sizing: { type: "cover", w: 7.5, h: 7.5 } });
        renderText(7.9, 0.7, 5.0);
        break;
      case 5: // Large image right (60%)
      default:
        renderText(0.5, 0.7, 5.0);
        slide.addImage({ data: dataUrl!, x: 5.83, y: 0, w: 7.5, h: 7.5, sizing: { type: "cover", w: 7.5, h: 7.5 } });
        break;
    }

    addWatermark(slide);
    if (s.notes) slide.addNotes(s.notes);
  }

  await pptx.writeFile({ fileName: `${deckTitle.replace(/[^a-z0-9\-_ ]/gi, "").slice(0, 80) || "deck"}.pptx` });
}
