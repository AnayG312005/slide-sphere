import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, LayoutGrid, Square } from "lucide-react";

export type PreviewSlide = {
  id: string;
  position: number;
  layout: string;
  title: string | null;
  body: string | null;
  bullets: string[] | null;
  image_url?: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  slides: PreviewSlide[];
  deckTitle: string;
  startIndex?: number;
}

function SlideCanvas({ slide, deckTitle, index, total }: { slide: PreviewSlide; deckTitle: string; index: number; total: number }) {
  const layout = slide.layout || "content";
  const hasImage = !!slide.image_url;
  const bullets = slide.bullets ?? [];

  const Title = ({ size = "xl" }: { size?: "xl" | "lg" | "md" }) => (
    <h2 className={`font-display text-ink leading-[1.05] tracking-tight ${
      size === "xl" ? "text-5xl sm:text-7xl" : size === "lg" ? "text-4xl sm:text-6xl" : "text-3xl sm:text-5xl"
    }`}>{slide.title || "Untitled"}</h2>
  );

  const Body = () => slide.body ? (
    <p className="text-base sm:text-xl text-muted-foreground leading-relaxed max-w-3xl">{slide.body}</p>
  ) : null;

  const Bullets = () => bullets.length > 0 ? (
    <ul className="space-y-3 max-w-3xl">
      {bullets.map((b, i) => (
        <li key={i} className="flex gap-3 text-base sm:text-lg text-foreground">
          <span className="mt-1 w-6 h-6 shrink-0 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-semibold">{i + 1}</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  ) : null;

  const Footer = () => (
    <>
      <div className="absolute bottom-6 left-10 text-[11px] uppercase tracking-widest text-muted-foreground truncate max-w-[50%]">
        {deckTitle}
      </div>
      <div className="absolute bottom-6 right-10 text-[11px] uppercase tracking-[0.28em] font-semibold text-primary/75 select-none">
        Slide Sphere
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] tabular-nums text-muted-foreground">
        {index + 1} / {total}
      </div>
    </>
  );

  // Title slide
  if (layout === "title") {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-card via-secondary to-card">
        {hasImage && (
          <img src={slide.image_url!} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0" style={{ background: "radial-gradient(at 30% 30%, oklch(0.82 0.13 50 / 0.45), transparent 60%)" }} />
        <div className="relative h-full grid place-items-center text-center px-10">
          <div className="space-y-5 max-w-4xl">
            <div className="text-xs uppercase tracking-[0.3em] text-primary">Presentation</div>
            <Title size="xl" />
            {slide.body && <p className="text-lg sm:text-2xl text-muted-foreground">{slide.body}</p>}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Closing
  if (layout === "closing") {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card">
        <div className="absolute inset-0" style={{ background: "radial-gradient(at 70% 70%, oklch(0.7 0.18 30 / 0.35), transparent 60%)" }} />
        <div className="relative h-full grid place-items-center text-center px-10">
          <div className="space-y-4">
            <Title size="xl" />
            <Body />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Quote
  if (layout === "quote") {
    return (
      <div className="relative w-full h-full overflow-hidden bg-card">
        {hasImage && <img src={slide.image_url!} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
        <div className="relative h-full grid place-items-center px-12 sm:px-20">
          <div className="max-w-4xl">
            <div className="font-display text-6xl text-primary leading-none mb-4">“</div>
            <p className="font-display text-2xl sm:text-4xl text-ink leading-tight">{slide.body || slide.title}</p>
            {slide.title && slide.body && <p className="mt-6 text-sm uppercase tracking-widest text-muted-foreground">— {slide.title}</p>}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Two-column
  if (layout === "two-column" && hasImage) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-card grid grid-cols-2">
        <div className="p-10 sm:p-14 flex flex-col justify-center gap-6 overflow-hidden">
          {/* metadata label removed for cleaner presentation */}
          <Title size="md" />
          <Body />
          <Bullets />
        </div>
        <div className="relative">
          <img src={slide.image_url!} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-card/30" />
        </div>
        <Footer />
      </div>
    );
  }

  // Default content layout
  return (
    <div className="relative w-full h-full overflow-hidden bg-card">
      {hasImage && (
        <div className="absolute right-0 top-0 bottom-0 w-2/5">
          <img src={slide.image_url!} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-card/20 to-card" />
        </div>
      )}
      <div className={`relative h-full p-10 sm:p-14 flex flex-col justify-center gap-6 ${hasImage ? "max-w-[62%]" : ""}`}>
        {/* metadata label removed for cleaner presentation */}
        <Title size="md" />
        <Body />
        <Bullets />
      </div>
      <Footer />
    </div>
  );
}

export function SlidePreview({ open, onClose, slides, deckTitle, startIndex = 0 }: Props) {
  const [i, setI] = useState(startIndex);
  const [mode, setMode] = useState<"single" | "deck">("single");
  const [isFs, setIsFs] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => { if (open) setI(startIndex); }, [open, startIndex]);

  const next = useCallback(() => setI((v) => Math.min(slides.length - 1, v + 1)), [slides.length]);
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  // Scroll the active slide into view in deck mode.
  useEffect(() => {
    if (mode === "deck") {
      slideRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [i, mode]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") {
        e.preventDefault(); next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault(); prev();
      } else if (e.key === "Escape") onClose();
      else if (e.key.toLowerCase() === "g") setMode((m) => m === "single" ? "deck" : "single");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, next, prev, onClose]);

  const toggleFs = async () => {
    const el = document.getElementById("slide-preview-root");
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setIsFs(true);
    } else {
      await document.exitFullscreen?.();
      setIsFs(false);
    }
  };

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const slide = slides[i];

  return (
    <AnimatePresence>
      {open && slide && (
        <motion.div
          id="slide-preview-root"
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 text-white/90 border-b border-white/5">
            <div className="text-sm font-medium truncate">{deckTitle}</div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode((m) => m === "single" ? "deck" : "single")}
                title={mode === "single" ? "Deck view (G)" : "Single view (G)"}
                className="p-2 rounded-full hover:bg-white/10"
              >
                {mode === "single" ? <LayoutGrid className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>
              <button onClick={toggleFs} title="Fullscreen" className="p-2 rounded-full hover:bg-white/10">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} title="Close (Esc)" className="p-2 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stage */}
          <div className="flex-1 flex min-h-0">
            {/* Thumbnail rail */}
            <aside className="hidden md:flex flex-col w-32 lg:w-40 border-r border-white/5 overflow-y-auto py-3 px-2 gap-2 bg-black/40">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setI(idx)}
                  className={`group relative shrink-0 aspect-video rounded-md overflow-hidden ring-1 transition ${idx === i ? "ring-primary" : "ring-white/10 hover:ring-white/30"}`}
                  title={s.title ?? `Slide ${idx + 1}`}
                >
                  <div className="absolute inset-0 scale-[0.18] origin-top-left" style={{ width: "555%", height: "555%" }}>
                    <SlideCanvas slide={s} deckTitle={deckTitle} index={idx} total={slides.length} />
                  </div>
                  <div className="absolute bottom-0.5 left-1 text-[9px] font-medium text-white/80 bg-black/40 px-1 rounded">{idx + 1}</div>
                </button>
              ))}
            </aside>

            {/* Main viewing area */}
            <div className="flex-1 min-w-0 overflow-hidden" ref={deckRef}>
              {mode === "single" ? (
                <div className="h-full grid place-items-center px-4 sm:px-10 py-4">
                  <div className="w-full max-w-[1600px] aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-card">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={slide.id}
                        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25 }}
                        className="w-full h-full"
                      >
                        <SlideCanvas slide={slide} deckTitle={deckTitle} index={i} total={slides.length} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto scroll-smooth px-4 sm:px-10 py-8 space-y-8">
                  {slides.map((s, idx) => (
                    <div
                      key={s.id}
                      ref={(el) => { slideRefs.current[idx] = el; }}
                      onClick={() => setI(idx)}
                      className={`mx-auto w-full max-w-[1400px] aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 cursor-pointer transition ${idx === i ? "ring-primary" : "ring-white/10"}`}
                    >
                      <SlideCanvas slide={s} deckTitle={deckTitle} index={idx} total={slides.length} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 py-3 text-white border-t border-white/5">
            <button onClick={prev} disabled={i === 0}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-sm tabular-nums w-20 text-center">{i + 1} / {slides.length}</div>
            <button onClick={next} disabled={i === slides.length - 1}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

