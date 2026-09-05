"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { formatMoney, toBn, formatDate } from "@/lib/format";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { UserReportDialog } from "@/components/shared/user-report-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserX,
  ShieldCheck,
  CalendarDays,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Wallet,
  TrendingUp,
  Sparkles,
  Zap,
  Crown,
  Trophy,
  Building2,
  Award,
  Lock,
  type LucideIcon,
} from "lucide-react";

type PublicUser = {
  id: string;
  name: string;
  username: string;
  createdAt: string;
  role: string;
  totalEarned: number;
  totalSpent: number;
  jobsPosted: number;
  submissionsCount: number;
  approvedCount: number;
};

type PublicBadge = {
  key: string;
  labelBn: string;
  labelEn: string;
  icon: string;
  earned: boolean;
};

// Mirror of the ICONS map in src/components/shared/user-badges.tsx.
// Redeclared locally because the original is not exported and we must not
// modify other files.
const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  CheckCircle2,
  Zap,
  Crown,
  Trophy,
  Briefcase,
  Building2,
  Award,
};

// Mirror of the COLORS map in src/components/shared/user-badges.tsx.
const COLORS: Record<string, string> = {
  blue: "from-blue-500/20 to-blue-500/5 text-blue-600 border-blue-500/20",
  green: "from-green-500/20 to-green-500/5 text-green-600 border-green-500/20",
  yellow: "from-yellow-500/20 to-yellow-500/5 text-yellow-600 border-yellow-500/20",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-600 border-amber-500/20",
  purple: "from-purple-500/20 to-purple-500/5 text-purple-600 border-purple-500/20",
  indigo: "from-indigo-500/20 to-indigo-500/5 text-indigo-600 border-indigo-500/20",
  cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-600 border-cyan-500/20",
  rose: "from-rose-500/20 to-rose-500/5 text-rose-600 border-rose-500/20",
};

// The public-user API returns badges without a color field, so we map by key.
const KEY_COLOR: Record<string, string> = {
  newbie: "cyan",
  first_job: "green",
  active_worker: "yellow",
  pro_earner: "purple",
  top_earner: "amber",
  job_creator: "blue",
  employer: "indigo",
  veteran: "rose",
};

export function PublicProfilePage({ username }: { username: string }) {
  const { t, lang } = useI18n();
  const { user: currentUser } = useAuth();
  const { navigate } = useRouter();

  const [data, setData] = useState<{ user: PublicUser; badges: PublicBadge[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setData(null);

    const run = async () => {
      try {
        const res = await fetch(
          `/api/public-user?username=${encodeURIComponent(username)}`,
          { cache: "no-store" }
        );
        if (!active) return;
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) {
          const json = await res.json();
          setData({
            user: json.user as PublicUser,
            badges: Array.isArray(json.badges) ? (json.badges as PublicBadge[]) : [],
          });
        } else {
          setNotFound(true);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <LoadingState text={t.common.loading} />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <EmptyState
          icon={UserX}
          title={t.publicProfile.userNotFound}
          description={lang === "bn"
            ? `@${username} নামে কোনো ইউজার নেই।`
            : `No user with username @${username}.`}
          action={
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate({ name: "jobs" } as Route)}
            >
              <ArrowLeft className="h-4 w-4" />
              {t.common.back}
            </Button>
          }
        />
      </div>
    );
  }

  const { user, badges } = data;
  const earnedCount = badges.filter((b) => b.earned).length;
  const isAdmin = user.role === "ADMIN";
  const initial = (user.name || user.username || "?").charAt(0).toUpperCase();

  const stats = [
    {
      label: t.publicProfile.totalEarned,
      value: `${t.common.currency}${formatMoney(user.totalEarned, lang)}`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      label: t.publicProfile.totalSpent,
      value: `${t.common.currency}${formatMoney(user.totalSpent, lang)}`,
      icon: Wallet,
      color: "text-rose-600",
      bg: "bg-rose-500/10",
    },
    {
      label: t.publicProfile.jobsPosted,
      value: toBn(user.jobsPosted),
      icon: Briefcase,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t.publicProfile.jobsCompleted,
      value: toBn(user.approvedCount),
      icon: CheckCircle2,
      color: "text-cyan-600",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      {/* Header card */}
      <Card className="relative overflow-hidden p-5 md:p-7 mb-6 animate-fade-in-up bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl md:text-4xl font-bold ring-4 ring-background shadow-lg">
            {initial}
          </div>

          {/* Identity */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                {user.name || user.username}
              </h1>
              {isAdmin && (
                <Badge variant="default" className="gap-1 py-0 px-2">
                  <ShieldCheck className="h-3 w-3" />
                  {lang === "bn" ? "অ্যাডমিন" : "Admin"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">@{user.username}</p>

            <div className="mt-3 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{t.publicProfile.memberSince}</span>
              <span className="font-medium text-foreground">
                {formatDate(user.createdAt, lang)}
              </span>
            </div>
          </div>

          {/* Report this user (only for logged-in, non-self, non-admin-profile) */}
          {currentUser && currentUser.id !== user.id && !isAdmin && (
            <div className="absolute top-3 right-3">
              <UserReportDialog
                reportedId={user.id}
                reportedName={user.name || user.username}
                reportedRole="user"
                trigger="icon"
                triggerVariant="ghost"
                triggerSize="sm"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Stats grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 stagger">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 card-lift">
              <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center mb-2.5`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-lg md:text-xl font-bold leading-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </Card>
          );
        })}
      </section>

      {/* Badges section */}
      <section className="mb-8 animate-fade-in-up">
        <Card className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-sm md:text-base">
                  {t.publicProfile.badges}
                </h2>
                <p className="text-xs text-muted-foreground">{t.badges.subtitle}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-primary">
              {lang === "bn" ? toBn(earnedCount) : earnedCount}
              <span className="text-muted-foreground font-normal">
                /{lang === "bn" ? toBn(badges.length) : badges.length}
              </span>
            </span>
          </div>

          {badges.length === 0 ? (
            <EmptyState icon={Award} title={t.badges.title} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
              {badges.map((badge) => {
                const Icon = ICONS[badge.icon] || Sparkles;
                const colorKey = KEY_COLOR[badge.key] || "blue";
                const colorClass = COLORS[colorKey] || COLORS.blue;
                return (
                  <div
                    key={badge.key}
                    className={`relative p-3 rounded-xl border bg-gradient-to-br ${colorClass} ${
                      badge.earned ? "opacity-100" : "opacity-40 grayscale"
                    }`}
                    title={badge.earned ? t.badges.earned : t.badges.locked}
                  >
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="h-10 w-10 rounded-full bg-background/50 flex items-center justify-center">
                        {badge.earned ? (
                          <Icon className="h-5 w-5" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-xs font-semibold leading-tight">
                        {lang === "bn" ? badge.labelBn : badge.labelEn}
                      </span>
                      <span
                        className={`text-[10px] leading-tight ${
                          badge.earned ? "text-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {badge.earned ? t.badges.earned : t.badges.locked}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
        <Button
          variant="default"
          className="w-full sm:w-auto gap-2"
          onClick={() => navigate({ name: "available-jobs" } as Route)}
        >
          <Briefcase className="h-4 w-4" />
          {lang === "bn" ? "কাজ ব্রাউজ করুন" : "Browse Jobs"}
        </Button>
        <Button
          variant="outline"
          className="w-full sm:w-auto gap-2"
          onClick={() => navigate({ name: "jobs" } as Route)}
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </Button>
      </div>
    </div>
  );
}
