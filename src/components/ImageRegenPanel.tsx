import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

export type ImageStyle = "illustration" | "photo" | "abstract" | "3d" | "line-art";

const STYLE_OPTIONS: { key: ImageStyle; label: string; desc: string }[] = [
  { key: "illustration", label: "Illustration", desc: "Editorial, flat" },
  { key: "photo", label: "Photo Realistic", desc: "Stock photo look" },
  { key: "abstract", label: "Abstract", desc: "Shapes & color" },
  { key: "3d", label: "3D Render", desc: "Studio lit" },
  { key: "line-art", label: "Line Art", desc: "Minimal mono" },
];

export function ImageRegenPanel({
  open,
  onClose,
  currentImageUrl,
  defaultPrompt,
  isGenerating,
  onGenerate,
}: {
  open: boolean;
  onClose: () => void;
  currentImageUrl: string | null;
  defaultPrompt: string;
  isGenerating: boolean;
  onGenerate: (prompt: string, style: ImageStyle) => void;
}) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [style, setStyle] = useState<ImageStyle>("illustration");

  useEffect(() => { if (open) setPrompt(defaultPrompt); }, [open, defaultPrompt]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-3 top-3 bottom-3 z-40 w-80 rounded-2xl border border-border/60 bg-card/85 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-ink">AI Image</div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-accent transition" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentImageUrl && (
              <div className="aspect-video rounded-lg overflow-hidden ring-1 ring-border/60">
                <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="Describe the image you want…"
                className="w-full text-sm rounded-lg border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStyle(s.key)}
                    className={`text-left rounded-lg border px-2.5 py-2 transition ${
                      style === s.key
                        ? "border-primary/60 bg-primary/5 ring-1 ring-primary/40"
                        : "border-border hover:bg-accent/60"
                    }`}
                  >
                    <div className="text-[12px] font-medium text-ink">{s.label}</div>
                    <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <footer className="p-3 border-t border-border/50">
            <button
              onClick={() => onGenerate(prompt.trim(), style)}
              disabled={isGenerating || prompt.trim().length < 3}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-2 text-sm shadow-glow hover:opacity-90 disabled:opacity-60 transition active:scale-[0.98]"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate New Image
            </button>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
