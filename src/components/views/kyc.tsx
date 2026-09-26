"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { DashboardLayout } from "./dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/states";
import { ImageUploader } from "@/components/shared/image-uploader";
import { toast } from "sonner";
import {
  ShieldCheck, Loader2, CheckCircle2, XCircle, Clock,
  IdCard, UserCircle, Upload, AlertCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";

type KycData = {
  kycStatus: string;
  kycNidFront: string | null;
  kycNidBack: string | null;
  kycSelfie: string | null;
  kycSubmittedAt: string | null;
  kycReviewedAt: string | null;
  kycRejectReason: string | null;
};

export function KycPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nidFront, setNidFront] = useState("");
  const [nidBack, setNidBack] = useState("");
  const [selfie, setSelfie] = useState("");

  useEffect(() => {
    fetch("/api/kyc")
      .then((r) => r.json())
      .then((d) => {
        setKyc(d.kyc || null);
        if (d.kyc?.kycNidFront) setNidFront(d.kyc.kycNidFront);
        if (d.kyc?.kycNidBack) setNidBack(d.kyc.kycNidBack);
        if (d.kyc?.kycSelfie) setSelfie(d.kyc.kycSelfie);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nidFront || !nidBack || !selfie) {
      toast.error(lang === "bn" ? "সব ছবি আপলোড করুন" : "Upload all images");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nidFront, nidBack, selfie }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(lang === "bn" ? "KYC জমা হয়েছে ✓" : "KYC submitted ✓");
      // Refresh
      const kycRes = await fetch("/api/kyc");
      const kycData = await kycRes.json();
      setKyc(kycData.kyc);
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout active="kyc">
        <LoadingState />
      </DashboardLayout>
    );
  }

  const status = kyc?.kycStatus || "NONE";

  const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string; border: string; labelBn: string; labelEn: string }> = {
    NONE: { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/30", border: "border-muted", labelBn: "যাচাই হয়নি", labelEn: "Not verified" },
    PENDING: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20", labelBn: "অপেক্ষমাণ", labelEn: "Pending review" },
    VERIFIED: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20", labelBn: "যাচাই হয়েছে", labelEn: "Verified" },
    REJECTED: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20", labelBn: "প্রত্যাখ্যাত", labelEn: "Rejected" },
  };

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NONE;
  const StatusIcon = cfg.icon;

  return (
    <DashboardLayout active="kyc">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {lang === "bn" ? "KYC যাচাই" : "KYC Verification"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "bn"
            ? "কাজ পোস্ট করতে NID ও selfie যাচাই প্রয়োজন"
            : "NID and selfie verification required to post jobs"}
        </p>
      </div>

      {/* Status banner */}
      <Card className={`p-4 mb-5 border-l-4 ${cfg.border} ${cfg.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
            <StatusIcon className={`h-5 w-5 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">
                {lang === "bn" ? "KYC স্ট্যাটাস" : "KYC Status"}
              </p>
              <Badge className={`${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                {lang === "bn" ? cfg.labelBn : cfg.labelEn}
              </Badge>
            </div>
            {kyc?.kycSubmittedAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "bn" ? "জমা দেওয়া হয়েছে:" : "Submitted:"} {formatDateTime(kyc.kycSubmittedAt, lang)}
              </p>
            )}
            {kyc?.kycReviewedAt && (
              <p className="text-xs text-muted-foreground">
                {lang === "bn" ? "যাচাই হয়েছে:" : "Reviewed:"} {formatDateTime(kyc.kycReviewedAt, lang)}
              </p>
            )}
          </div>
          {status === "VERIFIED" && (
            <Button onClick={() => navigate({ name: "post-job" } as Route)} className="shrink-0">
              {lang === "bn" ? "কাজ পোস্ট করুন" : "Post Job"}
            </Button>
          )}
        </div>
        {status === "REJECTED" && kyc?.kycRejectReason && (
          <div className="mt-3 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-xs text-red-600">
              <span className="font-medium">{lang === "bn" ? "কারণ:" : "Reason:"}</span> {kyc.kycRejectReason}
            </p>
          </div>
        )}
      </Card>

      {/* Already verified — don't show the form */}
      {status === "VERIFIED" ? (
        <Card className="p-6 text-center">
          <div className="h-14 w-14 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="font-semibold text-lg mb-1">
            {lang === "bn" ? "আপনার KYC যাচাই সম্পন্ন!" : "Your KYC is verified!"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            {lang === "bn"
              ? "আপনি এখন কাজ পোস্ট করতে পারবেন। নিচের বাটনে ক্লিক করে কাজ পোস্ট করুন।"
              : "You can now post jobs. Click below to post a job."}
          </p>
          <Button onClick={() => navigate({ name: "post-job" } as Route)} className="gap-2">
            {lang === "bn" ? "কাজ পোস্ট করুন" : "Post a Job"}
          </Button>
        </Card>
      ) : (
        /* KYC submission form */
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Instructions */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-primary mb-0.5">
                  {lang === "bn" ? "নির্দেশনা" : "Instructions"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === "bn"
                    ? "নিচে আপনার NID এর সামনের ও পেছনের অংশের ছবি এবং একটি selfie (face verification) আপলোড করুন। অ্যাডমিন যাচাই করার পর আপনি কাজ পোস্ট করতে পারবেন।"
                    : "Upload clear photos of your NID (front + back) and a selfie for face verification. After admin review, you can post jobs."}
                </p>
              </div>
            </div>

            {/* NID Front */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <IdCard className="h-4 w-4 text-primary" />
                {lang === "bn" ? "NID সামনের অংশ" : "NID Front Side"}
              </label>
              <ImageUploader
                value={nidFront}
                onChange={setNidFront}
                label={lang === "bn" ? "NID সামনের ছবি" : "NID front photo"}
                allowUrl={false}
              />
            </div>

            {/* NID Back */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <IdCard className="h-4 w-4 text-primary" />
                {lang === "bn" ? "NID পেছনের অংশ" : "NID Back Side"}
              </label>
              <ImageUploader
                value={nidBack}
                onChange={setNidBack}
                label={lang === "bn" ? "NID পেছনের ছবি" : "NID back photo"}
                allowUrl={false}
              />
            </div>

            {/* Selfie */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <UserCircle className="h-4 w-4 text-primary" />
                {lang === "bn" ? "Selfie (Face Verification)" : "Selfie (Face Verification)"}
              </label>
              <ImageUploader
                value={selfie}
                onChange={setSelfie}
                label={lang === "bn" ? "আপনার সেলফি" : "Your selfie"}
                allowUrl={false}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2"
              disabled={submitting || !nidFront || !nidBack || !selfie}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {status === "REJECTED"
                ? (lang === "bn" ? "আবার জমা দিন" : "Re-submit")
                : (lang === "bn" ? "KYC জমা দিন" : "Submit KYC")}
            </Button>
          </form>
        </Card>
      )}
    </DashboardLayout>
  );
}
