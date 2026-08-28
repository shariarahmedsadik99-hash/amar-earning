"use client";

import { useEffect } from "react";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { BottomNav } from "@/components/shared/bottom-nav";
import { useRouter } from "@/lib/router";
import { useAuth } from "@/lib/auth-context";
import { HomePage } from "@/components/views/home";
import { HowItWorksPage } from "@/components/views/how-it-works";
import { LoginPage } from "@/components/views/login";
import { RegisterPage } from "@/components/views/register";
import { JobsListPage } from "@/components/views/jobs-list";
import { JobDetailPage } from "@/components/views/job-detail";
import { PostJobPage } from "@/components/views/post-job";
import { DashboardPage } from "@/components/views/dashboard";
import { MyJobsPage } from "@/components/views/my-jobs";
import { MySubmissionsPage } from "@/components/views/my-submissions";
import { WalletPage } from "@/components/views/wallet";
import { WithdrawPage } from "@/components/views/withdraw";
import { ProfilePage } from "@/components/views/profile";
import { NotificationsPage } from "@/components/views/notifications";
import { NotificationSettingsPage } from "@/components/views/notification-settings";
import { FaqPage } from "@/components/views/faq";
import { ReferralsPage } from "@/components/views/referrals";
import { MyBookmarksPage } from "@/components/views/my-bookmarks";
import { LeaderboardPage } from "@/components/views/leaderboard";
import { CategoriesPage } from "@/components/views/categories";
import { JobFeedPage } from "@/components/views/job-feed";
import { PlatformStatsPage } from "@/components/views/platform-stats";
import { PublicProfilePage } from "@/components/views/public-profile";
import { AdminPage } from "@/components/admin/admin-page";
import { MaintenanceBanner } from "@/components/shared/maintenance-banner";

export default function Home() {
  const { route, navigate } = useRouter();
  const { user, loading } = useAuth();

  // Auth guard for protected routes
  useEffect(() => {
    if (loading) return;
    const protectedRoutes = [
      "dashboard",
      "post-job",
      "my-jobs",
      "my-submissions",
      "my-bookmarks",
      "wallet",
      "withdraw",
      "profile",
      "referrals",
      "notifications",
      "notification-settings",
    ];
    const adminRoutes = ["admin", "admin-users", "admin-jobs", "admin-submissions", "admin-withdrawals", "admin-categories", "admin-reports", "admin-settings", "admin-announce"];

    if (!user && (protectedRoutes.includes(route.name) || adminRoutes.includes(route.name))) {
      navigate({ name: "login" });
    }
    if (user && adminRoutes.includes(route.name) && user.role !== "ADMIN") {
      navigate({ name: "dashboard" });
    }
    // Redirect logged-in users away from login/register
    if (user && (route.name === "login" || route.name === "register")) {
      navigate({ name: "dashboard" });
    }
  }, [route.name, user, loading, navigate]);

  const renderView = () => {
    switch (route.name) {
      case "home":
        return <HomePage />;
      case "how-it-works":
        return <HowItWorksPage />;
      case "login":
        return <LoginPage />;
      case "register":
        return <RegisterPage />;
      case "jobs":
        return <JobsListPage />;
      case "available-jobs":
      case "available-jobs-category":
        return (
          <JobsListPage
            key={route.name === "available-jobs-category" ? route.categoryId : "all"}
            categoryId={route.name === "available-jobs-category" ? route.categoryId : undefined}
          />
        );
      case "job":
        return <JobDetailPage jobId={route.id} />;
      case "post-job":
        return <PostJobPage />;
      case "dashboard":
        return <DashboardPage />;
      case "my-jobs":
        return <MyJobsPage />;
      case "my-submissions":
        return <MySubmissionsPage />;
      case "my-bookmarks":
        return <MyBookmarksPage />;
      case "wallet":
        return <WalletPage />;
      case "withdraw":
        return <WithdrawPage />;
      case "profile":
        return <ProfilePage />;
      case "referrals":
        return <ReferralsPage />;
      case "notifications":
        return <NotificationsPage />;
      case "notification-settings":
        return <NotificationSettingsPage />;
      case "faq":
        return <FaqPage />;
      case "leaderboard":
        return <LeaderboardPage />;
      case "categories":
        return <CategoriesPage />;
      case "job-feed":
        return <JobFeedPage />;
      case "platform-stats":
        return <PlatformStatsPage />;
      case "public-profile":
        return <PublicProfilePage username={route.username} />;
      case "admin":
      case "admin-users":
      case "admin-jobs":
      case "admin-submissions":
      case "admin-withdrawals":
      case "admin-categories":
      case "admin-reports":
      case "admin-settings":
      case "admin-announce":
        return <AdminPage route={route} />;
      default:
        return <HomePage />;
    }
  };

  const isAuthPage = route.name === "login" || route.name === "register";
  const isAdminPage = route.name.startsWith("admin");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MaintenanceBanner />
      <Header />
      <main className={`flex-1 ${isAuthPage ? "" : "pb-20 md:pb-0"}`}>
        {renderView()}
      </main>
      {!isAuthPage && !isAdminPage && <Footer />}
      <BottomNav />
    </div>
  );
}
