"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Flag, Loader2, CheckCircle2 } from "lucide-react";

export function ReportButton({ jobId }: { jobId: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/reports", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        if (res.ok && active) {
          const data = await res.json();
          setReported(data.reported);
        }
      } catch {}
    };
    run();
    return () => { active = false; };
  }, [open, user, jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ name: "login" } as Route);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, reason, detail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(t.report.submitted);
      setReported(true);
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
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground">
          {reported ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Flag className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{reported ? (t.report.alreadyReported) : t.report.title}</span>
          <Flag className="h-4 w-4 sm:hidden" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            {t.report.title}
          </DialogTitle>
        </DialogHeader>
        {reported ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 mb-2" />
            <p className="text-sm font-medium">{t.report.alreadyReported}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground">{t.report.subtitle}</p>
            <div className="space-y-1.5">
              <Label>{t.report.reason}</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">{t.report.reasons.spam}</SelectItem>
                  <SelectItem value="inappropriate">{t.report.reasons.inappropriate}</SelectItem>
                  <SelectItem value="scam">{t.report.reasons.scam}</SelectItem>
                  <SelectItem value="duplicate">{t.report.reasons.duplicate}</SelectItem>
                  <SelectItem value="other">{t.report.reasons.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="detail">{t.report.detail}</Label>
              <Textarea
                id="detail"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                maxLength={300}
              />
            </div>
            <Button type="submit" variant="destructive" className="w-full h-11 gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Flag className="h-4 w-4" />}
              {t.report.submit}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
