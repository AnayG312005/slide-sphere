import { createFileRoute, Link } from "@tanstack/react-router";
import { PricingTable } from "@clerk/tanstack-react-start";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Crown, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Slide Sphere" },
      { name: "description", content: "Unlock 12–15 slide presentations with the Unlimited plan for just $1/month." },
      { property: "og:title", content: "Pricing — Slide Sphere" },
      { property: "og:description", content: "Unlock 12–15 slide presentations with the Unlimited plan for just $1/month." },
    ],
  }),
});

function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border text-xs text-muted-foreground mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Plans & pricing
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-ink leading-[1.05]">
            Simple, <span className="italic text-gradient-ember">unlimited</span> pricing.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Free decks up to 12 slides. Upgrade to <span className="inline-flex items-center gap-1 font-medium text-ink"><Crown className="w-3.5 h-3.5 text-primary" /> Unlimited</span> for $1/month
            to unlock 12–15 slide presentations and premium perks.
          </p>
        </div>

        <div className="glass border rounded-3xl p-4 sm:p-6 shadow-soft">
          <PricingTable />
        </div>

        <div className="mt-10 text-center text-sm text-muted-foreground">
          Already subscribed? <Link to="/dashboard" className="text-primary hover:underline">Go to your dashboard</Link>.
        </div>
      </main>
      <Footer />
    </div>
  );
}
