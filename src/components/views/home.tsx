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
import { Search, TrendingUp, ShieldCheck, Zap, ArrowRight, Wallet, Users, Trophy, Star } from "lucide-react";
import { formatMoney, toBn } from "@/lib/format";

type Category = { id: string; name: string; slug: string; icon: string };

export function HomePage() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalJobs: 0, totalUsers: 0, totalPaid: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/jobs/list?limit=8").then((r) => r.json()),
      fetch("/api/jobs/featured").then((r) => r.json()).catch(() => ({ jobs: [] })),
      fetch("/api/stats").then((r) => r.json()).catch(() => ({ totalJobs: 0, totalUsers: 0, totalPaid: 0 })),
    ]).then(([catData, jobsData, featuredData, statsData]) => {
      setCategories(catData.categories || []);
      setJobs(jobsData.jobs || []);
      setFeaturedJobs(featuredData.jobs || []);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        {/* Animated gradient background */}
        <div className="absolute inset-0 hero-gradient" />
        {/* Decorative blurred orbs */}
        <div className="absolute top-10 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Text content */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left animate-fade-in-up">
              <Badge variant="secondary" className="mb-4 gap-1.5 bg-primary/10 text-primary border-primary/20">
                <Zap className="h-3 w-3" />
                {lang === "bn" ? "বাংলাদেশের #১ মাইক্রো-জব প্ল্যাটফর্ম" : "#1 Micro-job platform in Bangladesh"}
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                {t.hero.headline}
              </h1>
              <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                {t.hero.description}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  size="lg"
                  className="gap-2 h-12 px-6 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                  onClick={() => navigate({ name: "available-jobs" })}
                >
                  <Search className="h-5 w-5" />
                  {t.hero.findJobs}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 h-12 px-6 text-base hover:bg-primary/5 hover:border-primary/40 transition-colors"
                  onClick={() => navigate({ name: "post-job" })}
                >
                  {t.hero.postJob}
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-3 gap-4 md:gap-6 w-full max-w-md">
                <Stat value={toBn(stats.totalJobs || 0)} label={lang === "bn" ? "কাজ" : "Jobs"} />
                <Stat value={toBn(stats.totalUsers || 0)} label={lang === "bn" ? "ইউজার" : "Users"} />
                <Stat value={`${t.common.currency}${formatMoney(stats.totalPaid || 0, lang)}`} label={lang === "bn" ? "পরিশোধিত" : "Paid"} />
              </div>
            </div>

            {/* Hero illustration with decorative elements */}
            <div className="hidden md:flex justify-center items-center animate-fade-in-up">
              <div className="relative w-80 h-80 lg:w-[28rem] lg:h-[28rem]">
                {/* Glow backdrop */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-emerald-300/10 to-transparent rounded-full blur-2xl" />
                {/* Rotating ring decoration */}
                <div
                  className="absolute inset-4 rounded-full border-2 border-dashed border-primary/20 animate-[spin_20s_linear_infinite]"
                />
                {/* Main image - curved/rounded */}
                <div className="absolute inset-6 rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-primary/10">
                  <img
                    src="/hero-illustration-v2.png"
                    alt="Amar Earning illustration"
                    className="relative w-full h-full object-cover animate-float"
                  />
                  {/* Gradient overlay for smooth blend */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
                </div>
                {/* Floating stat card - top right */}
                <div className="absolute -top-2 -right-2 lg:-right-4 bg-background/90 backdrop-blur-md border rounded-xl shadow-lg p-3 animate-float z-10" style={{ animationDelay: "0.5s" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{lang === "bn" ? "আয়" : "Earned"}</p>
                      <p className="text-sm font-bold text-green-600">+৳{formatMoney(500, lang)}</p>
                    </div>
                  </div>
                </div>
                {/* Floating stat card - bottom left */}
                <div className="absolute -bottom-2 -left-2 lg:-left-4 bg-background/90 backdrop-blur-md border rounded-xl shadow-lg p-3 animate-float z-10" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{lang === "bn" ? "কাজ সম্পন্ন" : "Completed"}</p>
                      <p className="text-sm font-bold text-primary">{toBn(8)}+</p>
                    </div>
                  </div>
                </div>
                {/* Floating coin badge - top left */}
                <div className="absolute top-8 -left-4 bg-amber-500/90 backdrop-blur-md text-white rounded-full shadow-lg h-12 w-12 flex items-center justify-center animate-float z-10" style={{ animationDelay: "1.5s" }}>
                  <span className="text-lg font-bold">৳</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <SectionHeader
          title={t.categories.title}
          subtitle={t.categories.subtitle}
          action={
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate({ name: "categories" })}>
              {t.categoriesPage.browse}
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
        {loading ? (
          <LoadingState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 stagger">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate({ name: "available-jobs-category", categoryId: cat.id })}
                className="group"
              >
                <Card className="p-4 md:p-5 flex flex-col items-center text-center gap-3 hover:shadow-md hover:border-primary/30 transition-all card-lift">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:scale-110">
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

      {/* Featured Jobs */}
      {!loading && featuredJobs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 md:py-10">
          <SectionHeader
            title={t.featured.title}
            subtitle={t.featured.subtitle}
            action={
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate({ name: "available-jobs" })}>
                {t.jobs.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Button>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger">
            {featuredJobs.slice(0, 4).map((job) => (
              <div key={job.id} className="relative">
                <div className="absolute -top-2 -right-2 z-10 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Star className="h-3.5 w-3.5 text-primary-foreground fill-primary-foreground" />
                </div>
                <JobCard job={job} />
              </div>
            ))}
          </div>
        </section>
      )}

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

      {/* Leaderboard CTA */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <Card className="overflow-hidden border-primary/20">
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 animate-float">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold">{t.leaderboard.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t.leaderboard.subtitle}</p>
              </div>
              <Button size="lg" className="gap-2 shrink-0" onClick={() => navigate({ name: "leaderboard" })}>
                <Trophy className="h-4 w-4" />
                {t.leaderboard.viewAll}
              </Button>
            </div>
          </div>
        </Card>
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
