"use client";

import { useState, useCallback } from "react";

export type RecentJob = {
  id: string;
  title: string;
  reward: number;
  categoryName: string;
  viewedAt: string;
};

const STORAGE_KEY = "ae_recent_jobs";
const MAX_ITEMS = 8;

export function useRecentJobs() {
  const [recent, setRecent] = useState<RecentJob[]>([]);

  const load = useCallback(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items = stored ? JSON.parse(stored) : [];
      setRecent(items);
      return items;
    } catch {
      return [];
    }
  }, []);

  const add = useCallback((job: Omit<RecentJob, "viewedAt">) => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items: RecentJob[] = stored ? JSON.parse(stored) : [];
      // Remove if already exists
      const filtered = items.filter((j) => j.id !== job.id);
      // Add to front
      const newItems = [{ ...job, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      setRecent(newItems);
    } catch {}
  }, []);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    setRecent([]);
  }, []);

  return { recent, load, add, clear };
}
