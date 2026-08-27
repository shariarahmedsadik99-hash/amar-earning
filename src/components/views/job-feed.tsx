"use client";

import { useI18n } from "@/lib/i18n-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Code2, Copy, ExternalLink, Globe } from "lucide-react";

export function JobFeedPage() {
  const { t, lang } = useI18n();

  const endpoint = typeof window !== "undefined" ? `${window.location.origin}/api/jobs/feed` : "/api/jobs/feed";

  const copyEndpoint = () => {
    navigator.clipboard.writeText(endpoint);
    toast.success(t.jobFeed.copied);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center mb-4">
          <Globe className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.jobFeed.title}</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">{t.jobFeed.subtitle}</p>
      </div>

      {/* Description */}
      <Card className="p-5 mb-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{t.jobFeed.description}</p>
      </Card>

      {/* Endpoint */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{t.jobFeed.endpoint}</h3>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border font-mono text-xs">
          <span className="flex-1 truncate">{endpoint}</span>
          <Button size="sm" variant="ghost" className="h-7 gap-1 shrink-0" onClick={copyEndpoint}>
            <Copy className="h-3 w-3" />
            {t.jobFeed.copyEndpoint}
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3 gap-2"
          onClick={() => window.open(endpoint, "_blank")}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t.jobFeed.openApi}
        </Button>
      </Card>

      {/* Parameters */}
      <Card className="p-5 mb-4">
        <h3 className="font-semibold text-sm mb-3">{t.jobFeed.params}</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <code className="text-xs font-mono">limit</code>
            <span className="text-xs text-muted-foreground">{t.jobFeed.limit}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <code className="text-xs font-mono">category</code>
            <span className="text-xs text-muted-foreground">{t.jobFeed.category}</span>
          </div>
        </div>
      </Card>

      {/* Example */}
      <Card className="p-5 mb-4">
        <h3 className="font-semibold text-sm mb-3">{t.jobFeed.example}</h3>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-muted/50 border font-mono text-xs">
            GET {endpoint}?limit=5
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border font-mono text-xs">
            GET {endpoint}?category=social-media&limit=10
          </div>
        </div>
      </Card>

      {/* Response format preview */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3">
          {lang === "bn" ? "রেসপন্স ফরম্যাট" : "Response Format"}
        </h3>
        <pre className="p-3 rounded-lg bg-muted/50 border text-xs font-mono overflow-x-auto">
{`{
  "platform": "Amar Earning",
  "tagline": "কাজ করুন, আয় করুন।",
  "totalJobs": 8,
  "generatedAt": "2026-08-27T...",
  "jobs": [
    {
      "id": "...",
      "title": "Facebook Page Follow",
      "description": "...",
      "reward": 5,
      "currency": "BDT",
      "workerLimit": 50,
      "slotsRemaining": 49,
      "category": "Social Media",
      "categorySlug": "social-media",
      "deadline": "2026-09-03T...",
      "url": "/#/jobs/..."
    }
  ]
}`}
        </pre>
      </Card>
    </div>
  );
}
