"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "./dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/shared/states";
import {
  Gift,
  Users,
  Wallet as WalletIcon,
  Copy,
  Share2,
  UserPlus,
  ClipboardCheck,
  Coins,
} from "lucide-react";
import { formatMoney, formatDate, toBn } from "@/lib/format";
import { toast } from "sonner";

type ReferralUser = {
  id: string;
  name: string;
  username: string;
  createdAt: string;
  wallet: { totalEarned: number } | null;
};

type ReferralData = {
  referrals: ReferralUser[];
  totalReferrals: number;
  totalBonus: number;
  referralCode: string | null;
};

export function ReferralsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/referrals", { cache: "no-store" });
        const json = await res.json();
        if (active) {
          setData({
            referrals: json.referrals || [],
            totalReferrals: json.totalReferrals || 0,
            totalBonus: json.totalBonus || 0,
            referralCode: json.referralCode || user?.referralCode || null,
          });
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [user?.referralCode]);

  const referralCode = data?.referralCode || user?.referralCode || "";
  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/#/register?ref=${encodeURIComponent(referralCode)}`
      : `/#/register?ref=${encodeURIComponent(referralCode)}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success(
        lang === "bn" ? "রেফারেল কোড কপি হয়েছে" : "Referral code copied"
      );
    } catch {
      toast.error(lang === "bn" ? "কপি ব্যর্থ হয়েছে" : "Copy failed");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success(
        lang === "bn" ? "লিংক কপি হয়েছে" : "Link copied"
      );
    } catch {
      toast.error(lang === "bn" ? "কপি ব্যর্থ হয়েছে" : "Copy failed");
    }
  };

  const steps = [
    { icon: Share2, text: t.referrals.step1 },
    { icon: UserPlus, text: t.referrals.step2 },
    { icon: Coins, text: t.referrals.step3 },
  ];

  return (
    <DashboardLayout active="referrals">
      {/* Page header */}
      <div className="mb-5 animate-fade-in-up">
        <h1 className="text-xl md:text-2xl font-bold">{t.referrals.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.referrals.subtitle}</p>
      </div>

      {/* Commission info banner */}
      <Card className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-emerald-500/5 border-primary/20 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {lang === "bn" ? "২% লাইফটাইম কমিশন!" : "2% Lifetime Commission!"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "bn"
                ? "আপনার রেফার করা ইউজার যতবার উইথড্র করবে, প্রতিবার আপনি উইথড্র অ্যামাউন্টের ২% পাবেন। যেমন: ১০০০৳ উইথড্র করলে আপনি পাবেন ২০৳।"
                : "Every time your referred user withdraws, you get 2% of the withdrawal amount. Example: 1000৳ withdrawal = you get 20৳."}
            </p>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingState text={t.common.loading} />
      ) : (
        <div className="space-y-6">
          {/* Hero card with referral code */}
          <Card className="relative overflow-hidden p-5 md:p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 animate-fade-in-up">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-base md:text-lg">{t.referrals.yourCode}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t.referrals.shareText}
                </p>
              </div>
            </div>

            {/* Code block */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex-1 rounded-lg border border-dashed border-primary/40 bg-background px-4 py-3">
                <code className="text-xl md:text-2xl font-bold tracking-wider text-primary break-all">
                  {referralCode || "—"}
                </code>
              </div>
              <Button onClick={copyCode} variant="default" className="gap-2 shrink-0">
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {lang === "bn" ? "কোড কপি" : "Copy Code"}
                </span>
              </Button>
            </div>

            {/* Share link row */}
            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex-1 rounded-lg bg-background/60 px-3 py-2 text-xs text-muted-foreground truncate">
                {shareLink}
              </div>
              <Button
                onClick={copyLink}
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
              >
                <Share2 className="h-4 w-4" />
                {t.referrals.copyLink}
              </Button>
            </div>
          </Card>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 stagger">
            <Card className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{t.referrals.totalReferrals}</span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">{toBn(data?.totalReferrals ?? 0)}</div>
            </Card>

            <Card className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{t.referrals.totalBonus}</span>
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <WalletIcon className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold">
                {t.common.currency}
                {formatMoney(data?.totalBonus ?? 0, lang)}
              </div>
            </Card>
          </div>

          {/* How it works */}
          <section>
            <h2 className="font-semibold text-base md:text-lg mb-3">{t.referrals.howItWorks}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 stagger">
              {steps.map((step, i) => (
                <Card key={i} className="p-4 card-lift">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {toBn(i + 1)}
                    </span>
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{step.text}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Referral list */}
          <section>
            <h2 className="font-semibold text-base md:text-lg mb-3">{t.referrals.referralList}</h2>
            {data && data.referrals.length > 0 ? (
              <div className="space-y-2 stagger">
                {data.referrals.map((r) => (
                  <Card key={r.id} className="p-4 card-lift">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {(r.name || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate">{r.name}</p>
                          <span className="text-xs text-muted-foreground">@{r.username}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.referrals.joined}: {formatDate(r.createdAt, lang)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{t.referrals.earned}</p>
                        <Badge variant="secondary" className="font-semibold text-green-600">
                          {t.common.currency}
                          {formatMoney(r.wallet?.totalEarned ?? 0, lang)}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title={t.referrals.noReferrals}
                description={t.referrals.shareText}
              />
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
