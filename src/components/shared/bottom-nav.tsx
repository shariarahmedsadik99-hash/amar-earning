"use client";

import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import {
  Home, Briefcase, Wallet, User, PlusCircle, ArrowDownToLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate, route } = useRouter();

  if (!user) return null;

  const isClient = user.activeRole === "CLIENT" && user.role !== "ADMIN";

  // Client: Home, Post Job, Wallet, Deposit, Profile (5 items for clients)
  // Freelancer: Home, Jobs, Wallet, Withdraw, Profile (5 items for freelancers)
  const clientItems = [
    { icon: Home, label: t.nav.home, route: { name: "home" } as Route, active: route.name === "home" },
    { icon: PlusCircle, label: t.nav.postJob, route: { name: "post-job" } as Route, active: route.name === "post-job" },
    { icon: Wallet, label: t.nav.wallet, route: { name: "wallet" } as Route, active: ["wallet"].includes(route.name) },
    { icon: ArrowDownToLine, label: lang === "bn" ? "টাকা যোগ" : "Deposit", route: { name: "deposit" } as Route, active: route.name === "deposit" },
    { icon: User, label: t.nav.profile, route: { name: "profile" } as Route, active: ["profile", "dashboard"].includes(route.name) },
  ];

  const freelancerItems = [
    { icon: Home, label: t.nav.home, route: { name: "home" } as Route, active: route.name === "home" },
    { icon: Briefcase, label: t.nav.availableJobs, route: { name: "available-jobs" } as Route, active: ["available-jobs", "jobs", "job"].includes(route.name) },
    { icon: Wallet, label: t.nav.wallet, route: { name: "wallet" } as Route, active: ["wallet"].includes(route.name) },
    { icon: User, label: t.nav.profile, route: { name: "profile" } as Route, active: ["profile", "dashboard"].includes(route.name) },
  ];

  const items = isClient ? clientItems : freelancerItems;
  const cols = items.length;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div className={cn("grid h-16", cols === 5 ? "grid-cols-5" : "grid-cols-4")}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.route)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-colors relative",
              item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {/* Active indicator bar */}
            {item.active && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
            )}
            <item.icon className={cn("h-5 w-5 transition-transform", item.active && "scale-110")} />
            <span className="text-[9px] font-medium leading-none truncate max-w-full px-1">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
