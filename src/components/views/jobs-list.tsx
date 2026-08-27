"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobCard, type JobCardData } from "@/components/shared/job-card";
import { CategoryIcon } from "@/components/shared/category-icon";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { Search, Briefcase, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { id: string; name: string; slug: string; icon: string };

export function JobsListPage() {
  const { t, lang } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

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
  }, [search, category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.nav.availableJobs}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.jobs.subtitle}</p>
      </div>

      {/* Filters */}
      <Card className="p-3 md:p-4 mb-6 flex flex-col sm:flex-row gap-3">
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
          <SelectTrigger className="sm:w-56">
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
