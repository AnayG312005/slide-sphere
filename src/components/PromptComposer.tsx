import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { toast } from "sonner";
import { Wand2, Paperclip, X, Crown } from "lucide-react";
import { GenerationModal } from "./GenerationModal";
import { useHasUnlimited } from "@/lib/billing";

const SLIDE_BUCKETS = [
  { label: "0–3", value: 3, premium: false },
  { label: "3–6", value: 6, premium: false },
  { label: "6–9", value: 9, premium: false },
  { label: "9–12", value: 12, premium: false },
  { label: "12–15", value: 15, premium: true },
] as const;

interface Props {
  onCreated?: () => void;
  compact?: boolean;
}

export function PromptComposer({ compact = false }: Props) {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [slideValue, setSlideValue] = useState<number>(9);
  const [file, setFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const hasUnlimited = useHasUnlimited();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoaded && !isSignedIn) {
      toast.info("Sign up to generate your deck");
      navigate({ to: "/sign-up" });
      return;
    }
    if (prompt.trim().length < 3 && !file) {
      toast.error("Describe your topic or attach a file");
      return;
    }
    setModalOpen(true);
  };

  const onFile = (f: File | null) => {
    if (!f) return setFile(null);
    const ok = ["application/pdf", "image/jpeg", "image/jpg"].includes(f.type) || /\.(pdf|jpe?g)$/i.test(f.name);
    if (!ok) { toast.error("Only PDF, JPG, or JPEG files supported"); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    setFile(f);
  };

  const composedTopic = file ? `${prompt.trim()}\n\n(Source document attached: ${file.name})` : prompt.trim();

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={`glass border rounded-3xl shadow-soft overflow-hidden ${compact ? "" : "shadow-glow"}`}
      >
        <div className="p-5 sm:p-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your presentation… e.g. 'AI in healthcare for hospital CIOs, focused on ROI'"
            rows={compact ? 3 : 4}
            className="w-full resize-none bg-transparent text-base sm:text-lg text-ink placeholder:text-muted-foreground/80 focus:outline-none"
            maxLength={1000}
          />
          {file && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border text-xs text-ink">
              <Paperclip className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-[200px]">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="border-t bg-secondary/40 px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full bg-card border p-1 shadow-sm">
              {SLIDE_BUCKETS.map((b) => {
                const active = slideValue === b.value;
                const locked = b.premium && !hasUnlimited;
                const onClick = () => {
                  if (locked) {
                    toast.info("Upgrade to Unlimited Plan for only $1/month to unlock 12–15 slide presentations.");
                    navigate({ to: "/pricing" });
                    return;
                  }
                  setSlideValue(b.value);
                };
                return (
                  <button
                    key={b.value} type="button"
                    onClick={onClick}
                    title={locked ? "Premium — Unlimited plan" : undefined}
                    className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition inline-flex items-center gap-1 ${
                      b.premium
                        ? active
                          ? "bg-gradient-to-r from-amber-400 to-fuchsia-500 text-white shadow-glow"
                          : "bg-gradient-to-r from-amber-400/15 to-fuchsia-500/15 text-ink hover:from-amber-400/25 hover:to-fuchsia-500/25 ring-1 ring-amber-400/40"
                        : active
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:text-ink"
                    }`}
                  >
                    {b.premium && <Crown className={`w-3 h-3 ${active ? "text-white" : "text-amber-500"}`} />}
                    {b.label}
                    {b.premium && (
                      <span className={`ml-0.5 text-[9px] uppercase tracking-wider font-semibold ${active ? "text-white/90" : "text-amber-600"}`}>
                        Premium
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button" onClick={() => fileInput.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border text-xs text-ink hover:bg-accent transition"
            >
              <Paperclip className="w-3.5 h-3.5" /> Attach PDF / JPG
            </button>
            <input
              ref={fileInput} type="file"
              accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow-glow hover:opacity-90 transition"
          >
            <Wand2 className="w-4 h-4" /> Generate deck
          </button>
        </div>
      </form>

      <GenerationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPrompt={composedTopic}
        initialSlideCount={slideValue}
        isPremium={!!isPremiumPlan}
      />
    </>
  );
}
