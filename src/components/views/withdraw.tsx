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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Banknote, Loader2, Clock, CheckCircle2, XCircle, ShieldCheck, Lightbulb } from "lucide-react";
import { formatMoney, toBn, formatDateTime } from "@/lib/format";

type WalletData = { balance: number; pendingBalance: number };
type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  accountNumber: string;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  processedAt: string | null;
};

export function WithdrawPage() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [wallet, setWallet] = useState<WalletData>({ balance: 0, pendingBalance: 0 });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ method: "BKASH", accountNumber: "", amount: "" });
  const [submitting, setSubmitting] = useState(false);
  const [minWithdrawal, setMinWithdrawal] = useState(100);

  const load = async () => {
    const [wRes, wdRes, sRes] = await Promise.all([
      fetch("/api/wallet"),
      fetch("/api/withdrawals"),
      fetch("/api/settings").catch(() => null),
    ]);
    const wData = await wRes.json();
    const wdData = await wdRes.json();
    setWallet(wData.wallet || { balance: 0, pendingBalance: 0 });
    setWithdrawals(wdData.withdrawals || []);
    if (sRes && sRes.ok) {
      const sData = await sRes.json();
      setMinWithdrawal(sData.minWithdrawal || 100);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(t.withdraw.submit + " ✓");
      setForm({ method: "BKASH", accountNumber: "", amount: "" });
      load();
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout active="withdraw"><LoadingState /></DashboardLayout>;

  return (
    <DashboardLayout active="withdraw">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold">{t.withdraw.title}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-xs text-muted-foreground">{t.wallet.availableBalance}</p>
          <p className="text-2xl font-bold text-primary mt-1">{t.common.currency}{formatMoney(wallet.balance, lang)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{t.withdraw.minWithdrawal}</p>
          <p className="text-2xl font-bold mt-1">{t.common.currency}{formatMoney(minWithdrawal, lang)}</p>
        </Card>
      </div>

      {/* Withdrawal info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card className="p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{t.withdrawInfo.processingTime}</p>
            <p className="text-sm font-bold mt-0.5">{t.withdrawInfo.estimatedDays}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t.withdrawInfo.estimatedDesc}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{t.withdrawInfo.fee}</p>
            <p className="text-sm font-bold mt-0.5 text-green-600">{t.withdrawInfo.free}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t.withdrawInfo.feeDesc}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Lightbulb className="h-4 w-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{t.withdrawInfo.tips}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{t.withdrawInfo.tipsDesc}</p>
          </div>
        </Card>
      </div>

      {/* Withdraw form */}
      <Card className="p-5 mb-6">
        <h2 className="font-semibold mb-4">{t.withdraw.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t.withdraw.method}</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BKASH">{t.withdraw.bkash}</SelectItem>
                <SelectItem value="NAGAD">{t.withdraw.nagad}</SelectItem>
                <SelectItem value="ROCKET">{t.withdraw.rocket}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account">{t.withdraw.accountNumber}</Label>
            <Input
              id="account"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">{t.withdraw.amount} (৳)</Label>
            <Input
              id="amount"
              type="number"
              min={minWithdrawal}
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder={String(minWithdrawal)}
              required
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Banknote className="h-4 w-4 mr-2" />}
            {t.withdraw.submit}
          </Button>
        </form>
      </Card>

      {/* Pending withdrawals */}
      {withdrawals.filter((w) => w.status === "PENDING").length > 0 && (
        <Card className="p-4 mb-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            {t.withdraw.pendingWithdrawals}
          </h3>
          <div className="space-y-2">
            {withdrawals.filter((w) => w.status === "PENDING").map((w) => (
              <div key={w.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                <span>{t.common.currency}{formatMoney(w.amount, lang)} • {w.method}</span>
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{t.status.pending}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* History */}
      <Card className="p-4 md:p-5">
        <h2 className="font-semibold mb-3">{t.withdraw.history}</h2>
        {withdrawals.length === 0 ? (
          <EmptyState icon={Banknote} title={t.withdraw.noHistory} />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                    w.status === "PAID" || w.status === "APPROVED" ? "bg-green-500/10" : w.status === "REJECTED" ? "bg-red-500/10" : "bg-yellow-500/10"
                  }`}>
                    {w.status === "PAID" || w.status === "APPROVED" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : w.status === "REJECTED" ? <XCircle className="h-4 w-4 text-red-600" /> : <Clock className="h-4 w-4 text-yellow-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.common.currency}{formatMoney(w.amount, lang)}</p>
                    <p className="text-xs text-muted-foreground">{w.method} • {w.accountNumber.slice(0, 4)}****</p>
                    {w.rejectReason && <p className="text-xs text-destructive mt-0.5">⚠️ {w.rejectReason}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={
                    w.status === "PAID" || w.status === "APPROVED" ? "text-green-600 border-green-500/30" : w.status === "REJECTED" ? "text-red-600 border-red-500/30" : "text-yellow-600 border-yellow-500/30"
                  }>
                    {t.status[w.status.toLowerCase() as keyof typeof t.status] || w.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(w.createdAt, lang)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
