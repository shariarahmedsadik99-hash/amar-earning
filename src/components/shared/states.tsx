"use client";

import { type ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      {text && <span className="ml-3 text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}
