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
  IdCard, UserCircle, Upload, AlertCircle, FileText, CreditCard,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type KycData = {
  kycStatus: string;
  kycDocType: string | null;
  kycNidFront: string | null;
  kycNidBack: string | null;
  kycSelfie: string | null;
  kycSubmittedAt: string | null;
  kycReviewedAt: string | null;
  kycRejectReason: string | null;
};

const DOC_TYPES = [
  { value: "NID", labelBn: "জাতীয় পরিচয়পত্র (NID)", labelEn: "National ID (NID)", icon: IdCard, requiresBack: true },
  { value: "LICENSE", labelBn: "ড্রাইভিং লাইসেন্স", labelEn: "Driving License", icon: CreditCard, requiresBack: false },
  { value: "PASSPORT", labelBn: "পাসপোর্ট", labelEn: "Passport", icon: FileText, requiresBack: false },
];

export function KycPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [docType, setDocType] = useState("NID");
  const [docFront, setDocFront] = useState("");
  const [docBack, setDocBack] = useState("");
  const [selfie, setSelfie] = useState("");

  useEffect(() => {
    fetch("/api/kyc")
      .then((r) => r.json())
      .then((d) => {
        setKyc(d.kyc || null);
        if (d.kyc?.kycDocType) setDocType(d.kyc.kycDocType);
        if (d.kyc?.kycNidFront) setDocFront(d.kyc.kycNidFront);
        if (d.kyc?.kycNidBack) setDocBack(d.kyc.kycNidBack);
        if (d.kyc?.kycSelfie) setSelfie(d.kyc.kycSelfie);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFront || !selfie) {
      toast.error(lang === "bn" ? "ডকুমেন্ট ছবি ও selfie আপলোড করুন" : "Upload document image and selfie");
      return;
    }
    if (docType === "NID" && !docBack) {
      toast.error(lang === "bn" ? "NID এর পেছনের ছবি আপলোড করুন" : "Upload NID back image");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          docFront,
          docBack: docType === "NID" ? docBack : undefined,
          selfie,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(lang === "bn" ? "KYC জমা হয়েছে ✓" : "KYC submitted ✓");
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
  const selectedDoc = DOC_TYPES.find((d) => d.value === docType) || DOC_TYPES[0];

  return (
    <DashboardLayout active="kyc">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {lang === "bn" ? "KYC যাচাই" : "KYC Verification"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "bn"
            ? "কাজ করতে বা কাজ পোস্ট করতে KYC যাচাই প্রয়োজন"
            : "KYC verification required to work or post jobs"}
        </p>
      </div>

      {/* Status banner */}
      <Card className={cn("p-4 mb-5 border-l-4", cfg.border, cfg.bg)}>
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
            <StatusIcon className={cn("h-5 w-5", cfg.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">
                {lang === "bn" ? "KYC স্ট্যাটাস" : "KYC Status"}
              </p>
              <Badge className={cn(cfg.bg, cfg.color, cfg.border, "border")}>
                {lang === "bn" ? cfg.labelBn : cfg.labelEn}
              </Badge>
              {kyc?.kycDocType && (
                <Badge variant="outline" className="text-primary border-primary/30">
                  {DOC_TYPES.find((d) => d.value === kyc.kycDocType)?.[lang === "bn" ? "labelBn" : "labelEn"] || kyc.kycDocType}
                </Badge>
              )}
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
              ? "আপনি এখন কাজ করতে এবং কাজ পোস্ট করতে পারবেন।"
              : "You can now work on jobs and post jobs."}
          </p>
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
                    ? "নিচে আপনার পরিচয়পত্র (NID/লাইসেন্স/পাসপোর্ট) এবং একটি selfie আপলোড করুন। অ্যাডমিন যাচাই করার পর আপনি কাজ করতে ও কাজ পোস্ট করতে পারবেন।"
                    : "Upload your ID document (NID/License/Passport) and a selfie. After admin review, you can work and post jobs."}
                </p>
              </div>
            </div>

            {/* Document type selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <IdCard className="h-4 w-4 text-primary" />
                {lang === "bn" ? "ডকুমেন্ট টাইপ বাছুন" : "Select Document Type"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DOC_TYPES.map((d) => {
                  const Icon = d.icon;
                  const isSelected = docType === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => {
                        setDocType(d.value);
                        setDocFront("");
                        setDocBack("");
                      }}
                      className={cn(
                        "p-3 rounded-xl border-2 text-center transition-all",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 mx-auto mb-1", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <p className="text-[10px] font-medium leading-tight">
                        {lang === "bn" ? d.labelBn : d.labelEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document front */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <IdCard className="h-4 w-4 text-primary" />
                {docType === "NID"
                  ? (lang === "bn" ? `${selectedDoc.labelBn} সামনের অংশ` : `${selectedDoc.labelEn} Front`)
                  : (lang === "bn" ? `${selectedDoc.labelBn} ছবি` : `${selectedDoc.labelEn} Image`)}
              </label>
              <ImageUploader
                value={docFront}
                onChange={setDocFront}
                label={lang === "bn" ? "ডকুমেন্ট ছবি" : "Document image"}
                allowUrl={false}
              />
            </div>

            {/* Document back — only for NID */}
            {docType === "NID" && (
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <IdCard className="h-4 w-4 text-primary" />
                  {lang === "bn" ? "NID পেছনের অংশ" : "NID Back Side"}
                </label>
                <ImageUploader
                  value={docBack}
                  onChange={setDocBack}
                  label={lang === "bn" ? "NID পেছনের ছবি" : "NID back image"}
                  allowUrl={false}
                />
              </div>
            )}

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
              disabled={submitting || !docFront || !selfie || (docType === "NID" && !docBack)}
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
