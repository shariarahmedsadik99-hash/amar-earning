"use client";

import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Home, Briefcase, Wallet, User } from "lucide-react";

export function BottomNav() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { navigate, route } = useRouter();

  if (!user) return null;

  const items = [
    { icon: Home, label: t.nav.home, route: { name: "home" } as Route, active: route.name === "home" },
    { icon: Briefcase, label: t.nav.availableJobs, route: { name: "available-jobs" } as Route, active: ["available-jobs", "jobs", "job"].includes(route.name) },
    { icon: Wallet, label: t.nav.wallet, route: { name: "wallet" } as Route, active: ["wallet", "withdraw"].includes(route.name) },
    { icon: User, label: t.nav.profile, route: { name: "profile" } as Route, active: ["profile", "dashboard"].includes(route.name) },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md pb-safe">
      <div className="grid grid-cols-4 h-16">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.route)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              item.active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className={`h-5 w-5 ${item.active ? "scale-110" : ""} transition-transform`} />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
