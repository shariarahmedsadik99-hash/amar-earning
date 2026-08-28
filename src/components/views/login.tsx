"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/shared/logo";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginPage() {
  const { t } = useI18n();
  const { refresh } = useAuth();
  const { navigate } = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error(t.auth.loginSubtitle);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      await refresh();
      toast.success(t.nav.dashboard + " ✓");
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
          <h1 className="mt-5 text-2xl font-bold">{t.auth.loginTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.auth.loginSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier">{t.auth.emailOrUsername}</Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="email@example.com"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t.auth.password}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-muted-foreground cursor-pointer font-normal">
                {t.auth.rememberMe}
              </Label>
            </div>
            <button type="button" className="text-primary hover:underline text-sm">
              {t.auth.forgotPassword}
            </button>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t.auth.login}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          {t.auth.noAccount}{" "}
          <button
            onClick={() => navigate({ name: "register" } as Route)}
            className="text-primary font-medium hover:underline"
          >
            {t.nav.register}
          </button>
        </div>

        {/* Demo accounts hint */}
        <div className="mt-5 p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Demo Accounts:</p>
          <p>👤 Worker: worker@amarearning.com / worker123</p>
          <p>💼 Employer: employer@amarearning.com / employer123</p>
          <p>🛡️ Admin: admin@amarearning.com / admin123</p>
        </div>
      </Card>
    </div>
  );
}
