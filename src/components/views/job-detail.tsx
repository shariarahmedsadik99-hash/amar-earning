"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryIcon } from "@/components/shared/category-icon";
import { JobStatsCard } from "@/components/shared/job-stats-card";
import { OwnerReputation } from "@/components/shared/owner-reputation";
import { ShareButton } from "@/components/shared/share-button";
import { ReportButton } from "@/components/shared/report-button";
import { JobRatingWidget } from "@/components/shared/job-rating-widget";
import { LoadingState } from "@/components/shared/states";
import { useRecentJobs } from "@/lib/use-recent-jobs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Wallet,
  ListChecks,
  FileCheck,
  Link2,
  Image as ImageIcon,
  Loader2,
  Send,
  Bookmark,
} from "lucide-react";
import { formatMoney, formatDate, toBn } from "@/lib/format";

type JobDetail = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  requiredProof: string;
  reward: number;
  workerLimit: number;
  completedCount: number;
  status: string;
  deadline: string;
  createdAt: string;
  ownerId: string;
  category: { id: string; name: string; slug: string; icon: string };
  owner: { name: string; username: string };
  _count: { submissions: number };
};

export function JobDetailPage({ jobId }: { jobId: string }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mySubmission, setMySubmission] = useState<{ status: string } | null>(null);
  const [showProof, setShowProof] = useState(false);
  const [proof, setProof] = useState({ textProof: "", urlProof: "", imageProof: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const { add: addRecentJob } = useRecentJobs();

  useEffect(() => {
    fetch(`/api/jobs?id=${jobId}`)
      .then((r) => r.json())
      .then((d) => {
        setJob(d.job);
        setMySubmission(d.mySubmission);
        setLoading(false);
        // Track recently viewed
        if (d.job) {
          addRecentJob({
            id: d.job.id,
            title: d.job.title,
            reward: d.job.reward,
            categoryName: d.job.category.name,
          });
        }
      });
    // Load bookmark status
    if (user) {
      fetch("/api/bookmarks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) })
        .then((r) => r.json())
        .then((d) => setBookmarked(d.bookmarked));
    }
  }, [jobId, user]);

  const toggleBookmark = async () => {
    if (!user) {
      navigate({ name: "login" });
      return;
    }
    if (job?.owner.username === user.username) return; // can't bookmark own job
    setBookmarkLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookmarked(data.bookmarked);
        toast.success(data.bookmarked ? t.bookmarks.added : t.bookmarks.removed);
      }
    } catch {
      toast.error("Error");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ name: "login" } as Route);
      return;
    }
    if (!proof.textProof && !proof.urlProof && !proof.imageProof) {
      toast.error(t.proof.title);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, ...proof }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(t.proof.success);
      setMySubmission({ status: "PENDING" });
      setShowProof(false);
      setProof({ textProof: "", urlProof: "", imageProof: "" });
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{t.jobs.noJobs}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ name: "available-jobs" })}>
          {t.nav.availableJobs}
        </Button>
      </div>
    );
  }

  const remaining = job.workerLimit - job.completedCount;
  const isOwner = user?.id && job.owner.username === user.username;
  const isFull = remaining <= 0;
  const expired = new Date(job.deadline) < new Date();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate({ name: "available-jobs" })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.back}
        </button>
        <div className="flex items-center gap-1">
          <ShareButton jobId={job.id} />
          {!isOwner && <ReportButton jobId={job.id} />}
        </div>
      </div>

      {/* Header */}
      <Card className="p-5 md:p-6 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CategoryIcon name={job.category.icon} className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="secondary">{job.category.name}</Badge>
              {job.status === "ACTIVE" && (
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  {t.status.active}
                </Badge>
              )}
              {!isOwner && user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-8 w-8 p-0"
                  onClick={toggleBookmark}
                  disabled={bookmarkLoading}
                  aria-label="Bookmark"
                >
                  <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                </Button>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">{job.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "bn" ? "পোস্ট করেছেন" : "Posted by"} {job.owner.name} (@{job.owner.username})
            </p>
          </div>
        </div>

        {/* Reward highlight */}
        <div className="flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-primary/5 border border-primary/20">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">{t.jobs.reward}:</span>
          <span className="text-2xl font-bold text-primary">{t.common.currency}{formatMoney(job.reward, lang)}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat icon={Users} label={t.jobs.available} value={`${toBn(remaining)}/${toBn(job.workerLimit)}`} />
          <Stat icon={CheckCircle2} label={t.jobs.completed} value={toBn(job.completedCount)} />
          <Stat icon={Clock} label={t.jobs.deadline} value={formatDate(job.deadline, lang)} />
        </div>
      </Card>

      {/* Description */}
      <Card className="p-5 md:p-6 mb-4">
        <h2 className="font-semibold text-base mb-2 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-primary" />
          {t.jobs.description}
        </h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
      </Card>

      {/* Instructions */}
      <Card className="p-5 md:p-6 mb-4">
        <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          {t.jobs.instructions}
        </h2>
        <div className="space-y-2">
          {job.instructions.split("\n").map((line, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {toBn(i + 1)}
              </span>
              <span className="text-muted-foreground leading-relaxed pt-0.5">{line.replace(/^\d+\.\s*/, "")}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Required proof */}
      <Card className="p-5 md:p-6 mb-4">
        <h2 className="font-semibold text-base mb-2 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-primary" />
          {t.jobs.requiredProof}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{job.requiredProof}</p>
      </Card>

      {/* Job Statistics */}
      <div className="mb-4">
        <JobStatsCard jobId={job.id} />
      </div>

      {/* Owner Reputation */}
      <div className="mb-4">
        <OwnerReputation ownerId={job.ownerId} />
      </div>

      {/* Job Difficulty Rating */}
      <div className="mb-4">
        <JobRatingWidget jobId={job.id} />
      </div>

      {/* Action */}
      {isOwner ? (
        <Card className="p-5 text-center border-primary/20 bg-primary/5">
          <p className="text-sm text-muted-foreground">
            {lang === "bn" ? "এটি আপনার নিজের কাজ। আপনি নিজের কাজ সম্পন্ন করতে পারবেন না।" : "This is your own job. You cannot complete your own job."}
          </p>
        </Card>
      ) : mySubmission ? (
        <Card className="p-5 text-center">
          <Badge
            className={
              mySubmission.status === "PENDING"
                ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                : mySubmission.status === "APPROVED"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-red-500/10 text-red-600 border-red-500/20"
            }
          >
            {t.status[mySubmission.status.toLowerCase() as keyof typeof t.status] || mySubmission.status}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            {lang === "bn" ? "আপনি এই কাজে ইতিমধ্যে আবেদন করেছেন।" : "You have already applied for this job."}
          </p>
        </Card>
      ) : isFull ? (
        <Card className="p-5 text-center">
          <p className="text-sm text-muted-foreground">{lang === "bn" ? "এই কাজের স্লট পূর্ণ।" : "This job is full."}</p>
        </Card>
      ) : expired ? (
        <Card className="p-5 text-center">
          <p className="text-sm text-muted-foreground">{lang === "bn" ? "এই কাজের সময় শেষ।" : "This job has expired."}</p>
        </Card>
      ) : !user ? (
        <Card className="p-5 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {lang === "bn" ? "কাজ শুরু করতে লগইন করুন।" : "Login to start this job."}
          </p>
          <Button onClick={() => navigate({ name: "login" })}>{t.nav.login}</Button>
        </Card>
      ) : showProof ? (
        <Card className="p-5 md:p-6">
          <h2 className="font-semibold text-base mb-4">{t.proof.title}</h2>
          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5" /> {t.proof.textProof}
              </Label>
              <Textarea
                value={proof.textProof}
                onChange={(e) => setProof({ ...proof, textProof: e.target.value })}
                placeholder={lang === "bn" ? "আপনার প্রমাণ লিখুন..." : "Write your proof..."}
                rows={4}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> {t.proof.urlProof}
                </Label>
                <Input
                  value={proof.urlProof}
                  onChange={(e) => setProof({ ...proof, urlProof: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> {t.proof.imageProof}
                </Label>
                <Input
                  value={proof.imageProof}
                  onChange={(e) => setProof({ ...proof, imageProof: e.target.value })}
                  placeholder={lang === "bn" ? "ছবির লিংক" : "Image URL"}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowProof(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {t.proof.submit}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button size="lg" className="w-full h-12 text-base" onClick={() => setShowProof(true)}>
          {t.jobs.startJob}
        </Button>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground mb-1" />
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
