import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { GoogleAnalytics } from "@/components/google-analytics";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Next.js Rendering Strategy Analyzer",
  description: "Interactive tool for understanding and comparing Next.js rendering strategies: SSR, SSG, ISR, and Cache Components. Measure Core Web Vitals and optimize your application's performance.",
  keywords: ["Next.js", "React", "SSR", "SSG", "ISR", "Cache", "Core Web Vitals", "Performance", "Web Performance"],
  authors: [{ name: "Next.js Portfolio Analyzer" }],
  creator: "Next.js Portfolio Analyzer",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Next.js Rendering Strategy Analyzer",
    description: "Analyze and compare rendering strategies for optimal web performance",
    siteName: "Next.js Rendering Strategy Analyzer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js Rendering Strategy Analyzer",
    description: "Analyze and compare rendering strategies for optimal web performance",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(1 0 0)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.129 0.042 264.695)" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased flex flex-col min-h-screen`}
      >
        <GoogleAnalytics />
        <WebVitalsReporter />
        <ErrorBoundary>
          <div className="flex-1">
            {children}
          </div>
          <SiteFooter />
        </ErrorBoundary>
      </body>
    </html>
  );
}
