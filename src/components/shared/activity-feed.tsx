"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney, timeAgo } from "@/lib/format";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  TrendingUp,
  TrendingDown,
  Inbox,
  Activity as ActivityIcon,
} from "lucide-react";

const ICONS: Record<string, typeof Clock> = {
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  TrendingUp,
  TrendingDown,
  Inbox,
};

type Activity = {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  icon: string;
};

export function ActivityFeed() {
  const { t, lang } = useI18n();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/activity");
        if (res.ok && active) {
          const data = await res.json();
          setActivities(data.activities || []);
        }
      } catch {}
      if (active) setLoading(false);
    };
    run();
    return () => { active = false; };
  }, []);

  const getColor = (type: string) => {
    if (type.includes("approved") || type === "transaction" && activities.find(a => a.type === type)?.amount && (activities.find(a => a.type === type)?.amount || 0) > 0) return "text-green-600 bg-green-500/10";
    if (type.includes("rejected")) return "text-red-600 bg-red-500/10";
    if (type.includes("pending")) return "text-yellow-600 bg-yellow-500/10";
    return "text-primary bg-primary/10";
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ActivityIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t.activity.title}</h3>
            <p className="text-xs text-muted-foreground">{t.activity.subtitle}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="h-8 w-8 rounded-full skeleton-shimmer" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 skeleton-shimmer rounded" />
                <div className="h-2 w-1/3 skeleton-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <ActivityIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{t.activity.empty}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.activity.emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {activities.map((a) => {
            const Icon = ICONS[a.icon] || Clock;
            const isPositive = a.amount !== undefined && a.amount > 0;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${getColor(a.type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  {a.amount !== undefined && (
                    <p className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      {isPositive ? "+" : ""}{t.common.currency}{formatMoney(Math.abs(a.amount), lang)}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">{timeAgo(a.timestamp, lang)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
