// Premium infinite marquee — 30 real company logos scrolling right→left.
// Logos via Clearbit's free logo CDN. Grayscale by default, full color on hover.
const COMPANIES = [
  { name: "Google", domain: "google.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "NVIDIA", domain: "nvidia.com" },
  { name: "Adobe", domain: "adobe.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "IBM", domain: "ibm.com" },
  { name: "Cisco", domain: "cisco.com" },
  { name: "Intel", domain: "intel.com" },
  { name: "Samsung", domain: "samsung.com" },
  { name: "Tesla", domain: "tesla.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "OpenAI", domain: "openai.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Airbnb", domain: "airbnb.com" },
  { name: "Spotify", domain: "spotify.com" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "PayPal", domain: "paypal.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Shopify", domain: "shopify.com" },
  { name: "Atlassian", domain: "atlassian.com" },
  { name: "Slack", domain: "slack.com" },
  { name: "Dropbox", domain: "dropbox.com" },
  { name: "Zoom", domain: "zoom.us" },
  { name: "TCS", domain: "tcs.com" },
  { name: "Infosys", domain: "infosys.com" },
  { name: "Accenture", domain: "accenture.com" },
];

export function LogoMarquee() {
  const items = [...COMPANIES, ...COMPANIES];
  return (
    <section className="py-20 border-y bg-secondary/20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Trusted by teams from
        </p>
        <h3 className="font-display text-3xl sm:text-4xl text-ink">
          FAANG, MAANG, and global tech leaders
        </h3>
      </div>

      <div className="relative">
        <div
          className="flex gap-10 sm:gap-14 whitespace-nowrap animate-marquee"
          style={{ width: "max-content" }}
        >
          {items.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className="group shrink-0 inline-flex items-center justify-center h-16 w-36 sm:w-44 rounded-2xl bg-card/70 border border-border/60 px-5 transition-all duration-300 hover:border-primary/40 hover:bg-card hover:-translate-y-1 hover:shadow-soft"
              title={c.name}
            >
              <img
                src={`https://logo.clearbit.com/${c.domain}?size=160`}
                alt={`${c.name} logo`}
                loading="lazy"
                className="max-h-9 max-w-full object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition duration-300"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = "none";
                  el.parentElement?.insertAdjacentHTML(
                    "beforeend",
                    `<span class="font-display text-lg text-ink/60 group-hover:text-ink transition">${c.name}</span>`
                  );
                }}
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />
      </div>
    </section>
  );
}
