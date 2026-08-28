"use client";

import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { formatMoney, toBn } from "@/lib/format";
import { TrendingUp, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

type DayData = {
  date: string;
  label: string;
  amount: number;
  count: number;
};

export function EarningsChart() {
  const { t, lang } = useI18n();
  const [days, setDays] = useState<DayData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/earnings");
        const data = await res.json();
        if (active) {
          setDays(data.days || []);
          setTotal(data.totalThisWeek || 0);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, []);

  const maxAmount = Math.max(...days.map((d) => d.amount), 1);

  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t.earnings.title}</h3>
            <p className="text-xs text-muted-foreground">{t.earnings.thisWeek}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-primary font-bold text-lg">
            <TrendingUp className="h-4 w-4" />
            {t.common.currency}{formatMoney(total, lang)}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-end justify-between gap-2 h-32">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 h-full flex items-end">
              <div className="w-full h-1/2 rounded-t-md skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : days.every((d) => d.amount === 0) ? (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">{t.earnings.noEarnings}</p>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-32">
          {days.map((d, i) => {
            const heightPct = Math.max((d.amount / maxAmount) * 100, 4);
            const isToday = i === days.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="relative w-full flex items-end justify-center" style={{ height: "100%" }}>
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${
                      isToday ? "bg-primary" : "bg-primary/30 group-hover:bg-primary/50"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  {d.amount > 0 && (
                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-medium px-1.5 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none">
                      {t.common.currency}{formatMoney(d.amount, lang)}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
