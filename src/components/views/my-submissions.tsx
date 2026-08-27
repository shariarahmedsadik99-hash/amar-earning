"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { DashboardLayout } from "./dashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { CertificateButton } from "@/components/shared/certificate-button";
import { ClipboardList } from "lucide-react";
import { formatMoney, toBn, formatDateTime } from "@/lib/format";

type Submission = {
  id: string;
  status: string;
  textProof: string | null;
  urlProof: string | null;
  imageProof: string | null;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  job: { title: string; reward: number; category: { name: string } };
};

export function MySubmissionsPage() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    fetch("/api/submissions?scope=mine")
      .then((r) => r.json())
      .then((d) => {
        setSubmissions(d.submissions || []);
        setLoading(false);
      });
  }, []);

  const filtered = submissions.filter((s) => {
    if (tab === "all") return true;
    return s.status.toLowerCase() === tab;
  });

  return (
    <DashboardLayout active="my-submissions">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold">{t.nav.mySubmissions}</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">{t.common.all}</TabsTrigger>
          <TabsTrigger value="pending">{t.status.pending}</TabsTrigger>
          <TabsTrigger value="approved">{t.status.approved}</TabsTrigger>
          <TabsTrigger value="rejected">{t.status.rejected}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={t.notifications.noNotifications}
              action={<Button onClick={() => navigate({ name: "available-jobs" })}>{t.nav.availableJobs}</Button>}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => (
                <Card key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{s.job.title}</h3>
                      <p className="text-xs text-muted-foreground">{s.job.category.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        className={
                          s.status === "PENDING"
                            ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                            : s.status === "APPROVED"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }
                      >
                        {t.status[s.status.toLowerCase() as keyof typeof t.status] || s.status}
                      </Badge>
                      <p className="text-sm font-bold text-primary mt-1">
                        {t.common.currency}{formatMoney(s.job.reward, lang)}
                      </p>
                    </div>
                  </div>

                  {(s.textProof || s.urlProof) && (
                    <div className="text-xs text-muted-foreground space-y-1 mb-2 p-2 rounded-lg bg-muted/30">
                      {s.textProof && <p>📝 {s.textProof}</p>}
                      {s.urlProof && <p>🔗 {s.urlProof}</p>}
                    </div>
                  )}

                  {s.status === "REJECTED" && s.rejectReason && (
                    <p className="text-xs text-destructive mb-2">⚠️ {s.rejectReason}</p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-muted-foreground">{formatDateTime(s.createdAt, lang)}</p>
                    {s.status === "APPROVED" && (
                      <CertificateButton submissionId={s.id} />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
