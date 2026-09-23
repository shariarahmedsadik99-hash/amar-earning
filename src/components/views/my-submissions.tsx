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
import { UserReportDialog } from "@/components/shared/user-report-dialog";
import {
  ClipboardList, ShieldAlert, CheckCircle2, XCircle, Clock,
  Image as ImageIcon, Link as LinkIcon, FileText, ArrowRight,
  UserCircle, Calendar, Award,
} from "lucide-react";
import { formatMoney, toBn, formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Submission = {
  id: string;
  status: string;
  textProof: string | null;
  urlProof: string | null;
  imageProof: string | null;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  job: {
    id: string;
    title: string;
    reward: number;
    ownerId: string;
    category: { name: string };
    owner: { id: string; name: string; username: string };
  };
};

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string; border: string; labelBn: string; labelEn: string }> = {
  PENDING: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20", labelBn: "অপেক্ষমাণ", labelEn: "Pending" },
  APPROVED: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20", labelBn: "অনুমোদিত", labelEn: "Approved" },
  REJECTED: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20", labelBn: "প্রত্যাখ্যাত", labelEn: "Rejected" },
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

  // Stats summary
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "PENDING").length,
    approved: submissions.filter((s) => s.status === "APPROVED").length,
    rejected: submissions.filter((s) => s.status === "REJECTED").length,
    totalEarned: submissions.filter((s) => s.status === "APPROVED").reduce((sum, s) => sum + s.job.reward, 0),
  };

  return (
    <DashboardLayout active="my-submissions">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          {t.nav.mySubmissions}
        </h1>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card className="p-3 ring-1 ring-primary/20 shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{lang === "bn" ? "মোট" : "Total"}</p>
          <p className="text-lg font-bold">{toBn(stats.total)}</p>
        </Card>
        <Card className="p-3 ring-1 ring-yellow-500/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{lang === "bn" ? "অপেক্ষমাণ" : "Pending"}</p>
          <p className="text-lg font-bold text-yellow-600">{toBn(stats.pending)}</p>
        </Card>
        <Card className="p-3 ring-1 ring-green-500/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{lang === "bn" ? "অনুমোদিত" : "Approved"}</p>
          <p className="text-lg font-bold text-green-600">{toBn(stats.approved)}</p>
        </Card>
        <Card className="p-3 ring-1 ring-primary/20 shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{lang === "bn" ? "মোট আয়" : "Total Earned"}</p>
          <p className="text-lg font-bold text-primary">{t.common.currency}{formatMoney(stats.totalEarned, lang)}</p>
        </Card>
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
              {filtered.map((s) => {
                const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = cfg.icon;
                return (
                  <Card key={s.id} className={cn("p-4 border-l-4", cfg.border)}>
                    {/* Header: job title + status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => navigate({ name: "job", id: s.job.id } as Route)}
                          className="font-semibold text-sm truncate hover:text-primary transition-colors flex items-center gap-1"
                        >
                          {s.job.title}
                          <ArrowRight className="h-3 w-3 opacity-50" />
                        </button>
                        <p className="text-xs text-muted-foreground">{s.job.category.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge className={cn(cfg.bg, cfg.color, cfg.border, "border")}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {lang === "bn" ? cfg.labelBn : cfg.labelEn}
                        </Badge>
                        <p className="text-sm font-bold text-primary mt-1">
                          {t.common.currency}{formatMoney(s.job.reward, lang)}
                        </p>
                      </div>
                    </div>

                    {/* Client info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-2 rounded-lg bg-muted/30">
                      <UserCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{lang === "bn" ? "ক্লায়েন্ট:" : "Client:"}</span>
                      <span className="font-medium text-foreground">{s.job.owner.name}</span>
                      <span className="text-muted-foreground">(@{s.job.owner.username})</span>
                    </div>

                    {/* Proof preview */}
                    {(s.textProof || s.urlProof || s.imageProof) && (
                      <div className="mb-3 space-y-1.5">
                        {s.textProof && (
                          <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/30 flex items-start gap-1.5">
                            <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                            <p className="whitespace-pre-wrap break-words">{s.textProof}</p>
                          </div>
                        )}
                        {s.urlProof && (
                          <div className="text-xs p-2 rounded-lg bg-muted/30 flex items-center gap-1.5">
                            <LinkIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <a href={s.urlProof} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                              {s.urlProof}
                            </a>
                          </div>
                        )}
                        {s.imageProof && (
                          <div className="flex flex-wrap gap-2">
                            {s.imageProof.split(",").map((url, idx) => url.trim()).filter(Boolean).map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="group relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt={`proof-${idx}`}
                                  className="h-16 w-16 object-cover rounded-lg border hover:ring-2 hover:ring-primary transition-all"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rejection reason */}
                    {s.status === "REJECTED" && s.rejectReason && (
                      <div className="mb-3 p-2 rounded-lg bg-red-500/5 border border-red-500/20 flex items-start gap-1.5">
                        <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-medium text-red-600 uppercase tracking-wide">{lang === "bn" ? "প্রত্যাখ্যানের কারণ" : "Rejection Reason"}</p>
                          <p className="text-xs text-muted-foreground">{s.rejectReason}</p>
                        </div>
                      </div>
                    )}

                    {/* Status timeline */}
                    <div className="mb-3 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{lang === "bn" ? "জমা:" : "Submitted:"} {formatDateTime(s.createdAt, lang)}</span>
                      </div>
                      {s.reviewedAt && (
                        <div className={cn("flex items-center gap-1", s.status === "APPROVED" ? "text-green-600" : "text-red-600")}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{lang === "bn" ? "রিভিউ:" : "Reviewed:"} {formatDateTime(s.reviewedAt, lang)}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t">
                      <span className="text-[10px] text-muted-foreground">{timeAgo(s.createdAt, lang)}</span>
                      <div className="flex items-center gap-1">
                        {s.status === "PENDING" && (
                          <span className="text-[10px] text-yellow-600 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10">
                            <Clock className="h-3 w-3" />
                            {lang === "bn" ? "ক্লায়েন্টের রিভিউয়ের অপেক্ষায়" : "Awaiting client review"}
                          </span>
                        )}
                        {s.status === "APPROVED" && (
                          <span className="text-[10px] text-green-600 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10">
                            <Award className="h-3 w-3" />
                            {lang === "bn" ? `৳${formatMoney(s.job.reward, lang)} যোগ হয়েছে` : `৳${formatMoney(s.job.reward, lang)} credited`}
                          </span>
                        )}
                        <UserReportDialog
                          reportedId={s.job.ownerId}
                          reportedRole="employer"
                          jobId={s.job.id}
                          submissionId={s.id}
                          trigger="icon"
                          triggerVariant="ghost"
                          triggerSize="sm"
                        />
                        {s.status === "APPROVED" && (
                          <CertificateButton submissionId={s.id} />
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
