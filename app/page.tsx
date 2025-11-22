import { SiteHeader } from '@/components/site-header';
import { StrategyCards } from '@/components/strategy-cards';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <SiteHeader />

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
            <a href="/lab" className="rounded-lg border border-input bg-background px-8 py-3 text-sm font-medium hover:bg-accent">
              Try Lab Demos
            </a>
          </div>
        </div>
      </section>

      {/* Strategy Cards Grid */}
      <StrategyCards />

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
