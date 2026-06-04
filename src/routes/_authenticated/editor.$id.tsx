import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { getProject, updateSlidesBulk } from "@/lib/projects.functions";
import { searchStockImages } from "@/lib/image-search.functions";
import { exportDeckToPptx } from "@/lib/pptx-export";
import { Loader2, Save, ArrowLeft, Play, Download, Pencil, Eye, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { SlidePreview, type PreviewSlide } from "@/components/SlidePreview";
import { ImageRegenPanel, type StockImage } from "@/components/ImageRegenPanel";

export const Route = createFileRoute("/_authenticated/editor/$id")({
  component: Editor,
  head: () => ({ meta: [{ title: "Editor — Slide Sphere" }] }),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-[60vh] grid place-items-center p-6 text-center">
      <div className="space-y-3">
        <div className="text-sm text-destructive">Couldn't load this deck: {error.message}</div>
        <button onClick={reset} className="px-4 py-1.5 rounded-full border bg-card hover:bg-accent text-sm">
          Retry
        </button>
      </div>
    </div>
  ),
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

type Draft = { title: string; body: string; bullets: string[]; image_url: string | null };

type Mode = "preview" | "edit";

function slideToDraft(s: Slide): Draft {
  return {
    title: s.title ?? "",
    body: s.body ?? "",
    bullets: s.bullets ?? [],
    image_url: s.image_url ?? null,
  };
}

function draftsEqual(a: Draft, b: Draft): boolean {
  if (a.title !== b.title || a.body !== b.body || a.image_url !== b.image_url) return false;
  if (a.bullets.length !== b.bullets.length) return false;
  for (let i = 0; i < a.bullets.length; i++) if (a.bullets[i] !== b.bullets[i]) return false;
  return true;
}

function Editor() {
  const { id } = Route.useParams();
  const { isLoaded, isSignedIn } = useAuth();
  const qc = useQueryClient();
  const fetchProject = useServerFn(getProject);
  const bulkSave = useServerFn(updateSlidesBulk);
  const searchImages = useServerFn(searchStockImages);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject({ data: { id } }),
    enabled: isLoaded && isSignedIn,
    retry: false,
  });

  const slides = useMemo(() => (data?.slides ?? []) as Slide[], [data]);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<Mode>("preview");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [imagePanelOpen, setImagePanelOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StockImage[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Sync drafts from server data on load / refetch
  useEffect(() => {
    if (!slides.length) return;
    setDrafts((prev) => {
      const next: Record<string, Draft> = {};
      for (const s of slides) next[s.id] = prev[s.id] ?? slideToDraft(s);
      return next;
    });
  }, [slides]);

  const current = slides[active];
  const currentDraft = current ? drafts[current.id] : undefined;

  const dirtySlideIds = useMemo(() => {
    const out: string[] = [];
    for (const s of slides) {
      const d = drafts[s.id];
      if (d && !draftsEqual(d, slideToDraft(s))) out.push(s.id);
    }
    return out;
  }, [drafts, slides]);
  const dirty = dirtySlideIds.length > 0;

  // Auto-scale slide canvas (16:9)
  useEffect(() => {
    const compute = () => {
      const el = stageRef.current;
      if (!el) return;
      const padding = 64;
      const w = el.clientWidth - padding;
      const h = el.clientHeight - padding;
      if (w <= 0 || h <= 0) return;
      setScale(Math.min(w / 1600, h / 900));
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener("resize", compute);
    return () => { ro.disconnect(); window.removeEventListener("resize", compute); };
  }, [data, imagePanelOpen]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const patches = dirtySlideIds.map((sid) => {
        const d = drafts[sid];
        return { id: sid, title: d.title, body: d.body, bullets: d.bullets, image_url: d.image_url };
      });
      if (!patches.length) return;
      await bulkSave({ data: { slides: patches } });
    },
    onSuccess: () => {
      toast.success("All changes saved");
      refetch();
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDownload = async () => {
    if (dirty) {
      toast.error("Please save your changes before downloading.");
      return;
    }
    if (!data || slides.length === 0) return;
    try {
      setDownloading(true);
      await exportDeckToPptx(
        data.project.title,
        slides.map((s) => ({
          title: s.title, body: s.body, bullets: s.bullets, notes: s.notes,
          layout: s.layout, image_url: s.image_url ?? null,
        }))
      );
      toast.success("Presentation downloaded.");
    } catch (e) {
      toast.error((e as Error).message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!current) return;
    try {
      setSearching(true);
      setHasSearched(true);
      const { images } = await searchImages({ data: { query, count: 5 } });
      setSearchResults(images);
    } catch (e) {
      toast.error((e as Error).message || "Image search failed");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectImage = (url: string) => {
    if (!current) return;
    setDrafts((prev) => ({ ...prev, [current.id]: { ...prev[current.id], image_url: url } }));
    toast.success("Image applied — save to keep changes");
  };

  // Keyboard arrows
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (previewOpen || imagePanelOpen) return;
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
  }, [slides.length, previewOpen, imagePanelOpen]);

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isSignedIn) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6 text-center">
        <div className="space-y-3">
          <div className="font-display text-xl text-ink">Sign in to edit this deck</div>
          <Link to="/sign-in" className="inline-flex rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground shadow-glow">
            Sign in
          </Link>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6 text-center">
        <div className="space-y-3">
          <div className="text-sm text-destructive">Couldn't load this deck: {(error as Error).message}</div>
          <button onClick={() => refetch()} disabled={isFetching} className="px-4 py-1.5 rounded-full border bg-card hover:bg-accent disabled:opacity-60 text-sm">
            {isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const updateCurrent = (patch: Partial<Draft>) => {
    if (!current) return;
    setDrafts((prev) => ({ ...prev, [current.id]: { ...prev[current.id], ...patch } }));
  };

  return (
    <div className="flex flex-col bg-background h-[calc(100vh-80px)]">
      {/* Secondary editor header */}
      <header className="sticky top-0 z-30 mx-3 mt-3 rounded-xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-soft flex items-center justify-between px-4 py-2.5 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link to="/dashboard" className="p-2 rounded-full hover:bg-accent transition shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="font-display text-base text-ink truncate leading-tight">{data.project.title}</div>
            <div className="text-[11px] text-muted-foreground">
              {slides.length} slides · slide {active + 1}
              {dirty && <span className="ml-2 text-primary">• {dirtySlideIds.length} unsaved</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode toggle */}
          <div className="inline-flex rounded-full border bg-card p-0.5">
            <button
              onClick={() => { setMode("edit"); setImagePanelOpen(false); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition ${
                mode === "edit" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-ink"
              }`}
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={() => { setMode("preview"); setImagePanelOpen(false); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition ${
                mode === "preview" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-ink"
              }`}
            >
              <Eye className="w-3 h-3" /> View
            </button>
          </div>
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={slides.length === 0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card hover:bg-accent disabled:opacity-50 text-sm transition"
          >
            <Play className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !dirty}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60 text-sm transition active:scale-95"
          >
            {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {dirty ? `Save${dirtySlideIds.length > 1 ? ` (${dirtySlideIds.length})` : ""}` : "Saved"}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || slides.length === 0 || dirty}
            title={dirty ? "Save before downloading" : "Download as .pptx"}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card hover:bg-accent disabled:opacity-50 text-sm transition"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="relative flex-1 min-h-0">
        {/* Hover rail trigger */}
        <div className="absolute left-0 top-0 bottom-0 w-4 z-20" onMouseEnter={() => setRailOpen(true)} />
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
                {slides.map((s, i) => {
                  const isDirty = dirtySlideIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActive(i)}
                      className={`w-full text-left rounded-xl p-2.5 border transition group ${
                        i === active ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-accent/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 shrink-0 rounded-md bg-secondary grid place-items-center text-[11px] font-medium text-muted-foreground">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-ink truncate leading-tight">
                            {drafts[s.id]?.title || s.title || "Untitled"}
                            {isDirty && <span className="ml-1 text-primary">•</span>}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.layout}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Stage */}
        <div ref={stageRef} className="absolute inset-0 grid place-items-center px-8 py-6 overflow-hidden">
          {current && currentDraft && (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: 1600 * scale, height: 900 * scale }}
                className="relative rounded-3xl shadow-2xl ring-1 ring-border/60 bg-card overflow-hidden"
              >
                <div
                  style={{ width: 1600, height: 900, transform: `scale(${scale})`, transformOrigin: "top left" }}
                  className="relative"
                >
                  <SlideCanvas
                    mode={mode}
                    draft={currentDraft}
                    onChange={updateCurrent}
                    onImageClick={() => mode === "edit" && setImagePanelOpen(true)}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Image search panel */}
        <ImageRegenPanel
          open={imagePanelOpen && mode === "edit"}
          onClose={() => setImagePanelOpen(false)}
          currentImageUrl={currentDraft?.image_url ?? null}
          defaultPrompt={currentDraft?.title || ""}
          isSearching={searching}
          results={searchResults}
          hasSearched={hasSearched}
          onSearch={handleSearch}
          onSelect={handleSelectImage}
          selectedUrl={currentDraft?.image_url ?? null}
        />


        {/* Bottom dock */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-card/80 backdrop-blur-xl border border-border/60 shadow-soft">
            <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0}
              className="px-3 py-1 rounded-full text-xs hover:bg-accent disabled:opacity-30 transition">←</button>
            <span className="text-xs tabular-nums text-muted-foreground px-2">{active + 1} / {slides.length}</span>
            <button onClick={() => setActive(Math.min(slides.length - 1, active + 1))} disabled={active === slides.length - 1}
              className="px-3 py-1 rounded-full text-xs hover:bg-accent disabled:opacity-30 transition">→</button>
          </div>
        </div>
      </div>

      <SlidePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        slides={slides.map((s) => ({
          ...s,
          ...(drafts[s.id] ?? {}),
        })) as PreviewSlide[]}
        deckTitle={data.project.title}
        startIndex={active}
      />
    </div>
  );
}

/** Slide canvas — read-only in preview mode, fully editable in edit mode. */
function SlideCanvas({
  mode,
  draft,
  onChange,
  onImageClick,
}: {
  mode: Mode;
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onImageClick: () => void;
}) {
  const editable = mode === "edit";
  const hasImage = !!draft.image_url;

  const bodyLen = draft.body.length;
  const total = bodyLen + draft.bullets.reduce((a, b) => a + b.length, 0) + draft.bullets.length * 20;
  const tight = total > 600 || draft.bullets.length > 5;
  const titleCls = tight ? "text-5xl" : "text-6xl";
  const bodyCls = tight ? "text-lg" : "text-xl";
  const bulletCls = tight ? "text-base" : "text-lg";
  const gapCls = tight ? "gap-5" : "gap-8";
  const padCls = tight ? "p-14" : "p-20";

  const updateBullet = (i: number, v: string) => {
    const next = [...draft.bullets];
    next[i] = v;
    onChange({ bullets: next });
  };
  const deleteBullet = (i: number) => {
    onChange({ bullets: draft.bullets.filter((_, idx) => idx !== i) });
  };
  const moveBullet = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= draft.bullets.length) return;
    const next = [...draft.bullets];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ bullets: next });
  };
  const addBullet = () => onChange({ bullets: [...draft.bullets, "New bullet"] });

  const focusRing = editable
    ? "rounded-lg -mx-2 px-2 hover:bg-primary/[0.04] focus:bg-primary/[0.06] focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
    : "rounded-lg -mx-2 px-2";

  return (
    <div className="relative w-full h-full bg-card overflow-hidden">
      {hasImage && (
        <div
          className={`absolute right-0 top-0 bottom-0 w-2/5 group ${editable ? "cursor-pointer" : ""}`}
          onClick={editable ? onImageClick : undefined}
        >
          <img src={draft.image_url!} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-card/20 to-card" />
          {editable && (
            <div className="absolute inset-0 ring-0 group-hover:ring-4 ring-primary/40 transition-all pointer-events-none" />
          )}
          {editable && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs shadow-glow flex items-center gap-1.5">
              <Pencil className="w-3 h-3" /> Edit image
            </div>
          )}
        </div>
      )}
      <div className={`relative h-full ${padCls} flex flex-col justify-center ${gapCls} ${hasImage ? "max-w-[62%]" : ""}`}>
        {editable ? (
          <input
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className={`w-full bg-transparent font-display ${titleCls} text-ink leading-[1.05] tracking-tight ${focusRing}`}
            placeholder="Slide title"
          />
        ) : (
          <h2 className={`font-display ${titleCls} text-ink leading-[1.05] tracking-tight`}>
            {draft.title || <span className="text-muted-foreground/60">Untitled</span>}
          </h2>
        )}

        {(editable || draft.body) && (
          editable ? (
            <textarea
              value={draft.body}
              onChange={(e) => onChange({ body: e.target.value })}
              rows={tight ? 2 : 3}
              className={`w-full bg-transparent ${bodyCls} text-muted-foreground leading-relaxed resize-none overflow-hidden ${focusRing}`}
              placeholder="Body content…"
            />
          ) : (
            <p className={`${bodyCls} text-muted-foreground leading-relaxed`}>{draft.body}</p>
          )
        )}

        {(draft.bullets.length > 0 || editable) && (
          <ul className={`${tight ? "space-y-2" : "space-y-3"} max-w-3xl`}>
            {draft.bullets.map((b, i) => (
              <li key={i} className={`flex gap-3 ${bulletCls} text-foreground group/bullet items-start`}>
                <span className="mt-1.5 w-6 h-6 shrink-0 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-semibold">{i + 1}</span>
                {editable ? (
                  <>
                    <input
                      value={b}
                      onChange={(e) => updateBullet(i, e.target.value)}
                      className={`flex-1 bg-transparent ${focusRing}`}
                    />
                    <div className="opacity-0 group-hover/bullet:opacity-100 transition flex items-center gap-0.5 shrink-0">
                      <button onClick={() => moveBullet(i, -1)} disabled={i === 0}
                        className="p-1 rounded hover:bg-accent disabled:opacity-30" aria-label="Move up">
                        <GripVertical className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteBullet(i)}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive" aria-label="Delete bullet">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <span>{b}</span>
                )}
              </li>
            ))}
            {editable && (
              <li>
                <button onClick={addBullet}
                  className="inline-flex items-center gap-1.5 text-sm text-primary/80 hover:text-primary mt-1">
                  <Plus className="w-3.5 h-3.5" /> Add bullet
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
      <div className="absolute bottom-6 right-8 z-10 text-[13px] uppercase tracking-[0.28em] font-semibold text-primary/70 select-none pointer-events-none">
        Slide Sphere
      </div>
    </div>
  );
}
