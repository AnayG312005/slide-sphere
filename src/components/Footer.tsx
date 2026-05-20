import { Link } from "@tanstack/react-router";
import { Sparkles, Twitter, Github, Linkedin, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[oklch(0.18_0.015_50)] text-[oklch(0.96_0.012_75)] mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
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

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-white/50">© {new Date().getFullYear()} Lumen. All rights reserved.</p>
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
