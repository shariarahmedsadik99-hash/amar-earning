"use client";

import {
  Share2,
  Globe,
  Smartphone,
  Table,
  PenLine,
  Briefcase,
  Send,
  Mail,
  ShieldCheck,
  Star,
  Music,
  MessageCircle,
  Tv,
  Camera,
  Gift,
  MessageSquare,
  ThumbsUp,
  Play,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Share2,
  Globe,
  Smartphone,
  Table,
  PenLine,
  Briefcase,
  Send,
  Mail,
  ShieldCheck,
  Star,
  Music,
  MessageCircle,
  Tv,
  Camera,
  Gift,
  MessageSquare,
  ThumbsUp,
  Play,
  // Brand icon fallbacks
  Facebook: ThumbsUp,
  Youtube: Play,
  Twitter: MessageSquare,
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
