export function timeAgo(dateStr: string, lang: "bn" | "en" = "bn"): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return lang === "bn" ? "এইমাত্র" : "just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === "bn" ? `${toBn(m)} মিনিট আগে` : `${m}m ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return lang === "bn" ? `${toBn(h)} ঘন্টা আগে` : `${h}h ago`;
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return lang === "bn" ? `${toBn(d)} দিন আগে` : `${d}d ago`;
  }
  return date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US");
}

export function toBn(num: number | string): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => bnDigits[parseInt(d)]);
}

export function formatMoney(amount: number, lang: "bn" | "en" = "bn"): string {
  const formatted = amount.toFixed(2).replace(/\.00$/, "");
  return lang === "bn" ? toBn(formatted) : formatted;
}

export function formatDate(dateStr: string, lang: "bn" | "en" = "bn"): string {
  const date = new Date(dateStr);
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  const str = date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", opts);
  return lang === "bn" ? toBn(str) : str;
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
  const str = date.toLocaleString(lang === "bn" ? "bn-BD" : "en-US", opts);
  return lang === "bn" ? toBn(str) : str;
}
