"use client";

import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { Logo } from "./logo";

export function Footer() {
  const { t } = useI18n();
  const { navigate } = useRouter();

  const go = (r: Route) => navigate(r);

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
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
