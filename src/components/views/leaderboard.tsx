"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { formatMoney, toBn, formatDate } from "@/lib/format";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Medal,
  Crown,
  Briefcase,
  Sparkles,
  Gift,
  Users,
} from "lucide-react";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type LeaderboardEntry = {
  rank: number;
  name: string;
  username: string;
  totalEarned: number;
  jobsCompleted: number;
  joinedAt: string;
};

type ReferrerEntry = {
  rank: number;
  name: string;
  username: string;
  totalBonus: number;
  referralsCount: number;
  joinedAt: string;
};

type I18n = ReturnType<typeof useI18n>;
type Tab = "earners" | "referrers";

// ----------------------------------------------------------------------------
// Shared display model — normalized shape consumed by the podium/list renderers
// so both leaderboards can reuse the same rendering helpers.
// ----------------------------------------------------------------------------

type DisplayEntry = {
  rank: number;
  name: string;
  username: string;
  joinedAt: string;
  // pre-formatted primary value (currency) — already includes currency symbol
  primary: string;
  // pre-formatted secondary value (number) — already localized via toBn
  secondary: string;
  // localized label for the secondary stat ("Jobs" / "Referrals")
  secondaryLabel: string;
};

// ----------------------------------------------------------------------------
// Podium style config (gold / silver / bronze)
// ----------------------------------------------------------------------------

const PODIUM_STYLES: Record<
  number,
  {
    ring: string;
    bg: string;
    text: string;
    label: string;
    size: string;
    order: string;
    elevate: string;
  }
> = {
  1: {
    ring: "ring-amber-400",
    bg: "from-amber-400/20 to-amber-500/5",
    text: "text-amber-600",
    label: "bg-amber-500",
    size: "h-20 w-20 md:h-24 md:w-24 text-2xl md:text-3xl",
    order: "order-2 md:order-2",
    elevate: "md:-translate-y-4 md:scale-105 md:shadow-xl",
  },
  2: {
    ring: "ring-slate-300",
    bg: "from-slate-300/20 to-slate-400/5",
    text: "text-slate-600",
    label: "bg-slate-400",
    size: "h-16 w-16 md:h-20 md:w-20 text-xl md:text-2xl",
    order: "order-1 md:order-1",
    elevate: "md:shadow-lg",
  },
  3: {
    ring: "ring-orange-400",
    bg: "from-orange-400/20 to-orange-500/5",
    text: "text-orange-700",
    label: "bg-orange-500",
    size: "h-16 w-16 md:h-20 md:w-20 text-xl md:text-2xl",
    order: "order-3 md:order-3",
    elevate: "md:shadow-lg",
  },
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function getInitial(name: string): string {
  return (name || "?").charAt(0).toUpperCase();
}

/** Normalize earners entries to the shared display model. */
function toEarnerDisplay(
  entries: LeaderboardEntry[],
  t: I18n["t"],
  lang: I18n["lang"],
): DisplayEntry[] {
  return entries.map((e) => ({
    rank: e.rank,
    name: e.name,
    username: e.username,
    joinedAt: e.joinedAt,
    primary: `${t.common.currency}${formatMoney(e.totalEarned, lang)}`,
    secondary: toBn(e.jobsCompleted),
    secondaryLabel: t.leaderboard.jobs,
  }));
}

/** Normalize referrer entries to the shared display model. */
function toReferrerDisplay(
  entries: ReferrerEntry[],
  t: I18n["t"],
  lang: I18n["lang"],
): DisplayEntry[] {
  return entries.map((e) => ({
    rank: e.rank,
    name: e.name,
    username: e.username,
    joinedAt: e.joinedAt,
    primary: `${t.common.currency}${formatMoney(e.totalBonus, lang)}`,
    secondary: toBn(e.referralsCount),
    secondaryLabel: t.leaderboard.referrals,
  }));
}

// ----------------------------------------------------------------------------
// Podium (Top-3) — shared between both leaderboards
// ----------------------------------------------------------------------------

function PodiumCard({
  entry,
  isMe,
  lang,
  theme,
}: {
  entry: DisplayEntry;
  isMe: boolean;
  lang: I18n["lang"];
  theme: Tab;
}) {
  const style = PODIUM_STYLES[entry.rank];
  if (!style) return null;

  // Rank #1 highlight icon: Crown for earners theme, Gift for referrers theme
  const HighlightIcon = entry.rank === 1 ? (theme === "earners" ? Crown : Gift) : Medal;
  const SecondaryIcon = theme === "earners" ? Briefcase : Users;

  return (
    <Card
      className={`relative overflow-hidden p-4 md:p-5 text-center bg-gradient-to-b ${style.bg} ${
        style.elevate
      } ${isMe ? "ring-2 ring-primary" : ""} card-lift ${style.order}`}
    >
      {/* Rank badge */}
      <div
        className={`absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full ${style.label} text-white shadow-sm`}
      >
        <span className="text-xs font-bold">{toBn(entry.rank)}</span>
      </div>

      {/* Highlight icon for rank #1 */}
      {entry.rank === 1 && (
        <div
          className={`absolute top-3 left-3 ${style.text}`}
          aria-hidden
        >
          <HighlightIcon className="h-5 w-5" />
        </div>
      )}

      {/* Avatar with initial */}
      <div
        className={`mx-auto mb-3 flex items-center justify-center rounded-full bg-background ring-4 ${style.ring} ${style.size} font-bold text-foreground`}
      >
        {getInitial(entry.name)}
      </div>

      {/* Name + username */}
      <div className="min-w-0">
        <p className="font-semibold text-sm md:text-base truncate flex items-center justify-center gap-1.5">
          {entry.name}
          {isMe && (
            <Badge variant="default" className="px-1.5 py-0 text-[10px]">
              {lang === "bn" ? "আপনি" : "You"}
            </Badge>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
      </div>

      {/* Primary value + secondary stat */}
      <div className="mt-3 flex items-center justify-center gap-3 text-xs">
        <span className={`font-bold ${style.text}`}>{entry.primary}</span>
        <span className="text-muted-foreground flex items-center gap-1">
          <SecondaryIcon className="h-3 w-3" />
          {entry.secondary}
        </span>
      </div>
    </Card>
  );
}

function Podium({
  entries,
  isMe,
  lang,
  theme,
}: {
  entries: DisplayEntry[];
  isMe: (username: string) => boolean;
  lang: I18n["lang"];
  theme: Tab;
}) {
  if (entries.length === 0) return null;

  const top3 = entries.slice(0, 3);
  // Display order on desktop: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as DisplayEntry[];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end md:gap-4 stagger">
      {podiumOrder.map((entry) => (
        <PodiumCard
          key={entry.username}
          entry={entry}
          isMe={isMe(entry.username)}
          lang={lang}
          theme={theme}
        />
      ))}
    </section>
  );
}

// ----------------------------------------------------------------------------
// Remaining ranks (4-20) — desktop table + mobile cards, shared
// ----------------------------------------------------------------------------

function RemainingList({
  entries,
  isMe,
  t,
  lang,
  theme,
}: {
  entries: DisplayEntry[];
  isMe: (username: string) => boolean;
  t: I18n["t"];
  lang: I18n["lang"];
  theme: Tab;
}) {
  if (entries.length === 0) return null;

  const SecondaryIcon = theme === "earners" ? Briefcase : Users;
  const primaryHeader = theme === "earners" ? t.leaderboard.earned : t.leaderboard.bonus;
  const secondaryHeader = theme === "earners" ? t.leaderboard.jobs : t.leaderboard.referrals;
  const joinedLabel = lang === "bn" ? "যোগ দিয়েছে" : "Joined";

  return (
    <section>
      {/* Desktop: shadcn Table */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-16 text-center">{t.leaderboard.rank}</TableHead>
              <TableHead>{t.leaderboard.user}</TableHead>
              <TableHead className="text-right">{primaryHeader}</TableHead>
              <TableHead className="text-right">{secondaryHeader}</TableHead>
              <TableHead className="text-right hidden lg:table-cell">{joinedLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const me = isMe(entry.username);
              return (
                <TableRow
                  key={entry.username}
                  className={
                    me ? "bg-primary/5 border-l-2 border-primary" : undefined
                  }
                >
                  <TableCell className="text-center font-semibold">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        me
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {toBn(entry.rank)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {getInitial(entry.name)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate flex items-center gap-1.5">
                          {entry.name}
                          {me && (
                            <Badge
                              variant="default"
                              className="px-1.5 py-0 text-[10px]"
                            >
                              {lang === "bn" ? "আপনি" : "You"}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{entry.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-green-600">{entry.primary}</span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {entry.secondary}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground hidden lg:table-cell">
                    {formatDate(entry.joinedAt, lang)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2 stagger">
        {entries.map((entry) => {
          const me = isMe(entry.username);
          return (
            <Card
              key={entry.username}
              className={`p-3 card-lift ${me ? "ring-2 ring-primary bg-primary/5" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0 ${
                    me
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {toBn(entry.rank)}
                </span>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {getInitial(entry.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate flex items-center gap-1.5">
                    {entry.name}
                    {me && (
                      <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                        {lang === "bn" ? "আপনি" : "You"}
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{entry.username}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm text-green-600">{entry.primary}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                    <SecondaryIcon className="h-3 w-3" />
                    {entry.secondary} {entry.secondaryLabel.toLowerCase()}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Per-tab leaderboard wrapper
// ----------------------------------------------------------------------------

function LeaderboardContent({
  entries,
  isMe,
  t,
  lang,
  theme,
}: {
  entries: DisplayEntry[];
  isMe: (username: string) => boolean;
  t: I18n["t"];
  lang: I18n["lang"];
  theme: Tab;
}) {
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  return (
    <div className="space-y-8">
      <Podium entries={top3} isMe={isMe} lang={lang} theme={theme} />
      <RemainingList entries={rest} isMe={isMe} t={t} lang={lang} theme={theme} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export function LeaderboardPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [tab, setTab] = useState<Tab>("earners");

  // Earners state
  const [earners, setEarners] = useState<LeaderboardEntry[] | null>(null);
  const [earnersLoading, setEarnersLoading] = useState(true);

  // Referrers state (lazy-loaded when the referrers tab is first opened)
  const [referrers, setReferrers] = useState<ReferrerEntry[] | null>(null);
  const [referrersLoading, setReferrersLoading] = useState(false);
  const [referrersFetched, setReferrersFetched] = useState(false);

  // Fetch earners on mount
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const json = await res.json();
        if (active) {
          setEarners(Array.isArray(json.leaderboard) ? json.leaderboard : []);
        }
      } catch {
        if (active) setEarners([]);
      } finally {
        if (active) setEarnersLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  // Lazy-fetch referrers when the referrers tab is opened for the first time
  const fetchReferrers = useCallback(async () => {
    setReferrersLoading(true);
    try {
      const res = await fetch("/api/referral-leaderboard", { cache: "no-store" });
      const json = await res.json();
      setReferrers(Array.isArray(json.leaderboard) ? json.leaderboard : []);
    } catch {
      setReferrers([]);
    } finally {
      setReferrersLoading(false);
      setReferrersFetched(true);
    }
  }, []);

  useEffect(() => {
    if (tab === "referrers" && !referrersFetched) {
      fetchReferrers();
    }
  }, [tab, referrersFetched, fetchReferrers]);

  const isCurrentUser = useCallback(
    (username: string) => !!user && user.username === username,
    [user],
  );

  // Normalize to shared display model
  const earnerDisplay = earners ? toEarnerDisplay(earners, t, lang) : null;
  const referrerDisplay = referrers ? toReferrerDisplay(referrers, t, lang) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      {/* Header */}
      <header className="text-center mb-8 animate-fade-in-up">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Trophy className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t.leaderboard.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          {t.leaderboard.subtitle}
        </p>
      </header>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        className="mb-8"
      >
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="earners" className="gap-1.5">
            <Trophy className="h-4 w-4" />
            {t.leaderboard.tabEarners}
          </TabsTrigger>
          <TabsTrigger value="referrers" className="gap-1.5">
            <Gift className="h-4 w-4" />
            {t.leaderboard.tabReferrers}
          </TabsTrigger>
        </TabsList>

        {/* Earners tab */}
        <TabsContent value="earners">
          {earnersLoading ? (
            <LoadingState text={t.common.loading} />
          ) : !earnerDisplay || earnerDisplay.length === 0 ? (
            <EmptyState icon={Trophy} title={t.leaderboard.empty} />
          ) : (
            <LeaderboardContent
              entries={earnerDisplay}
              isMe={isCurrentUser}
              t={t}
              lang={lang}
              theme="earners"
            />
          )}
        </TabsContent>

        {/* Referrers tab */}
        <TabsContent value="referrers">
          {referrersLoading || !referrerDisplay ? (
            <LoadingState text={t.common.loading} />
          ) : referrerDisplay.length === 0 ? (
            <EmptyState icon={Gift} title={t.leaderboard.emptyReferrers} />
          ) : (
            <LeaderboardContent
              entries={referrerDisplay}
              isMe={isCurrentUser}
              t={t}
              lang={lang}
              theme="referrers"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* CTA for logged-out users */}
      {!user && (
        <section className="mt-10 text-center animate-fade-in-up">
          <Card className="relative overflow-hidden p-6 md:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 mb-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-semibold text-lg md:text-xl mb-1">
              {lang === "bn" ? "আজই আয় শুরু করুন" : "Start earning today"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              {lang === "bn"
                ? "রেজিস্টার করুন, কাজ শুরু করুন এবং পরবর্তী টপ আর্নার হন।"
                : "Sign up, start working, and become a top earner."}
            </p>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => navigate({ name: "register" } as Route)}
            >
              <Sparkles className="h-4 w-4" />
              {lang === "bn" ? "কাজ করে আয় করুন" : "Start Earning"}
            </Button>
          </Card>
        </section>
      )}
    </div>
  );
}
