import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getProject, updateSlide } from "@/lib/projects.functions";
import { ChevronLeft, ChevronRight, Loader2, Save, ArrowLeft, Play } from "lucide-react";
import { toast } from "sonner";
import { SlidePreview, type PreviewSlide } from "@/components/SlidePreview";

export const Route = createFileRoute("/_authenticated/editor/$id")({
  component: Editor,
  head: () => ({ meta: [{ title: "Editor — Lumen" }] }),
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
  const fetchProject = useServerFn(getProject);
  const save = useServerFn(updateSlide);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject({ data: { id } }),
  });
  const [active, setActive] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draft, setDraft] = useState<{ title: string; body: string; notes: string } | null>(null);

  const slides = (data?.slides ?? []) as Slide[];
  const current = slides[active];

  useEffect(() => {
    if (current) {
      setDraft({
        title: current.title ?? "",
        body: current.body ?? "",
        notes: current.notes ?? "",
      });
    }
  }, [current?.id]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: { id: current!.id, ...draft! } }),
    onSuccess: () => { toast.success("Saved"); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="p-2 rounded-full hover:bg-accent">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-2xl text-ink truncate">{data.project.title}</h1>
            <p className="text-xs text-muted-foreground">{slides.length} slides</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={slides.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card hover:bg-accent disabled:opacity-50 text-sm"
          >
            <Play className="w-4 h-4" /> Preview
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !draft}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60 text-sm"
          >
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_320px] gap-5">
        {/* Slide list */}
        <aside className="rounded-2xl border bg-card p-3 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className={`w-full text-left rounded-xl p-3 border transition ${i === active ? "border-primary bg-primary/5" : "border-transparent hover:bg-accent"}`}
              >
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Slide {i + 1}</div>
                <div className="text-sm text-ink line-clamp-2">{s.title ?? "Untitled"}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <section>
          {current && draft && (
            <div className="space-y-4">
              <div className="aspect-video rounded-3xl border bg-card p-10 sm:p-14 shadow-soft flex flex-col justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: "radial-gradient(at top right, oklch(0.85 0.1 50 / 0.5), transparent 60%)" }} />
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-widest text-primary mb-3">{current.layout}</div>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="w-full bg-transparent font-display text-3xl sm:text-5xl text-ink leading-tight focus:outline-none"
                    placeholder="Slide title"
                  />
                  <textarea
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    rows={4}
                    className="mt-5 w-full bg-transparent text-base text-muted-foreground focus:outline-none resize-none"
                    placeholder="Body content…"
                  />
                  {current.bullets && current.bullets.length > 0 && (
                    <ul className="mt-4 space-y-1.5">
                      {current.bullets.map((b, i) => (
                        <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary">•</span>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActive(Math.max(0, active - 1))}
                  disabled={active === 0}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full border bg-card hover:bg-accent disabled:opacity-40 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm text-muted-foreground">{active + 1} / {slides.length}</span>
                <button
                  onClick={() => setActive(Math.min(slides.length - 1, active + 1))}
                  disabled={active === slides.length - 1}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full border bg-card hover:bg-accent disabled:opacity-40 text-sm"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Inspector */}
        <aside className="rounded-2xl border bg-card p-5 h-fit">
          <h3 className="font-display text-lg text-ink mb-3">Speaker notes</h3>
          {draft && (
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={10}
              className="w-full rounded-xl border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Add presenter notes…"
            />
          )}
          <p className="mt-3 text-xs text-muted-foreground">Notes are saved to this slide.</p>
        </aside>
      </div>

      <SlidePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        slides={slides as PreviewSlide[]}
        deckTitle={data.project.title}
        startIndex={active}
      />
    </main>
  );
}
