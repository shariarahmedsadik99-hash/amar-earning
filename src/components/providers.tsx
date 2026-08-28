"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n-context";
import { AuthProvider } from "@/lib/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
