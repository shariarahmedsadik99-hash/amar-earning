"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserReportDialogProps {
  reportedId: string;
  reportedName?: string;
  // What role the reported user plays from the reporter's perspective.
  // "employer" = reporting an employer (worker filing report, e.g. NON_PAYMENT / FAKE_ISSUE)
  // "worker" = reporting a worker (employer filing report, e.g. WRONG_SUBMISSION)
  // "user" = generic
  reportedRole?: "employer" | "worker" | "user";
  jobId?: string;
  submissionId?: string;
  // The reason options shown depend on the role context.
  // If omitted, the full reason set is shown.
  defaultReason?: string;
  trigger?: "button" | "icon";
  triggerLabel?: string;
  triggerVariant?: "ghost" | "outline" | "destructive" | "secondary";
  triggerSize?: "sm" | "default" | "lg";
  className?: string;
  children?: React.ReactNode;
}

const REASON_KEYS = [
  "NON_PAYMENT",
  "FAKE_ISSUE",
  "WRONG_SUBMISSION",
  "ABUSE",
  "SPAM",
  "OTHER",
] as const;

// Worker reporting employer usually uses NON_PAYMENT / FAKE_ISSUE / ABUSE
// Employer reporting worker usually uses WRONG_SUBMISSION / ABUSE / SPAM
const WORKER_REASONS = ["WRONG_SUBMISSION", "ABUSE", "SPAM", "OTHER"] as const;
const EMPLOYER_REASONS = ["NON_PAYMENT", "FAKE_ISSUE", "ABUSE", "SPAM", "OTHER"] as const;

export function UserReportDialog({
  reportedId,
  reportedName,
  reportedRole = "user",
  jobId,
  submissionId,
  defaultReason,
  trigger = "button",
  triggerLabel,
  triggerVariant = "ghost",
  triggerSize = "sm",
  className,
  children,
}: UserReportDialogProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [open, setOpen] = useState(false);

  const reasonSet =
    reportedRole === "worker"
      ? WORKER_REASONS
      : reportedRole === "employer"
      ? EMPLOYER_REASONS
      : REASON_KEYS;

  const [reason, setReason] = useState<string>(defaultReason || reasonSet[0]);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const triggerLabelFinal =
    triggerLabel ||
    (reportedRole === "employer"
      ? t.userReports.reportEmployer
      : reportedRole === "worker"
      ? t.userReports.reportWorker
      : t.userReports.reportUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ name: "login" } as Route);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/user-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedId,
          jobId: jobId || undefined,
          submissionId: submissionId || undefined,
          reason,
          detail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(t.userReports.submitted);
      setOpen(false);
      setDetail("");
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          <span className="inline-flex">{children}</span>
        ) : trigger === "icon" ? (
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: triggerVariant, size: triggerSize }),
              "gap-1.5 text-muted-foreground hover:text-destructive",
              className
            )}
            aria-label={triggerLabelFinal}
            title={triggerLabelFinal}
          >
            <ShieldAlert className="h-4 w-4" />
          </button>
        ) : (
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={cn("gap-1.5", className)}
          >
            <ShieldAlert className="h-4 w-4" />
            {triggerLabelFinal}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            {reportedRole === "employer"
              ? t.userReports.reportEmployer
              : reportedRole === "worker"
              ? t.userReports.reportWorker
              : t.userReports.reportThisUser}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {reportedName && (
            <p className="text-xs text-muted-foreground">
              {t.userReports.reportedUser}: <span className="font-medium text-foreground">{reportedName}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t.userReports.subtitle}</p>
          <div className="space-y-1.5">
            <Label>{t.userReports.reason}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {reasonSet.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t.userReports.reasons[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="detail">{t.userReports.detail}</Label>
            <Textarea
              id="detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder={t.userReports.detailPlaceholder}
            />
          </div>
          <Button type="submit" variant="destructive" className="w-full h-11 gap-2" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            {submitting ? t.userReports.submitting : t.userReports.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
