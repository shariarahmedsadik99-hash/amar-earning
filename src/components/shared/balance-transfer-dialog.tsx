"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeftRight, Loader2, ArrowDown, Briefcase, UserCircle,
} from "lucide-react";

const TRANSFER_FEE_PERCENT = 15;

export function BalanceTransferDialog({ onTransferred }: { onTransferred?: () => void }) {
  const { t, lang } = useI18n();
  const { user, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"freelancer-to-client" | "client-to-freelancer">("freelancer-to-client");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error(lang === "bn" ? "পরিমাণ সঠিক নয়" : "Invalid amount");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, direction }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(
        lang === "bn"
          ? `৳${amt} ট্রান্সফার হয়েছে (${TRANSFER_FEE_PERCENT}% ফি: ৳${data.fee})`
          : `৳${amt} transferred (${TRANSFER_FEE_PERCENT}% fee: ৳${data.fee})`
      );
      setAmount("");
      setOpen(false);
      await refresh();
      onTransferred?.();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const amt = parseFloat(amount) || 0;
  const fee = +(amt * (TRANSFER_FEE_PERCENT / 100)).toFixed(2);
  const received = +(amt - fee).toFixed(2);

  const isF2C = direction === "freelancer-to-client";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {lang === "bn" ? "ব্যালেন্স ট্রান্সফার" : "Transfer Balance"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            {lang === "bn" ? "ব্যালেন্স ট্রান্সফার" : "Balance Transfer"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === "bn"
              ? `ফ্রিল্যান্সার ও ক্লায়েন্ট ব্যালেন্সের মধ্যে টাকা ট্রান্সফার করুন। প্রতিটি ট্রান্সফারে ${TRANSFER_FEE_PERCENT}% ফি কাটা হবে।`
              : `Transfer money between freelancer and client balances. A ${TRANSFER_FEE_PERCENT}% fee applies on every transfer.`}
          </p>

          {/* Direction toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("freelancer-to-client")}
              className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                isF2C ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              }`}
            >
              <Briefcase className={`h-4 w-4 mx-auto mb-1 ${isF2C ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-[10px] font-medium">
                {lang === "bn" ? "ফ্রিল্যান্সার → ক্লায়েন্ট" : "Freelancer → Client"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setDirection("client-to-freelancer")}
              className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                !isF2C ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              }`}
            >
              <UserCircle className={`h-4 w-4 mx-auto mb-1 ${!isF2C ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-[10px] font-medium">
                {lang === "bn" ? "ক্লায়েন্ট → ফ্রিল্যান্সার" : "Client → Freelancer"}
              </p>
            </button>
          </div>

          {/* Flow visualization */}
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="flex-1 text-center p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {isF2C
                  ? (lang === "bn" ? "ফ্রিল্যান্সার" : "Freelancer")
                  : (lang === "bn" ? "ক্লায়েন্ট" : "Client")}
              </p>
              <p className="text-xs font-semibold text-primary">−৳{amt || 0}</p>
            </div>
            <ArrowDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
            <div className="flex-1 text-center p-3 rounded-xl bg-green-500/5 border border-green-500/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {isF2C
                  ? (lang === "bn" ? "ক্লায়েন্ট" : "Client")
                  : (lang === "bn" ? "ফ্রিল্যান্সার" : "Freelancer")}
              </p>
              <p className="text-xs font-semibold text-green-600">+৳{received || 0}</p>
            </div>
          </div>

          <form onSubmit={handleTransfer} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                {lang === "bn" ? "ট্রান্সফার পরিমাণ (৳)" : "Amount to Transfer (৳)"}
              </Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="100"
                className="h-10"
              />
            </div>

            {/* Fee breakdown */}
            {amt > 0 && (
              <div className="p-3 rounded-xl bg-muted/30 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{lang === "bn" ? "ট্রান্সফার পরিমাণ" : "Transfer amount"}</span>
                  <span className="font-medium">৳{amt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {lang === "bn" ? `ফি (${TRANSFER_FEE_PERCENT}%)` : `Fee (${TRANSFER_FEE_PERCENT}%)`}
                  </span>
                  <span className="font-medium text-red-600">−৳{fee}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="font-medium">{lang === "bn" ? "প্রাপ্ত পরিমাণ" : "You receive"}</span>
                  <span className="font-bold text-green-600">৳{received}</span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-10 gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowLeftRight className="h-4 w-4" />
              )}
              {lang === "bn" ? "ট্রান্সফার করুন" : "Transfer Now"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
