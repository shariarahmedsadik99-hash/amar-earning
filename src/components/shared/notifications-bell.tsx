"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n-context";
import { timeAgo } from "@/lib/format";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export function NotificationsBell() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnread(data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (res.ok && active) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnread(data.unreadCount || 0);
        }
      } catch {}
    };
    run();
    if (user) {
      const interval = setInterval(run, 30000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }, [user]);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "readAll" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">{t.notifications.title}</span>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary hover:underline"
            >
              {t.notifications.markAllRead}
            </button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t.notifications.noNotifications}
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    navigate({ name: "notifications" } as Route);
                  }}
                  className={`text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {timeAgo(n.createdAt, lang)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
