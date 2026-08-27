"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobCard, type JobCardData } from "@/components/shared/job-card";
import { Sparkles, TrendingUp } from "lucide-react";
import { formatMoney, toBn } from "@/lib/format";

export function Recommendations() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [reason, setReason] = useState<"based_on_history" | "top_jobs">("top_jobs");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/recommendations");
        if (res.ok && active) {
          const data = await res.json();
          setJobs(data.jobs || []);
          setReason(data.reason || "top_jobs");
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
        <div className="h-5 w-48 skeleton-shimmer rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 skeleton-shimmer rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t.recommendations.title}</h3>
            <p className="text-xs text-muted-foreground">{t.recommendations.subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {reason === "based_on_history" ? t.recommendations.basedOnHistory : t.recommendations.topJobs}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </Card>
  );
}
