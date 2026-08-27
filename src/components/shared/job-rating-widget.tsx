"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, BarChart3, Loader2 } from "lucide-react";
import { toBn } from "@/lib/format";

export function JobRatingWidget({ jobId }: { jobId: string }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [distribution, setDistribution] = useState<Record<number, number>>({1:0,2:0,3:0,4:0,5:0});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const load = async () => {
    try {
      const res = await fetch(`/api/job-ratings?jobId=${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setAvgRating(data.avgRating);
        setTotalRatings(data.totalRatings);
        setMyRating(data.myRating);
        setDistribution(data.distribution);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [jobId]);

  const submitRating = async (difficulty: number) => {
    if (!user) {
      navigate({ name: "login" } as Route);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/job-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, difficulty }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.updated ? t.jobRating.updated : t.jobRating.submitted);
        setMyRating(difficulty);
        load();
      } else {
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-5 w-40 skeleton-shimmer rounded mb-4" />
        <div className="h-24 skeleton-shimmer rounded-lg" />
      </Card>
    );
  }

  const difficultyLabels: Record<number, string> = {
    1: lang === "bn" ? t.jobRating.difficulty[1] : t.jobRating.difficulty[1],
    2: t.jobRating.difficulty[2],
    3: t.jobRating.difficulty[3],
    4: t.jobRating.difficulty[4],
    5: t.jobRating.difficulty[5],
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">{t.jobRating.title}</h3>
      </div>

      {/* Average rating display */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-primary">{toBn(avgRating)}</p>
          <div className="flex gap-0.5 justify-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= Math.round(avgRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {toBn(totalRatings)} {t.jobRating.totalRatings}
          </p>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{toBn(star)}</span>
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-muted-foreground">{toBn(count)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rate this job */}
      <div className="pt-4 border-t">
        <p className="text-xs font-medium text-muted-foreground mb-2">{t.jobRating.subtitle}</p>
        {myRating !== null ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t.jobRating.yourRating}:</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
              <Star className="h-3 w-3 fill-primary" />
              {toBn(myRating)}/5 — {difficultyLabels[myRating]}
            </Badge>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => submitRating(star)}
                disabled={submitting}
                className="group p-1"
                aria-label={`${star} stars`}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= hoverRating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30 group-hover:text-amber-400"
                  }`}
                />
              </button>
            ))}
            {submitting && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />}
            {hoverRating > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                {difficultyLabels[hoverRating]}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
