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
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { toast } from "sonner";
import {
  Wallet, Loader2, CheckCircle2, XCircle, Clock, Copy, ArrowDownToLine,
  Info, Phone, Check, ChevronRight, Sparkles,
} from "lucide-react";
import { formatMoney, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type PaymentMethod = {
  key: string;
  labelBn: string;
  labelEn: string;
  number: string;
  phone: string; // contact/help-line phone (separate from payment number)
  type: string;
  color: string;
  textColor: string;
  logo: string;
  logoType: string;
  imageUrl: string;
  instructionsBn: string;
  instructionsEn: string;
  active: boolean;
};

type Deposit = {
  id: string;
  amount: number;
  method: string;
  senderNumber: string;
  transactionId: string;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  processedAt: string | null;
};

export function DepositPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({ amount: "", senderNumber: "", transactionId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Deposits are CLIENT-only. Freelancers should use job earnings.
  const isClient = user?.activeRole === "CLIENT";
  const isFreelancer = user && !isClient && user.role !== "ADMIN";

  useEffect(() => {
    Promise.all([
      fetch("/api/payment-methods").then((r) => r.json()),
      fetch("/api/deposits").then((r) => r.json()),
    ]).then(([methodData, depData]) => {
      setMethods(methodData.methods || []);
      setDeposits(depData.deposits || []);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) {
      toast.error(lang === "bn" ? "পেমেন্ট মেথড বাছুন" : "Select payment method");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.amount,
          method: selectedMethod.key,
          senderNumber: form.senderNumber,
          transactionId: form.transactionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(lang === "bn" ? "ডিপোজিট রিকোয়েস্ট সফল!" : "Deposit request submitted!");
      setForm({ amount: "", senderNumber: "", transactionId: "" });
      const depRes = await fetch("/api/deposits");
      const depData = await depRes.json();
      setDeposits(depData.deposits || []);
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyValue = (value: string, fieldKey: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldKey);
    toast.success(lang === "bn" ? "কপি হয়েছে" : "Copied");
    setTimeout(() => setCopiedField(null), 1500);
  };

  if (loading) {
    return (
      <DashboardLayout active="deposit">
        <LoadingState />
      </DashboardLayout>
    );
  }

  // Freelancers cannot deposit (deposits are client-only)
  if (isFreelancer) {
    return (
      <DashboardLayout active="deposit">
        <Card className="p-8 text-center">
          <div className="h-14 w-14 rounded-xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <ArrowDownToLine className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-lg mb-1">
            {lang === "bn" ? "ডিপোজিট ক্লায়েন্টদের জন্য" : "Deposits are for clients"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            {lang === "bn"
              ? "ফ্রিল্যান্সার হিসেবে আপনি কাজ করে আয় করতে পারবেন। কাজ পোস্ট করতে চাইলে ক্লায়েন্ট মোডে স্যুইচ করুন।"
              : "As a freelancer you earn by completing jobs. Switch to Client mode to deposit money for posting jobs."}
          </p>
          <Button onClick={() => navigate({ name: "available-jobs" } as Route)}>
            {lang === "bn" ? "কাজ খুঁজুন" : "Find Jobs"}
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="deposit">
      {/* Hero header */}
      <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5 md:p-6">
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
            <ArrowDownToLine className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              {lang === "bn" ? "টাকা যোগ করুন" : "Add Money"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {lang === "bn"
                ? "নিচের যেকোনো পেমেন্ট মেথড বেছে নিন, টাকা পাঠান, তারপর ট্রানজেকশন আইডি দিন।"
                : "Pick a payment method below, send money, then provide the transaction ID."}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Selection — modern cards */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          {lang === "bn" ? "পেমেন্ট মেথড বাছুন" : "Choose Payment Method"}
        </h2>
        <span className="text-[11px] text-muted-foreground">{methods.length} {lang === "bn" ? "টি" : "available"}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {methods.map((method) => {
          const selected = selectedMethod?.key === method.key;
          return (
            <button
              key={method.key}
              onClick={() => setSelectedMethod(method)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 transition-all text-left bg-card",
                selected
                  ? "border-primary shadow-lg shadow-primary/10 scale-[1.01]"
                  : "border-border hover:border-primary/40 hover:shadow-md"
              )}
            >
              {/* Colored gradient header */}
              <div
                className="relative p-4 flex items-center gap-3 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${method.color} 0%, ${method.color}dd 100%)`, color: method.textColor }}
              >
                {/* Decorative circle */}
                <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/10 group-hover:scale-125 transition-transform" />
                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-white/30" />
                {method.logoType === "image" && method.imageUrl ? (
                  <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center bg-white/20 shrink-0 backdrop-blur">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={method.imageUrl} alt={method.labelEn} className="h-7 w-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 text-2xl">
                    {method.logo}
                  </div>
                )}
                <div className="min-w-0 flex-1 relative">
                  <p className="font-bold text-sm truncate">{lang === "bn" ? method.labelBn : method.labelEn}</p>
                  <p className="text-[10px] opacity-90 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-current opacity-70" />
                    {method.type === "PERSONAL"
                      ? lang === "bn" ? "পার্সোনাল" : "Personal"
                      : lang === "bn" ? "মার্চেন্ট" : "Merchant"}
                  </p>
                </div>
                {/* Selected checkmark */}
                {selected && (
                  <div className="relative h-6 w-6 rounded-full bg-white text-primary flex items-center justify-center shadow-md">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Body — payment number + phone */}
              <div className="p-3 space-y-2">
                {/* Payment number */}
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5">
                    {lang === "bn" ? "পেমেন্ট নম্বর" : "Payment Number"}
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-mono font-bold tracking-wide">{method.number}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyValue(method.number, `${method.key}-number`); }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title={lang === "bn" ? "কপি" : "Copy"}
                    >
                      {copiedField === `${method.key}-number` ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Phone (contact) */}
                {method.phone && (
                  <div className="pt-2 border-t">
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium mb-0.5 flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5" />
                      {lang === "bn" ? "ফোন" : "Phone"}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-mono font-medium">{method.phone}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyValue(method.phone, `${method.key}-phone`); }}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        title={lang === "bn" ? "কপি" : "Copy"}
                      >
                        {copiedField === `${method.key}-phone` ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hover hint */}
              {!selected && (
                <div className="px-3 pb-3 -mt-1 flex items-center justify-end text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                  {lang === "bn" ? "নির্বাচন করুন" : "Select"}
                  <ChevronRight className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Instructions + Form */}
      {selectedMethod && (
        <Card className="p-5 md:p-6 mb-6 animate-fade-in-up border-primary/20 shadow-sm">
          {/* Header with method brand */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: selectedMethod.color, color: selectedMethod.textColor }}
            >
              {selectedMethod.logoType === "image" && selectedMethod.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={selectedMethod.imageUrl} alt="" className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <span className="text-xl">{selectedMethod.logo}</span>
              )}
            </div>
            <div>
              <p className="font-bold text-sm">{lang === "bn" ? selectedMethod.labelBn : selectedMethod.labelEn}</p>
              <p className="text-[11px] text-muted-foreground">
                {selectedMethod.type === "PERSONAL"
                  ? lang === "bn" ? "পার্সোনাল অ্যাকাউন্ট" : "Personal Account"
                  : lang === "bn" ? "মার্চেন্ট অ্যাকাউন্ট" : "Merchant Account"}
              </p>
            </div>
          </div>

          {/* Instructions banner */}
          <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary mb-0.5">
                {lang === "bn" ? "নির্দেশনা" : "Instructions"}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "bn" ? selectedMethod.instructionsBn : selectedMethod.instructionsEn}
              </p>
            </div>
          </div>

          {/* Copyable number chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <div className="p-2.5 rounded-xl bg-muted/40 border flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium">{lang === "bn" ? "পেমেন্ট নম্বর" : "Payment Number"}</p>
                <p className="text-sm font-mono font-bold truncate" style={{ color: selectedMethod.color }}>{selectedMethod.number}</p>
              </div>
              <button
                onClick={() => copyValue(selectedMethod.number, "form-number")}
                className="shrink-0 px-2 py-1 rounded-lg bg-background border text-[10px] font-medium hover:bg-primary/10 hover:border-primary/30 transition-colors flex items-center gap-1"
              >
                {copiedField === "form-number" ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                {lang === "bn" ? "কপি" : "Copy"}
              </button>
            </div>
            {selectedMethod.phone && (
              <div className="p-2.5 rounded-xl bg-muted/40 border flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{lang === "bn" ? "ফোন" : "Phone"}</p>
                  <p className="text-sm font-mono font-bold truncate">{selectedMethod.phone}</p>
                </div>
                <button
                  onClick={() => copyValue(selectedMethod.phone, "form-phone")}
                  className="shrink-0 px-2 py-1 rounded-lg bg-background border text-[10px] font-medium hover:bg-primary/10 hover:border-primary/30 transition-colors flex items-center gap-1"
                >
                  {copiedField === "form-phone" ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  {lang === "bn" ? "কপি" : "Copy"}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="flex items-center gap-1 text-xs">
                  <Wallet className="h-3 w-3 text-muted-foreground" />
                  {lang === "bn" ? "পরিমাণ (৳)" : "Amount (৳)"}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  placeholder="100"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="senderNumber" className="flex items-center gap-1 text-xs">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  {lang === "bn" ? "আপনার নম্বর" : "Your Number"}
                </Label>
                <Input
                  id="senderNumber"
                  type="tel"
                  value={form.senderNumber}
                  onChange={(e) => setForm({ ...form, senderNumber: e.target.value })}
                  required
                  placeholder="01XXXXXXXXX"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="transactionId" className="flex items-center gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                  {lang === "bn" ? "ট্রানজেকশন আইডি" : "Transaction ID"}
                </Label>
                <Input
                  id="transactionId"
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                  required
                  placeholder="ABC123XYZ"
                  className="font-mono h-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 gap-2 text-sm font-semibold" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
              {lang === "bn" ? "ডিপোজিট রিকোয়েস্ট করুন" : "Submit Deposit Request"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              {lang === "bn"
                ? "ডিপোজিট রিকোয়েস্ট করার পর অ্যাডমিন ভেরিফাই করবে। অনুমোদনের পর ব্যালেন্সে যোগ হবে।"
                : "After submitting, admin will verify. Balance will be credited after approval."}
            </p>
          </form>
        </Card>
      )}

      {/* Deposit History */}
      <Card className="p-4 md:p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {lang === "bn" ? "ডিপোজিট ইতিহাস" : "Deposit History"}
        </h2>
        {deposits.length === 0 ? (
          <EmptyState icon={Wallet} title={lang === "bn" ? "কোনো ডিপোজিট নেই" : "No deposits yet"} />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {deposits.map((d) => {
              const method = methods.find((m) => m.key === d.method);
              return (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/40 hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm"
                      style={{ backgroundColor: method?.color || "#888", color: method?.textColor || "#fff" }}
                    >
                      {method?.logoType === "image" && method?.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={method.imageUrl} alt="" className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <span className="text-lg">{method?.logo || "💳"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold">
                        {t.common.currency}{formatMoney(d.amount, lang)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.method} • TXID: <span className="font-mono">{d.transactionId}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatDateTime(d.createdAt, lang)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <Badge
                      className={
                        d.status === "APPROVED"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : d.status === "REJECTED"
                          ? "bg-red-500/10 text-red-600 border-red-500/20"
                          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                      }
                    >
                      {d.status === "PENDING" ? (
                        <Clock className="h-3 w-3 mr-1" />
                      ) : d.status === "APPROVED" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {t.status[d.status.toLowerCase() as keyof typeof t.status] || d.status}
                    </Badge>
                    {d.rejectReason && (
                      <p className="text-[10px] text-destructive mt-1">{d.rejectReason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
