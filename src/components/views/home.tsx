"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobCard, type JobCardData } from "@/components/shared/job-card";
import { CategoryIcon } from "@/components/shared/category-icon";
import { LoadingState } from "@/components/shared/states";
import { Search, TrendingUp, ShieldCheck, Zap, ArrowRight, Wallet, Users } from "lucide-react";
import { formatMoney, toBn } from "@/lib/format";

type Category = { id: string; name: string; slug: string; icon: string };

export function HomePage() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalJobs: 0, totalUsers: 0, totalPaid: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/jobs/list?limit=8").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()).catch(() => ({ totalJobs: 0, totalUsers: 0, totalPaid: 0 })),
    ]).then(([catData, jobsData, statsData]) => {
      setCategories(catData.categories || []);
      setJobs(jobsData.jobs || []);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient border-b">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4 gap-1.5 bg-primary/10 text-primary border-primary/20">
              <Zap className="h-3 w-3" />
              {lang === "bn" ? "বাংলাদেশের #১ মাইক্রো-জব প্ল্যাটফর্ম" : "#1 Micro-job platform in Bangladesh"}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              {t.hero.headline}
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {t.hero.description}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                className="gap-2 h-12 px-6 text-base"
                onClick={() => navigate({ name: "available-jobs" })}
              >
                <Search className="h-5 w-5" />
                {t.hero.findJobs}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 h-12 px-6 text-base"
                onClick={() => navigate({ name: "post-job" })}
              >
                {t.hero.postJob}
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4 md:gap-8 w-full max-w-lg">
              <Stat value={toBn(stats.totalJobs || 0)} label={lang === "bn" ? "কাজ" : "Jobs"} />
              <Stat value={toBn(stats.totalUsers || 0)} label={lang === "bn" ? "ইউজার" : "Users"} />
              <Stat value={`${t.common.currency}${formatMoney(stats.totalPaid || 0, lang)}`} label={lang === "bn" ? "পরিশোধিত" : "Paid"} />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <SectionHeader title={t.categories.title} subtitle={t.categories.subtitle} />
        {loading ? (
          <LoadingState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate({ name: "available-jobs" })}
                className="group"
              >
                <Card className="p-4 md:p-5 flex flex-col items-center text-center gap-3 hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CategoryIcon name={cat.icon} className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium leading-tight">
                    {lang === "bn"
                      ? t.categories[cat.slug.replace(/-/g, "") as keyof typeof t.categories] || cat.name
                      : cat.name}
                  </span>
                </Card>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Available Jobs */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <SectionHeader
          title={t.jobs.title}
          subtitle={t.jobs.subtitle}
          action={
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate({ name: "available-jobs" })}>
              {t.jobs.viewAll}
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
        {loading ? (
          <LoadingState />
        ) : jobs.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">{t.jobs.noJobs}</Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* How it works preview */}
      <section className="bg-muted/30 border-y">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <SectionHeader title={t.howItWorks.title} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { n: 1, title: t.howItWorks.step1Title, desc: t.howItWorks.step1Desc, icon: Search },
              { n: 2, title: t.howItWorks.step2Title, desc: t.howItWorks.step2Desc, icon: Zap },
              { n: 3, title: t.howItWorks.step3Title, desc: t.howItWorks.step3Desc, icon: ShieldCheck },
              { n: 4, title: t.howItWorks.step4Title, desc: t.howItWorks.step4Desc, icon: Wallet },
            ].map((step) => (
              <Card key={step.n} className="p-5 relative overflow-hidden">
                <div className="absolute top-3 right-3 text-5xl font-bold text-primary/10">
                  {toBn(step.n)}
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{lang === "bn" ? "নিরাপদ ও বিশ্বস্ত" : "Safe & Trusted"}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "bn" ? "আপনার সব লেনদেন সুরক্ষিত। নির্ভরযোগ্য পেমেন্ট সিস্টেম।" : "All transactions secured. Reliable payment system."}
              </p>
            </div>
          </Card>
          <Card className="p-6 flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{lang === "bn" ? "দ্রুত পেমেন্ট" : "Fast Payment"}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "bn" ? "কাজ অনুমোদনের পর তাৎক্ষণিকভাবে ব্যালেন্সে যোগ হয়।" : "Instantly credited after approval."}
              </p>
            </div>
          </Card>
          <Card className="p-6 flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{lang === "bn" ? "সহজ ও সাশ্রয়ী" : "Easy & Affordable"}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === "bn" ? "বিকাশ, নগদ, রকেটে সহজে টাকা তুলুন।" : "Withdraw easily via bKash, Nagad, Rocket."}
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xl md:text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-5 md:mb-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
