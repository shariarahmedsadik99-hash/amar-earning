"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, Copy, Link2, Check } from "lucide-react";
import { toast } from "sonner";

export function ShareButton({ jobId }: { jobId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/#/jobs/${jobId}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t.share.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.share.shareText,
          url: shareUrl,
        });
      } catch {}
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">{t.share.title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            {t.share.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Link preview */}
          <div className="p-3 rounded-lg bg-muted/50 border flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate flex-1">{shareUrl}</span>
          </div>

          {/* Copy button */}
          <Button onClick={copyLink} variant="outline" className="w-full gap-2">
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? t.share.copied : t.share.copyLink}
          </Button>

          {/* Native share (if supported) */}
          {typeof navigator !== "undefined" && navigator.share && (
            <Button onClick={shareNative} className="w-full gap-2">
              <Share2 className="h-4 w-4" />
              {t.share.title}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
