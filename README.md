# Next.js Rendering Strategy Analyzer ⚡

An interactive web application that demonstrates and analyzes Next.js 16 rendering strategies (SSR, SSG, ISR, and Cache Components) with real-time Core Web Vitals metrics, AI-powered optimization insights, and Lighthouse-based website analysis.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwind-css)

## 🎯 What This App Does

- **📊 Compare Rendering Strategies**: Side-by-side dashboard showing SSR, SSG, ISR, and Cache Components with live Core Web Vitals metrics (FCP, LCP, CLS, INP, TTFB)
- **🧪 Interactive Lab Demos**: Hands-on demos of each rendering strategy with real-time metrics, cache status indicators, and source code viewers
- **🔍 URL Analysis**: Run Lighthouse tests on any website and get rendering strategy recommendations with projected performance improvements
- **🤖 AI Optimization Insights**: Streaming AI assistant that analyzes performance data and provides actionable optimization suggestions
- **🌍 Vercel Platform Showcase**: Live demos of Edge Functions vs Serverless, KV caching latency, Edge Config, and geographic latency testing
- **📈 Historical Trends**: Track Core Web Vitals evolution over time with regression detection and multi-project support
- **📄 Export Reports**: Generate PDF reports, Markdown implementation guides, and JSON optimization checklists

## ✨ Key Features

- ✅ **Responsive Design**: Optimized for mobile, tablet, and desktop
- ✅ **Accessibility**: ARIA labels, keyboard navigation, and focus management
- ✅ **Performance Monitoring**: Real-time Web Vitals tracking with instrumentation
- ✅ **Error Handling**: Graceful error pages and user-friendly error messages
- ✅ **Loading States**: Skeleton loaders for async content
- ✅ **Dynamic Imports**: Code splitting for optimal bundle size (< 200KB initial load)

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router with Parallel Routes)
- **Runtime**: React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts
- **Animations**: Framer Motion
- **AI**: Vercel AI SDK (OpenAI/Anthropic)
- **Storage**: Vercel KV (Redis)
- **Config**: Vercel Edge Config
- **Performance**: Lighthouse CI integration
- **Syntax Highlighting**: Shiki

## 📋 Project Structure

See [`specs/001-nextjs-render-analyzer/plan.md`](specs/001-nextjs-render-analyzer/plan.md) for complete architecture and file structure.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm/bun
- Chrome/Chromium (for Lighthouse analysis)
- Vercel account (optional, for KV caching)
- OpenAI or Anthropic API key (optional, for AI insights)

### Installation

```bash
# Install dependencies
npm install

# Set environment variable for Next.js build (required for font loading)
export NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1

# Optional: Configure Redis for caching
# export REDIS_URL=your_redis_url
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## 📚 Documentation

- **[Specification](specs/001-nextjs-render-analyzer/spec.md)**: Complete feature requirements and user stories
- **[Implementation Plan](specs/001-nextjs-render-analyzer/plan.md)**: Technical architecture and project structure
- **[Tasks](specs/001-nextjs-render-analyzer/tasks.md)**: 155 detailed implementation tasks organized by phase
- **[AI Insights Guide](docs/AI_INSIGHTS.md)**: AI-powered optimization insights documentation
- **[60-Minute Dynamic Data Demo](docs/QUICK_DATA_DEMO.md)**: Fast path to showcase Vercel Postgres + KV with ISR vs dynamic routes
- **[Confluence Space](https://rurich.atlassian.net/wiki/spaces/NAPA)**: Project documentation and task tracking
- **[Jira Board](https://rurich.atlassian.net/jira/software/projects/NAPA/boards/104)**: Sprint planning and issue tracking

## 🎯 Implementation Phases

1. **Phase 1**: Setup (10 tasks) - Project initialization ✅
2. **Phase 2**: Foundation (13 tasks) - Core infrastructure ✅
3. **Phase 3**: Dashboard MVP (14 tasks) - Strategy comparisons ✅ 🎯
4. **Phase 4**: Lab Demos (17 tasks) - Interactive rendering demos 🚧
5. **Phase 5**: URL Analysis (18 tasks) - Lighthouse integration ✅
6. **Phase 6**: AI Insights (16 tasks) - Streaming optimization suggestions ✅
7. **Phase 7**: Platform Features (20 tasks) - Vercel capabilities showcase ✅
8. **Phase 8**: Historical Trends (14 tasks) - Performance tracking over time ✅
9. **Phase 9**: Polish (18 tasks) - Production readiness ✅

**MVP Scope**: Phases 1-3 (37 tasks) deliver a deployable product with core value.
**Current Status**: Phase 5 (URL Analysis) completed with full Lighthouse integration.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

Each phase includes specific test criteria. Example:

- **Phase 3 Test**: Load dashboard at `/`, verify all four rendering strategies display with Core Web Vitals metrics ✅
- **Phase 4 Test**: Navigate to `/lab/ssr`, trigger re-render, verify metrics update and cache status displays
- **Phase 5 Test**: Enter `https://example.com` at `/analyze`, wait for analysis, verify Lighthouse scores and recommendations display ✅

**Test Coverage**: 146 tests passing across 9 test suites

## 📊 Performance Targets

- **FCP**: < 1.8s
- **LCP**: < 2.5s
- **CLS**: < 0.1
- **INP**: < 200ms
- **TTFB**: < 800ms
- **Bundle Size**: < 200KB initial load
- **Lighthouse Scores**: > 90 in all categories

## 🚢 Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-portfolio-analyzer)

Ensure environment variables are configured in Vercel project settings.

## 📝 License

MIT

## 🤝 Contributing

This is a demonstration project. For implementation details, see the [tasks document](specs/001-nextjs-render-analyzer/tasks.md) with 155 tracked tasks.
