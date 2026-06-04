import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, X, ImageOff, Check } from "lucide-react";
import { useEffect, useState } from "react";

export type ImageStyle = "illustration" | "photo" | "abstract" | "3d" | "line-art";

export type StockImage = {
  url: string;
  thumb: string;
  source: "pexels" | "unsplash";
  credit: string;
  link: string;
};

const STYLE_OPTIONS: { key: ImageStyle; label: string; desc: string; hint: string }[] = [
  { key: "illustration", label: "Illustration", desc: "Editorial, flat", hint: "illustration" },
  { key: "photo", label: "Photo Realistic", desc: "Stock photo look", hint: "photograph" },
  { key: "abstract", label: "Abstract", desc: "Shapes & color", hint: "abstract" },
  { key: "3d", label: "3D Render", desc: "Studio lit", hint: "3d render" },
  { key: "line-art", label: "Line Art", desc: "Minimal mono", hint: "line art minimal" },
];

export function ImageRegenPanel({
  open,
  onClose,
  currentImageUrl,
  defaultPrompt,
  isSearching,
  results,
  hasSearched,
  onSearch,
  onSelect,
  selectedUrl,
}: {
  open: boolean;
  onClose: () => void;
  currentImageUrl: string | null;
  defaultPrompt: string;
  isSearching: boolean;
  results: StockImage[];
  hasSearched: boolean;
  onSearch: (query: string) => void;
  onSelect: (url: string) => void;
  selectedUrl: string | null;
}) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [style, setStyle] = useState<ImageStyle>("photo");

  useEffect(() => { if (open) setPrompt(defaultPrompt); }, [open, defaultPrompt]);

  const submit = () => {
    const base = prompt.trim();
    if (base.length < 2) return;
    const hint = STYLE_OPTIONS.find((s) => s.key === style)?.hint ?? "";
    onSearch(`${base} ${hint}`.trim());
  };

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
              <Search className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-ink">Find Image</div>
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
                Search prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={3}
                placeholder="e.g. mountain sunrise, team meeting…"
                className="w-full text-sm rounded-lg border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">Press Enter to search.</p>
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

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Results
              </label>

              {isSearching && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}

              {!isSearching && results.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {results.map((img) => {
                    const active = selectedUrl === img.url;
                    return (
                      <button
                        key={img.url}
                        onClick={() => onSelect(img.url)}
                        className={`group relative aspect-video rounded-lg overflow-hidden ring-1 transition ${
                          active
                            ? "ring-2 ring-primary"
                            : "ring-border/60 hover:ring-primary/60"
                        }`}
                        title={`${img.credit} · ${img.source}`}
                      >
                        <img
                          src={img.thumb}
                          alt={img.credit}
                          loading="lazy"
                          className="w-full h-full object-cover transition group-hover:scale-[1.03]"
                        />
                        {active && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 px-1.5 py-0.5 text-[9px] text-white/90 bg-gradient-to-t from-black/70 to-transparent truncate">
                          {img.credit} · {img.source}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!isSearching && hasSearched && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <ImageOff className="w-5 h-5" />
                  <p className="text-xs">No images found. Try another prompt.</p>
                </div>
              )}

              {!isSearching && !hasSearched && (
                <p className="text-xs text-muted-foreground py-2">
                  Enter a prompt above to fetch 5 stock images.
                </p>
              )}
            </div>
          </div>

          <footer className="p-3 border-t border-border/50">
            <button
              onClick={submit}
              disabled={isSearching || prompt.trim().length < 2}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-2 text-sm shadow-glow hover:opacity-90 disabled:opacity-60 transition active:scale-[0.98]"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search Images
            </button>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
