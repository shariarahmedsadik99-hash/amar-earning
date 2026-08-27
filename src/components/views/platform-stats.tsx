"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { formatMoney, toBn } from "@/lib/format";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  Briefcase,
  Activity,
  ClipboardList,
  CheckCircle2,
  ArrowLeftRight,
  Wallet,
  Banknote,
  TrendingUp,
  TrendingDown,
  Search,
} from "lucide-react";

// ----------------------------------------------------------------------------
// Types — match the /api/platform-stats response shape
// ----------------------------------------------------------------------------

type PlatformStats = {
  totals: {
    users: number;
    jobs: number;
    activeJobs: number;
    submissions: number;
    approvedSubmissions: number;
    transactions: number;
    paidOut: number;
    withdrawals: number;
  };
  topCategories: Array<{
    name: string;
    slug: string;
    icon: string;
    jobCount: number;
  }>;
  growth: {
    newUsersThisWeek: number;
    newUsersLastWeek: number;
    jobsThisWeek: number;
    jobsLastWeek: number;
    userGrowthRate: number;
    jobGrowthRate: number;
  };
};

// ----------------------------------------------------------------------------
// Stat card config — defines icon + tint for each of the 8 totals cards.
// Color rotation chosen for visual variety while keeping the soft-green
// primary theme dominant on the surrounding chrome.
// ----------------------------------------------------------------------------

type StatCardDef = {
  key: keyof PlatformStats["totals"];
  labelKey: keyof ReturnType<typeof useI18n>["t"]["platformStats"];
  Icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for the icon chip background + foreground color. */
  tint: string;
  /** True if the value should be rendered as currency (formatMoney + ৳). */
  money?: boolean;
};

const STAT_CARDS: StatCardDef[] = [
  { key: "users", labelKey: "totalUsers", Icon: Users, tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { key: "jobs", labelKey: "totalJobs", Icon: Briefcase, tint: "bg-green-500/10 text-green-600 dark:text-green-400" },
  { key: "activeJobs", labelKey: "activeJobs", Icon: Activity, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  { key: "submissions", labelKey: "totalSubmissions", Icon: ClipboardList, tint: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { key: "approvedSubmissions", labelKey: "approvedSubmissions", Icon: CheckCircle2, tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { key: "transactions", labelKey: "totalTransactions", Icon: ArrowLeftRight, tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  { key: "paidOut", labelKey: "totalPaidOut", Icon: Wallet, tint: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", money: true },
  { key: "withdrawals", labelKey: "totalWithdrawals", Icon: Banknote, tint: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
];

// ----------------------------------------------------------------------------
// Growth card — this-week vs last-week with a colored rate badge.
// ----------------------------------------------------------------------------

function GrowthCard({
  Icon,
  label,
  thisWeek,
  lastWeek,
  rate,
  vsLabel,
  lang,
  tint,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  thisWeek: number;
  lastWeek: number;
  rate: number;
  vsLabel: string;
  lang: "bn" | "en";
  tint: string;
}) {
  const positive = rate > 0;
  const negative = rate < 0;

  return (
    <Card className="card-lift p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{toBn(thisWeek)}</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={
            positive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
              : negative
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15"
              : "bg-muted text-muted-foreground hover:bg-muted"
          }
        >
          {positive && <TrendingUp className="h-3.5 w-3.5 mr-1" />}
          {negative && <TrendingDown className="h-3.5 w-3.5 mr-1" />}
          {positive ? "+" : ""}
          {toBn(rate)}%
        </Badge>
      </div>

      {/* This-week vs last-week comparison row */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-muted/60 px-3 py-2">
          <p className="text-muted-foreground">{lang === "bn" ? "এই সপ্তাহ" : "This week"}</p>
          <p className="font-semibold mt-0.5 text-foreground">{toBn(thisWeek)}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-muted-foreground">{lang === "bn" ? "গত সপ্তাহ" : "Last week"}</p>
          <p className="font-semibold mt-0.5 text-muted-foreground">{toBn(lastWeek)}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{vsLabel}</p>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// Top categories — relative bar chart (each bar sized against the #1 category)
// ----------------------------------------------------------------------------

function TopCategoriesSection({
  categories,
  title,
  lang,
}: {
  categories: PlatformStats["topCategories"];
  title: string;
  lang: "bn" | "en";
}) {
  if (!categories.length) return null;
  const max = Math.max(1, ...categories.map((c) => c.jobCount));

  return (
    <section className="mt-10 md:mt-12">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <Card className="p-4 sm:p-6">
        <ul className="flex flex-col gap-3.5">
          {categories.map((c, i) => {
            const pct = Math.round((c.jobCount / max) * 100);
            return (
              <li
                key={c.slug || c.name}
                className="group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CategoryIcon name={c.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{c.name}</span>
                      <span className="shrink-0 text-sm font-semibold text-foreground">
                        {toBn(c.jobCount)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {lang === "bn" ? "কাজ" : "jobs"}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Main page
// ----------------------------------------------------------------------------

export function PlatformStatsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/platform-stats");
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as PlatformStats;
        if (active) setData(json);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      {/* ---------------------------------------------------------------- Header */}
      <header className="animate-fade-in-up flex flex-col items-center text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BarChart3 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t.platformStats.title}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
          {t.platformStats.subtitle}
        </p>
      </header>

      {/* ---------------------------------------------------------------- Loading */}
      {loading && (
        <div className="mt-12">
          <LoadingState text={t.common.loading} />
        </div>
      )}

      {/* ---------------------------------------------------------------- Error / empty */}
      {!loading && !data && (
        <div className="mt-12">
          <EmptyState
            icon={BarChart3}
            title={lang === "bn" ? "পরিসংখ্যান লোড করা যায়নি" : "Couldn't load stats"}
            description={
              lang === "bn"
                ? "কিছুক্ষণ পরে আবার চেষ্টা করুন।"
                : "Please try again in a moment."
            }
          />
        </div>
      )}

      {/* ---------------------------------------------------------------- Body */}
      {!loading && data && (
        <>
          {/* ---------------- Totals grid (8 cards) */}
          <section className="stagger mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-12 md:grid-cols-4">
            {STAT_CARDS.map((def) => {
              const value = data.totals[def.key];
              const display = def.money
                ? `${t.common.currency}${formatMoney(value, lang)}`
                : toBn(value);
              return (
                <Card
                  key={def.key}
                  className="card-lift relative overflow-hidden p-4 sm:p-5"
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${def.tint}`}
                  >
                    <def.Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-xs text-muted-foreground sm:text-sm">
                    {t.platformStats[def.labelKey]}
                  </p>
                  <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                    {display}
                  </p>
                </Card>
              );
            })}
          </section>

          {/* ---------------- Growth section (2 cards) */}
          <section className="mt-10 md:mt-12">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">
                {t.platformStats.growth}
              </h2>
            </div>
            <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2">
              <GrowthCard
                Icon={Users}
                label={t.platformStats.newUsersThisWeek}
                thisWeek={data.growth.newUsersThisWeek}
                lastWeek={data.growth.newUsersLastWeek}
                rate={data.growth.userGrowthRate}
                vsLabel={t.platformStats.vsLastWeek}
                lang={lang}
                tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              />
              <GrowthCard
                Icon={Briefcase}
                label={t.platformStats.jobsThisWeek}
                thisWeek={data.growth.jobsThisWeek}
                lastWeek={data.growth.jobsLastWeek}
                rate={data.growth.jobGrowthRate}
                vsLabel={t.platformStats.vsLastWeek}
                lang={lang}
                tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"
              />
            </div>
          </section>

          {/* ---------------- Top categories */}
          <TopCategoriesSection
            categories={data.topCategories}
            title={t.platformStats.topCategories}
            lang={lang}
          />

          {/* ---------------- CTA for logged-out users */}
          {!user && (
            <section className="mt-10 md:mt-12">
              <Card className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                  <div className="max-w-md">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {lang === "bn" ? "আয় শুরু করুন" : "Start earning today"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lang === "bn"
                        ? "হাজারো কাজ থেকে আপনার পছন্দেরটি বেছে নিন এবং আজই আয় করা শুরু করুন।"
                        : "Browse thousands of micro-jobs and start earning right away."}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="shrink-0"
                    onClick={() => navigate({ name: "available-jobs" } as Route)}
                  >
                    <Search className="h-4 w-4" />
                    {lang === "bn" ? "কাজ খুঁজুন" : "Find Work"}
                  </Button>
                </div>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}
