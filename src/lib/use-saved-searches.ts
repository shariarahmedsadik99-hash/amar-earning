"use client";

import { useState, useCallback } from "react";

export type SavedSearch = {
  id: string;
  name: string;
  search: string;
  category: string;
  minReward: string;
  maxReward: string;
  sortBy: string;
  deadline: string;
  createdAt: string;
};

const STORAGE_KEY = "ae_saved_searches";
const MAX_ITEMS = 10;

export function useSavedSearches() {
  const [saved, setSaved] = useState<SavedSearch[]>([]);

  const load = useCallback(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items = stored ? JSON.parse(stored) : [];
      setSaved(items);
      return items;
    } catch {
      return [];
    }
  }, []);

  const save = useCallback((search: Omit<SavedSearch, "id" | "createdAt">) => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items: SavedSearch[] = stored ? JSON.parse(stored) : [];
      const newItem: SavedSearch = {
        ...search,
        id: `s${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const newItems = [newItem, ...items].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      setSaved(newItems);
      return true;
    } catch {
      return false;
    }
  }, []);

  const remove = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items: SavedSearch[] = stored ? JSON.parse(stored) : [];
      const filtered = items.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      setSaved(filtered);
    } catch {}
  }, []);

  return { saved, load, save, remove };
}
