import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { getProject, updateSlide } from "@/lib/projects.functions";
import { exportDeckToPptx } from "@/lib/pptx-export";
import { Loader2, Save, ArrowLeft, Play, Download } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { SlidePreview, type PreviewSlide } from "@/components/SlidePreview";

export const Route = createFileRoute("/_authenticated/editor/$id")({
  component: Editor,
  head: () => ({ meta: [{ title: "Editor — Slide Sphere" }] }),
});

type Slide = {
  id: string;
  position: number;
  layout: string;
  title: string | null;
  body: string | null;
  bullets: string[] | null;
  notes: string | null;
  image_url?: string | null;
};

function Editor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchProject = useServerFn(getProject);
  const save = useServerFn(updateSlide);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject({ data: { id } }),
  });
  const [active, setActive] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedOnce, setSavedOnce] = useState(true); // existing deck loaded from DB is considered saved
  const [downloading, setDownloading] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const slides = (data?.slides ?? []) as Slide[];
  const current = slides[active];

  useEffect(() => {
    if (current) {
      setDraft({
        title: current.title ?? "",
        body: current.body ?? "",
      });
      setDirty(false);
    }
  }, [current?.id]);


  // Auto-scale slide canvas to fit available stage area (16:9).
  useEffect(() => {
    const compute = () => {
      const el = stageRef.current;
      if (!el) return;
      const padding = 64;
      const w = el.clientWidth - padding;
      const h = el.clientHeight - padding;
      if (w <= 0 || h <= 0) return;
      const baseW = 1600;
      const baseH = 900;
      setScale(Math.min(w / baseW, h / baseH));
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener("resize", compute);
    return () => { ro.disconnect(); window.removeEventListener("resize", compute); };
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: { id: current!.id, ...draft! } }),
    onSuccess: () => {
      toast.success("Saved");
      setDirty(false);
      setSavedOnce(true);
      refetch();
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDownload = async () => {
    if (dirty || !savedOnce) {
      toast.error("Please save your presentation before downloading.");
      return;
    }
    if (!data || slides.length === 0) return;
    try {
      setDownloading(true);
      await exportDeckToPptx(
        data.project.title,
        slides.map((s) => ({
          title: s.title,
          body: s.body,
          bullets: s.bullets,
          notes: s.notes,
          layout: s.layout,
          image_url: s.image_url ?? null,
        }))
      );
      toast.success("Presentation downloaded successfully.");
    } catch (e) {
      toast.error((e as Error).message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  // Keyboard arrows
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (previewOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setActive((v) => Math.min(slides.length - 1, v + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive((v) => Math.max(0, v - 1));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [slides.length, previewOpen]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b bg-card/70 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="p-2 rounded-full hover:bg-accent transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="font-display text-base text-ink truncate leading-tight">{data.project.title}</div>
            <div className="text-[11px] text-muted-foreground">{slides.length} slides · slide {active + 1}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={slides.length === 0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card hover:bg-accent disabled:opacity-50 text-sm transition"
          >
            <Play className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !draft || !dirty}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60 text-sm transition active:scale-95"
          >
            {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {dirty ? "Save" : "Saved"}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || slides.length === 0}
            title={dirty || !savedOnce ? "Save before downloading" : "Download as .pptx"}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card hover:bg-accent disabled:opacity-50 text-sm transition"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="relative flex-1 min-h-0">
        {/* Hover trigger zone */}
        <div
          className="absolute left-0 top-0 bottom-0 w-4 z-20"
          onMouseEnter={() => setRailOpen(true)}
        />

        {/* Floating slide rail */}
        <AnimatePresence>
          {railOpen && (
            <motion.aside
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onMouseLeave={() => setRailOpen(false)}
              className="absolute left-3 top-3 bottom-3 z-30 w-56 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border/50">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Slides</div>
              </div>
              <div className="p-2 space-y-1.5 overflow-y-auto h-[calc(100%-44px)]">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(i)}
                    className={`w-full text-left rounded-xl p-2.5 border transition group ${
                      i === active
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent hover:bg-accent/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 shrink-0 rounded-md bg-secondary grid place-items-center text-[11px] font-medium text-muted-foreground">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-ink truncate leading-tight">
                          {s.title ?? "Untitled"}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                          {s.layout}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Stage */}
        <div ref={stageRef} className="absolute inset-0 grid place-items-center px-8 py-6 overflow-hidden">
          {current && draft && (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: 1600 * scale,
                  height: 900 * scale,
                }}
                className="relative rounded-3xl shadow-2xl ring-1 ring-border/60 bg-card overflow-hidden"
              >
                <div
                  style={{
                    width: 1600,
                    height: 900,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                  className="relative"
                >
                  <SlideCanvasEditable
                    slide={current}
                    draft={draft}
                    onDraft={(d) => { setDraft(d); setDirty(true); }}
                  />

                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Bottom dock — slide counter */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-card/80 backdrop-blur-xl border border-border/60 shadow-soft">
            <button
              onClick={() => setActive(Math.max(0, active - 1))}
              disabled={active === 0}
              className="px-3 py-1 rounded-full text-xs hover:bg-accent disabled:opacity-30 transition"
            >
              ←
            </button>
            <span className="text-xs tabular-nums text-muted-foreground px-2">
              {active + 1} / {slides.length}
            </span>
            <button
              onClick={() => setActive(Math.min(slides.length - 1, active + 1))}
              disabled={active === slides.length - 1}
              className="px-3 py-1 rounded-full text-xs hover:bg-accent disabled:opacity-30 transition"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <SlidePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        slides={slides as PreviewSlide[]}
        deckTitle={data.project.title}
        startIndex={active}
      />
    </div>
  );
}

/** Editable canvas — mirrors SlidePreview look, with editable title/body. */
function SlideCanvasEditable({
  slide,
  draft,
  onDraft,
  index,
}: {
  slide: Slide;
  draft: { title: string; body: string };
  onDraft: (d: { title: string; body: string }) => void;
  index: number;
}) {
  const hasImage = !!slide.image_url;
  const bullets = slide.bullets ?? [];

  return (
    <div className="relative w-full h-full bg-card">
      {hasImage && (
        <div className="absolute right-0 top-0 bottom-0 w-2/5">
          <img src={slide.image_url!} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-card/20 to-card" />
        </div>
      )}
      <div className={`relative h-full p-20 flex flex-col justify-center gap-8 ${hasImage ? "max-w-[62%]" : ""}`}>
        <div className="text-xs uppercase tracking-[0.25em] text-primary">Slide {index + 1} · {slide.layout}</div>
        <input
          value={draft.title}
          onChange={(e) => onDraft({ ...draft, title: e.target.value })}
          className="w-full bg-transparent font-display text-6xl text-ink leading-[1.05] tracking-tight focus:outline-none focus:bg-primary/5 rounded-lg -mx-2 px-2"
          placeholder="Slide title"
        />
        <textarea
          value={draft.body}
          onChange={(e) => onDraft({ ...draft, body: e.target.value })}
          rows={3}
          className="w-full bg-transparent text-xl text-muted-foreground leading-relaxed resize-none focus:outline-none focus:bg-primary/5 rounded-lg -mx-2 px-2"
          placeholder="Body content…"
        />
        {bullets.length > 0 && (
          <ul className="space-y-3 max-w-3xl">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-lg text-foreground">
                <span className="mt-1.5 w-6 h-6 shrink-0 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-semibold">{i + 1}</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Watermark */}
      <div className="absolute bottom-5 right-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
        Slide Sphere
      </div>
    </div>
  );
}
