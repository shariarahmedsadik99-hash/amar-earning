import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Amar Earning — কাজ করুন, আয় করুন।",
  description:
    "Amar Earning - একটি সহজ ও বিশ্বস্ত বাংলাদেশী মাইক্রো-জব প্ল্টফর্ম। ছোট ছোট কাজ করে সহজেই আয় করুন।",
  keywords: ["micro job", "amar earning", "বাংলাদেশ", "আয়", "কাজ", "bKash", "earning"],
  authors: [{ name: "Amar Earning" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Amar Earning",
    description: "কাজ করুন, আয় করুন।",
    siteName: "Amar Earning",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoBengali.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
