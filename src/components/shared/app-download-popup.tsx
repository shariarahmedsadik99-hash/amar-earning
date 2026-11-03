"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";

const DISMISS_KEY = "ae_app_popup_dismissed";
const DISMISS_HOURS = 24; // re-show after 24 hours

export function AppDownloadPopup() {
  const { t, lang } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user dismissed recently
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        const hoursSince = (Date.now() - dismissedTime) / (1000 * 60 * 60);
        if (hoursSince < DISMISS_HOURS) {
          return; // don't show
        }
      }
    } catch {
      // localStorage not available
    }

    // Show after 3 seconds delay
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in-up md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="relative bg-card border border-primary/20 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="p-4 flex items-center gap-3">
          {/* App icon */}
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {lang === "bn" ? "Amar Earning অ্যাপ ডাউনলোড করুন! 📱" : "Download Amar Earning App! 📱"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "bn"
                ? "সহজে কাজ করুন, আয় করুন — এখনই অ্যাপটি ইনস্টল করুন"
                : "Work easily, earn more — install the app now"}
            </p>
          </div>

          {/* Download button */}
          <a href="/amar-earning.apk" download className="shrink-0">
            <Button size="sm" className="gap-1.5 h-9">
              <Download className="h-3.5 w-3.5" />
              APK
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
