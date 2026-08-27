"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter, type Route } from "@/lib/router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobCard, type JobCardData } from "@/components/shared/job-card";
import { CategoryIcon } from "@/components/shared/category-icon";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { useRecentJobs } from "@/lib/use-recent-jobs";
import { formatMoney } from "@/lib/format";
import { Search, Briefcase, SlidersHorizontal, History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string; slug: string; icon: string };

export function JobsListPage({ categoryId: initialCategory }: { categoryId?: string }) {
  const { t, lang } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory || "all");
  const [minReward, setMinReward] = useState("");
  const [maxReward, setMaxReward] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [deadline, setDeadline] = useState("any");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      if (minReward) params.set("minReward", minReward);
      if (maxReward) params.set("maxReward", maxReward);
      if (sortBy) params.set("sortBy", sortBy);
      if (deadline && deadline !== "any") params.set("deadline", deadline);
      params.set("limit", "50");
      const res = await fetch(`/api/jobs/list?${params}`);
      const d = await res.json();
      if (active) {
        setJobs(d.jobs || []);
        setLoading(false);
      }
    };
    const debounce = setTimeout(run, 250);
    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [search, category, minReward, maxReward, sortBy, deadline]);

  const hasActiveFilters = minReward || maxReward || deadline !== "any";

  const clearFilters = () => {
    setMinReward("");
    setMaxReward("");
    setDeadline("any");
    setSortBy("newest");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.nav.availableJobs}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.jobs.subtitle}</p>
      </div>

      {/* Filters */}
      <Card className="p-3 md:p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.jobs.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="sm:w-48">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.all}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {lang === "bn" ? t.categories[c.slug.replace(/-/g, "") as keyof typeof t.categories] || c.name : c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            className="sm:w-auto gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t.filters.title}
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary-foreground" />
            )}
          </Button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t.filters.minReward} (৳)</label>
              <Input
                type="number"
                min="0"
                value={minReward}
                onChange={(e) => setMinReward(e.target.value)}
                placeholder="0"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t.filters.maxReward} (৳)</label>
              <Input
                type="number"
                min="0"
                value={maxReward}
                onChange={(e) => setMaxReward(e.target.value)}
                placeholder="100"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t.filters.sortBy}</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t.filters.sortNewest}</SelectItem>
                  <SelectItem value="rewardHigh">{t.filters.sortRewardHigh}</SelectItem>
                  <SelectItem value="rewardLow">{t.filters.sortRewardLow}</SelectItem>
                  <SelectItem value="deadline">{t.filters.sortDeadline}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t.jobs.deadline}</label>
              <Select value={deadline} onValueChange={setDeadline}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t.filters.anyDeadline}</SelectItem>
                  <SelectItem value="3days">{t.filters.within3days}</SelectItem>
                  <SelectItem value="7days">{t.filters.within7days}</SelectItem>
                  <SelectItem value="expired">{t.filters.expired}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="col-span-2 md:col-span-4 text-xs text-destructive hover:underline text-left"
              >
                {t.filters.clear}
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Category chips (mobile) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 -mx-4 px-4 md:hidden">
        <Chip active={category === "all"} onClick={() => setCategory("all")}>
          {t.common.all}
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            <CategoryIcon name={c.icon} className="h-3.5 w-3.5" />
            {lang === "bn" ? t.categories[c.slug.replace(/-/g, "") as keyof typeof t.categories] || c.name : c.name}
          </Chip>
        ))}
      </div>

      {/* Jobs grid */}
      {loading ? (
        <LoadingState />
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title={t.jobs.noJobs} description={t.jobs.subtitle} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Recently viewed jobs */}
      <RecentJobsSection />
    </div>
  );
}

function RecentJobsSection() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const { recent, load, clear } = useRecentJobs();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, [load]);

  if (!mounted || recent.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-base flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          {t.recentJobs.title}
        </h2>
        <button
          onClick={clear}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          {t.recentJobs.clear}
        </button>
      </div>
      <Card className="p-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {recent.map((job) => (
            <button
              key={job.id}
              onClick={() => navigate({ name: "job", id: job.id } as Route)}
              className="shrink-0 w-48 p-3 rounded-lg border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left card-lift"
            >
              <p className="text-sm font-medium truncate">{job.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{job.categoryName}</p>
              <p className="text-sm font-bold text-primary mt-1">
                {t.common.currency}{formatMoney(job.reward, lang)}
              </p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
