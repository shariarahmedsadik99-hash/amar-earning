"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { DashboardLayout } from "./dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, User, Mail, AtSign, Gift, Shield, LogOut, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { UserBadges } from "@/components/shared/user-badges";

export function ProfilePage() {
  const { t, lang } = useI18n();
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        toast.success(t.common.save + " ✓");
      }
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate({ name: "home" });
  };

  const copyReferral = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast.success(lang === "bn" ? "কপি হয়েছে" : "Copied");
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout active="profile">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold">{t.nav.profile}</h1>
      </div>

      {/* Profile header */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate">{user.name}</h2>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Shield className="h-3 w-3" />
                {user.role === "ADMIN" ? "Admin" : "User"}
              </span>
              <span className="text-xs text-muted-foreground">
                {lang === "bn" ? "যোগ দিয়েছেন" : "Joined"} {formatDate(user.createdAt, lang)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Referral code */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{lang === "bn" ? "আপনার রেফারেল কোড" : "Your Referral Code"}</p>
              <p className="text-lg font-bold tracking-wider text-primary">{user.referralCode}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={copyReferral}>
            <Copy className="h-4 w-4 mr-1" />
            {lang === "bn" ? "কপি" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {lang === "bn"
            ? "এই কোড শেয়ার করুন। প্রতিটি নতুন ইউজারের জন্য ৳২০ বোনাস পাবেন।"
            : "Share this code. Get ৳20 bonus for each new user."}
        </p>
      </Card>

      {/* User Badges */}
      <div className="mb-4">
        <UserBadges />
      </div>

      {/* Edit profile */}
      <Card className="p-5 mb-4">
        <h2 className="font-semibold mb-4">{lang === "bn" ? "তথ্য সম্পাদনা" : "Edit Information"}</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {t.auth.fullName}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><AtSign className="h-3.5 w-3.5" /> {t.auth.username}</Label>
            <Input value={user.username} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {t.auth.email}</Label>
            <Input value={user.email} disabled className="bg-muted/50" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t.common.save}
          </Button>
        </form>
      </Card>

      <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        {t.nav.logout}
      </Button>
    </DashboardLayout>
  );
}
