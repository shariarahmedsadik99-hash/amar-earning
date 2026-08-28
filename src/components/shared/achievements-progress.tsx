"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toBn } from "@/lib/format";
import {
  Sparkles,
  CheckCircle2,
  Zap,
  Crown,
  Trophy,
  Award,
  Target,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  CheckCircle2,
  Zap,
  Crown,
  Trophy,
  Award,
};

type BadgeProgress = {
  key: string;
  labelBn: string;
  labelEn: string;
  icon: string;
  earned: boolean;
  current: number;
  target: number;
  unit: string;
};

export function AchievementsProgress() {
  const { t, lang } = useI18n();
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [nextBadge, setNextBadge] = useState<BadgeProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/achievements-progress");
        if (res.ok && active) {
          const data = await res.json();
          setBadges(data.badges || []);
          setEarnedCount(data.earnedCount || 0);
          setNextBadge(data.nextBadge || null);
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
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 skeleton-shimmer rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t.achievementsProgress.title}</h3>
            <p className="text-xs text-muted-foreground">{t.achievementsProgress.subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="font-bold">
          {toBn(earnedCount)}/{toBn(badges.length)}
        </Badge>
      </div>

      {/* Next badge highlight */}
      {nextBadge ? (
        <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">{t.achievementsProgress.nextBadge}</span>
            {(() => {
              const Icon = ICONS[nextBadge.icon] || Sparkles;
              return <Icon className="h-4 w-4 text-primary" />;
            })()}
          </div>
          <p className="text-sm font-semibold mb-2">
            {lang === "bn" ? nextBadge.labelBn : nextBadge.labelEn}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((nextBadge.current / nextBadge.target) * 100, 100)}%`,
                }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              {toBn(nextBadge.current)} {t.achievementsProgress.of} {toBn(nextBadge.target)} {nextBadge.unit}
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
          <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-1" />
          <p className="text-sm font-medium text-green-600">{t.achievementsProgress.completed}</p>
        </div>
      )}

      {/* All badges progress list */}
      <div className="space-y-2">
        {badges.map((badge) => {
          const Icon = ICONS[badge.icon] || Sparkles;
          const pct = Math.min((badge.current / badge.target) * 100, 100);
          return (
            <div
              key={badge.key}
              className={`flex items-center gap-3 p-2 rounded-lg ${badge.earned ? "bg-primary/5" : ""}`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${badge.earned ? "bg-primary/15" : "bg-muted"}`}>
                <Icon className={`h-4 w-4 ${badge.earned ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium truncate">
                    {lang === "bn" ? badge.labelBn : badge.labelEn}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {badge.earned ? "✓" : `${toBn(badge.current)}/${toBn(badge.target)}`}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${badge.earned ? "bg-green-500" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
