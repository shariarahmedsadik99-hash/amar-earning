"use client";

import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { HelpCircle, Mail } from "lucide-react";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

export function FaqPage() {
  const { t } = useI18n();
  const { navigate } = useRouter();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      {/* Header */}
      <header className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <HelpCircle className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.faq.title}</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">{t.faq.subtitle}</p>
      </header>

      {/* Accordion list */}
      <Accordion type="single" collapsible className="space-y-3">
        {FAQ_KEYS.map((key, i) => (
          <Card
            key={key}
            className="px-4 sm:px-5 py-1 shadow-sm hover:shadow-md transition-shadow card-lift overflow-hidden"
          >
            <AccordionItem value={`item-${i + 1}`} className="border-b-0">
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline">
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="line-clamp-2">{t.faq.items[key]}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground pl-9">
                {t.faq.items[`a${key.slice(1)}` as keyof typeof t.faq.items]}
              </AccordionContent>
            </AccordionItem>
          </Card>
        ))}
      </Accordion>

      {/* Contact support CTA */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground text-sm mb-4">{t.faq.contactSupport}</p>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => navigate({ name: "register" } as Route)}
        >
          <Mail className="h-4 w-4" />
          {t.footer.contact}
        </Button>
      </div>
    </div>
  );
}
