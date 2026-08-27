"use client";

import { useI18n } from "@/lib/i18n-context";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { t } = useI18n();
  const sizes = {
    sm: { box: "h-8 w-8", text: "text-base", icon: 16 },
    md: { box: "h-9 w-9", text: "text-lg", icon: 18 },
    lg: { box: "h-12 w-12", text: "text-2xl", icon: 24 },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <div className={`${s.box} rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0`}>
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${s.text} font-bold tracking-tight text-foreground`}>
          Amar Earning
        </span>
        <span className="text-[10px] text-muted-foreground hidden sm:block">{t.tagline}</span>
      </div>
    </div>
  );
}
