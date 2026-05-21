import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Wand2, Crown } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { generateOutline, finalizeDeck } from "@/lib/generate.functions";
import { OutlineEditor, type OutlineSlide } from "./OutlineEditor";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const STYLES = [
  { id: "modern-corporate", name: "Modern Corporate", desc: "Clean grids, restrained palette" },
  { id: "glassmorphism", name: "Glassmorphism", desc: "Frosted layers, soft glow" },
  { id: "minimal-clean", name: "Minimal Clean", desc: "Lots of whitespace, type-led" },
  { id: "dark-futuristic", name: "Dark Futuristic", desc: "High contrast, neon accents", premium: true },
  { id: "startup-pitch", name: "Startup Pitch Deck", desc: "Bold callouts, metric-focused" },
  { id: "creative-gradient", name: "Creative Gradient", desc: "Vibrant gradients, expressive", premium: true },
] as const;

const DENSITIES = [
  { id: "minimal", name: "Minimal", desc: "1-2 bullets / slide" },
  { id: "concise", name: "Concise", desc: "3-5 bullets / slide" },
  { id: "extensive", name: "Extensive", desc: "Full body + 4-6 bullets" },
] as const;

type StyleId = typeof STYLES[number]["id"];
type DensityId = typeof DENSITIES[number]["id"];

interface Props {
  open: boolean;
  onClose: () => void;
  initialPrompt: string;
  initialSlideCount: number;
  isPremium: boolean;
}

export function GenerationModal({ open, onClose, initialPrompt, initialSlideCount, isPremium }: Props) {
  const navigate = useNavigate();
  const outlineFn = useServerFn(generateOutline);
  const finalizeFn = useServerFn(finalizeDeck);

  const [step, setStep] = useState<"config" | "outline" | "generating">("config");
  const [style, setStyle] = useState<StyleId>("modern-corporate");
  const [density, setDensity] = useState<DensityId>("concise");
  const [outline, setOutline] = useState<{ deckTitle: string; description: string; slides: OutlineSlide[] } | null>(null);

  const outlineMut = useMutation({
    mutationFn: () => outlineFn({ data: { topic: initialPrompt, tone: "professional", slideCount: initialSlideCount, style, density } }),
    onSuccess: (res) => {
      setOutline({
        deckTitle: res.deckTitle,
        description: res.description ?? "",
        slides: res.slides.map((s, i) => ({ id: `s-${i}-${Date.now()}`, title: s.title, summary: s.summary ?? "", layout: s.layout })),
      });
      setStep("outline");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const finalizeMut = useMutation({
    mutationFn: () => {
      if (!outline) throw new Error("Missing outline");
      return finalizeFn({ data: {
        topic: initialPrompt, tone: "professional", style, density,
        deckTitle: outline.deckTitle, description: outline.description,
        slides: outline.slides.map(s => ({ title: s.title, summary: s.summary, layout: s.layout })),
      }});
    },
    onSuccess: (res) => {
      toast.success(`Deck created! ${res.creditsRemaining} credits left.`);
      onClose();
      navigate({ to: "/editor/$id", params: { id: res.projectId } });
    },
    onError: (e: Error) => {
      if (e.message.startsWith("INSUFFICIENT_CREDITS")) {
        toast.error("Out of credits — upgrade to continue", { action: { label: "Upgrade", onClick: () => navigate({ to: "/pricing" }) }});
      } else { toast.error(e.message); }
      setStep("outline");
    },
  });

  const onStart = () => {
    if (!isPremium && STYLES.find(s => s.id === style)?.premium) {
      toast.error("This style is premium-only. Pick another or upgrade."); return;
    }
    setStep("generating");
    outlineMut.mutate();
  };

  const onFinalize = () => {
    setStep("generating");
    finalizeMut.mutate();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-card border rounded-3xl shadow-glow flex flex-col"
            initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <div className="grid place-items-center w-8 h-8 rounded-full gradient-ember shadow-glow">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-ink">
                    {step === "config" ? "Configure your deck" : step === "outline" ? "Edit the outline" : "Generating…"}
                  </h2>
                  <p className="text-xs text-muted-foreground">Step {step === "config" ? "1" : step === "outline" ? "2" : "3"} of 3</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-accent" disabled={finalizeMut.isPending}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6 flex-1">
              {step === "config" && (
                <div className="space-y-7">
                  <section>
                    <h3 className="text-sm font-medium text-ink mb-3">Presentation style</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {STYLES.map(s => {
                        const locked = s.premium && !isPremium;
                        const active = style === s.id;
                        return (
                          <button
                            key={s.id} type="button"
                            onClick={() => setStyle(s.id)}
                            className={`text-left p-3.5 rounded-2xl border transition relative ${
                              active ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:border-primary/40"
                            } ${locked ? "opacity-60" : ""}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-ink text-sm">{s.name}</span>
                              {s.premium && <Crown className="w-3 h-3 text-primary" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{s.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-medium text-ink mb-3">Content density</h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      {DENSITIES.map(d => (
                        <button
                          key={d.id} type="button"
                          onClick={() => setDensity(d.id)}
                          className={`text-left p-3.5 rounded-2xl border transition ${
                            density === d.id ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="font-medium text-ink text-sm">{d.name}</div>
                          <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  <div className="rounded-2xl bg-secondary/60 border p-4">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Your prompt</div>
                    <p className="text-sm text-ink line-clamp-3">{initialPrompt || "—"}</p>
                    <p className="text-xs text-muted-foreground mt-2">{initialSlideCount} slides · costs 5 credits</p>
                  </div>
                </div>
              )}

              {step === "outline" && outline && (
                <OutlineEditor
                  deckTitle={outline.deckTitle}
                  description={outline.description}
                  slides={outline.slides}
                  onChange={(next) => setOutline({ ...outline, ...next })}
                />
              )}

              {step === "generating" && (
                <div className="py-10 grid place-items-center">
                  <div className="text-center max-w-sm">
                    <div className="mx-auto mb-5 w-14 h-14 rounded-2xl gradient-ember grid place-items-center shadow-glow">
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                    </div>
                    <h3 className="font-display text-2xl text-ink">
                      {outlineMut.isPending ? "Drafting your outline…" : "Generating presentation…"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {outlineMut.isPending ? "Slide Sphere is structuring the narrative arc." : "Writing content and fetching visuals for each slide."}
                    </p>
                    <div className="mt-6 space-y-2.5">
                      {[0,1,2].map(i => (
                        <div key={i} className="h-3 rounded-full bg-secondary overflow-hidden">
                          <motion.div
                            className="h-full gradient-ember"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                            style={{ width: "40%" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 p-5 border-t bg-secondary/30">
              <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-ink" disabled={finalizeMut.isPending}>
                Cancel
              </button>
              {step === "config" && (
                <button onClick={onStart} disabled={!initialPrompt}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50">
                  <Wand2 className="w-4 h-4" /> Generate outline
                </button>
              )}
              {step === "outline" && (
                <div className="flex gap-2">
                  <button onClick={() => setStep("config")} className="px-4 py-2.5 rounded-full border text-sm hover:bg-accent">Back</button>
                  <button onClick={onFinalize}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow-glow hover:opacity-90">
                    <Sparkles className="w-4 h-4" /> Generate presentation (−5 credits)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
