"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { formatMoney, toBn } from "@/lib/format";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  CalendarClock,
  Users,
  PieChart,
} from "lucide-react";

type JobStats = {
  totalSubmissions: number;
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: number;
  completionRate: number;
  avgApprovalHours: number;
  totalPaidOut: number;
  daysRemaining: number;
  slotsRemaining: number;
};

export function JobStatsCard({ jobId }: { jobId: string }) {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/jobs/stats?id=${jobId}`);
        if (res.ok && active) {
          const data = await res.json();
          setStats(data);
        }
      } catch {}
      if (active) setLoading(false);
    };
    run();
    return () => { active = false; };
  }, [jobId]);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-5 w-40 skeleton-shimmer rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 skeleton-shimmer rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  const statsItems = [
    {
      icon: PieChart,
      label: t.jobStats.totalSubmissions,
      value: toBn(stats.totalSubmissions),
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      icon: TrendingUp,
      label: t.jobStats.approvalRate,
      value: `${toBn(stats.approvalRate)}%`,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      icon: CheckCircle2,
      label: t.jobStats.approved,
      value: toBn(stats.approved),
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      icon: XCircle,
      label: t.jobStats.rejected,
      value: toBn(stats.rejected),
      color: "text-red-600",
      bg: "bg-red-500/10",
    },
    {
      icon: BarChart3,
      label: t.jobStats.completionRate,
      value: `${toBn(stats.completionRate)}%`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Clock,
      label: t.jobStats.avgApprovalTime,
      value: stats.avgApprovalHours > 0 ? `${toBn(stats.avgApprovalHours)} ${t.jobStats.hours}` : "—",
      color: "text-yellow-600",
      bg: "bg-yellow-500/10",
    },
    {
      icon: Wallet,
      label: t.jobStats.totalPaidOut,
      value: `${t.common.currency}${formatMoney(stats.totalPaidOut, lang)}`,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      icon: CalendarClock,
      label: t.jobStats.daysRemaining,
      value: stats.daysRemaining > 0 ? `${toBn(stats.daysRemaining)} ${t.jobStats.day}` : t.filters.expired,
      color: stats.daysRemaining > 0 ? "text-primary" : "text-red-600",
      bg: stats.daysRemaining > 0 ? "bg-primary/10" : "bg-red-500/10",
    },
  ];

  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">{t.jobStats.title}</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        {statsItems.map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/40 border"
          >
            <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <span className="text-base md:text-lg font-bold leading-none">{item.value}</span>
            <span className="text-[10px] text-muted-foreground mt-1 leading-tight">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Slots progress bar */}
      <div className="mt-4 p-3 rounded-lg bg-muted/40 border">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {t.jobStats.slotsRemaining}
          </span>
          <span className="font-semibold">{toBn(stats.slotsRemaining)}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
