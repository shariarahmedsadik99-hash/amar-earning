"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { formatMoney, toBn } from "@/lib/format";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Briefcase, TrendingUp, Trophy, ArrowRight, FolderSearch } from "lucide-react";

type CategoryStat = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  jobCount: number;
  avgReward: number;
  maxReward: number;
};

// Translate a category slug into the current language, falling back to the
// raw name returned by the API when no matching translation key exists.
function useCategoryLabel() {
  const { t } = useI18n();
  return (slug: string, fallback: string) => {
    const labels = t.categories as Record<string, string>;
    const tryKey1 = slug.replace(/-/g, "");
    const tryKey2 = slug.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    return labels[tryKey1] ?? labels[tryKey2] ?? fallback;
  };
}

export function CategoriesPage() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const labelFor = useCategoryLabel();

  const [categories, setCategories] = useState<CategoryStat[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/categories-stats", { cache: "no-store" });
        const json = await res.json();
        if (active) {
          setCategories(Array.isArray(json.categories) ? json.categories : []);
        }
      } catch {
        if (active) setCategories([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-16">
      {/* Header */}
      <header className="text-center mb-10 md:mb-12 animate-fade-in-up">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <LayoutGrid className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t.categoriesPage.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-xl mx-auto">
          {t.categoriesPage.subtitle}
        </p>
      </header>

      {loading ? (
        <LoadingState text={t.common.loading} />
      ) : !categories || categories.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title={t.categoriesPage.title}
          description={
            lang === "bn"
              ? "এখনও কোনো ক্যাটাগরি তৈরি করা হয়নি।"
              : "No categories have been created yet."
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 stagger">
          {categories.map((cat) => {
            const hasJobs = cat.jobCount > 0;
            return (
              <Card
                key={cat.id}
                role="button"
                tabIndex={0}
                aria-label={`${labelFor(cat.slug, cat.name)} — ${toBn(cat.jobCount)} ${t.categoriesPage.jobs}`}
                onClick={() =>
                  navigate({
                    name: "available-jobs-category",
                    categoryId: cat.id,
                  } as Route)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate({
                      name: "available-jobs-category",
                      categoryId: cat.id,
                    } as Route);
                  }
                }}
                className="group relative p-4 md:p-5 cursor-pointer card-lift hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {/* Job count badge */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge
                    variant={hasJobs ? "secondary" : "outline"}
                    className="px-2 py-0.5 text-[11px] font-semibold gap-1"
                  >
                    <Briefcase className="h-3 w-3" />
                    {toBn(cat.jobCount)}
                  </Badge>
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-3">
                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-1 ring-primary/10 group-hover:scale-105 transition-transform">
                    <CategoryIcon
                      name={cat.icon}
                      className="h-7 w-7 md:h-8 md:w-8 text-primary"
                    />
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-center font-semibold text-sm md:text-base line-clamp-1">
                  {labelFor(cat.slug, cat.name)}
                </h3>

                {/* Reward stats */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {t.categoriesPage.avgReward}
                    </span>
                    <span className="font-semibold">
                      {t.common.currency}
                      {formatMoney(cat.avgReward, lang)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {t.categoriesPage.maxReward}
                    </span>
                    <span className="font-semibold">
                      {t.common.currency}
                      {formatMoney(cat.maxReward, lang)}
                    </span>
                  </div>
                </div>

                {/* Browse affordance */}
                <div className="mt-3 pt-3 border-t flex items-center justify-center gap-1 text-[11px] font-medium text-primary group-hover:gap-2 transition-all">
                  {t.categoriesPage.browse}
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
