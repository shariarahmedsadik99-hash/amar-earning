"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { AlertTriangle, X } from "lucide-react";

export function MaintenanceBanner() {
  const { t } = useI18n();
  const [maintenance, setMaintenance] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok && active) {
          const data = await res.json();
          setMaintenance(data.maintenanceMode === true);
        }
      } catch {}
    };
    run();
    return () => { active = false; };
  }, []);

  if (!maintenance || dismissed) return null;

  return (
    <div className="bg-amber-500 text-amber-950 dark:text-amber-50 px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium relative">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{t.maintenance.message}</span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
