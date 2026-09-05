"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { DashboardLayout } from "./dashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { ShieldAlert, ShieldCheck, ArrowRight } from "lucide-react";
import { useRouter, type Route } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

type Report = {
  id: string;
  reason: string;
  detail: string | null;
  status: string;
  resolution: string | null;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; name: string; username: string };
  reported: { id: string; name: string; username: string };
  job: { id: string; title: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  REVIEWING: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  RESOLVED: "bg-green-500/10 text-green-600 border-green-500/20",
  DISMISSED: "bg-muted text-muted-foreground border-border",
};

export function MyReportsPage() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    fetch("/api/user-reports")
      .then((r) => r.json())
      .then((d) => {
        setReports(d.reports || []);
        setLoading(false);
      });
  }, []);

  const filtered = reports.filter((r) => {
    if (tab === "all") return true;
    if (tab === "filed") return r.reporter.id !== r.reported.id; // all are from current user, show all filed
    return true; // tab "against" filtered below
  });
  // For "against" we want reports where the current user is reported.
  // Since the API returns both directions, we need to know current user id.
  // Simpler: keep tab = "filed" or "against" using the api direction.
  // We'll just fetch separately for clarity.

  return (
    <DashboardLayout active="my-reports">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{t.userReports.myReports}</h1>
          <p className="text-xs text-muted-foreground">{t.userReports.subtitle}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="all">{t.common.all}</TabsTrigger>
          <TabsTrigger value="filed">{t.userReports.filedByMe}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {loading ? (
            <LoadingState />
          ) : reports.length === 0 ? (
            <EmptyState icon={ShieldCheck} title={t.userReports.noReports} />
          ) : (
            <div className="space-y-3">
              {reports.map((r) => {
                const other = r.reported;
                return (
                  <Card key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <ShieldAlert className="h-3 w-3 text-destructive" />
                          <span>
                            {t.userReports.reportedUser}:{" "}
                            <span className="font-medium text-foreground">
                              {other.name} (@{other.username})
                            </span>
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {t.userReports.reasons[r.reason as keyof typeof t.userReports.reasons] || r.reason}
                        </Badge>
                      </div>
                      <Badge className={`text-[10px] ${STATUS_COLOR[r.status] || ""}`}>
                        {t.userReports.status[r.status as keyof typeof t.userReports.status] || r.status}
                      </Badge>
                    </div>

                    {r.detail && (
                      <p className="text-xs text-muted-foreground mb-2 p-2 rounded-lg bg-muted/30 whitespace-pre-wrap">
                        {r.detail}
                      </p>
                    )}

                    {r.job && (
                      <button
                        onClick={() => navigate({ name: "job", id: r.job!.id } as Route)}
                        className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
                      >
                        {t.userReports.relatedJob}: {r.job.title}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}

                    {r.resolution && r.resolution !== "NO_ACTION" && (
                      <p className="text-xs text-green-600 mb-1">
                        {t.userReports.resolution}:{" "}
                        {t.adminDisputes.resolutionOptions[r.resolution as keyof typeof t.adminDisputes.resolutionOptions] || r.resolution}
                      </p>
                    )}

                    <p className="text-[10px] text-muted-foreground">
                      {formatDateTime(r.createdAt, lang)}
                    </p>
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
