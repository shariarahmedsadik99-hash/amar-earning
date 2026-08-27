"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Gift } from "lucide-react";

export function RegisterPage() {
  const { t } = useI18n();
  const { refresh } = useAuth();
  const { navigate } = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-fill referral code from URL query param or hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^.*\?/, ""));
    const ref = params.get("ref") || hashParams.get("ref");
    if (ref) {
      setForm((p) => ({ ...p, referralCode: ref }));
    }
  }, []);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(t.auth.password + " ✗");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }
      await refresh();
      toast.success("৳50 " + (t.wallet.title) + " ✓");
      navigate({ name: "dashboard" } as Route);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 hero-gradient">
      <Card className="w-full max-w-md p-6 md:p-8 shadow-lg">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" />
          <h1 className="mt-5 text-2xl font-bold">{t.auth.registerTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.auth.registerSubtitle}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Gift className="h-3 w-3" />
            ৳50 Signup Bonus
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t.auth.fullName}</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="আপনার নাম" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">{t.auth.username}</Label>
            <Input id="username" value={form.username} onChange={(e) => set("username", e.target.value)} required placeholder="username" autoCapitalize="none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="email@example.com" autoCapitalize="none" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t.auth.password}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                placeholder="••••••••"
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="referralCode">{t.auth.referralCode}</Label>
            <Input id="referralCode" value={form.referralCode} onChange={(e) => set("referralCode", e.target.value)} placeholder="AE123456" autoCapitalize="none" />
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t.auth.createAccount}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          {t.auth.haveAccount}{" "}
          <button onClick={() => navigate({ name: "login" } as Route)} className="text-primary font-medium hover:underline">
            {t.nav.login}
          </button>
        </div>
      </Card>
    </div>
  );
}
