const LOGOS = [
  "Northwind", "Acme Corp", "Globex", "Initech", "Umbrella", "Stark Industries",
  "Wayne Enterprises", "Soylent", "Hooli", "Pied Piper", "Massive Dynamic", "Tyrell",
];

export function LogoMarquee() {
  const row = [...LOGOS, ...LOGOS];
  return (
    <section className="py-14 border-y bg-secondary/30 overflow-hidden">
      <p className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground mb-8">
        Trusted by teams at world-class companies
      </p>
      <div className="relative">
        <div className="flex gap-16 animate-marquee whitespace-nowrap">
          {row.map((name, i) => (
            <div key={i} className="font-display text-2xl sm:text-3xl text-ink/40 hover:text-ink/80 transition">
              {name}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  );
}
