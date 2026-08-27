"use client";

import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Zap, ShieldCheck, Wallet, ArrowRight } from "lucide-react";
import { toBn } from "@/lib/format";

export function HowItWorksPage() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();

  const steps = [
    { n: 1, title: t.howItWorks.step1Title, desc: t.howItWorks.step1Desc, icon: Search },
    { n: 2, title: t.howItWorks.step2Title, desc: t.howItWorks.step2Desc, icon: Zap },
    { n: 3, title: t.howItWorks.step3Title, desc: t.howItWorks.step3Desc, icon: ShieldCheck },
    { n: 4, title: t.howItWorks.step4Title, desc: t.howItWorks.step4Desc, icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t.howItWorks.title}</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          {lang === "bn"
            ? "মাত্র ৪টি সহজ ধাপে আয় শুরু করুন Amar Earning-এ।"
            : "Start earning on Amar Earning in 4 easy steps."}
        </p>
      </div>

      <div className="grid gap-4 md:gap-6">
        {steps.map((step) => (
          <Card key={step.n} className="p-6 flex items-start gap-5">
            <div className="flex flex-col items-center shrink-0">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="mt-2 text-2xl font-bold text-primary/30">{toBn(step.n)}</span>
            </div>
            <div className="flex-1 pt-1">
              <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button size="lg" className="gap-2 h-12 px-8" onClick={() => navigate({ name: "register" } as Route)}>
          {t.auth.createAccount}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
