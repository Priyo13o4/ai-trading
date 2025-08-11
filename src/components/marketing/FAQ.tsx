import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "What assets do you support?",
    a: "We start with XAUUSD and major FX pairs, and can expand to indices and crypto based on demand.",
  },
  {
    q: "How fresh are the signals?",
    a: "Intraday. Pipelines process prices, news and sentiment continuously, publishing updates as conditions change.",
  },
  {
    q: "Do you store my data?",
    a: "We store only what's required to operate the service. You control your integrations and can opt out anytime.",
  },
  {
    q: "Can I integrate Telegram or webhooks?",
    a: "Yes. We support Telegram delivery and custom webhooks via n8n.",
  },
] as const;

const FAQ = () => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  } as const;

  return (
    <section aria-labelledby="faq-heading" className="py-16 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 id="faq-heading" className="text-center font-display text-3xl md:text-4xl font-semibold">
          Frequently asked questions
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Quick answers to common questions.
        </p>

        <div className="mx-auto mt-8 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </div>
    </section>
  );
};

export default FAQ;
