"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  ClipboardList,
  Wallet as WalletIcon,
  Banknote,
  User,
  Bell,
  Shield,
  ShieldAlert,
  Home,
  Bookmark,
  Gift,
  ArrowDownToLine,
} from "lucide-react";
import { formatMoney, toBn } from "@/lib/format";
import { EarningsChart } from "@/components/shared/earnings-chart";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { WeekComparison } from "@/components/shared/week-comparison";
import { AchievementsProgress } from "@/components/shared/achievements-progress";
import { Recommendations } from "@/components/shared/recommendations";

type DashboardStats = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  pendingBalance: number;
  completedJobs: number;
  pendingJobs: number;
};

export function DashboardLayout({ children, active }: { children: ReactNode; active: string }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();

  const menu = [
    { name: "dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { name: "available-jobs", label: t.nav.availableJobs, icon: Briefcase },
    { name: "post-job", label: t.nav.postJob, icon: PlusCircle },
    { name: "my-jobs", label: t.nav.myJobs, icon: Briefcase },
    { name: "my-submissions", label: t.nav.mySubmissions, icon: ClipboardList },
    { name: "my-bookmarks", label: t.bookmarks.title, icon: Bookmark },
    { name: "my-reports", label: t.userReports.myReports, icon: ShieldAlert },
    { name: "referrals", label: t.referrals.title, icon: Gift },
    { name: "wallet", label: t.nav.wallet, icon: WalletIcon },
    { name: "deposit", label: lang === "bn" ? "টাকা যোগ" : "Deposit", icon: ArrowDownToLine },
    { name: "withdraw", label: t.nav.withdraw, icon: Banknote },
    { name: "profile", label: t.nav.profile, icon: User },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="flex gap-6">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-20 space-y-1">
            <div className="px-3 py-2 mb-2">
              <p className="text-xs text-muted-foreground">{t.dashboard.welcome}</p>
              <p className="font-semibold text-sm truncate">{user?.name}</p>
            </div>
            {menu.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate({ name: item.name } as Route)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active === item.name
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
            {user?.role === "ADMIN" && (
              <button
                onClick={() => navigate({ name: "admin" } as Route)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Shield className="h-4 w-4" />
                {t.nav.admin}
              </button>
            )}
            <button
              onClick={() => navigate({ name: "home" } as Route)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              {t.nav.home}
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const { t, lang } = useI18n();
  const cards = [
    { label: t.dashboard.balance, value: stats.balance, icon: WalletIcon, color: "text-primary", bg: "bg-primary/10" },
    { label: t.dashboard.totalEarned, value: stats.totalEarned, icon: Briefcase, color: "text-green-600", bg: "bg-green-500/10" },
    { label: t.dashboard.completedJobs, value: stats.completedJobs, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-500/10", isCount: true },
    { label: t.dashboard.pendingJobs, value: stats.pendingJobs, icon: ClipboardList, color: "text-yellow-600", bg: "bg-yellow-500/10", isCount: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((c, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{c.label}</span>
            <div className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold">
            {c.isCount ? toBn(c.value) : `${t.common.currency}${formatMoney(c.value, lang)}`}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    pendingBalance: 0,
    completedJobs: 0,
    pendingJobs: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/wallet").then((r) => r.json()),
      fetch("/api/submissions?scope=mine").then((r) => r.json()),
    ]).then(([walletData, subData]) => {
      const subs = subData.submissions || [];
      setStats({
        balance: walletData.wallet?.balance || 0,
        totalEarned: walletData.wallet?.totalEarned || 0,
        totalSpent: walletData.wallet?.totalSpent || 0,
        pendingBalance: walletData.wallet?.pendingBalance || 0,
        completedJobs: subs.filter((s: { status: string }) => s.status === "APPROVED").length,
        pendingJobs: subs.filter((s: { status: string }) => s.status === "PENDING").length,
      });
    });
  }, []);

  return stats;
}

export function DashboardPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const stats = useDashboardStats();
  const [recentJobs, setRecentJobs] = useState<unknown[]>([]);

  useEffect(() => {
    fetch("/api/jobs/list?limit=4").then((r) => r.json()).then((d) => setRecentJobs(d.jobs || []));
  }, []);

  return (
    <DashboardLayout active="dashboard">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold">{t.dashboard.welcome}, {user?.name} 👋</h1>
      </div>

      <StatsCards stats={stats} />

      {/* Job Recommendations */}
      <div className="mt-6">
        <Recommendations />
      </div>

      {/* Earnings chart */}
      <div className="mt-4">
        <EarningsChart />
      </div>

      {/* Week comparison */}
      <div className="mt-4">
        <WeekComparison />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-1" onClick={() => navigate({ name: "available-jobs" })}>
          <Briefcase className="h-5 w-5 text-primary" />
          <span className="text-sm">{t.nav.availableJobs}</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-1" onClick={() => navigate({ name: "post-job" })}>
          <PlusCircle className="h-5 w-5 text-primary" />
          <span className="text-sm">{t.nav.postJob}</span>
        </Button>
      </div>

      {/* Referral CTA */}
      <Card className="p-4 mt-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{t.referrals.title}</p>
          <p className="text-xs text-muted-foreground truncate">{t.referrals.shareText}</p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate({ name: "referrals" })}>
          {t.common.view}
        </Button>
      </Card>

      {/* Activity Feed */}
      <div className="mt-6">
        <ActivityFeed />
      </div>

      {/* Achievements Progress */}
      <div className="mt-6">
        <AchievementsProgress />
      </div>

      {/* Recent jobs preview */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{t.jobs.title}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate({ name: "available-jobs" })}>
            {t.jobs.viewAll}
          </Button>
        </div>
        <Card className="p-4">
          {recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t.jobs.noJobs}</p>
          ) : (
            <div className="space-y-2">
              {(recentJobs as Array<{ id: string; title: string; reward: number; category: { name: string } }>).map((job) => (
                <button
                  key={job.id}
                  onClick={() => navigate({ name: "job", id: job.id })}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.category.name}</p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0 ml-2">
                    {t.common.currency}{formatMoney(job.reward, lang)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
