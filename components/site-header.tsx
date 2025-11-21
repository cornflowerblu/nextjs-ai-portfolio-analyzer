/**
 * SiteHeader Component
 * Global navigation header for the application
 */

import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold">⚡</div>
          <span className="text-xl font-semibold">Next.js Rendering Analyzer</span>
        </Link>
        <nav className="hidden gap-6 md:flex">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/lab" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Lab
          </Link>
          <Link href="/analyze" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Analyze
          </Link>
          <Link href="/trends" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Trends
          </Link>
        </nav>
      </div>
    </header>
  );
}
