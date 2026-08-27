"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatMoney, formatDate } from "@/lib/format";
import { Award, Download, Loader2, ShieldCheck, Sparkles } from "lucide-react";

type Certificate = {
  certificateId: string;
  recipientName: string;
  recipientUsername: string;
  jobTitle: string;
  categoryName: string;
  reward: number;
  ownerName: string;
  completedAt: string;
  issuedAt: string;
};

export function CertificateButton({ submissionId }: { submissionId: string }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/certificate?submissionId=${submissionId}`);
        if (res.ok && active) {
          const data = await res.json();
          setCert(data.certificate);
        }
      } catch {}
      if (active) setLoading(false);
    };
    run();
    return () => { active = false; };
  }, [open, submissionId]);

  const handleDownload = () => {
    if (!cert) return;
    // Generate a printable HTML certificate
    const html = generateCertificateHTML(cert, lang);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => {
        setTimeout(() => win.print(), 500);
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Award className="h-4 w-4 text-amber-600" />
          <span className="hidden sm:inline">{t.certificate.title}</span>
          <Award className="h-4 w-4 sm:hidden" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" />
            {t.certificate.title}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : cert ? (
          <div className="space-y-4">
            {/* Certificate preview */}
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-6">
              <div className="absolute top-2 right-2">
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {t.certificate.verified}
                </Badge>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-amber-500/10 mb-3">
                  <Award className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold gradient-text">{t.certificate.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.certificate.subtitle}</p>
              </div>
              <div className="mt-5 space-y-2.5">
                <CertRow label={t.certificate.awardedTo} value={`${cert.recipientName} (@${cert.recipientUsername})`} />
                <CertRow label={t.certificate.completedJob} value={cert.jobTitle} />
                <CertRow label={t.certificate.category} value={cert.categoryName} />
                <CertRow label={t.certificate.reward} value={`${t.common.currency}${formatMoney(cert.reward, lang)}`} />
                <CertRow label={t.certificate.issuedBy} value={cert.ownerName} />
                <CertRow label={t.certificate.completedOn} value={formatDate(cert.completedAt, lang)} />
                <CertRow label={t.certificate.certificateId} value={cert.certificateId} mono />
              </div>
              <div className="mt-4 pt-3 border-t border-primary/20 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {t.certificate.congratulations}
                </p>
              </div>
            </div>
            <Button onClick={handleDownload} className="w-full h-11 gap-2">
              <Download className="h-4 w-4" />
              {t.certificate.download}
            </Button>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Error loading certificate</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CertRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className={`font-medium text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function generateCertificateHTML(cert: Certificate, lang: "bn" | "en"): string {
  const bn = lang === "bn";
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>Certificate - ${cert.recipientName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Hind', Arial, sans-serif; background: #f0fdf4; padding: 20px; }
  .cert {
    max-width: 800px; margin: 0 auto; background: white;
    border: 3px solid #22c55e; border-radius: 16px; padding: 48px;
    position: relative; overflow: hidden;
  }
  .cert::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 8px;
    background: linear-gradient(90deg, #22c55e, #16a34a, #22c55e);
  }
  .badge { display: inline-flex; align-items: center; gap: 6px; background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; position: absolute; top: 24px; right: 24px; }
  .header { text-align: center; margin-bottom: 32px; }
  .icon { width: 64px; height: 64px; margin: 0 auto 12px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; }
  .title { font-size: 28px; font-weight: bold; color: #16a34a; }
  .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .body { display: grid; gap: 12px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #f9fafb; border-radius: 8px; }
  .label { color: #6b7280; font-size: 14px; }
  .value { font-weight: 600; font-size: 14px; text-align: right; }
  .footer { margin-top: 24px; padding-top: 16px; border-top: 2px solid #dcfce7; text-align: center; font-size: 12px; color: #6b7280; }
  .brand { text-align: center; font-size: 18px; font-weight: bold; color: #16a34a; margin-bottom: 4px; }
  @media print { body { background: white; padding: 0; } .cert { border-color: #22c55e; } }
</style>
</head>
<body>
<div class="cert">
  <div class="badge">✓ ${bn ? "যাচাইকৃত" : "Verified"}</div>
  <div class="brand">Amar Earning</div>
  <div class="header">
    <div class="icon">🏆</div>
    <div class="title">${bn ? "কাজ সমাপ্তি সার্টিফিকেট" : "Job Completion Certificate"}</div>
    <div class="subtitle">${bn ? "এই সার্টিফিকেটটি প্রমাণ করে যে নিম্নলিখিত কাজ সফলভাবে সম্পন্ন হয়েছে" : "This certifies that the following job has been successfully completed"}</div>
  </div>
  <div class="body">
    <div class="row"><span class="label">${bn ? "প্রদানকৃত" : "Awarded To"}</span><span class="value">${cert.recipientName} (@${cert.recipientUsername})</span></div>
    <div class="row"><span class="label">${bn ? "সম্পন্ন কাজ" : "Completed Job"}</span><span class="value">${cert.jobTitle}</span></div>
    <div class="row"><span class="label">${bn ? "ক্যাটাগরি" : "Category"}</span><span class="value">${cert.categoryName}</span></div>
    <div class="row"><span class="label">${bn ? "পুরস্কার" : "Reward"}</span><span class="value">৳${cert.reward}</span></div>
    <div class="row"><span class="label">${bn ? "প্রদানকারী" : "Issued By"}</span><span class="value">${cert.ownerName}</span></div>
    <div class="row"><span class="label">${bn ? "সম্পন্নের তারিখ" : "Completed On"}</span><span class="value">${new Date(cert.completedAt).toLocaleDateString(bn ? "bn-BD" : "en-US")}</span></div>
    <div class="row"><span class="label">${bn ? "সার্টিফিকেট আইডি" : "Certificate ID"}</span><span class="value" style="font-family: monospace; font-size: 12px;">${cert.certificateId}</span></div>
  </div>
  <div class="footer">
    🎉 ${bn ? "অভিনন্দন! আপনি এই কাজটি সফলভাবে সম্পন্ন করেছেন।" : "Congratulations! You have successfully completed this job."}
  </div>
</div>
</body>
</html>`;
}
