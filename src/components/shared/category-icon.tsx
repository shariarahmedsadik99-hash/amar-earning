"use client";

import {
  Share2,
  Globe,
  Smartphone,
  Table,
  PenLine,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Share2,
  Globe,
  Smartphone,
  Table,
  PenLine,
  Briefcase,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] || Briefcase;
  return <Icon className={className} />;
}

export const CATEGORY_ICON_NAMES = Object.keys(ICON_MAP);
