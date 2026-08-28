"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { formatMoney, toBn } from "@/lib/format";
import { TrendingUp, TrendingDown, Minus, Wallet, ClipboardList } from "lucide-react";

type Comparison = {
  thisWeek: { earned: number; submissions: number };
  lastWeek: { earned: number; submissions: number };
  earningsChange: number;
  submissionsChange: number;
};

export function WeekComparison() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/earnings-comparison");
        if (res.ok && active) {
          const d = await res.json();
          setData(d);
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
        <div className="grid grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 skeleton-shimmer rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const renderChange = (change: number, hasLastWeekData: boolean) => {
    if (!hasLastWeekData) {
      return (
        <span className="text-xs text-muted-foreground">{t.comparison.noData}</span>
      );
    }
    if (change > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-medium">
          <TrendingUp className="h-3 w-3" />
          {toBn(change)}% {t.comparison.increase}
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-medium">
          <TrendingDown className="h-3 w-3" />
          {toBn(Math.abs(change))}% {t.comparison.decrease}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground font-medium">
        <Minus className="h-3 w-3" />
        {t.comparison.noChange}
      </span>
    );
  };

  const cards = [
    {
      icon: Wallet,
      label: t.comparison.earned,
      thisValue: `${t.common.currency}${formatMoney(data.thisWeek.earned, lang)}`,
      lastValue: `${t.common.currency}${formatMoney(data.lastWeek.earned, lang)}`,
      change: data.earningsChange,
      hasLastData: data.lastWeek.earned > 0,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      icon: ClipboardList,
      label: t.comparison.submissions,
      thisValue: toBn(data.thisWeek.submissions),
      lastValue: toBn(data.lastWeek.submissions),
      change: data.submissionsChange,
      hasLastData: data.lastWeek.submissions > 0,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">{t.comparison.title}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
        {cards.map((c, i) => (
          <div key={i} className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
                <span className="text-sm font-medium">{c.label}</span>
              </div>
              {renderChange(c.change, c.hasLastData)}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t.comparison.thisWeek}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.thisValue}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t.comparison.lastWeek}</p>
                <p className="text-sm text-muted-foreground">{c.lastValue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
