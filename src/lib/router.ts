"use client";

import { useState, useEffect, useCallback } from "react";

export type Route =
  | { name: "home" }
  | { name: "login" }
  | { name: "register" }
  | { name: "jobs" }
  | { name: "job"; id: string }
  | { name: "dashboard" }
  | { name: "available-jobs" }
  | { name: "my-jobs" }
  | { name: "my-submissions" }
  | { name: "post-job" }
  | { name: "wallet" }
  | { name: "withdraw" }
  | { name: "profile" }
  | { name: "notifications" }
  | { name: "how-it-works" }
  | { name: "admin" }
  | { name: "admin-users" }
  | { name: "admin-jobs" }
  | { name: "admin-submissions" }
  | { name: "admin-withdrawals" }
  | { name: "admin-categories" }
  | { name: "admin-settings" };

function parseHash(): Route {
  if (typeof window === "undefined") return { name: "home" };
  const hash = window.location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);

  if (parts.length === 0) return { name: "home" };

  switch (parts[0]) {
    case "login":
      return { name: "login" };
    case "register":
      return { name: "register" };
    case "jobs":
      if (parts[1]) return { name: "job", id: parts[1] };
      return { name: "jobs" };
    case "dashboard":
      return { name: "dashboard" };
    case "available-jobs":
      return { name: "available-jobs" };
    case "my-jobs":
      return { name: "my-jobs" };
    case "my-submissions":
      return { name: "my-submissions" };
    case "post-job":
      return { name: "post-job" };
    case "wallet":
      return { name: "wallet" };
    case "withdraw":
      return { name: "withdraw" };
    case "profile":
      return { name: "profile" };
    case "notifications":
      return { name: "notifications" };
    case "how-it-works":
      return { name: "how-it-works" };
    case "admin":
      if (parts[1] === "users") return { name: "admin-users" };
      if (parts[1] === "jobs") return { name: "admin-jobs" };
      if (parts[1] === "submissions") return { name: "admin-submissions" };
      if (parts[1] === "withdrawals") return { name: "admin-withdrawals" };
      if (parts[1] === "categories") return { name: "admin-categories" };
      if (parts[1] === "settings") return { name: "admin-settings" };
      return { name: "admin" };
    default:
      return { name: "home" };
  }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "job":
      return `#/jobs/${route.id}`;
    case "available-jobs":
      return "#/available-jobs";
    case "my-jobs":
      return "#/my-jobs";
    case "my-submissions":
      return "#/my-submissions";
    case "post-job":
      return "#/post-job";
    case "admin-users":
      return "#/admin/users";
    case "admin-jobs":
      return "#/admin/jobs";
    case "admin-submissions":
      return "#/admin/submissions";
    case "admin-withdrawals":
      return "#/admin/withdrawals";
    case "admin-categories":
      return "#/admin/categories";
    case "admin-settings":
      return "#/admin/settings";
    default:
      return `#/${route.name}`;
  }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash());
      // Scroll to top on route change
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = useCallback((newRoute: Route) => {
    window.location.hash = routeToHash(newRoute);
  }, []);

  return { route, navigate };
}
