import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, Sparkles, Wand2, Layers, Palette, Download, Zap, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Lumen — AI slide decks from a single prompt" },
      { name: "description", content: "Turn ideas into beautiful presentations in seconds. Lumen generates polished, on-brand slide decks powered by AI." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Powered by Gemini 2.5 — generate decks in seconds
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-ink">
            Presentations that <span className="italic text-gradient-ember">feel handcrafted</span>,
            <br />generated in one prompt.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Lumen turns a sentence into a polished, on-brand slide deck — structure, copy, narrative, and design, all in seconds.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/sign-up" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground shadow-glow hover:opacity-90 transition">
              Start creating free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border bg-card hover:bg-accent transition">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required · 5 free decks per month</p>
        </div>

        {/* Mock preview */}
        <div className="mt-16 mx-auto max-w-5xl">
          <div className="glass rounded-3xl border shadow-soft p-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: "The Rise of AI Workflows", body: "How teams compress weeks into minutes" },
                { title: "Three pillars of velocity", body: "• Automation\n• Composability\n• Iteration" },
                { title: "Where to start", body: "Audit. Pilot. Scale." },
              ].map((s, i) => (
                <div key={i} className="aspect-video rounded-2xl bg-card border p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-primary mb-2">Slide {i + 1}</div>
                    <div className="font-display text-lg text-ink leading-tight">{s.title}</div>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-4xl text-ink">Everything you need, nothing you don't</h2>
            <p className="mt-3 text-muted-foreground">Crafted for founders, educators, and teams that ship.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Wand2, title: "Prompt to deck", body: "A short brief becomes a structured, narrative-driven presentation." },
              { icon: Layers, title: "Smart layouts", body: "Title, content, two-column, quote, closing — chosen contextually." },
              { icon: Palette, title: "Tasteful design", body: "Editorial typography, refined palettes, subtle motion." },
              { icon: Zap, title: "Instant edits", body: "Tweak any slide inline. Re-generate sections without losing flow." },
              { icon: Download, title: "Export anywhere", body: "Copy to slides, export as PDF, or share a live link." },
              { icon: Sparkles, title: "On-brand themes", body: "Switch palettes and typography with one click." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="group rounded-2xl border bg-card p-6 hover:shadow-soft transition">
                <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center mb-4 group-hover:gradient-ember transition">
                  <Icon className="w-5 h-5 text-primary group-hover:text-white transition" />
                </div>
                <h3 className="font-display text-xl text-ink">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/40">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl text-ink">From idea to deck in three steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Describe your topic", b: "A sentence is enough. Add audience or tone for extra polish." },
              { n: "02", t: "Let Lumen draft", b: "Our AI writes the narrative, structure, and copy in seconds." },
              { n: "03", t: "Refine and ship", b: "Edit inline, swap themes, export or share." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl border bg-card p-7">
                <div className="font-display text-5xl text-gradient-ember">{s.n}</div>
                <h3 className="mt-3 font-display text-xl text-ink">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl text-ink">Simple pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Starter", price: "$0", desc: "For exploring the magic.", feats: ["5 decks / month", "Up to 10 slides", "Standard themes"] },
              { name: "Pro", price: "$19", featured: true, desc: "For makers and educators.", feats: ["Unlimited decks", "Up to 20 slides", "All themes & exports", "Priority generation"] },
              { name: "Team", price: "$49", desc: "For collaborative teams.", feats: ["Everything in Pro", "Shared workspace", "Brand kits", "Analytics"] },
            ].map((p) => (
              <div key={p.name} className={`rounded-2xl border p-7 ${p.featured ? "gradient-ember text-white shadow-glow border-transparent" : "bg-card"}`}>
                <div className={`text-sm ${p.featured ? "text-white/80" : "text-muted-foreground"}`}>{p.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-5xl">{p.price}</span>
                  <span className={p.featured ? "text-white/80" : "text-muted-foreground"}>/mo</span>
                </div>
                <p className={`mt-2 text-sm ${p.featured ? "text-white/80" : "text-muted-foreground"}`}>{p.desc}</p>
                <ul className="mt-6 space-y-2">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 ${p.featured ? "text-white" : "text-primary"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/sign-up"
                  className={`mt-7 block text-center rounded-full px-5 py-2.5 text-sm font-medium transition ${p.featured ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                >
                  {p.featured ? "Start Pro" : "Get started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-10 px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Lumen. Crafted with care.</p>
      </footer>
    </div>
  );
}
