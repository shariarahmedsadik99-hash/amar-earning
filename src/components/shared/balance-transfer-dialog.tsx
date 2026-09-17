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
  ArrowLeftRight, Loader2, ArrowDown, Wallet, UserCircle,
} from "lucide-react";
import { formatMoney } from "@/lib/format";

export function BalanceTransferDialog({ onTransferred }: { onTransferred?: () => void }) {
  const { t, lang } = useI18n();
  const { user, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
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
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      toast.success(
        lang === "bn"
          ? `৳${amt} ক্লায়েন্ট ব্যালেন্সে ট্রান্সফার হয়েছে ✓`
          : `৳${amt} transferred to client balance ✓`
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
              ? "আপনার ফ্রিল্যান্সার ব্যালেন্স থেকে ক্লায়েন্ট ব্যালেন্সে টাকা ট্রান্সফার করুন। ক্লায়েন্ট ব্যালেন্স দিয়ে আপনি কাজ পোস্ট করতে পারবেন।"
              : "Transfer money from your freelancer balance to client balance. Use client balance to post jobs."}
          </p>

          {/* Flow visualization */}
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="flex-1 text-center p-3 rounded-xl bg-primary/5 border border-primary/20">
              <Briefcase className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {lang === "bn" ? "ফ্রিল্যান্সার" : "Freelancer"}
              </p>
            </div>
            <ArrowDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
            <div className="flex-1 text-center p-3 rounded-xl bg-primary/5 border border-primary/20">
              <UserCircle className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {lang === "bn" ? "ক্লায়েন্ট" : "Client"}
              </p>
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

// Local Briefcase icon to avoid import collision
import { Briefcase } from "lucide-react";
