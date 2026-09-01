"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { DashboardLayout } from "./dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { toast } from "sonner";
import { Wallet, Loader2, CheckCircle2, XCircle, Clock, Copy, ArrowDownToLine, Info } from "lucide-react";
import { formatMoney, formatDateTime } from "@/lib/format";

type PaymentMethod = {
  key: string;
  labelBn: string;
  labelEn: string;
  number: string;
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
  const { navigate } = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({ amount: "", senderNumber: "", transactionId: "" });
  const [submitting, setSubmitting] = useState(false);

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
      // Refresh deposits
      const depRes = await fetch("/api/deposits");
      const depData = await depRes.json();
      setDeposits(depData.deposits || []);
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    toast.success(lang === "bn" ? "নম্বর কপি হয়েছে" : "Number copied");
  };

  if (loading) {
    return (
      <DashboardLayout active="deposit">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="deposit">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5 text-primary" />
          {lang === "bn" ? "টাকা যোগ করুন" : "Add Money"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "bn" ? "ব্যালেন্সে টাকা যোগ করতে নিচের যেকোনো মেথড ব্যবহার করুন" : "Use any method below to add money to your balance"}
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {methods.map((method) => (
          <button
            key={method.key}
            onClick={() => setSelectedMethod(method)}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all text-left ${
              selectedMethod?.key === method.key
                ? "border-primary shadow-lg scale-[1.02]"
                : "border-border hover:border-primary/30"
            }`}
          >
            {/* Colored header */}
            <div
              className="p-4 flex items-center gap-3"
              style={{ backgroundColor: method.color, color: method.textColor }}
            >
              {method.logoType === "image" && method.imageUrl ? (
                <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-white/20 shrink-0">
                  { }
                  <img src={method.imageUrl} alt={method.labelEn} className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              ) : (
                <span className="text-2xl">{method.logo}</span>
              )}
              <div>
                <p className="font-bold text-sm">{lang === "bn" ? method.labelBn : method.labelEn}</p>
                <p className="text-[10px] opacity-90">
                  {method.type === "PERSONAL"
                    ? lang === "bn" ? "পার্সোনাল" : "Personal"
                    : lang === "bn" ? "মার্চেন্ট" : "Merchant"}
                </p>
              </div>
            </div>
            {/* Number display */}
            <div className="p-3 bg-card">
              <p className="text-[10px] text-muted-foreground mb-0.5">
                {lang === "bn" ? "নম্বর" : "Number"}
              </p>
              <div className="flex items-center justify-between gap-1">
                <p className="text-sm font-mono font-bold">{method.number}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); copyNumber(method.number); }}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            </div>
            {/* Selected checkmark */}
            {selectedMethod?.key === method.key && (
              <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Instructions + Form */}
      {selectedMethod && (
        <Card className="p-5 mb-6 animate-fade-in-up">
          {/* Instructions */}
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-primary mb-0.5">
                {lang === "bn" ? "নির্দেশনা" : "Instructions"}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === "bn" ? selectedMethod.instructionsBn : selectedMethod.instructionsEn}
              </p>
              <p className="text-xs mt-1">
                <span className="text-muted-foreground">{lang === "bn" ? "নম্বর: " : "Number: "}</span>
                <span className="font-bold font-mono" style={{ color: selectedMethod.color }}>
                  {selectedMethod.number}
                </span>
                <button
                  onClick={() => copyNumber(selectedMethod.number)}
                  className="ml-2 text-primary hover:underline text-[10px]"
                >
                  {lang === "bn" ? "কপি" : "Copy"}
                </button>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount">
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
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="senderNumber">
                  {lang === "bn" ? "আপনার নম্বর" : "Your Number"}
                </Label>
                <Input
                  id="senderNumber"
                  type="tel"
                  value={form.senderNumber}
                  onChange={(e) => setForm({ ...form, senderNumber: e.target.value })}
                  required
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="transactionId">
                  {lang === "bn" ? "ট্রানজেকশন আইডি" : "Transaction ID"}
                </Label>
                <Input
                  id="transactionId"
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                  required
                  placeholder="ABC123XYZ"
                  className="font-mono"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
              {lang === "bn" ? "ডিপোজিট রিকোয়েস্ট করুন" : "Submit Deposit Request"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              {lang === "bn"
                ? "ডিপোজিট রিকোয়েস্ট করার পর অ্যাডমিন ভেরিফাই করবে। অনুমোদনের পর ব্যালেন্সে যোগ হবে।"
                : "After submitting, admin will verify. Balance will be credited after approval."}
            </p>
          </form>
        </Card>
      )}

      {/* Deposit History */}
      <Card className="p-4 md:p-5">
        <h2 className="font-semibold mb-3">
          {lang === "bn" ? "ডিপোজিট ইতিহাস" : "Deposit History"}
        </h2>
        {deposits.length === 0 ? (
          <EmptyState icon={Wallet} title={lang === "bn" ? "কোনো ডিপোজিট নেই" : "No deposits yet"} />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {deposits.map((d) => {
              const method = methods.find((m) => m.key === d.method);
              return (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: method?.color || "#888", color: method?.textColor || "#fff" }}
                    >
                      {method?.logoType === "image" && method?.imageUrl ? (
                         
                        <img src={method.imageUrl} alt="" className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <span className="text-base">{method?.logo || "💳"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold">
                        {t.common.currency}{formatMoney(d.amount, lang)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.method} • TXID: {d.transactionId}
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
