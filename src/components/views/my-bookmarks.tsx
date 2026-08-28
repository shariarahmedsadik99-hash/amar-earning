"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { DashboardLayout } from "./dashboard";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { JobCard, type JobCardData } from "@/components/shared/job-card";
import { Bookmark, BookmarkX } from "lucide-react";

type BookmarkJob = {
  id: string;
  title: string;
  description: string;
  reward: number;
  workerLimit: number;
  completedCount: number;
  status: string;
  deadline: string;
  category: { id: string; name: string; slug: string; icon: string };
  owner: { name: string; username: string };
};

type Bookmark = {
  id: string;
  createdAt: string;
  job: BookmarkJob;
};

export function MyBookmarksPage() {
  const { t } = useI18n();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/bookmarks", { cache: "no-store" });
        const json = await res.json();
        if (active) {
          setBookmarks(json.bookmarks || []);
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
  }, []);

  const jobs: JobCardData[] = bookmarks.map((b) => ({
    id: b.job.id,
    title: b.job.title,
    description: b.job.description,
    reward: b.job.reward,
    workerLimit: b.job.workerLimit,
    completedCount: b.job.completedCount,
    status: b.job.status,
    deadline: b.job.deadline,
    category: b.job.category,
    _count: { submissions: 0 },
  }));

  return (
    <DashboardLayout active="my-bookmarks">
      {/* Header */}
      <div className="mb-5 animate-fade-in-up">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold">{t.bookmarks.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{t.bookmarks.subtitle}</p>
      </div>

      {loading ? (
        <LoadingState text={t.common.loading} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={BookmarkX}
          title={t.bookmarks.empty}
          description={t.bookmarks.emptyHint}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 stagger">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
