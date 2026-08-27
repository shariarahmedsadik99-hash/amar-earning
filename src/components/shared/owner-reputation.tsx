"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/format";
import { Briefcase, Wallet, Calendar, TrendingUp, BadgeCheck } from "lucide-react";

type OwnerInfo = {
  name: string;
  username: string;
  memberSince: string;
  jobsPosted: number;
  totalSpent: number;
  approvalRate: number;
  isVerified: boolean;
};

export function OwnerReputation({ ownerId }: { ownerId: string }) {
  const { t, lang } = useI18n();
  const [info, setInfo] = useState<OwnerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/owner-reputation?userId=${ownerId}`);
        if (res.ok && active) {
          const data = await res.json();
          setInfo(data);
        }
      } catch {}
      if (active) setLoading(false);
    };
    run();
    return () => { active = false; };
  }, [ownerId]);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-5 w-40 skeleton-shimmer rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 skeleton-shimmer rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (!info) return null;

  const stats = [
    {
      icon: Briefcase,
      label: t.ownerReputation.jobsPosted,
      value: String(info.jobsPosted),
    },
    {
      icon: Wallet,
      label: t.ownerReputation.totalSpent,
      value: `${t.common.currency}${formatMoney(info.totalSpent, lang)}`,
    },
    {
      icon: TrendingUp,
      label: t.ownerReputation.approvalRate,
      value: `${info.approvalRate}%`,
    },
    {
      icon: Calendar,
      label: t.ownerReputation.memberSince,
      value: formatDate(info.memberSince, lang),
    },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {info.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm">{info.name}</h3>
              {info.isVerified && (
                <BadgeCheck className="h-4 w-4 text-primary" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">@{info.username}</p>
          </div>
        </div>
        {info.isVerified && (
          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
            <BadgeCheck className="h-3 w-3" />
            {t.ownerReputation.verified}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/40 border"
          >
            <s.icon className="h-4 w-4 text-primary mb-1.5" />
            <span className="text-sm font-bold leading-none">{s.value}</span>
            <span className="text-[10px] text-muted-foreground mt-1 leading-tight">{s.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
