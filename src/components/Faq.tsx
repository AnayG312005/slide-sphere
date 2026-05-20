import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "How does Lumen generate presentations?", a: "Lumen uses advanced AI models to draft a coherent narrative, structure, and copy from a single prompt — then assembles it into editable slides with tasteful layouts and typography." },
  { q: "Can I upload my own documents?", a: "Yes. Upload a PDF, JPG, or JPEG and Lumen will use it as source material to generate an on-topic, on-brand deck." },
  { q: "What's included in the free plan?", a: "Five decks per month, up to 10 slides each, and access to our standard themes — no credit card required." },
  { q: "How long does generation take?", a: "Most decks are ready in 10–20 seconds. Larger 12–15 slide premium decks may take up to 40 seconds." },
  { q: "Can I export my decks?", a: "Pro and Team plans include PDF export, PowerPoint export, and shareable live links." },
  { q: "Is my data secure?", a: "Yes. Your prompts and decks are encrypted in transit and at rest. We never train models on your content." },
];

export function Faq() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl text-ink">Frequently asked questions</h2>
          <p className="mt-3 text-muted-foreground">Everything you need to know about Lumen.</p>
        </div>
        <div className="glass border rounded-3xl px-6 sm:px-8">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-b-0">
                <AccordionTrigger className="text-base font-medium text-ink hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
