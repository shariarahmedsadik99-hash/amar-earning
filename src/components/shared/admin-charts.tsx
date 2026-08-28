"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { formatMoney, toBn } from "@/lib/format";
import { BarChart3, TrendingUp, Users, FileText, PieChart } from "lucide-react";

type Day = {
  date: string;
  label: string;
  submissions: number;
  earnings: number;
  spending: number;
  newUsers: number;
  withdrawals: number;
};

type StatusBreakdown = {
  pending: number;
  approved: number;
  rejected: number;
};

export function AdminCharts() {
  const { t, lang } = useI18n();
  const [days, setDays] = useState<Day[]>([]);
  const [status, setStatus] = useState<StatusBreakdown>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"submissions" | "earnings" | "newUsers">("submissions");

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/admin/charts");
        if (res.ok && active) {
          const data = await res.json();
          setDays(data.days || []);
          setStatus(data.statusBreakdown || { pending: 0, approved: 0, rejected: 0 });
        }
      } catch {}
      if (active) setLoading(false);
    };
    run();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-5 w-40 skeleton-shimmer rounded mb-4" />
        <div className="h-48 skeleton-shimmer rounded-lg" />
      </Card>
    );
  }

  const maxVal = Math.max(
    ...days.map((d) =>
      chartType === "submissions" ? d.submissions :
      chartType === "earnings" ? d.earnings :
      d.newUsers
    ),
    1
  );

  const totalSubs = days.reduce((s, d) => s + d.submissions, 0);
  const totalEarnings = days.reduce((s, d) => s + d.earnings, 0);
  const totalUsers = days.reduce((s, d) => s + d.newUsers, 0);

  const statusTotal = status.pending + status.approved + status.rejected;
  const getStatusPct = (val: number) => statusTotal > 0 ? Math.round((val / statusTotal) * 100) : 0;

  const chartTabs = [
    { key: "submissions" as const, label: t.adminCharts.submissions, icon: FileText, value: toBn(totalSubs) },
    { key: "earnings" as const, label: t.adminCharts.earnings, icon: TrendingUp, value: `${t.common.currency}${formatMoney(totalEarnings, lang)}` },
    { key: "newUsers" as const, label: t.adminCharts.newUsers, icon: Users, value: toBn(totalUsers) },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">{t.adminCharts.title}</h3>
      </div>

      {/* Chart type tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {chartTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setChartType(tab.key)}
            className={`p-3 rounded-lg border text-left transition-all ${
              chartType === tab.key
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <tab.icon className={`h-3.5 w-3.5 ${chartType === tab.key ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-[10px] text-muted-foreground">{tab.label}</span>
            </div>
            <p className="text-sm font-bold">{tab.value}</p>
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-between gap-0.5 h-40 mb-2">
        {days.map((d, i) => {
          const val =
            chartType === "submissions" ? d.submissions :
            chartType === "earnings" ? d.earnings :
            d.newUsers;
          const heightPct = Math.max((val / maxVal) * 100, 2);
          const isLast = i === days.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
              <div className="relative w-full flex items-end justify-center" style={{ height: "100%" }}>
                <div
                  className={`w-full max-w-[16px] rounded-t-sm transition-all duration-500 ${
                    isLast ? "bg-primary" : "bg-primary/25 group-hover:bg-primary/40"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
                {val > 0 && (
                  <div className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-medium px-1.5 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none z-10">
                    {chartType === "earnings" ? `${t.common.currency}${formatMoney(val, lang)}` : toBn(val)}
                  </div>
                )}
              </div>
              {/* Show label every 5 days */}
              {i % 5 === 0 && (
                <span className="text-[8px] text-muted-foreground">{d.label}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Status breakdown */}
      <div className="mt-5 pt-4 border-t">
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold">{t.adminCharts.statusBreakdown}</h4>
        </div>
        <div className="space-y-2">
          <StatusBar
            label={t.adminCharts.pending}
            value={status.pending}
            pct={getStatusPct(status.pending)}
            color="bg-yellow-500"
          />
          <StatusBar
            label={t.adminCharts.approved}
            value={status.approved}
            pct={getStatusPct(status.approved)}
            color="bg-green-500"
          />
          <StatusBar
            label={t.adminCharts.rejected}
            value={status.rejected}
            pct={getStatusPct(status.rejected)}
            color="bg-red-500"
          />
        </div>
      </div>
    </Card>
  );
}

function StatusBar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{toBn(value)} ({toBn(pct)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
