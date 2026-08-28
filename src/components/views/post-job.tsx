"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Calculator, Wallet, AlertCircle } from "lucide-react";
import { formatMoney } from "@/lib/format";

type Category = { id: string; name: string; slug: string; icon: string };

export function PostJobPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    requiredProof: "",
    reward: "",
    workerLimit: "",
    categoryId: "",
    deadline: "",
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
    if (user) {
      fetch("/api/wallet").then((r) => r.json()).then((d) => setBalance(d.wallet?.balance || 0));
    }
  }, [user]);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const rewardNum = parseFloat(form.reward) || 0;
  const workersNum = parseInt(form.workerLimit) || 0;
  const totalBudget = rewardNum * workersNum;
  const sufficient = balance >= totalBudget && totalBudget > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, deadline: form.deadline }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(t.postJob.publish + " ✓");
      navigate({ name: "my-jobs" } as Route);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.postJob.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.postJob.description}</p>
      </div>

      {/* Balance card */}
      <Card className="p-4 mb-4 flex items-center justify-between bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">{t.dashboard.balance}</span>
        </div>
        <span className="text-lg font-bold text-primary">{t.common.currency}{formatMoney(balance, lang)}</span>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">{t.postJob.jobTitle}</Label>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder={lang === "bn" ? "যেমন: Facebook Page Follow" : "e.g. Facebook Page Follow"} />
          </div>

          <div className="space-y-1.5">
            <Label>{t.postJob.category}</Label>
            <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
              <SelectTrigger><SelectValue placeholder={lang === "bn" ? "ক্যাটাগরি বাছুন" : "Select category"} /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {lang === "bn" ? t.categories[c.slug.replace(/-/g, "") as keyof typeof t.categories] || c.name : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">{t.postJob.description}</Label>
            <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} required rows={3} placeholder={lang === "bn" ? "কাজের বিস্তারিত লিখুন" : "Describe the job"} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instructions">{t.postJob.instructions}</Label>
            <Textarea id="instructions" value={form.instructions} onChange={(e) => set("instructions", e.target.value)} required rows={4} placeholder={"1. Step one\n2. Step two\n3. Step three"} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="requiredProof">{t.postJob.requiredProof}</Label>
            <Textarea id="requiredProof" value={form.requiredProof} onChange={(e) => set("requiredProof", e.target.value)} required rows={2} placeholder={lang === "bn" ? "কী প্রমাণ জমা দিতে হবে" : "What proof to submit"} />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reward">{t.postJob.rewardPerWorker} (৳)</Label>
              <Input id="reward" type="number" min="1" step="0.01" value={form.reward} onChange={(e) => set("reward", e.target.value)} required placeholder="5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workerLimit">{t.postJob.numWorkers}</Label>
              <Input id="workerLimit" type="number" min="1" value={form.workerLimit} onChange={(e) => set("workerLimit", e.target.value)} required placeholder="50" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deadline">{t.postJob.deadline}</Label>
            <Input id="deadline" type="date" value={form.deadline || defaultDeadline} onChange={(e) => set("deadline", e.target.value)} required />
          </div>

          {/* Budget calculation */}
          <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calculator className="h-4 w-4 text-primary" />
              {t.postJob.totalBudget}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t.common.currency}{formatMoney(rewardNum, lang)} × {workersNum} = 
              </span>
              <span className={`text-xl font-bold ${sufficient ? "text-primary" : "text-destructive"}`}>
                {t.common.currency}{formatMoney(totalBudget, lang)}
              </span>
            </div>
            {!sufficient && totalBudget > 0 && (
              <div className="flex items-start gap-2 text-xs text-destructive mt-2 p-2 rounded-lg bg-destructive/5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{t.postJob.insufficientBalance}</span>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading || !sufficient}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t.postJob.publish}
          </Button>
        </Card>
      </form>
    </div>
  );
}
