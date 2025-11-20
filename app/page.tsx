export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">⚡</div>
            <span className="text-xl font-semibold">Next.js Rendering Analyzer</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <a href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</a>
            <a href="#lab" className="text-sm font-medium text-muted-foreground hover:text-foreground">Lab</a>
            <a href="#analyze" className="text-sm font-medium text-muted-foreground hover:text-foreground">Analyze</a>
            <a href="#trends" className="text-sm font-medium text-muted-foreground hover:text-foreground">Trends</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Understand Next.js Rendering Strategies
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Compare SSR, SSG, ISR, and Cache Components with real-time Core Web Vitals metrics, 
            AI-powered insights, and Lighthouse analysis.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a href="/dashboard" className="rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              View Dashboard
            </a>
            <a href="#" className="rounded-lg border border-input bg-background px-8 py-3 text-sm font-medium hover:bg-accent">
              Try Lab Demos
            </a>
          </div>
        </div>
      </section>

      {/* Strategy Cards Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Rendering Strategies</h2>
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* SSR Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xl">🔄</span>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">SSR</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Server-Side Rendering</h3>
            <p className="text-sm text-muted-foreground">
              Render on every request with always-fresh data
            </p>
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">FCP</span>
                <span className="font-mono">--</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">LCP</span>
                <span className="font-mono">--</span>
              </div>
            </div>
          </div>

          {/* SSG Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xl">⚡</span>
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">SSG</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Static Site Generation</h3>
            <p className="text-sm text-muted-foreground">
              Pre-render at build time for maximum performance
            </p>
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">FCP</span>
                <span className="font-mono">--</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">LCP</span>
                <span className="font-mono">--</span>
              </div>
            </div>
          </div>

          {/* ISR Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xl">🔄⚡</span>
              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-600">ISR</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Incremental Static Regeneration</h3>
            <p className="text-sm text-muted-foreground">
              Static generation with periodic revalidation
            </p>
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">FCP</span>
                <span className="font-mono">--</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">LCP</span>
                <span className="font-mono">--</span>
              </div>
            </div>
          </div>

          {/* Cache Components Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xl">💾</span>
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-500">CACHE</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Cache Components</h3>
            <p className="text-sm text-muted-foreground">
              Component-level caching with Next.js 16
            </p>
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">FCP</span>
                <span className="font-mono">--</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">LCP</span>
                <span className="font-mono">--</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">Features</h2>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
              🧪
            </div>
            <h3 className="text-xl font-semibold">Interactive Lab</h3>
            <p className="text-sm text-muted-foreground">
              Hands-on demos with live metrics, cache indicators, and source code viewers
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
              🔍
            </div>
            <h3 className="text-xl font-semibold">URL Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Run Lighthouse tests on any website with strategy recommendations
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
              🤖
            </div>
            <h3 className="text-xl font-semibold">AI Insights</h3>
            <p className="text-sm text-muted-foreground">
              Streaming AI analysis with actionable optimization suggestions
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
              📊
            </div>
            <h3 className="text-xl font-semibold">Historical Trends</h3>
            <p className="text-sm text-muted-foreground">
              Track Core Web Vitals evolution over time with regression detection
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
              🚀
            </div>
            <h3 className="text-xl font-semibold">Vercel Platform</h3>
            <p className="text-sm text-muted-foreground">
              Live demos of Edge Functions, KV caching, and geographic latency
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
              📄
            </div>
            <h3 className="text-xl font-semibold">Export Reports</h3>
            <p className="text-sm text-muted-foreground">
              Generate PDF reports, Markdown guides, and JSON checklists
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-lg md:p-12">
          <h2 className="text-3xl font-bold">Coming Soon</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            This dashboard is currently under development. Check back soon for the full experience!
          </p>
          <div className="mt-8">
            <a 
              href="https://github.com/cornflowerblu/nextjs-ai-portfolio-analyzer" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              <span>⭐</span>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Next.js Rendering Strategy Analyzer • Built with Next.js 16 & React 19</p>
        </div>
      </footer>
    </div>
  );
}
