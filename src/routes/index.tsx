import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { PromptComposer } from "@/components/PromptComposer";
import { LogoMarquee } from "@/components/LogoMarquee";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Sparkles, Wand2, Layers, Palette, Download, Zap, Star, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Slide Sphere — AI slide decks from a single prompt" },
      { name: "description", content: "Turn ideas into beautiful presentations in seconds. Slide Sphere generates polished, on-brand slide decks powered by AI." },
    ],
  }),
});

function Landing() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Restrict signed-in users from the marketing home — push to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) navigate({ to: "/dashboard" });
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-14 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Powered by Gemini 2.5 — decks in seconds
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-ink">
            Presentations that <span className="italic text-gradient-ember">feel handcrafted</span>,
            <br />generated in one prompt.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Describe your idea, attach a document, choose your length. Slide Sphere does the rest.
          </p>
        </div>
      </section>

      {/* Prompt input */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mx-auto max-w-3xl">
          <PromptComposer />
          <p className="text-center mt-4 text-xs text-muted-foreground">
            Free plan · No credit card · 5 decks / month
          </p>
        </div>
      </section>

      {/* Cinematic video */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="relative rounded-3xl overflow-hidden shadow-glow border bg-black aspect-video">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-95"
              poster="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=80"
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/70">Live preview</div>
                <div className="font-display text-2xl sm:text-3xl">Watch Slide Sphere design a deck in real-time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LogoMarquee />

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-4xl sm:text-5xl text-ink">Everything you need, nothing you don't</h2>
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
            ].map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="group rounded-2xl border bg-card p-6 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-11 h-11 rounded-xl bg-secondary grid place-items-center mb-4 group-hover:gradient-ember transition">
                  <Icon className="w-5 h-5 text-primary group-hover:text-white transition" />
                </div>
                <h3 className="font-display text-xl text-ink">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl gradient-ember p-12 sm:p-16 text-center shadow-glow">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.05]">
                Your next deck is one sentence away.
              </h2>
              <p className="mt-5 text-white/90 max-w-xl mx-auto">
                Join thousands of founders, educators, and storytellers who've replaced hours of slide work with seconds.
              </p>
              <Link
                to="/sign-up"
                className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-primary font-medium hover:bg-white/90 transition shadow-lg"
              >
                Start creating free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/40">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl sm:text-5xl text-ink">Loved by makers everywhere</h2>
            <p className="mt-3 text-muted-foreground">A few words from people shipping with Slide Sphere.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Sarah Chen", role: "Founder, Northwind", avatar: "https://i.pravatar.cc/100?img=47", quote: "I built our entire seed pitch in 12 minutes. Investors thought we hired a design studio." },
              { name: "Marcus Diallo", role: "Professor, MIT", avatar: "https://i.pravatar.cc/100?img=12", quote: "Slide Sphere turned my course notes into beautiful lecture decks. My students actually look up now." },
              { name: "Priya Raman", role: "PM, Globex", avatar: "https://i.pravatar.cc/100?img=32", quote: "Quarterly reviews used to eat my weekend. Now I prompt, polish, and present. Magic." },
              { name: "Tom Becker", role: "Indie hacker", avatar: "https://i.pravatar.cc/100?img=15", quote: "The typography alone is worth the price. Feels like Apple keynote, runs in a browser." },
              { name: "Aisha Khan", role: "Sales lead, Acme", avatar: "https://i.pravatar.cc/100?img=38", quote: "I generate a custom pitch for every prospect now. Close rate is up 28%." },
              { name: "Lukas Meyer", role: "Designer", avatar: "https://i.pravatar.cc/100?img=68", quote: "Even as a designer, the layouts surprise me. Tasteful defaults, full control when I want it." },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl bg-card border p-7 hover:shadow-soft transition">
                <div className="flex gap-0.5 mb-4">
                  {[0,1,2,3,4].map(i => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-ink leading-relaxed">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                  <div>
                    <div className="text-sm font-medium text-ink">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Faq />

      <Footer />
    </div>
  );
}
