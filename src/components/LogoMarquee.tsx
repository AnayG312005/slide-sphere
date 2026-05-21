// Real-world MNC/FAANG/MAANG logos via Clearbit's free logo CDN.
// Grayscale by default, full color on hover.
const COMPANIES = [
  { name: "Google", domain: "google.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "NVIDIA", domain: "nvidia.com" },
  { name: "Adobe", domain: "adobe.com" },
  { name: "Tesla", domain: "tesla.com" },
  { name: "IBM", domain: "ibm.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "Intel", domain: "intel.com" },
  { name: "OpenAI", domain: "openai.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "Samsung", domain: "samsung.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Airbnb", domain: "airbnb.com" },
  { name: "Spotify", domain: "spotify.com" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "PayPal", domain: "paypal.com" },
  { name: "Infosys", domain: "infosys.com" },
  { name: "TCS", domain: "tcs.com" },
  { name: "Wipro", domain: "wipro.com" },
  { name: "Accenture", domain: "accenture.com" },
  { name: "Deloitte", domain: "deloitte.com" },
  { name: "EY", domain: "ey.com" },
  { name: "PwC", domain: "pwc.com" },
  { name: "JPMorgan", domain: "jpmorganchase.com" },
  { name: "Goldman Sachs", domain: "goldmansachs.com" },
  { name: "Stripe", domain: "stripe.com" },
];

function Row({ reverse = false }: { reverse?: boolean }) {
  const items = [...COMPANIES, ...COMPANIES];
  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex gap-12 sm:gap-16 whitespace-nowrap py-3 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
        style={{ width: "max-content" }}
      >
        {items.map((c, i) => (
          <div
            key={`${c.name}-${i}`}
            className="group shrink-0 inline-flex items-center justify-center h-14 w-32 sm:w-40 rounded-xl bg-card/60 border border-border/60 px-4 transition hover:border-primary/40 hover:bg-card hover:-translate-y-0.5 hover:shadow-soft"
            title={c.name}
          >
            <img
              src={`https://logo.clearbit.com/${c.domain}?size=128`}
              alt={c.name}
              loading="lazy"
              className="max-h-8 max-w-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition duration-300"
              onError={(e) => {
                // Fallback to wordmark if logo CDN misses
                const el = e.currentTarget;
                el.style.display = "none";
                el.parentElement?.insertAdjacentHTML(
                  "beforeend",
                  `<span class="font-display text-base sm:text-lg text-ink/50 group-hover:text-ink transition">${c.name}</span>`
                );
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LogoMarquee() {
  return (
    <section className="py-16 border-y bg-secondary/20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Trusted by teams from
        </p>
        <h3 className="font-display text-2xl sm:text-3xl text-ink">
          FAANG, MAANG, and global enterprises
        </h3>
      </div>
      <div className="relative">
        <Row />
        <div className="mt-3"><Row reverse /></div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
      </div>
    </section>
  );
}
