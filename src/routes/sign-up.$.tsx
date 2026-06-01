import { createFileRoute, Link } from "@tanstack/react-router";
import { SignUp } from "@clerk/tanstack-react-start";
import { Sparkles, Wand2, Layers, ShieldCheck, Zap, Star } from "lucide-react";

export const Route = createFileRoute("/sign-up/$")({
  component: SignUpPage,
  head: () => ({ meta: [{ title: "Sign up — Slide Sphere" }] }),
});

function SignUpPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-[460px] h-[460px] rounded-full bg-[oklch(0.78_0.12_45)]/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-[oklch(0.85_0.08_70)]/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="grid place-items-center w-9 h-9 rounded-full gradient-ember shadow-glow transition-transform group-hover:rotate-12">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-2xl text-ink">Slide Sphere</span>
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — pitch */}
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border text-xs text-muted-foreground mb-6">
            <Zap className="w-3.5 h-3.5 text-primary" />
            50 free credits on signup
          </div>
          <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] text-ink">
            Start shaping <span className="italic text-gradient-ember">beautiful</span> decks
            <br /> in seconds.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg">
            Join thousands of teams using Slide Sphere to turn raw ideas into polished, on-brand presentations.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-lg">
            {[
              { icon: Wand2, label: "One-prompt generation" },
              { icon: Layers, label: "Editable AI outlines" },
              { icon: ShieldCheck, label: "Private by default" },
              { icon: Sparkles, label: "Designer-grade themes" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="glass border rounded-2xl px-4 py-3 flex items-center gap-3 shadow-soft hover:-translate-y-0.5 hover:shadow-glow transition"
              >
                <div className="w-8 h-8 rounded-lg gradient-ember grid place-items-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-ink font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Trust */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {["A", "K", "M", "S"].map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-background grid place-items-center text-[10px] text-white font-medium"
                    style={{ background: `oklch(${0.6 + i * 0.04} 0.16 ${30 + i * 12})` }}
                  >
                    {c}
                  </div>
                ))}
              </div>
              <span>20k+ creators</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
              <span className="ml-1.5">4.9 / 5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              SOC2 ready
            </div>
          </div>
        </div>

        {/* Right — Clerk card */}
        <div className="relative animate-fade-in">
          <div className="absolute -inset-1 rounded-3xl gradient-ember opacity-30 blur-2xl" />
          <div className="relative glass border rounded-3xl p-6 sm:p-8 shadow-soft">
            <div className="text-center mb-5">
              <h2 className="font-display text-2xl text-ink">Create your account</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Free forever. No credit card required.
              </p>
            </div>
            <div className="flex justify-center">
              <SignUp
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
                forceRedirectUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none border-0 p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "border border-border hover:bg-accent transition rounded-xl",
                    formButtonPrimary:
                      "bg-primary hover:opacity-90 shadow-glow rounded-xl normal-case",
                    footerAction: "text-muted-foreground",
                    formFieldInput: "rounded-xl border-border",
                  },
                }}
              />
            </div>
            <p className="text-[11px] text-center text-muted-foreground mt-6">
              By signing up you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
