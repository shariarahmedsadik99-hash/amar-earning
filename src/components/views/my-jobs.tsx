"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { DashboardLayout } from "./dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { toast } from "sonner";
import { Briefcase, Eye, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { formatMoney, toBn, formatDateTime } from "@/lib/format";

type MyJob = {
  id: string;
  title: string;
  reward: number;
  workerLimit: number;
  completedCount: number;
  status: string;
  totalBudget: number;
  createdAt: string;
  category: { name: string };
  _count: { submissions: number };
};

type Submission = {
  id: string;
  status: string;
  textProof: string | null;
  imageProof: string | null;
  urlProof: string | null;
  createdAt: string;
  user: { name: string; username: string };
};

export function MyJobsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetch(`/api/jobs/list?ownerId=${user.id}&status=ACTIVE&limit=100`);
    const data = await res.json();
    setJobs(data.jobs || []);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!user) return;
      const res = await fetch(`/api/jobs/list?ownerId=${user.id}&status=ACTIVE&limit=100`);
      const data = await res.json();
      if (active) {
        setJobs(data.jobs || []);
        setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [user]);

  const filtered = jobs.filter((j) => {
    if (activeTab === "active") return j.status === "ACTIVE";
    if (activeTab === "completed") return j.status === "COMPLETED" || j.completedCount >= j.workerLimit;
    return true;
  });

  return (
    <DashboardLayout active="my-jobs">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">{t.nav.myJobs}</h1>
        <Button size="sm" onClick={() => navigate({ name: "post-job" })}>+ {t.nav.postJob}</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="active">{t.status.active}</TabsTrigger>
          <TabsTrigger value="completed">{t.status.completed}</TabsTrigger>
          <TabsTrigger value="all">{t.common.all}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={t.jobs.noJobs}
              action={<Button onClick={() => navigate({ name: "post-job" })}>+ {t.nav.postJob}</Button>}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((job) => (
                <JobRow key={job.id} job={job} t={t} lang={lang} navigate={navigate} onUpdate={load} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

function JobRow({
  job,
  t,
  lang,
  navigate,
  onUpdate,
}: {
  job: MyJob;
  t: ReturnType<typeof useI18n>["t"];
  lang: "bn" | "en";
  navigate: (r: Route) => void;
  onUpdate: () => void;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showSubs, setShowSubs] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const loadSubs = async () => {
    setLoadingSubs(true);
    const res = await fetch(`/api/submissions?scope=job&jobId=${job.id}`);
    const data = await res.json();
    setSubmissions(data.submissions || []);
    setLoadingSubs(false);
    setShowSubs(true);
  };

  const review = async (submissionId: string, action: "approve" | "reject") => {
    const reason = action === "reject" ? prompt(lang === "bn" ? "প্রত্যাখ্যানের কারণ:" : "Reject reason:") : undefined;
    const res = await fetch("/api/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, action, rejectReason: reason }),
    });
    if (res.ok) {
      toast.success(action === "approve" ? t.common.approve + " ✓" : t.common.reject + " ✓");
      loadSubs();
      onUpdate();
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{job.title}</h3>
          <p className="text-xs text-muted-foreground">{job.category.name}</p>
        </div>
        <Badge variant="secondary" className="text-primary">
          {t.common.currency}{formatMoney(job.reward, lang)}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="font-bold text-sm">{toBn(job.workerLimit)}</p>
          <p className="text-muted-foreground">{lang === "bn" ? "মোট" : "Total"}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="font-bold text-sm">{toBn(job.completedCount)}</p>
          <p className="text-muted-foreground">{t.jobs.completed}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="font-bold text-sm">{toBn(job._count.submissions)}</p>
          <p className="text-muted-foreground">{lang === "bn" ? "সাবমিশন" : "Subs"}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="font-bold text-sm">{t.common.currency}{formatMoney(job.reward * job.workerLimit, lang)}</p>
          <p className="text-muted-foreground">{lang === "bn" ? "বাজেট" : "Budget"}</p>
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={loadSubs}>
        <Eye className="h-4 w-4 mr-2" />
        {lang === "bn" ? "সাবমিশন দেখুন" : "View Submissions"} ({toBn(job._count.submissions)})
      </Button>

      {showSubs && (
        <div className="mt-3 pt-3 border-t space-y-2">
          {loadingSubs ? (
            <LoadingState />
          ) : submissions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">{t.notifications.noNotifications}</p>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{s.user.name} (@{s.user.username})</span>
                  <Badge
                    variant="outline"
                    className={
                      s.status === "PENDING"
                        ? "text-yellow-600 border-yellow-500/30"
                        : s.status === "APPROVED"
                        ? "text-green-600 border-green-500/30"
                        : "text-red-600 border-red-500/30"
                    }
                  >
                    {t.status[s.status.toLowerCase() as keyof typeof t.status] || s.status}
                  </Badge>
                </div>
                {s.textProof && <p className="text-xs text-muted-foreground mb-1">📝 {s.textProof}</p>}
                {s.urlProof && <p className="text-xs text-muted-foreground mb-1">🔗 {s.urlProof}</p>}
                <p className="text-[10px] text-muted-foreground">{formatDateTime(s.createdAt, lang)}</p>
                {s.status === "PENDING" && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-7 text-xs flex-1" onClick={() => review(s.id, "approve")}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> {t.common.approve}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1 text-destructive" onClick={() => review(s.id, "reject")}>
                      <XCircle className="h-3 w-3 mr-1" /> {t.common.reject}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
