"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { DashboardLayout } from "./dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, User, Mail, AtSign, Gift, Shield, LogOut, Loader2, Lock, KeyRound } from "lucide-react";
import { formatDate } from "@/lib/format";
import { UserBadges } from "@/components/shared/user-badges";

export function ProfilePage() {
  const { t, lang } = useI18n();
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);

  // Withdraw PIN state
  const [hasPin, setHasPin] = useState(false);
  const [pinForm, setPinForm] = useState({ newPin: "", confirmPin: "", currentPin: "" });
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    fetch("/api/withdraw-pin").then((r) => r.json()).then((d) => setHasPin(d.hasPin || false));
  }, []);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pinForm.newPin)) {
      toast.error(lang === "bn" ? "PIN অবশ্যই ৪ ডিজিটের হতে হবে" : "PIN must be 4 digits");
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      toast.error(lang === "bn" ? "PIN মেলে না" : "PINs do not match");
      return;
    }
    setPinLoading(true);
    try {
      const res = await fetch("/api/withdraw-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinForm.newPin, currentPin: pinForm.currentPin || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(data.message || "PIN set successfully");
      setHasPin(true);
      setPinForm({ newPin: "", confirmPin: "", currentPin: "" });
    } catch {
      toast.error("Network error");
    } finally {
      setPinLoading(false);
    }
  };

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

      {/* Withdraw PIN Setup */}
      <Card className="p-5 mb-4">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          {lang === "bn" ? "উইথড্র PIN" : "Withdraw PIN"}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {hasPin
            ? (lang === "bn"
                ? "আপনার PIN সেট করা আছে। পরিবর্তন করতে বর্তমান PIN দিন।"
                : "Your PIN is set. Enter current PIN to change.")
            : (lang === "bn"
                ? "উইথড্র করার আগে একটি ৪ ডিজিটের PIN সেট করুন। এটি নিরাপত্তার জন্য প্রয়োজন।"
                : "Set a 4-digit PIN before withdrawing. Required for security.")
          }
        </p>

        {hasPin && (
          <div className="mb-3 flex items-center gap-2 text-xs bg-primary/5 border border-primary/20 rounded-lg p-2">
            <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-primary font-medium">{lang === "bn" ? "PIN সেট করা আছে ✓" : "PIN is set ✓"}</span>
          </div>
        )}

        <form onSubmit={handleSetPin} className="space-y-3">
          {hasPin && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                {lang === "bn" ? "বর্তমান PIN" : "Current PIN"}
              </Label>
              <Input
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="\d{4}"
                value={pinForm.currentPin}
                onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, "") })}
                placeholder="••••"
                className="tracking-widest text-center font-mono text-lg"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <KeyRound className="h-3 w-3" />
                {lang === "bn" ? "নতুন PIN" : "New PIN"}
              </Label>
              <Input
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="\d{4}"
                value={pinForm.newPin}
                onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, "") })}
                placeholder="••••"
                className="tracking-widest text-center font-mono text-lg"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <KeyRound className="h-3 w-3" />
                {lang === "bn" ? "নিশ্চিত করুন" : "Confirm"}
              </Label>
              <Input
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="\d{4}"
                value={pinForm.confirmPin}
                onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, "") })}
                placeholder="••••"
                className="tracking-widest text-center font-mono text-lg"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={pinLoading}>
            {pinLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {hasPin
              ? (lang === "bn" ? "PIN পরিবর্তন করুন" : "Update PIN")
              : (lang === "bn" ? "PIN সেট করুন" : "Set PIN")
            }
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
