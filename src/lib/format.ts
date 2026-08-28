export function timeAgo(dateStr: string, lang: "bn" | "en" = "bn"): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return lang === "bn" ? "এইমাত্র" : "just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === "bn" ? `${m} মিনিট আগে` : `${m}m ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return lang === "bn" ? `${h} ঘন্টা আগে` : `${h}h ago`;
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return lang === "bn" ? `${d} দিন আগে` : `${d}d ago`;
  }
  return date.toLocaleDateString("en-US");
}

// Numbers stay in English digits (0-9) — user preference
export function toBn(num: number | string): string {
  return String(num);
}

export function formatMoney(amount: number, lang: "bn" | "en" = "bn"): string {
  const formatted = amount.toFixed(2).replace(/\.00$/, "");
  return formatted;
}

export function formatDate(dateStr: string, lang: "bn" | "en" = "bn"): string {
  const date = new Date(dateStr);
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  // Use en-US to keep all digits in English
  return date.toLocaleDateString("en-US", opts);
}

export function formatDateTime(dateStr: string, lang: "bn" | "en" = "bn"): string {
  const date = new Date(dateStr);
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  // Use en-US to keep all digits in English
  return date.toLocaleString("en-US", opts);
}
