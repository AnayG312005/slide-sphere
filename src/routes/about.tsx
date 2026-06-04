import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Pencil,
  LayoutTemplate,
  LayoutDashboard,
  Download,
  Coins,
  ShieldCheck,
  Users,
  GraduationCap,
  Briefcase,
  Megaphone,
  TrendingUp,
  Rocket,
  Microscope,
  Stethoscope,
  Cpu,
  ArrowRight,
  Target,
  Eye,
  Lightbulb,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About Slide Sphere — AI-powered presentations, reimagined" },
      {
        name: "description",
        content:
          "Learn the mission, vision and story behind Slide Sphere — the AI presentation platform that turns ideas into polished, editable decks in seconds.",
      },
      { property: "og:title", content: "About Slide Sphere" },
      {
        property: "og:description",
        content:
          "The mission, features, and roadmap behind Slide Sphere — the AI-powered presentation generator.",
      },
    ],
  }),
});

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16">
      <div className="mx-auto max-w-5xl">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border text-[11px] uppercase tracking-widest text-muted-foreground mb-4">
            <Sparkles className="w-3 h-3 text-primary" />
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-3xl sm:text-4xl text-ink mb-6">{title}</h2>
        <div className="text-muted-foreground leading-relaxed space-y-4">{children}</div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass border rounded-2xl p-5 hover:border-primary/40 transition">
      <div className="grid place-items-center w-10 h-10 rounded-xl gradient-ember shadow-glow mb-3">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-display text-lg text-ink mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

function IndustryPill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border bg-card text-sm text-ink hover:bg-accent transition">
      <Icon className="w-4 h-4 text-primary" />
      {label}
    </div>
  );
}

function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-14 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            About Slide Sphere
          </div>
          <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] text-ink">
            Presentations, <span className="italic text-gradient-ember">reimagined</span> by AI.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Slide Sphere is an AI-powered presentation generation platform that helps
            anyone turn an idea into a polished, fully editable deck in seconds — no
            design skills required.
          </p>
        </div>
      </section>

      {/* Intro */}
      <Section eyebrow="Introduction" title="What is Slide Sphere?">
        <p>
          Slide Sphere is a modern, AI-first presentation builder. You describe a topic
          or upload a source document, choose a length, and our generation pipeline
          drafts a coherent narrative, structures it into slides, writes the copy, and
          assembles tasteful layouts and typography around it. The result is a deck
          that looks handcrafted but takes seconds to produce.
        </p>
        <p>
          Every slide is fully editable. Change a title, rewrite a bullet, swap an
          image from our stock library, or restyle the layout — Slide Sphere is a
          generator and an editor in one.
        </p>
      </Section>

      {/* Mission & Vision */}
      <section className="px-4 sm:px-6 lg:px-8 py-10">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-2 gap-4">
          <div className="glass border rounded-3xl p-6">
            <div className="grid place-items-center w-10 h-10 rounded-xl gradient-ember shadow-glow mb-3">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-display text-2xl text-ink mb-2">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              Free people from the busywork of building slides so they can focus on
              the message. We believe great ideas shouldn't be bottlenecked by
              formatting, alignment, or hunting for stock images.
            </p>
          </div>
          <div className="glass border rounded-3xl p-6">
            <div className="grid place-items-center w-10 h-10 rounded-xl gradient-ember shadow-glow mb-3">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-display text-2xl text-ink mb-2">Our Vision</h3>
            <p className="text-muted-foreground leading-relaxed">
              A world where every student, founder, marketer and educator has a
              personal design team in their pocket — one that turns intent into
              beautiful, on-brand presentations in a single prompt.
            </p>
          </div>
        </div>
      </section>

      {/* Why we built it */}
      <Section eyebrow="The story" title="Why Slide Sphere was created">
        <p>
          Building a good presentation has always been disproportionately painful.
          You start with an idea, then spend hours fighting layout grids, hunting for
          icons, rewriting bullet points, and rebuilding the same title slide for the
          thousandth time. Most existing tools either generate generic, soulless
          decks or hand you a blank canvas and walk away.
        </p>
        <p>
          We built Slide Sphere to close that gap — a tool that respects your time
          like an AI generator, but respects your taste like a real design system.
        </p>
        <h3 className="font-display text-xl text-ink mt-6">Real-world problems we solve</h3>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Hours spent on layout, alignment, and formatting that should take minutes.</li>
          <li>Writer's block when staring at a blank title slide.</li>
          <li>Searching for tasteful stock imagery across half a dozen sites.</li>
          <li>Inconsistent themes and typography across long decks.</li>
          <li>Re-doing the same deck for a slightly different audience.</li>
          <li>Teams without a designer producing decks that look amateurish.</li>
        </ul>
      </Section>

      {/* Key Features */}
      <Section eyebrow="What's inside" title="Key features">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 not-prose">
          <FeatureCard icon={Wand2} title="AI Presentation Generation">
            One prompt becomes a structured, narrative-driven deck — title, sections,
            content, and closing — in seconds.
          </FeatureCard>
          <FeatureCard icon={Sparkles} title="AI Content Creation">
            Large language models draft slide copy, bullet points, and speaker notes
            tuned to your topic and audience.
          </FeatureCard>
          <FeatureCard icon={ImageIcon} title="Smart Image Selection">
            Search curated stock libraries (Pexels, Unsplash) directly inside the
            editor and pick the perfect visual per slide.
          </FeatureCard>
          <FeatureCard icon={Pencil} title="Full PPT Editing">
            Edit every title, body, bullet, image and layout after generation — no
            credits charged for refining an existing deck.
          </FeatureCard>
          <FeatureCard icon={LayoutTemplate} title="Template & Theme Selection">
            Choose tasteful, professionally designed themes that keep typography and
            spacing consistent across every slide.
          </FeatureCard>
          <FeatureCard icon={LayoutDashboard} title="Dashboard Management">
            All your decks in one place. Search, sort, duplicate, rename and
            jump back into editing in a click.
          </FeatureCard>
          <FeatureCard icon={Download} title="Export & Download">
            Export to native .pptx for PowerPoint and Google Slides, or share a
            live link for instant viewing.
          </FeatureCard>
          <FeatureCard icon={Coins} title="Transparent Credit System">
            Generating a new deck spends credits. Editing, saving, or refining an
            existing deck never does.
          </FeatureCard>
          <FeatureCard icon={ShieldCheck} title="Secure Authentication">
            Sign in with email or Google. Sessions, storage and database access are
            protected end-to-end.
          </FeatureCard>
          <FeatureCard icon={Users} title="Built for Collaboration">
            Share decks with teammates, iterate together, and keep a single source
            of truth instead of "final_v7_REAL.pptx".
          </FeatureCard>
        </div>
      </Section>

      {/* Target Users */}
      <Section eyebrow="Who it's for" title="Target users & industries">
        <p>
          Slide Sphere is built for anyone who has to communicate ideas visually —
          from a student preparing a project to a CEO walking into a board meeting.
        </p>
        <div className="flex flex-wrap gap-2 pt-3">
          <IndustryPill icon={GraduationCap} label="Education" />
          <IndustryPill icon={Briefcase} label="Corporate" />
          <IndustryPill icon={Megaphone} label="Marketing" />
          <IndustryPill icon={TrendingUp} label="Sales" />
          <IndustryPill icon={Rocket} label="Startups" />
          <IndustryPill icon={Microscope} label="Research" />
          <IndustryPill icon={Lightbulb} label="Consulting" />
          <IndustryPill icon={Stethoscope} label="Healthcare" />
          <IndustryPill icon={Cpu} label="Technology" />
        </div>
      </Section>

      {/* How it works */}
      <Section eyebrow="How it works" title="From idea to deck in five steps">
        <ol className="space-y-4 list-none pl-0">
          {[
            { t: "Describe your topic", d: "Type a prompt or upload a PDF / JPG source document and pick a slide length." },
            { t: "AI generates an outline", d: "Slide Sphere drafts the narrative — sections, titles and one-line summaries you can reorder." },
            { t: "Full deck is assembled", d: "Copy, bullet points, images and layouts are generated on a tasteful theme." },
            { t: "Edit in the live editor", d: "Tune any slide — text, bullets, images, layout — with instant preview." },
            { t: "Export or share", d: "Download as .pptx, export to PDF, or share a live link with your team." },
          ].map((s, i) => (
            <li key={i} className="flex gap-4 glass border rounded-2xl p-4">
              <div className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-display text-sm shrink-0">
                {i + 1}
              </div>
              <div>
                <h4 className="font-display text-lg text-ink">{s.t}</h4>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Roadmap */}
      <Section eyebrow="What's next" title="Future roadmap">
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Realtime multi-user collaboration with presence and comments.</li>
          <li>Brand kits — bring your logo, colors and fonts into every deck.</li>
          <li>Voice-to-deck: speak your idea and watch slides build live.</li>
          <li>AI-generated charts and diagrams from raw data.</li>
          <li>Native Google Slides and Keynote sync.</li>
          <li>Presenter mode with AI-coached speaker notes and timing.</li>
          <li>Marketplace of community-contributed themes and templates.</li>
        </ul>
      </Section>

      {/* Why choose */}
      <Section eyebrow="Why Slide Sphere" title="Why teams choose us">
        <ul className="list-disc pl-6 space-y-1.5">
          <li><span className="text-ink font-medium">Speed:</span> a finished deck in under a minute, not an afternoon.</li>
          <li><span className="text-ink font-medium">Design quality:</span> taste baked into every theme, layout, and typography choice.</li>
          <li><span className="text-ink font-medium">Full editability:</span> generators stop where editors begin. We give you both.</li>
          <li><span className="text-ink font-medium">Fair credits:</span> only new generations cost credits — editing is always free.</li>
          <li><span className="text-ink font-medium">Privacy first:</span> your prompts and decks are encrypted in transit and at rest, never used to train models.</li>
        </ul>
      </Section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-3xl glass border rounded-3xl p-10 text-center shadow-glow">
          <h3 className="font-display text-3xl text-ink">Ready to build your next deck?</h3>
          <p className="mt-2 text-muted-foreground">
            Start free — five decks a month, no credit card required.
          </p>
          <Link
            to="/sign-up"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow-glow hover:opacity-90 transition"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
