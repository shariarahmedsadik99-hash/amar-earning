"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { toBn } from "@/lib/format";
import {
  Sparkles,
  CheckCircle2,
  Zap,
  Crown,
  Trophy,
  Briefcase,
  Building2,
  Award,
  Lock,
  type LucideIcon,
} from "lucide-react";

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

type Badge = {
  key: string;
  labelBn: string;
  labelEn: string;
  icon: string;
  color: string;
  earned: boolean;
  descriptionBn: string;
  descriptionEn: string;
};

export function UserBadges() {
  const { t, lang } = useI18n();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/user-badges");
        if (res.ok && active) {
          const data = await res.json();
          setBadges(data.badges || []);
          setEarnedCount(data.earnedCount || 0);
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
        <div className="h-5 w-32 skeleton-shimmer rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 skeleton-shimmer rounded-lg" />
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
            <Award className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t.badges.title}</h3>
            <p className="text-xs text-muted-foreground">{t.badges.subtitle}</p>
          </div>
        </div>
        <span className="text-sm font-bold text-primary">
          {lang === "bn" ? toBn(earnedCount) : earnedCount}/{lang === "bn" ? toBn(badges.length) : badges.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {badges.map((badge) => {
          const Icon = ICONS[badge.icon] || Sparkles;
          const colorClass = COLORS[badge.color] || COLORS.blue;
          return (
            <div
              key={badge.key}
              className={`relative p-3 rounded-xl border bg-gradient-to-br ${colorClass} ${
                badge.earned ? "opacity-100" : "opacity-40 grayscale"
              }`}
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
                <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                  {lang === "bn" ? badge.descriptionBn : badge.descriptionEn}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

