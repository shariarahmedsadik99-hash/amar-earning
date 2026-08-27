"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { formatMoney, toBn, formatDate } from "@/lib/format";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Medal, Crown, Briefcase, Sparkles } from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  name: string;
  username: string;
  totalEarned: number;
  jobsCompleted: number;
  joinedAt: string;
};

// Medal style config for the podium
const PODIUM_STYLES: Record<
  number,
  {
    ring: string;
    bg: string;
    text: string;
    label: string;
    size: string;
    icon: typeof Medal;
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
    icon: Crown,
    order: "order-2 md:order-2",
    elevate: "md:-translate-y-4 md:scale-105 md:shadow-xl",
  },
  2: {
    ring: "ring-slate-300",
    bg: "from-slate-300/20 to-slate-400/5",
    text: "text-slate-600",
    label: "bg-slate-400",
    size: "h-16 w-16 md:h-20 md:w-20 text-xl md:text-2xl",
    icon: Medal,
    order: "order-1 md:order-1",
    elevate: "md:shadow-lg",
  },
  3: {
    ring: "ring-orange-400",
    bg: "from-orange-400/20 to-orange-500/5",
    text: "text-orange-700",
    label: "bg-orange-500",
    size: "h-16 w-16 md:h-20 md:w-20 text-xl md:text-2xl",
    icon: Medal,
    order: "order-3 md:order-3",
    elevate: "md:shadow-lg",
  },
};

export function LeaderboardPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const json = await res.json();
        if (active) {
          setEntries(Array.isArray(json.leaderboard) ? json.leaderboard : []);
        }
      } catch {
        if (active) setEntries([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  const top3 = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];

  // Display order on desktop: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const isCurrentUser = (username: string) =>
    !!user && user.username === username;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      {/* Header */}
      <header className="text-center mb-10 animate-fade-in-up">
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

      {loading ? (
        <LoadingState text={t.common.loading} />
      ) : !entries || entries.length === 0 ? (
        <EmptyState icon={Trophy} title={t.leaderboard.empty} />
      ) : (
        <div className="space-y-8">
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end md:gap-4 stagger">
              {podiumOrder.map((entry) => {
                const style = PODIUM_STYLES[entry.rank];
                const Icon = style.icon;
                const me = isCurrentUser(entry.username);
                return (
                  <Card
                    key={entry.username}
                    className={`relative overflow-hidden p-4 md:p-5 text-center bg-gradient-to-b ${style.bg} ${
                      style.elevate
                    } ${me ? "ring-2 ring-primary" : ""} card-lift ${
                      style.order
                    }`}
                  >
                    {/* Rank badge */}
                    <div
                      className={`absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full ${style.label} text-white shadow-sm`}
                    >
                      <span className="text-xs font-bold">{toBn(entry.rank)}</span>
                    </div>

                    {/* Crown for #1 */}
                    {entry.rank === 1 && (
                      <div
                        className={`absolute top-3 left-3 ${style.text}`}
                        aria-hidden
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    )}

                    {/* Avatar with initial */}
                    <div
                      className={`mx-auto mb-3 flex items-center justify-center rounded-full bg-background ring-4 ${style.ring} ${style.size} font-bold text-foreground`}
                    >
                      {(entry.name || "?").charAt(0).toUpperCase()}
                    </div>

                    {/* Name + username */}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm md:text-base truncate flex items-center justify-center gap-1.5">
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

                    {/* Earned + jobs */}
                    <div className="mt-3 flex items-center justify-center gap-3 text-xs">
                      <span className={`font-bold ${style.text}`}>
                        {t.common.currency}
                        {formatMoney(entry.totalEarned, lang)}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {toBn(entry.jobsCompleted)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </section>
          )}

          {/* Remaining ranks 4-20 */}
          {rest.length > 0 && (
            <section>
              {/* Desktop: shadcn Table */}
              <Card className="hidden md:block overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-16 text-center">
                        {t.leaderboard.rank}
                      </TableHead>
                      <TableHead>{t.leaderboard.user}</TableHead>
                      <TableHead className="text-right">
                        {t.leaderboard.earned}
                      </TableHead>
                      <TableHead className="text-right">
                        {t.leaderboard.jobs}
                      </TableHead>
                      <TableHead className="text-right hidden lg:table-cell">
                        {lang === "bn" ? "যোগ দিয়েছে" : "Joined"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rest.map((entry) => {
                      const me = isCurrentUser(entry.username);
                      return (
                        <TableRow
                          key={entry.username}
                          className={
                            me
                              ? "bg-primary/5 border-l-2 border-primary"
                              : undefined
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
                                  {(entry.name || "?").charAt(0).toUpperCase()}
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
                            <span className="font-semibold text-green-600">
                              {t.common.currency}
                              {formatMoney(entry.totalEarned, lang)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {toBn(entry.jobsCompleted)}
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
                {rest.map((entry) => {
                  const me = isCurrentUser(entry.username);
                  return (
                    <Card
                      key={entry.username}
                      className={`p-3 card-lift ${
                        me
                          ? "ring-2 ring-primary bg-primary/5"
                          : ""
                      }`}
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
                            {(entry.name || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
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
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-sm text-green-600">
                            {t.common.currency}
                            {formatMoney(entry.totalEarned, lang)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {toBn(entry.jobsCompleted)} {t.leaderboard.jobs.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* CTA for logged-out users */}
          {!user && (
            <section className="mt-10 text-center animate-fade-in-up">
              <Card className="relative overflow-hidden p-6 md:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-semibold text-lg md:text-xl mb-1">
                  {lang === "bn"
                    ? "আজই আয় শুরু করুন"
                    : "Start earning today"}
                </h2>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  {lang === "bn"
                    ? "রেজিস্টার করুন, সাইন-আপ বোনাস পান এবং পরবর্তী টপ আর্নার হন।"
                    : "Sign up, get a signup bonus, and become a top earner."}
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
      )}
    </div>
  );
}
