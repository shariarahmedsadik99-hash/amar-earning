"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { DashboardLayout } from "./dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/shared/states";
import { toast } from "sonner";
import { Bell, CheckCircle2, XCircle, Banknote, ClipboardList, Megaphone, Loader2, Save } from "lucide-react";

type Settings = {
  submissionApproved: boolean;
  submissionRejected: boolean;
  withdrawalApproved: boolean;
  withdrawalRejected: boolean;
  jobCompleted: boolean;
  announcement: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  submissionApproved: true,
  submissionRejected: true,
  withdrawalApproved: true,
  withdrawalRejected: true,
  jobCompleted: true,
  announcement: true,
};

export function NotificationSettingsPage() {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/notification-settings");
        if (res.ok && active) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch {}
      if (active) setLoading(false);
    };
    run();
    return () => { active = false; };
  }, []);

  const toggle = (key: keyof Settings) => {
    setSettings((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notification-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        toast.success(t.notifySettings.saved);
      } else {
        toast.error("Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout active="notification-settings">
        <LoadingState />
      </DashboardLayout>
    );
  }

  const items: Array<{
    key: keyof Settings;
    icon: typeof Bell;
    iconColor: string;
    iconBg: string;
  }> = [
    { key: "submissionApproved", icon: CheckCircle2, iconColor: "text-green-600", iconBg: "bg-green-500/10" },
    { key: "submissionRejected", icon: XCircle, iconColor: "text-red-600", iconBg: "bg-red-500/10" },
    { key: "withdrawalApproved", icon: Banknote, iconColor: "text-green-600", iconBg: "bg-green-500/10" },
    { key: "withdrawalRejected", icon: XCircle, iconColor: "text-red-600", iconBg: "bg-red-500/10" },
    { key: "jobCompleted", icon: ClipboardList, iconColor: "text-primary", iconBg: "bg-primary/10" },
    { key: "announcement", icon: Megaphone, iconColor: "text-amber-600", iconBg: "bg-amber-500/10" },
  ];

  return (
    <DashboardLayout active="notification-settings">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          {t.notifySettings.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t.notifySettings.subtitle}</p>
      </div>

      <Card className="p-5">
        <div className="space-y-1">
          {items.map((item, i) => (
            <div
              key={item.key}
              className={`flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                i > 0 ? "border-t" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {t.notifySettings[item.key]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.notifySettings[`${item.key}Desc` as keyof typeof t.notifySettings]}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={() => toggle(item.key)}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} className="w-full mt-4 h-11" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {t.notifySettings.save}
        </Button>
      </Card>
    </DashboardLayout>
  );
}
