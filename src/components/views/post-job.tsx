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
import { Loader2, Calculator, Wallet, AlertCircle, ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/format";

type Category = { id: string; name: string; slug: string; icon: string };
type JobType = { id: string; title: string; reward: number };

export function PostJobPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [balance, setBalance] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(8);
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
    fetch("/api/settings").then((r) => r.json()).then((d) => setServiceCharge(d.serviceCharge || 8));
    if (user) {
      fetch("/api/wallet").then((r) => r.json()).then((d) => setBalance(d.wallet?.balance || 0));
    }
  }, [user]);

  // Fetch job types when category changes
  useEffect(() => {
    if (!form.categoryId) {
      setJobTypes([]);
      return;
    }
    fetch(`/api/job-types?categoryId=${form.categoryId}`)
      .then((r) => r.json())
      .then((d) => setJobTypes(d.jobTypes || []));
  }, [form.categoryId]);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const [selectedJobType, setSelectedJobType] = useState<JobType | null>(null);
  const minReward = selectedJobType?.reward || 0;

  const selectJobType = (jobTypeId: string) => {
    const jt = jobTypes.find((j) => j.id === jobTypeId);
    if (jt) {
      setSelectedJobType(jt);
      setForm((p) => ({ ...p, title: jt.title, reward: String(jt.reward) }));
    }
  };

  const rewardNum = parseFloat(form.reward) || 0;
  const workersNum = parseInt(form.workerLimit) || 0;
  const jobBudget = rewardNum * workersNum;
  const totalBudget = jobBudget + serviceCharge;
  const minJobBudget = 50; // Minimum total job budget (reward × workers) must be at least 50

  // Check if reward is below minimum (per job type)
  const isBelowMin = selectedJobType && rewardNum > 0 && rewardNum < selectedJobType.reward;
  // Check if total job budget is below 50
  const isBelowMinBudget = jobBudget > 0 && jobBudget < minJobBudget;
  const sufficient = balance >= totalBudget && totalBudget > 0;
  const canSubmit = sufficient && !isBelowMin && !isBelowMinBudget;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate minimum reward if job type selected
    if (selectedJobType && rewardNum < selectedJobType.reward) {
      toast.error(lang === "bn"
        ? `সর্বনিম্ন দাম ৳${selectedJobType.reward} দিতে হবে! আপনি ৳${rewardNum} দিয়েছেন।`
        : `Minimum price is ৳${selectedJobType.reward}! You entered ৳${rewardNum}.`);
      return;
    }
    // Validate minimum total budget (reward × workers >= 50)
    if (jobBudget < minJobBudget) {
      toast.error(lang === "bn"
        ? `মোট বাজেট কমপক্ষে ৳${minJobBudget} হতে হবে! আপনার বাজেট ৳${jobBudget} (${rewardNum} × ${workersNum})। কর্মী সংখ্যা বাড়ান বা পুরস্কার বাড়ান।`
        : `Total budget must be at least ৳${minJobBudget}! Your budget is ৳${jobBudget} (${rewardNum} × ${workersNum}). Increase workers or reward.`);
      return;
    }
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
            <Label>{t.postJob.category}</Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) => {
                set("categoryId", v);
                set("title", "");
                set("reward", "");
                setSelectedJobType(null);
              }}
            >
              <SelectTrigger><SelectValue placeholder={lang === "bn" ? "ক্যাটাগরি বাছুন" : "Select category"} /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Type selector — auto-fills title and reward */}
          {form.categoryId && jobTypes.length > 0 && (
            <div className="space-y-1.5">
              <Label>{lang === "bn" ? "কাজের ধরন (ঐচ্ছিক)" : "Job Type (optional)"}</Label>
              <Select onValueChange={selectJobType}>
                <SelectTrigger>
                  <SelectValue placeholder={lang === "bn" ? "কাজের ধরন বাছুন — টাইটেল ও দাম অটো-ফিল হবে" : "Select job type — auto-fills title & price"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {jobTypes.map((jt) => (
                    <SelectItem key={jt.id} value={jt.id}>
                      <span className="flex items-center justify-between w-full">
                        <span>{jt.title}</span>
                        <span className="text-primary font-bold ml-2">৳{jt.reward}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">{t.postJob.jobTitle}</Label>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder={lang === "bn" ? "যেমন: Facebook Page Follow" : "e.g. Facebook Page Follow"} />
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
              <Label htmlFor="reward" className="flex items-center gap-1.5">
                {t.postJob.rewardPerWorker} (৳)
                {selectedJobType && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                    {lang === "bn" ? `সর্বনিম্ন ৳${minReward}` : `Min ৳${minReward}`}
                  </span>
                )}
              </Label>
              <Input
                id="reward"
                type="number"
                min={minReward || 1}
                step="0.01"
                value={form.reward}
                onChange={(e) => set("reward", e.target.value)}
                required
                placeholder={selectedJobType ? String(minReward) : "5"}
                className={isBelowMin ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {/* Red error when below minimum */}
              {isBelowMin && (
                <div className="flex items-start gap-1.5 text-xs text-red-600 font-medium p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    {lang === "bn"
                      ? `ভুল! এই কাজের সর্বনিম্ন দাম ৳${minReward}। আপনি ৳${rewardNum} দিয়েছেন। দয়া করে ৳${minReward} বা তার বেশি দিন।`
                      : `Error! Minimum price is ৳${minReward}. You entered ৳${rewardNum}. Please enter ৳${minReward} or more.`}
                  </span>
                </div>
              )}
              {/* Normal info when valid */}
              {selectedJobType && !isBelowMin && (
                <p className="text-[11px] text-muted-foreground">
                  {lang === "bn"
                    ? `এই কাজের সর্বনিম্ন দাম ৳${minReward}। আপনি চাইলে বেশি দিতে পারেন কিন্তু কম দিতে পারবেন না।`
                    : `Minimum price for this job is ৳${minReward}. You can increase but not decrease.`}
                </p>
              )}
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
            {/* Job cost breakdown */}
            <div className={`flex items-center justify-between text-sm ${isBelowMinBudget ? "text-red-600" : ""}`}>
              <span className={isBelowMinBudget ? "" : "text-muted-foreground"}>
                {t.common.currency}{formatMoney(rewardNum, lang)} × {workersNum} {lang === "bn" ? "কর্মী" : "workers"}
              </span>
              <span className={`font-medium ${isBelowMinBudget ? "text-red-600" : ""}`}>{t.common.currency}{formatMoney(jobBudget, lang)}</span>
            </div>
            {/* Minimum budget warning */}
            {isBelowMinBudget && (
              <div className="flex items-start gap-1.5 text-xs text-red-600 font-medium p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  {lang === "bn"
                    ? `মোট বাজেট কমপক্ষে ৳${minJobBudget} হতে হবে! আপনার বাজেট ৳${jobBudget}। ${Math.ceil(minJobBudget / (rewardNum || 1)) - workersNum > 0 ? `আরও ${Math.ceil(minJobBudget / (rewardNum || 1)) - workersNum} জন কর্মী যোগ করুন বা পুরস্কার বাড়ান।` : "পুরস্কার বাড়ান।"}`
                    : `Total budget must be at least ৳${minJobBudget}! Your budget is ৳${jobBudget}. Increase workers or reward.`}
                </span>
              </div>
            )}
            {/* Service charge */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                {lang === "bn" ? "সার্ভিস চার্জ" : "Service Charge"}
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{lang === "bn" ? "প্রতি কাজ" : "per job"}</span>
              </span>
              <span className="font-medium text-primary">{t.common.currency}{formatMoney(serviceCharge, lang)}</span>
            </div>
            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-semibold">{lang === "bn" ? "সর্বমোট" : "Total"}</span>
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
            {/* Info: pending approval */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2 p-2 rounded-lg bg-primary/5">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>{lang === "bn" ? "কাজ পোস্ট হওয়ার পর অ্যাডমিন অনুমোদনের পর লাইভ হবে।" : "Job will go live after admin approval."}</span>
            </div>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading || !canSubmit}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t.postJob.publish}
          </Button>
        </Card>
      </form>
    </div>
  );
}
