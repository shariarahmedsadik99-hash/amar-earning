"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Briefcase, UserCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleSwitcherProps {
  className?: string;
  onSwitched?: () => void;
}

export function RoleSwitcher({ className, onSwitched }: RoleSwitcherProps) {
  const { user, refresh } = useAuth();
  const [switching, setSwitching] = useState(false);

  if (!user || user.role === "ADMIN") return null;

  const current = user.activeRole || "FREELANCER";

  const handleSwitch = async (role: "FREELANCER" | "CLIENT") => {
    if (role === current || switching) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/role/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed");
        return;
      }
      await refresh();
      toast.success(
        role === "FREELANCER"
          ? "ফ্রিল্যান্সার মোডে স্যুইচ হয়েছে ✓"
          : "ক্লায়েন্ট মোডে স্যুইচ হয়েছে ✓"
      );
      onSwitched?.();
    } catch {
      toast.error("Network error");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border",
        className
      )}
    >
      <button
        onClick={() => handleSwitch("FREELANCER")}
        disabled={switching}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          current === "FREELANCER"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background"
        )}
      >
        {switching ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Briefcase className="h-3 w-3" />
        )}
        Freelancer
      </button>
      <button
        onClick={() => handleSwitch("CLIENT")}
        disabled={switching}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          current === "CLIENT"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background"
        )}
      >
        {switching ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <UserCircle className="h-3 w-3" />
        )}
        Client
      </button>
    </div>
  );
}
