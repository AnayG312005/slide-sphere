import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { generateDeck } from "@/lib/generate.functions";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/new")({
  component: NewDeck,
  head: () => ({ meta: [{ title: "New deck — Lumen" }] }),
});

const TONES = ["professional", "casual", "academic", "persuasive", "inspirational"] as const;
type Tone = typeof TONES[number];

function NewDeck() {
  const router = useRouter();
  const gen = useServerFn(generateDeck);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [slideCount, setSlideCount] = useState(8);

  const mut = useMutation({
    mutationFn: () => gen({ data: { topic, audience: audience || undefined, tone, slideCount, theme: "warm-sand" } }),
    onSuccess: (res) => {
      toast.success("Deck created!");
      router.navigate({ to: "/editor/$id", params: { id: res.projectId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border text-xs text-muted-foreground mb-4">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> AI deck generator
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-ink">What should we present today?</h1>
        <p className="mt-3 text-muted-foreground">Describe your topic. Lumen handles the rest.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (topic.length < 3) { toast.error("Tell us a bit more about the topic"); return; } mut.mutate(); }}
        className="glass border rounded-3xl p-6 sm:p-8 shadow-soft space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Topic</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The future of remote work and async collaboration"
            rows={3}
            className="w-full rounded-2xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            disabled={mut.isPending}
            maxLength={300}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Audience <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. startup founders"
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={mut.isPending}
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
              disabled={mut.isPending}
            >
              {TONES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="flex justify-between text-sm font-medium text-ink mb-2">
            Number of slides <span className="text-primary font-display text-base">{slideCount}</span>
          </label>
          <input
            type="range" min={3} max={20} value={slideCount}
            onChange={(e) => setSlideCount(Number(e.target.value))}
            className="w-full accent-primary"
            disabled={mut.isPending}
          />
        </div>

        <button
          type="submit"
          disabled={mut.isPending || topic.length < 3}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {mut.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating your deck…</>
          ) : (
            <><Wand2 className="w-4 h-4" /> Generate deck</>
          )}
        </button>
        {mut.isPending && (
          <p className="text-center text-xs text-muted-foreground">This typically takes 10–20 seconds.</p>
        )}
      </form>
    </main>
  );
}
