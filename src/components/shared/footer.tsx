"use client";

import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { Logo } from "./logo";
import { Download, Smartphone } from "lucide-react";

export function Footer() {
  const { t } = useI18n();
  const { navigate } = useRouter();

  const go = (r: Route) => navigate(r);

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo size="md" />
            <p className="mt-3 text-sm text-muted-foreground max-w-sm leading-relaxed">
              {t.footer.about}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">{t.footer.quickLinks}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => go({ name: "home" })} className="hover:text-primary transition-colors">
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button onClick={() => go({ name: "available-jobs" })} className="hover:text-primary transition-colors">
                  {t.nav.jobs}
                </button>
              </li>
              <li>
                <button onClick={() => go({ name: "how-it-works" })} className="hover:text-primary transition-colors">
                  {t.nav.howItWorks}
                </button>
              </li>
              <li>
                <button onClick={() => go({ name: "faq" })} className="hover:text-primary transition-colors">
                  {t.faq.title}
                </button>
              </li>
              <li>
                <button onClick={() => go({ name: "register" })} className="hover:text-primary transition-colors">
                  {t.nav.register}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">{t.footer.support}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => go({ name: "login" })} className="hover:text-primary transition-colors">
                  {t.footer.contact}
                </button>
              </li>
              <li>
                <span className="cursor-pointer hover:text-primary transition-colors">{t.footer.terms}</span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-primary transition-colors">{t.footer.privacy}</span>
              </li>
            </ul>
          </div>

          {/* App download column */}
          <div>
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-primary" />
              {t.lang === "bn" ? "অ্যাপ" : "App"}
            </h4>
            <a
              href="/amar-earning.apk"
              download
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors border border-primary/20"
            >
              <Download className="h-4 w-4" />
              {t.lang === "bn" ? "অ্যাপ ডাউনলোড (APK)" : "Download App (APK)"}
            </a>
            <p className="text-[11px] text-muted-foreground mt-2">
              {t.lang === "bn"
                ? "Android অ্যাপ v1.0.0 — সহজে কাজ করুন"
                : "Android app v1.0.0 — work easily"}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Amar Earning. {t.footer.copyright}
          </p>
          <p className="text-xs text-muted-foreground">{t.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
