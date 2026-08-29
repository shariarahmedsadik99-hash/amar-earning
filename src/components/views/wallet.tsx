"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { DashboardLayout } from "./dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { Banknote, Wallet as WalletIcon, TrendingUp, TrendingDown, Clock, ArrowDownToLine } from "lucide-react";
import { formatMoney, toBn, formatDateTime } from "@/lib/format";

type WalletData = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  pendingBalance: number;
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
};

export function WalletPage() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        setWallet(d.wallet);
        setTransactions(d.transactions || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <DashboardLayout active="wallet"><LoadingState /></DashboardLayout>;

  const cards = [
    { label: t.wallet.availableBalance, value: wallet?.balance || 0, icon: WalletIcon, color: "text-primary", bg: "bg-primary/10" },
    { label: t.wallet.totalEarned, value: wallet?.totalEarned || 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-500/10" },
    { label: t.wallet.totalSpent, value: wallet?.totalSpent || 0, icon: TrendingDown, color: "text-red-600", bg: "bg-red-500/10" },
    { label: t.wallet.pendingBalance, value: wallet?.pendingBalance || 0, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500/10" },
  ];

  return (
    <DashboardLayout active="wallet">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">{t.wallet.title}</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate({ name: "deposit" })}>
            <ArrowDownToLine className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{lang === "bn" ? "টাকা যোগ" : "Deposit"}</span>
          </Button>
          <Button size="sm" onClick={() => navigate({ name: "withdraw" })}>
            <Banknote className="h-4 w-4 mr-1" />
            {t.nav.withdraw}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {cards.map((c, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <div className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold">
              {t.common.currency}{formatMoney(c.value, lang)}
            </div>
          </Card>
        ))}
      </div>

      {/* Transactions */}
      <Card className="p-4 md:p-5">
        <h2 className="font-semibold mb-3">{t.wallet.transactions}</h2>
        {transactions.length === 0 ? (
          <EmptyState icon={WalletIcon} title={t.wallet.noTransactions} />
        ) : (
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isPositive ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      {isPositive ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.wallet.transactionType[tx.type as keyof typeof t.wallet.transactionType] || tx.type} • {formatDateTime(tx.createdAt, lang)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      {isPositive ? "+" : ""}{t.common.currency}{formatMoney(Math.abs(tx.amount), lang)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t.common.currency}{formatMoney(tx.balanceAfter, lang)}
                    </p>
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
