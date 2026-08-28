"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter, type Route } from "@/lib/router";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsBell } from "./notifications-bell";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  Home,
  Briefcase,
  Info,
  LayoutDashboard,
  LogOut,
  Wallet,
  User,
  Shield,
  PlusCircle,
  ClipboardList,
  Bookmark,
  Gift,
  HelpCircle,
} from "lucide-react";

export function Header() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { navigate, route } = useRouter();
  const [open, setOpen] = useState(false);

  const navTo = (r: Route) => {
    navigate(r);
    setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate({ name: "home" });
    setOpen(false);
  };

  const isActive = (name: string) => route.name === name;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <button onClick={() => navTo({ name: "home" })} className="shrink-0">
          <Logo size="md" />
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink active={isActive("home")} onClick={() => navTo({ name: "home" })}>
            {t.nav.home}
          </NavLink>
          <NavLink active={isActive("jobs") || isActive("available-jobs")} onClick={() => navTo({ name: "available-jobs" })}>
            {t.nav.jobs}
          </NavLink>
          <NavLink active={isActive("how-it-works")} onClick={() => navTo({ name: "how-it-works" })}>
            {t.nav.howItWorks}
          </NavLink>
          {user && (
            <NavLink active={isActive("post-job")} onClick={() => navTo({ name: "post-job" })}>
              {t.nav.postJob}
            </NavLink>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {user && <NotificationsBell />}
          <LanguageSwitcher />
          <ThemeToggle />

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navTo({ name: "dashboard" })}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t.nav.dashboard}
                </Button>
                {user.role === "ADMIN" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navTo({ name: "admin" })}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    {t.nav.admin}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navTo({ name: "login" })}>
                  {t.nav.login}
                </Button>
                <Button size="sm" onClick={() => navTo({ name: "register" })}>
                  {t.nav.register}
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden h-9 w-9 p-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="px-4 py-4 border-b">
                    <SheetTitle className="text-left"><Logo size="sm" /></SheetTitle>
              </SheetHeader>
              <div className="flex flex-col py-2">
                <MobileNavItem icon={Home} label={t.nav.home} onClick={() => navTo({ name: "home" })} />
                <MobileNavItem icon={Briefcase} label={t.nav.availableJobs} onClick={() => navTo({ name: "available-jobs" })} />
                <MobileNavItem icon={Info} label={t.nav.howItWorks} onClick={() => navTo({ name: "how-it-works" })} />
                <MobileNavItem icon={HelpCircle} label={t.faq.title} onClick={() => navTo({ name: "faq" })} />

                {user ? (
                  <>
                    <div className="my-2 border-t" />
                    <MobileNavItem icon={LayoutDashboard} label={t.nav.dashboard} onClick={() => navTo({ name: "dashboard" })} />
                    <MobileNavItem icon={PlusCircle} label={t.nav.postJob} onClick={() => navTo({ name: "post-job" })} />
                    <MobileNavItem icon={Briefcase} label={t.nav.myJobs} onClick={() => navTo({ name: "my-jobs" })} />
                    <MobileNavItem icon={ClipboardList} label={t.nav.mySubmissions} onClick={() => navTo({ name: "my-submissions" })} />
                    <MobileNavItem icon={Bookmark} label={t.bookmarks.title} onClick={() => navTo({ name: "my-bookmarks" })} />
                    <MobileNavItem icon={Gift} label={t.referrals.title} onClick={() => navTo({ name: "referrals" })} />
                    <MobileNavItem icon={Wallet} label={t.nav.wallet} onClick={() => navTo({ name: "wallet" })} />
                    <MobileNavItem icon={User} label={t.nav.profile} onClick={() => navTo({ name: "profile" })} />
                    {user.role === "ADMIN" && (
                      <MobileNavItem icon={Shield} label={t.nav.admin} onClick={() => navTo({ name: "admin" })} />
                    )}
                    <div className="my-2 border-t" />
                    <MobileNavItem icon={LogOut} label={t.nav.logout} onClick={handleLogout} />
                  </>
                ) : (
                  <>
                    <div className="my-2 border-t" />
                    <div className="px-4 py-2 flex flex-col gap-2">
                      <Button onClick={() => navTo({ name: "login" })} variant="outline">{t.nav.login}</Button>
                      <Button onClick={() => navTo({ name: "register" })}>{t.nav.register}</Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function MobileNavItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted transition-colors text-left"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </button>
  );
}
