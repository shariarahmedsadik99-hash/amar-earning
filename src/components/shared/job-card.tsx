"use client";

import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "./category-icon";
import { formatMoney, toBn } from "@/lib/format";
import { Users, CheckCircle2, Clock } from "lucide-react";

export type JobCardData = {
  id: string;
  title: string;
  description: string;
  reward: number;
  workerLimit: number;
  completedCount: number;
  status: string;
  deadline: string;
  category: { id: string; name: string; slug: string; icon: string };
  _count?: { submissions: number };
};

export function JobCard({ job }: { job: JobCardData }) {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const remaining = job.workerLimit - job.completedCount;

  return (
    <Card className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CategoryIcon name={job.category.icon} className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{job.category.name}</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 font-semibold text-primary">
          {t.common.currency}{formatMoney(job.reward, lang)}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {job.description}
      </p>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {toBn(remaining)} {t.jobs.available}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          {toBn(job.completedCount)}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="h-3 w-3" />
        </span>
      </div>

      <Button
        size="sm"
        className="w-full mt-auto"
        onClick={() => navigate({ name: "job", id: job.id })}
      >
        {t.jobs.viewJob}
      </Button>
    </Card>
  );
}
