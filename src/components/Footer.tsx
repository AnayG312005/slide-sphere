import { Link } from "@tanstack/react-router";
import { Sparkles, Twitter, Github, Linkedin, Youtube, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const feedbackSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(200),
  message: z.string().trim().min(5, "Message is too short").max(1000),
});

export function Footer() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = feedbackSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    // Local-only submission — persist to localStorage so nothing is lost
    try {
      const key = "slidesphere:feedback";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.push({ ...parsed.data, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(prev));
      toast.success("Thanks for the feedback!");
      setForm({ name: "", email: "", message: "" });
    } catch {
      toast.error("Could not send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[oklch(0.18_0.015_50)] text-[oklch(0.96_0.012_75)] mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="grid place-items-center w-9 h-9 rounded-full gradient-ember shadow-glow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-2xl">Slide Sphere</span>
            </div>
            <p className="text-sm text-white/60 max-w-xs leading-relaxed">
              AI-powered slide decks that feel handcrafted. Generate, edit, and ship presentations in seconds.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[Twitter, Github, Linkedin, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full grid place-items-center bg-white/5 hover:bg-white/10 transition">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-10">
            {[
              { title: "Product", links: ["Features", "Pricing"] },
              { title: "Company", links: ["About"] },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-xs uppercase tracking-widest text-white/40 mb-4">{col.title}</div>
                <ul className="space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-white/80 hover:text-white transition">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-white/40 mb-4">Send us feedback</div>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={form.name}
                  maxLength={80}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  maxLength={200}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <textarea
                placeholder="What's on your mind?"
                value={form.message}
                maxLength={1000}
                rows={3}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-ember text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? "Sending…" : "Send feedback"}
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-white/50">© {new Date().getFullYear()} Slide Sphere. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-white/50">
            <Link to="/" className="hover:text-white">Home</Link>
            <a href="#" className="hover:text-white">Status</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
