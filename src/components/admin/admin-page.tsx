"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, LoadingState } from "@/components/shared/states";
import { CategoryIcon, CATEGORY_ICON_NAMES } from "@/components/shared/category-icon";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users as UsersIcon,
  Briefcase,
  ClipboardList,
  Banknote,
  FolderTree,
  Settings as SettingsIcon,
  Megaphone,
  Shield,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Trash2,
  Pencil,
  Plus,
  Search,
  Eye,
  Wallet,
  ListChecks,
  UserX,
  Activity,
  Globe,
  Star,
  StarOff,
  Flag,
  ArrowDownToLine,
} from "lucide-react";
import { formatMoney, toBn, formatDate, formatDateTime, timeAgo } from "@/lib/format";
import { AdminCharts } from "@/components/shared/admin-charts";

/* =========================================================================
 * Types
 * =======================================================================*/

type Lang = "bn" | "en";

type Stats = {
  totalUsers: number;
  activeJobs: number;
  pendingSubmissions: number;
  pendingWithdrawals: number;
  totalTransactions: number;
  totalJobs: number;
  suspendedUsers: number;
  withdrawnAmount: number;
};

type AdminUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  referralCode: string | null;
  createdAt: string;
  wallet: { balance: number; totalEarned: number; totalSpent: number };
  _count: { jobs: number; submissions: number };
};

type AdminJob = {
  id: string;
  title: string;
  reward: number;
  workerLimit: number;
  completedCount: number;
  status: string;
  deadline: string;
  createdAt: string;
  category: { name: string };
  owner: { name: string; username: string };
  _count: { submissions: number };
};

type AdminSubmission = {
  id: string;
  status: string;
  textProof: string | null;
  urlProof: string | null;
  imageProof: string | null;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  job: { title: string; reward: number };
  user: { name: string; username: string };
};

type AdminWithdrawal = {
  id: string;
  amount: number;
  method: string;
  accountNumber: string;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  processedAt: string | null;
  user: { name: string; username: string; email: string };
};

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  _count: { jobs: number };
};

type AppSettings = {
  websiteName: string;
  primaryColor: string;
  minWithdrawal: number;
  paymentMethods: string[];
  jobApprovalRequired: boolean;
  maintenanceMode: boolean;
};

/* =========================================================================
 * Helpers
 * =======================================================================*/

function useLang() {
  const { lang } = useI18n();
  return lang as Lang;
}

const L = (lang: Lang, bn: string, en: string) => (lang === "bn" ? bn : en);

function statusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "text-yellow-600 border-yellow-500/30 bg-yellow-500/10";
    case "APPROVED":
    case "ACTIVE":
    case "PAID":
      return "text-green-600 border-green-500/30 bg-green-500/10";
    case "REJECTED":
    case "SUSPENDED":
      return "text-red-600 border-red-500/30 bg-red-500/10";
    case "PAUSED":
      return "text-orange-600 border-orange-500/30 bg-orange-500/10";
    case "COMPLETED":
      return "text-blue-600 border-blue-500/30 bg-blue-500/10";
    default:
      return "text-muted-foreground";
  }
}

function statusLabel(status: string, t: ReturnType<typeof useI18n>["t"]): string {
  const key = status.toLowerCase() as keyof typeof t.status;
  return t.status[key] || status;
}

/* =========================================================================
 * Admin layout (sidebar + header + mobile tabs)
 * =======================================================================*/

type NavItem = {
  route: Route["name"];
  labelBn: string;
  labelEn: string;
  icon: typeof LayoutDashboard;
};

const NAV_ITEMS: NavItem[] = [
  { route: "admin", labelBn: "ড্যাশবোর্ড", labelEn: "Dashboard", icon: LayoutDashboard },
  { route: "admin-users", labelBn: "ইউজার", labelEn: "Users", icon: UsersIcon },
  { route: "admin-jobs", labelBn: "কাজ", labelEn: "Jobs", icon: Briefcase },
  { route: "admin-submissions", labelBn: "সাবমিশন", labelEn: "Submissions", icon: ClipboardList },
  { route: "admin-withdrawals", labelBn: "উইথড্র", labelEn: "Withdrawals", icon: Banknote },
  { route: "admin-deposits", labelBn: "ডিপোজিট", labelEn: "Deposits", icon: ArrowDownToLine },
  { route: "admin-categories", labelBn: "ক্যাটাগরি", labelEn: "Categories", icon: FolderTree },
  { route: "admin-reports", labelBn: "রিপোর্ট", labelEn: "Reports", icon: Flag },
  { route: "admin-announce", labelBn: "অ্যানাউন্সমেন্ট", labelEn: "Announce", icon: Megaphone },
  { route: "admin-settings", labelBn: "সেটিংস", labelEn: "Settings", icon: SettingsIcon },
];

function AdminShell({
  route,
  children,
}: {
  route: Route;
  children: ReactNode;
}) {
  const lang = useLang();
  const { navigate } = useRouter();
  const active = route.name;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 md:py-6">
      {/* Header */}
      <header className="mb-4 md:mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight">
            {L(lang, "অ্যাডমিন প্যানেল", "Admin Panel")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {L(lang, "প্ল্যাটফর্ম নিয়ন্ত্রণ কেন্দ্র", "Platform control center")}
          </p>
        </div>
      </header>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-20 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => navigate({ name: item.route } as Route)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {L(lang, item.labelBn, item.labelEn)}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Mobile horizontal tabs */}
        <div className="md:hidden -mx-3 sm:-mx-4 mb-3">
          <div className="flex gap-2 overflow-x-auto px-3 sm:px-4 py-1 scrollbar-thin">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => navigate({ name: item.route } as Route)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {L(lang, item.labelBn, item.labelEn)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================================
 * Section header
 * =======================================================================*/

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h2 className="text-base md:text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* =========================================================================
 * Dashboard view
 * =======================================================================*/

function DashboardView() {
  const lang = useLang();
  const t = useI18n().t;
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        const data = await res.json();
        if (alive) setStats(data);
      } catch {
        if (alive) toast.error(L(lang, "লোড ব্যর্থ", "Failed to load"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  if (loading || !stats) {
    return <LoadingState text={L(lang, "লোড হচ্ছে...", "Loading...")} />;
  }

  const cur = t.common.currency;

  const cards: {
    labelBn: string;
    labelEn: string;
    value: string;
    icon: typeof LayoutDashboard;
    color: string;
    bg: string;
  }[] = [
    {
      labelBn: "মোট ইউজার",
      labelEn: "Total Users",
      value: toBn(stats.totalUsers),
      icon: UsersIcon,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      labelBn: "চলমান কাজ",
      labelEn: "Active Jobs",
      value: toBn(stats.activeJobs),
      icon: Briefcase,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    {
      labelBn: "অপেক্ষমাণ সাবমিশন",
      labelEn: "Pending Submissions",
      value: toBn(stats.pendingSubmissions),
      icon: ClipboardList,
      color: "text-yellow-600",
      bg: "bg-yellow-500/10",
    },
    {
      labelBn: "অপেক্ষমাণ উইথড্র",
      labelEn: "Pending Withdrawals",
      value: toBn(stats.pendingWithdrawals),
      icon: Banknote,
      color: "text-orange-600",
      bg: "bg-orange-500/10",
    },
    {
      labelBn: "মোট লেনদেন",
      labelEn: "Total Transactions",
      value: toBn(stats.totalTransactions),
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
    {
      labelBn: "মোট কাজ",
      labelEn: "Total Jobs",
      value: toBn(stats.totalJobs),
      icon: ListChecks,
      color: "text-teal-600",
      bg: "bg-teal-500/10",
    },
    {
      labelBn: "সাসপেন্ডেড ইউজার",
      labelEn: "Suspended Users",
      value: toBn(stats.suspendedUsers),
      icon: UserX,
      color: "text-red-600",
      bg: "bg-red-500/10",
    },
    {
      labelBn: "উইথড্র করা পরিমাণ",
      labelEn: "Withdrawn Amount",
      value: `${cur}${formatMoney(stats.withdrawnAmount, lang)}`,
      icon: Wallet,
      color: "text-rose-600",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div>
      <SectionHeader
        title={L(lang, "ওভারভিউ", "Overview")}
        description={L(
          lang,
          "প্ল্যাটফর্মের সারসংক্ষেপ",
          "Platform summary at a glance"
        )}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] md:text-xs text-muted-foreground line-clamp-1">
                {L(lang, c.labelBn, c.labelEn)}
              </span>
              <div className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </div>
            <div className="text-lg md:text-2xl font-bold tracking-tight">
              {c.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Admin charts */}
      <div className="mt-4">
        <AdminCharts />
      </div>
    </div>
  );
}

/* =========================================================================
 * Users view
 * =======================================================================*/

function UsersView() {
  const lang = useLang();
  const t = useI18n().t;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      toast.error(L(lang, "লোড ব্যর্থ", "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [search, status, lang]);

  useEffect(() => {
    const handle = setTimeout(load, 300);
    return () => clearTimeout(handle);
  }, [load]);

  const toggleUser = async (u: AdminUser, action: "suspend" | "activate") => {
    setActionLoading(u.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || L(lang, "ব্যর্থ", "Failed"));
        return;
      }
      toast.success(
        action === "suspend"
          ? L(lang, "ইউজার সাসপেন্ড হয়েছে", "User suspended")
          : L(lang, "ইউজার অ্যাক্টিভ হয়েছে", "User activated")
      );
      load();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <SectionHeader
        title={L(lang, "ইউজার ম্যানেজমেন্ট", "User Management")}
        description={L(
          lang,
          "সকল ইউজার দেখুন এবং নিয়ন্ত্রণ করুন",
          "View and manage all users"
        )}
      />

      <Card className="p-3 md:p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={L(lang, "নাম, ইউজারনেম বা ইমেইল...", "Name, username or email...")}
              className="pl-8"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L(lang, "সব", "All")}</SelectItem>
              <SelectItem value="ACTIVE">{L(lang, "অ্যাক্টিভ", "Active")}</SelectItem>
              <SelectItem value="SUSPENDED">
                {L(lang, "সাসপেন্ডেড", "Suspended")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title={L(lang, "কোনো ইউজার নেই", "No users found")} />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L(lang, "ইউজার", "User")}</TableHead>
                  <TableHead>{L(lang, "রোল", "Role")}</TableHead>
                  <TableHead>{L(lang, "স্ট্যাটাস", "Status")}</TableHead>
                  <TableHead>{L(lang, "ব্যালেন্স", "Balance")}</TableHead>
                  <TableHead>{L(lang, "কাজ", "Jobs")}</TableHead>
                  <TableHead>{L(lang, "সাবমিশন", "Subs")}</TableHead>
                  <TableHead className="text-right">
                    {L(lang, "অ্যাকশন", "Actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{u.name}</span>
                        <span className="text-xs text-muted-foreground">
                          @{u.username} • {u.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeClass(u.status)}>
                        {statusLabel(u.status, t)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {t.common.currency}
                      {formatMoney(u.wallet?.balance || 0, lang)}
                    </TableCell>
                    <TableCell>{toBn(u._count.jobs)}</TableCell>
                    <TableCell>{toBn(u._count.submissions)}</TableCell>
                    <TableCell className="text-right">
                      {u.role === "ADMIN" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : u.status === "SUSPENDED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === u.id}
                          onClick={() => toggleUser(u, "activate")}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          {L(lang, "অ্যাক্টিভ", "Activate")}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          disabled={actionLoading === u.id}
                          onClick={() => toggleUser(u, "suspend")}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserX className="h-3.5 w-3.5 mr-1" />
                          )}
                          {L(lang, "সাসপেন্ড", "Suspend")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{u.username} • {u.email}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={statusBadgeClass(u.status)}>
                      {statusLabel(u.status, t)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {u.role}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="font-bold text-sm text-primary">
                      {t.common.currency}
                      {formatMoney(u.wallet?.balance || 0, lang)}
                    </p>
                    <p className="text-muted-foreground">
                      {L(lang, "ব্যালেন্স", "Balance")}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="font-bold text-sm">{toBn(u._count.jobs)}</p>
                    <p className="text-muted-foreground">{L(lang, "কাজ", "Jobs")}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="font-bold text-sm">{toBn(u._count.submissions)}</p>
                    <p className="text-muted-foreground">
                      {L(lang, "সাবমিশন", "Subs")}
                    </p>
                  </div>
                </div>
                {u.role !== "ADMIN" && (
                  <div className="flex justify-end">
                    {u.status === "SUSPENDED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === u.id}
                        onClick={() => toggleUser(u, "activate")}
                      >
                        {actionLoading === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        {L(lang, "অ্যাক্টিভ", "Activate")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        disabled={actionLoading === u.id}
                        onClick={() => toggleUser(u, "suspend")}
                      >
                        {actionLoading === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserX className="h-3.5 w-3.5 mr-1" />
                        )}
                        {L(lang, "সাসপেন্ড", "Suspend")}
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================================
 * Jobs view
 * =======================================================================*/

function JobsView() {
  const lang = useLang();
  const t = useI18n().t;
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminJob | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/admin/jobs?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      toast.error(L(lang, "লোড ব্যর্থ", "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [filter, lang]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (
    job: AdminJob,
    action: "approve" | "reject" | "pause" | "activate"
  ) => {
    setActionLoading(`${job.id}-${action}`);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || L(lang, "ব্যর্থ", "Failed"));
        return;
      }
      toast.success(L(lang, "সফল", "Done") + " ✓");
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: deleteTarget.id, action: "delete" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || L(lang, "ব্যর্থ", "Failed"));
        return;
      }
      toast.success(L(lang, "কাজ মুছে ফেলা হয়েছে", "Job deleted"));
      setDeleteTarget(null);
      load();
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { value: "all", label: L(lang, "সব", "All") },
    { value: "PENDING", label: L(lang, "অপেক্ষমাণ", "Pending") },
    { value: "ACTIVE", label: L(lang, "চলমান", "Active") },
    { value: "PAUSED", label: L(lang, "বিরতি", "Paused") },
    { value: "COMPLETED", label: L(lang, "সম্পন্ন", "Completed") },
    { value: "REJECTED", label: L(lang, "প্রত্যাখ্যাত", "Rejected") },
  ];

  return (
    <div>
      <SectionHeader
        title={L(lang, "কাজ মডারেশন", "Job Moderation")}
        description={L(
          lang,
          "কাজ অনুমোদন, পজ বা মুছুন",
          "Approve, pause, or delete jobs"
        )}
      />

      <Tabs value={filter} onValueChange={setFilter}>
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-3">
          <TabsList className="inline-flex w-auto">
            {tabs.map((tb) => (
              <TabsTrigger key={tb.value} value={tb.value} className="text-xs">
                {tb.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={filter} className="mt-0">
          {loading ? (
            <LoadingState />
          ) : jobs.length === 0 ? (
            <EmptyState icon={Briefcase} title={L(lang, "কোনো কাজ নেই", "No jobs found")} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {jobs.map((job) => (
                <Card key={job.id} className="p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {L(lang, "মালিক", "Owner")}: {job.owner.name} (@{job.owner.username})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {L(lang, "ক্যাটাগরি", "Category")}: {job.category.name}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusBadgeClass(job.status)}>
                      {statusLabel(job.status, t)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="font-bold text-sm text-primary">
                        {t.common.currency}
                        {formatMoney(job.reward, lang)}
                      </p>
                      <p className="text-muted-foreground">{L(lang, "পুরস্কার", "Reward")}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="font-bold text-sm">{toBn(job.workerLimit)}</p>
                      <p className="text-muted-foreground">{L(lang, "স্লট", "Slots")}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="font-bold text-sm">{toBn(job.completedCount)}</p>
                      <p className="text-muted-foreground">{L(lang, "সম্পন্ন", "Done")}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="font-bold text-sm">{toBn(job._count.submissions)}</p>
                      <p className="text-muted-foreground">{L(lang, "সাবমিশন", "Subs")}</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground mb-3">
                    {L(lang, "তৈরি", "Created")}: {formatDate(job.createdAt, lang)} •{" "}
                    {L(lang, "ডেডলাইন", "Deadline")}: {formatDate(job.deadline, lang)}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {(job.status === "PENDING" || job.status === "REJECTED") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={actionLoading === `${job.id}-approve`}
                        onClick={() => act(job, "approve")}
                      >
                        {actionLoading === `${job.id}-approve` ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {L(lang, "অনুমোদন", "Approve")}
                      </Button>
                    )}
                    {(job.status === "PENDING" || job.status === "ACTIVE") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive"
                        disabled={actionLoading === `${job.id}-reject`}
                        onClick={() => act(job, "reject")}
                      >
                        {actionLoading === `${job.id}-reject` ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {L(lang, "প্রত্যাখ্যান", "Reject")}
                      </Button>
                    )}
                    {job.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={actionLoading === `${job.id}-pause`}
                        onClick={() => act(job, "pause")}
                      >
                        {actionLoading === `${job.id}-pause` ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Pause className="h-3 w-3 mr-1" />
                        )}
                        {L(lang, "পজ", "Pause")}
                      </Button>
                    )}
                    {job.status === "PAUSED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={actionLoading === `${job.id}-activate`}
                        onClick={() => act(job, "activate")}
                      >
                        {actionLoading === `${job.id}-activate` ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        {L(lang, "চালু", "Activate")}
                      </Button>
                    )}
                    {/* Feature toggle */}
                    {job.featured ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-amber-600 border-amber-500/30"
                        disabled={actionLoading === `${job.id}-unfeature`}
                        onClick={() => act(job, "unfeature")}
                      >
                        {actionLoading === `${job.id}-unfeature` ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <StarOff className="h-3 w-3 mr-1" />
                        )}
                        {L(lang, "ফিচার্ড", "Featured")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        disabled={actionLoading === `${job.id}-feature`}
                        onClick={() => act(job, "feature")}
                      >
                        {actionLoading === `${job.id}-feature` ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Star className="h-3 w-3 mr-1" />
                        )}
                        {L(lang, "ফিচার", "Feature")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive ml-auto"
                      onClick={() => setDeleteTarget(job)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {L(lang, "মুছুন", "Delete")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirm dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              {L(lang, "কাজ মুছুন", "Delete Job")}
            </DialogTitle>
            <DialogDescription>
              {L(
                lang,
                `আপনি কি "${deleteTarget?.title || ""}" কাজটি মুছতে চান? এটি ফেরানো যাবে না।`,
                `Are you sure you want to delete "${deleteTarget?.title || ""}"? This cannot be undone.`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {L(lang, "বাতিল", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteLoading}
              onClick={confirmDelete}
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              {L(lang, "মুছুন", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =========================================================================
 * Submissions view
 * =======================================================================*/

function SubmissionsView() {
  const lang = useLang();
  const t = useI18n().t;
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ scope: "admin" });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/submissions?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch {
      toast.error(L(lang, "লোড ব্যর্থ", "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [filter, lang]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (
    s: AdminSubmission,
    action: "approve" | "reject",
    reason?: string
  ) => {
    setActionLoading(`${s.id}-${action}`);
    try {
      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: s.id,
          action,
          rejectReason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || L(lang, "ব্যর্থ", "Failed"));
        return;
      }
      toast.success(
        action === "approve"
          ? L(lang, "অনুমোদিত", "Approved") + " ✓"
          : L(lang, "প্রত্যাখ্যাত", "Rejected") + " ✓"
      );
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (s: AdminSubmission) => {
    const reason = window.prompt(
      L(lang, "প্রত্যাখ্যানের কারণ:", "Reject reason:")
    );
    if (reason === null) return;
    review(s, "reject", reason || undefined);
  };

  const tabs = [
    { value: "all", label: L(lang, "সব", "All") },
    { value: "PENDING", label: L(lang, "অপেক্ষমাণ", "Pending") },
    { value: "APPROVED", label: L(lang, "অনুমোদিত", "Approved") },
    { value: "REJECTED", label: L(lang, "প্রত্যাখ্যাত", "Rejected") },
  ];

  return (
    <div>
      <SectionHeader
        title={L(lang, "সাবমিশন রিভিউ", "Submission Review")}
        description={L(
          lang,
          "কর্মীদের জমা দেওয়া প্রমাণ যাচাই করুন",
          "Verify worker submitted proofs"
        )}
      />

      <Tabs value={filter} onValueChange={setFilter}>
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-3">
          <TabsList className="inline-flex w-auto">
            {tabs.map((tb) => (
              <TabsTrigger key={tb.value} value={tb.value} className="text-xs">
                {tb.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={filter} className="mt-0">
          {loading ? (
            <LoadingState />
          ) : submissions.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={L(lang, "কোনো সাবমিশন নেই", "No submissions")}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {submissions.map((s) => (
                <Card key={s.id} className="p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{s.job.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {L(lang, "কর্মী", "Worker")}: {s.user.name} (@{s.user.username})
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={statusBadgeClass(s.status)}>
                        {statusLabel(s.status, t)}
                      </Badge>
                      <Badge variant="secondary" className="text-primary text-xs">
                        {t.common.currency}
                        {formatMoney(s.job.reward, lang)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3 text-xs">
                    {s.textProof && (
                      <p className="text-muted-foreground break-words">
                        📝 {s.textProof}
                      </p>
                    )}
                    {s.urlProof && (
                      <a
                        href={s.urlProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-words flex items-center gap-1"
                      >
                        🔗 <span className="truncate">{s.urlProof}</span>
                        <Eye className="h-3 w-3 shrink-0" />
                      </a>
                    )}
                    {s.imageProof && (
                      <a
                        href={s.imageProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        🖼️ {L(lang, "ছবি দেখুন", "View image")}
                      </a>
                    )}
                    {!s.textProof && !s.urlProof && !s.imageProof && (
                      <p className="text-muted-foreground italic">
                        {L(lang, "কোনো প্রমাণ নেই", "No proof provided")}
                      </p>
                    )}
                    {s.rejectReason && (
                      <p className="text-destructive">⚠️ {s.rejectReason}</p>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground mb-3 mt-auto">
                    {L(lang, "জমা", "Submitted")}: {formatDateTime(s.createdAt, lang)} (
                    {timeAgo(s.createdAt, lang)})
                    {s.reviewedAt &&
                      ` • ${L(lang, "রিভিউ", "Reviewed")}: ${formatDateTime(
                        s.reviewedAt,
                        lang
                      )}`}
                  </p>

                  {s.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 text-xs flex-1"
                        disabled={actionLoading === `${s.id}-approve`}
                        onClick={() => review(s, "approve")}
                      >
                        {actionLoading === `${s.id}-approve` ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        {L(lang, "অনুমোদন", "Approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs flex-1 text-destructive"
                        disabled={actionLoading === `${s.id}-reject`}
                        onClick={() => handleReject(s)}
                      >
                        {actionLoading === `${s.id}-reject` ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        {L(lang, "প্রত্যাখ্যান", "Reject")}
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* =========================================================================
 * Withdrawals view
 * =======================================================================*/

function WithdrawalsView() {
  const lang = useLang();
  const t = useI18n().t;
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/withdrawals?scope=admin", { cache: "no-store" });
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    } catch {
      toast.error(L(lang, "লোড ব্যর্থ", "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (
    w: AdminWithdrawal,
    action: "approve" | "paid" | "reject",
    reason?: string
  ) => {
    setActionLoading(`${w.id}-${action}`);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: w.id,
          action,
          rejectReason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || L(lang, "ব্যর্থ", "Failed"));
        return;
      }
      toast.success(L(lang, "সফল", "Done") + " ✓");
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (w: AdminWithdrawal) => {
    const reason = window.prompt(L(lang, "প্রত্যাখ্যানের কারণ:", "Reject reason:"));
    if (reason === null) return;
    act(w, "reject", reason || undefined);
  };

  const methodLabel = (m: string) => {
    const map: Record<string, { bn: string; en: string }> = {
      BKASH: { bn: "বিকাশ", en: "bKash" },
      NAGAD: { bn: "নগদ", en: "Nagad" },
      ROCKET: { bn: "রকেট", en: "Rocket" },
    };
    const v = map[m] || { bn: m, en: m };
    return L(lang, v.bn, v.en);
  };

  return (
    <div>
      <SectionHeader
        title={L(lang, "উইথড্র অনুরোধ", "Withdrawal Requests")}
        description={L(
          lang,
          "ইউজারদের উইথড্র অনুরোধ প্রসেস করুন",
          "Process user withdrawal requests"
        )}
      />

      {loading ? (
        <LoadingState />
      ) : withdrawals.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title={L(lang, "কোনো উইথড্র নেই", "No withdrawals")}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {withdrawals.map((w) => (
            <Card key={w.id} className="p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{w.user.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    @{w.user.username} • {w.user.email}
                  </p>
                </div>
                <Badge variant="outline" className={statusBadgeClass(w.status)}>
                  {statusLabel(w.status, t)}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="font-bold text-sm text-primary">
                    {t.common.currency}
                    {formatMoney(w.amount, lang)}
                  </p>
                  <p className="text-muted-foreground">{L(lang, "পরিমাণ", "Amount")}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="font-bold text-sm">{methodLabel(w.method)}</p>
                  <p className="text-muted-foreground">{L(lang, "মাধ্যম", "Method")}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="font-bold text-xs">{w.accountNumber.slice(0, 4)}****</p>
                  <p className="text-muted-foreground">{L(lang, "অ্যাকাউন্ট", "Account")}</p>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mb-3 mt-auto">
                {L(lang, "অনুরোধ", "Requested")}: {formatDateTime(w.createdAt, lang)} (
                {timeAgo(w.createdAt, lang)})
                {w.processedAt &&
                  ` • ${L(lang, "প্রসেসড", "Processed")}: ${formatDateTime(
                    w.processedAt,
                    lang
                  )}`}
              </p>

              {w.rejectReason && (
                <p className="text-xs text-destructive mb-3">⚠️ {w.rejectReason}</p>
              )}

              {w.status === "PENDING" && (
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    className="h-8 text-xs flex-1"
                    disabled={actionLoading === `${w.id}-approve`}
                    onClick={() => act(w, "approve")}
                  >
                    {actionLoading === `${w.id}-approve` ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    {L(lang, "অনুমোদন", "Approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 text-xs flex-1"
                    disabled={actionLoading === `${w.id}-paid`}
                    onClick={() => act(w, "paid")}
                  >
                    {actionLoading === `${w.id}-paid` ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Banknote className="h-3.5 w-3.5 mr-1" />
                    )}
                    {L(lang, "পরিশোধিত", "Mark Paid")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-destructive flex-1"
                    disabled={actionLoading === `${w.id}-reject`}
                    onClick={() => handleReject(w)}
                  >
                    {actionLoading === `${w.id}-reject` ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                    )}
                    {L(lang, "প্রত্যাখ্যান", "Reject")}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * Categories view
 * =======================================================================*/

function CategoriesView() {
  const lang = useLang();
  const t = useI18n().t;
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", icon: "Briefcase" });
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [editForm, setEditForm] = useState({ name: "", icon: "Briefcase" });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      toast.error(L(lang, "লোড ব্যর্থ", "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(L(lang, "নাম দিন", "Name required"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), icon: form.icon }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || L(lang, "ব্যর্থ", "Failed"));
        return;
      }
      toast.success(L(lang, "ক্যাটাগরি যোগ হয়েছে", "Category added"));
      setForm({ name: "", icon: "Briefcase" });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c: AdminCategory) => {
    setEditing(c);
    setEditForm({ name: c.name, icon: c.icon });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editForm.name.trim()) {
      toast.error(L(lang, "নাম দিন", "Name required"));
      return;
    }
    setActionLoading(editing.id);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editing.id,
          action: "update",
          name: editForm.name.trim(),
          icon: editForm.icon,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || L(lang, "ব্যর্থ", "Failed"));
        return;
      }
      toast.success(L(lang, "আপডেট হয়েছে", "Updated"));
      setEditing(null);
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (c: AdminCategory) => {
    if (!window.confirm(L(lang, `মুছবেন "${c.name}"?`, `Delete "${c.name}"?`))) return;
    setActionLoading(c.id);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: c.id, action: "delete" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || L(lang, "ব্যর্থ", "Failed"));
        return;
      }
      toast.success(L(lang, "মুছে ফেলা হয়েছে", "Deleted"));
      load();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <SectionHeader
        title={L(lang, "ক্যাটাগরি", "Categories")}
        description={L(
          lang,
          "কাজের ক্যাটাগরি পরিচালনা করুন",
          "Manage job categories"
        )}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Add form */}
        <Card className="p-4 lg:p-5 h-fit order-2 lg:order-1">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            {L(lang, "নতুন ক্যাটাগরি", "Add Category")}
          </h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">{L(lang, "নাম", "Name")}</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={L(lang, "যেমন: সোশ্যাল মিডিয়া", "e.g. Social Media")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{L(lang, "আইকন", "Icon")}</Label>
              <div className="grid grid-cols-6 gap-1.5">
                {CATEGORY_ICON_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setForm({ ...form, icon: name })}
                    className={`h-9 rounded-lg border flex items-center justify-center transition-colors ${
                      form.icon === name
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:bg-muted"
                    }`}
                    title={name}
                  >
                    <CategoryIcon name={name} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {L(lang, "যোগ করুন", "Add")}
            </Button>
          </form>
        </Card>

        {/* List */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          {loading ? (
            <LoadingState />
          ) : categories.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title={L(lang, "কোনো ক্যাটাগরি নেই", "No categories")}
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {categories.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <CategoryIcon name={c.icon} className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {toBn(c._count.jobs)} {L(lang, "কাজ", "jobs")}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          /{c.slug}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      disabled={actionLoading === c.id}
                      onClick={() => startEdit(c)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      {L(lang, "সম্পাদনা", "Edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1 text-destructive"
                      disabled={actionLoading === c.id}
                      onClick={() => handleDelete(c)}
                    >
                      {actionLoading === c.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                      {L(lang, "মুছুন", "Delete")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{L(lang, "ক্যাটাগরি সম্পাদনা", "Edit Category")}</DialogTitle>
            <DialogDescription>
              {L(lang, "নাম ও আইকন পরিবর্তন করুন", "Update name and icon")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{L(lang, "নাম", "Name")}</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{L(lang, "আইকন", "Icon")}</Label>
              <div className="grid grid-cols-6 gap-1.5">
                {CATEGORY_ICON_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, icon: name })}
                    className={`h-9 rounded-lg border flex items-center justify-center transition-colors ${
                      editForm.icon === name
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:bg-muted"
                    }`}
                  >
                    <CategoryIcon name={name} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t.common.cancel}
            </Button>
            <Button disabled={actionLoading === editing?.id} onClick={saveEdit}>
              {actionLoading === editing?.id ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =========================================================================
 * Settings view
 * =======================================================================*/

const PAYMENT_METHODS = ["BKASH", "NAGAD", "ROCKET"] as const;

function SettingsView() {
  const lang = useLang();
  const t = useI18n().t;
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await res.json();
      setSettings({
        websiteName: data.websiteName ?? "Amar Earning",
        primaryColor: data.primaryColor ?? "#22c55e",
        minWithdrawal: Number(data.minWithdrawal ?? 100),
        paymentMethods: data.paymentMethods ?? ["BKASH", "NAGAD", "ROCKET"],
        jobApprovalRequired: Boolean(data.jobApprovalRequired ?? true),
        maintenanceMode: Boolean(data.maintenanceMode ?? false),
      });
    } catch {
      toast.error(L(lang, "লোড ব্যর্থ", "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  const togglePaymentMethod = (m: string) => {
    if (!settings) return;
    const exists = settings.paymentMethods.includes(m);
    setSettings({
      ...settings,
      paymentMethods: exists
        ? settings.paymentMethods.filter((x) => x !== m)
        : [...settings.paymentMethods, m],
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || L(lang, "সংরক্ষণ ব্যর্থ", "Save failed"));
        return;
      }
      toast.success(L(lang, "সেটিংস সংরক্ষিত", "Settings saved"));
      load();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <LoadingState text={L(lang, "লোড হচ্ছে...", "Loading...")} />;
  }

  const methodLabel = (m: string) => {
    const map: Record<string, { bn: string; en: string }> = {
      BKASH: { bn: "বিকাশ", en: "bKash" },
      NAGAD: { bn: "নগদ", en: "Nagad" },
      ROCKET: { bn: "রকেট", en: "Rocket" },
    };
    const v = map[m] || { bn: m, en: m };
    return L(lang, v.bn, v.en);
  };

  return (
    <div>
      <SectionHeader
        title={L(lang, "প্ল্যাটফর্ম সেটিংস", "Platform Settings")}
        description={L(
          lang,
          "সাইট কনফিগারেশন পরিবর্তন করুন",
          "Configure site-wide options"
        )}
      />

      <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
        {/* General */}
        <Card className="p-4 md:p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            {L(lang, "সাধারণ", "General")}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="website-name">
                {L(lang, "ওয়েবসাইটের নাম", "Website Name")}
              </Label>
              <Input
                id="website-name"
                value={settings.websiteName}
                onChange={(e) =>
                  setSettings({ ...settings, websiteName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min-wd">{L(lang, "সর্বনিম্ন উইথড্র", "Min Withdrawal")}</Label>
              <Input
                id="min-wd"
                type="number"
                min={1}
                step="0.01"
                value={settings.minWithdrawal}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minWithdrawal: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="primary-color">
              {L(lang, "প্রাইমারি কালার", "Primary Color")}
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="primary-color"
                type="color"
                value={settings.primaryColor}
                onChange={(e) =>
                  setSettings({ ...settings, primaryColor: e.target.value })
                }
                className="h-10 w-14 rounded-md border border-input cursor-pointer bg-transparent p-1"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) =>
                  setSettings({ ...settings, primaryColor: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Payment methods */}
        <Card className="p-4 md:p-5 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" />
            {L(lang, "পেমেন্ট মেথড", "Payment Methods")}
          </h3>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={settings.paymentMethods.includes(m)}
                  onCheckedChange={() => togglePaymentMethod(m)}
                />
                <span className="text-sm">{methodLabel(m)}</span>
                <span className="text-xs text-muted-foreground ml-auto">{m}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Toggles */}
        <Card className="p-4 md:p-5 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-primary" />
            {L(lang, "অপশন", "Options")}
          </h3>
          <div className="flex items-center justify-between gap-3 p-2 rounded-lg">
            <div>
              <p className="text-sm font-medium">
                {L(lang, "কাজ অনুমোদন প্রয়োজন", "Job Approval Required")}
              </p>
              <p className="text-xs text-muted-foreground">
                {L(
                  lang,
                  "নতুন কাজ অ্যাডমিন অনুমোদনের পর প্রকাশিত হবে",
                  "New jobs require admin approval before publishing"
                )}
              </p>
            </div>
            <Switch
              checked={settings.jobApprovalRequired}
              onCheckedChange={(v) =>
                setSettings({ ...settings, jobApprovalRequired: v })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3 p-2 rounded-lg border-t pt-3">
            <div>
              <p className="text-sm font-medium">
                {L(lang, "মেইনটেন্যান্স মোড", "Maintenance Mode")}
              </p>
              <p className="text-xs text-muted-foreground">
                {L(
                  lang,
                  "সাইট সাময়িকভাবে বন্ধ রাখুন",
                  "Temporarily disable site access"
                )}
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(v) =>
                setSettings({ ...settings, maintenanceMode: v })
              }
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            {L(lang, "সংরক্ষণ করুন", "Save Settings")}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================================
 * Access denied
 * =======================================================================*/

function AccessDenied() {
  const lang = useLang();
  const { navigate } = useRouter();
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <EmptyState
        icon={ShieldAlert}
        title={L(lang, "অ্যাক্সেস অস্বীকৃত", "Access Denied")}
        description={L(
          lang,
          "এই পেজ দেখতে অ্যাডমিন হতে হবে।",
          "You must be an admin to view this page."
        )}
        action={
          <Button onClick={() => navigate({ name: "dashboard" })}>
            {L(lang, "ড্যাশবোর্ডে যান", "Go to Dashboard")}
          </Button>
        }
      />
    </div>
  );
}

/* =========================================================================
 * AnnounceView - broadcast notification to all users
 * =======================================================================*/
function AnnounceView() {
  const lang = useLang();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error(lang === "bn" ? "সব ফিল্ড পূরণ করুন" : "Fill all fields");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          lang === "bn"
            ? `${data.recipients} ইউজার পেয়েছে`
            : `Sent to ${data.recipients} users`
        );
        setTitle("");
        setMessage("");
      } else {
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          {lang === "bn" ? "অ্যানাউন্সমেন্ট পাঠান" : "Send Announcement"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "bn" ? "সব সক্রিয় ইউজারকে নোটিফিকেশন পাঠান" : "Send a notification to all active users"}
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{lang === "bn" ? "শিরোনাম" : "Title"}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === "bn" ? "নোটিফিকেশনের শিরোনাম" : "Notification title"}
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{lang === "bn" ? "বার্তা" : "Message"}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={lang === "bn" ? "বিস্তারিত বার্তা..." : "Detailed message..."}
              required
              rows={5}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {lang === "bn"
                ? "এই বার্তাটি প্ল্যাটফর্মের সব সক্রিয় ইউজারকে পাঠানো হবে। সাবধানতার সাথে ব্যবহার করুন।"
                : "This message will be sent to all active users on the platform. Use with caution."}
            </p>
          </div>
          <Button type="submit" className="w-full h-11" disabled={sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Megaphone className="h-4 w-4 mr-2" />
            )}
            {lang === "bn" ? "পাঠান" : "Send Announcement"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

/* =========================================================================
 * DepositsView - manage deposit requests
 * =======================================================================*/
function DepositsView() {
  const lang = useLang();
  const t = useI18n().t;
  const [deposits, setDeposits] = useState<Array<{
    id: string;
    amount: number;
    method: string;
    senderNumber: string;
    transactionId: string;
    status: string;
    rejectReason: string | null;
    createdAt: string;
    user: { name: string; username: string; email: string };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deposits?scope=admin&status=${filter}`, { cache: "no-store" });
      const data = await res.json();
      setDeposits(data.deposits || []);
    } catch {
      toast.error(L(lang, "লোড ব্যর্থ", "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [filter, lang]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "approve" | "reject") => {
    const reason = action === "reject" ? prompt(L(lang, "প্রত্যাখ্যানের কারণ:", "Reject reason:")) : undefined;
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId: id, action, rejectReason: reason }),
      });
      if (res.ok) {
        toast.success(L(lang, "সফল", "Done"));
        load();
      }
    } catch {
      toast.error("Error");
    }
  };

  return (
    <div>
      <SectionHeader
        title={L(lang, "ডিপোজিট", "Deposits")}
        description={L(lang, "ইউজারদের ডিপোজিট রিকোয়েস্ট", "User deposit requests")}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
          >
            {s === "PENDING" ? L(lang, "অপেক্ষমাণ", "Pending") :
             s === "APPROVED" ? L(lang, "অনুমোদিত", "Approved") :
             L(lang, "প্রত্যাখ্যাত", "Rejected")}
          </Button>
        ))}
      </div>

      {loading ? (
        <LoadingState text={L(lang, "লোড হচ্ছে...", "Loading...")} />
      ) : deposits.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {L(lang, "কোনো ডিপোজিট নেই", "No deposits")}
        </Card>
      ) : (
        <div className="space-y-3">
          {deposits.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base">{t.common.currency}{formatMoney(d.amount, lang)}</h3>
                    <Badge variant="secondary">{d.method}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {L(lang, "ইউজার", "User")}: {d.user.name} (@{d.user.username})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {L(lang, "নম্বর", "Number")}: <span className="font-mono">{d.senderNumber}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {L(lang, "ট্রানজেকশন আইডি", "Transaction ID")}: <span className="font-mono font-bold">{d.transactionId}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(d.createdAt, lang)}</p>
                </div>
                <Badge
                  className={
                    d.status === "APPROVED"
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : d.status === "REJECTED"
                      ? "bg-red-500/10 text-red-600 border-red-500/20"
                      : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                  }
                >
                  {t.status[d.status.toLowerCase() as keyof typeof t.status] || d.status}
                </Badge>
              </div>
              {d.status === "PENDING" && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="h-8 text-xs flex-1" onClick={() => act(d.id, "approve")}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {L(lang, "অনুমোদন", "Approve")}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs text-destructive flex-1" onClick={() => act(d.id, "reject")}>
                    <XCircle className="h-3 w-3 mr-1" />
                    {L(lang, "প্রত্যাখ্যান", "Reject")}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * ReportsView - manage user job reports
 * =======================================================================*/
function ReportsView() {
  const lang = useLang();
  const t = useI18n().t;
  const [reports, setReports] = useState<Array<{
    id: string;
    reason: string;
    detail: string | null;
    status: string;
    createdAt: string;
    job: { id: string; title: string; status: string };
    reporter: { name: string; username: string };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${filter}`, { cache: "no-store" });
      const data = await res.json();
      setReports(data.reports || []);
    } catch {
      toast.error(L(lang, "লোড ব্যর্থ", "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [filter, lang]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "review" | "dismiss") => {
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: id, action }),
      });
      if (res.ok) {
        toast.success(L(lang, "সফল", "Done"));
        load();
      }
    } catch {
      toast.error("Error");
    }
  };

  const reasonLabels: Record<string, { bn: string; en: string }> = {
    spam: { bn: "স্প্যাম", en: "Spam" },
    inappropriate: { bn: "অনুপ্রযোজ্য", en: "Inappropriate" },
    scam: { bn: "প্রতারণা", en: "Scam" },
    duplicate: { bn: "ডুপ্লিকেট", en: "Duplicate" },
    other: { bn: "অন্যান্য", en: "Other" },
  };

  return (
    <div>
      <SectionHeader
        title={L(lang, "রিপোর্ট", "Reports")}
        description={L(lang, "ইউজারদের রিপোর্ট করা কাজ", "User-reported jobs")}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {["PENDING", "REVIEWED", "DISMISSED"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
          >
            {s === "PENDING" ? L(lang, "অপেক্ষমাণ", "Pending") :
             s === "REVIEWED" ? L(lang, "রিভিউ হয়েছে", "Reviewed") :
             L(lang, "বাতিল", "Dismissed")}
          </Button>
        ))}
      </div>

      {loading ? (
        <LoadingState text={L(lang, "লোড হচ্ছে...", "Loading...")} />
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {L(lang, "কোনো রিপোর্ট নেই", "No reports")}
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{r.job.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {L(lang, "রিপোর্টকারী", "Reporter")}: {r.reporter.name} (@{r.reporter.username})
                  </p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-500/30 shrink-0">
                  {reasonLabels[r.reason] ? L(lang, reasonLabels[r.reason].bn, reasonLabels[r.reason].en) : r.reason}
                </Badge>
              </div>
              {r.detail && (
                <p className="text-xs text-muted-foreground mb-2 p-2 rounded-lg bg-muted/30">
                  {r.detail}
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{formatDateTime(r.createdAt, lang)}</p>
                {r.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => act(r.id, "review")}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {L(lang, "রিভিউ", "Review")}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => act(r.id, "dismiss")}>
                      <XCircle className="h-3 w-3 mr-1" />
                      {L(lang, "বাতিল", "Dismiss")}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
 * Main AdminPage
 * =======================================================================*/

export function AdminPage({ route }: { route: Route }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <LoadingState />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return <AccessDenied />;
  }

  const renderView = () => {
    switch (route.name) {
      case "admin":
        return <DashboardView />;
      case "admin-users":
        return <UsersView />;
      case "admin-jobs":
        return <JobsView />;
      case "admin-submissions":
        return <SubmissionsView />;
      case "admin-withdrawals":
        return <WithdrawalsView />;
      case "admin-categories":
        return <CategoriesView />;
      case "admin-reports":
        return <ReportsView />;
      case "admin-deposits":
        return <DepositsView />;
      case "admin-announce":
        return <AnnounceView />;
      case "admin-settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return <AdminShell route={route}>{renderView()}</AdminShell>;
}

export default AdminPage;
