# AI Portfolio Analyzer - Copilot Instructions

## Project Overview

Next.js 16 application demonstrating rendering strategies (SSR, SSG, ISR, Cache Components) with Core Web Vitals analysis, AI-powered optimization insights, and Lighthouse-based URL analysis. Built as a portfolio piece showcasing Vercel platform expertise.

## Architecture Fundamentals

### Parallel Routes Pattern
Dashboard uses Next.js parallel routes (`@metrics`, `@comparison`, `@insights`) for independent section loading:
```
app/dashboard/
├── layout.tsx              # Composes parallel route slots
├── page.tsx                # Header and real-time indicator
├── @metrics/page.tsx       # Metrics panels with independent loading
├── @comparison/page.tsx    # Comparison charts
└── @insights/page.tsx      # AI insights panel
```
Each slot has `default.tsx` for route matching fallback. This enables progressive loading and isolated error boundaries.

### Rendering Strategy Segmentation
- **Edge Runtime**: `/api/insights/*` (streaming AI responses), `/app/edge/*` demos
- **Node.js Runtime**: `/api/analyze` (Lighthouse via PageSpeed Insights API), `/api/metrics`
- **Static Generation**: `/app/lab/ssg` with `export const dynamic = 'force-static'`
- **ISR**: `/app/lab/isr` with `export const revalidate = 60`
- **SSR**: `/app/lab/ssr` with `export const dynamic = 'force-dynamic'`

Explicitly set `runtime`, `dynamic`, and `revalidate` exports in route files to control rendering behavior.

### Data Flow & State Management
- **SWR** for client-side data fetching with shared config (`lib/swr-config.ts`):
  - `refreshInterval: 1000` for real-time metrics updates
  - Mock data generator uses sine wave variations for smooth, realistic fluctuations
- **Vercel KV (Redis)**: Cache Lighthouse results (1hr TTL), historical performance data
- **Edge Config**: Feature flags and configuration with latency measurement

## Key File Patterns

### Type System Structure
- `types/performance.ts`: Core Web Vitals types with thresholds and rating helpers
- `types/strategy.ts`: Rendering strategy definitions (SSR, SSG, ISR, CACHE)
- `types/lighthouse.ts`: Lighthouse scores, metrics, and analysis results
- Use strict TypeScript with path aliases: `@/components`, `@/lib`, `@/types`

### API Route Conventions
```typescript
// Edge runtime example (AI streaming)
export const runtime = 'edge';
export async function POST(request: NextRequest) { ... }

// Node.js runtime example (Lighthouse)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

### Component Organization
- `components/ui/`: shadcn/ui base components (button, card, badge)
- `components/dashboard/`: Dashboard-specific components (strategy-card, metrics-panel, comparison-chart)
- `components/ai/`: AI insights components (insights-panel, streaming-response, optimization-card)
- `components/lab/`: Lab demo components (demo-container, metrics-display, cache-status)

### Utility Libraries
- `lib/utils/format.ts`: 20+ formatting functions (formatMs, formatScore, formatLighthouseScore, etc.)
- `lib/utils/colors.ts`: Strategy color constants for consistent visualization
- `lib/storage/kv.ts`: Redis client wrapper with connection helpers
- `lib/lighthouse/runner.ts`: PageSpeed Insights API integration

## Development Workflows

### Testing
```bash
npm test                 # Run all Vitest tests (146 tests, 9 suites)
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report (55%+ thresholds)
npm run e2e              # Playwright E2E tests
```
- Test files: `__tests__/**/*.test.ts` with Vitest + React Testing Library
- Mocks: `__mocks__/` for recharts and SWR
- Setup: `vitest.setup.ts` with Next.js router and matchMedia mocks
- Use `describe`, `it`, `expect` from Vitest; `@testing-library/react` for component tests

### Running Demos
```bash
npm run dev              # Start dev server on :3000
npm run build            # Production build
npm run start            # Production server
```
- Set `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` for font loading
- Optional: Configure `REDIS_URL` for KV caching
- Optional: Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for AI insights

### Lighthouse Analysis
Uses **PageSpeed Insights API** (no local Chrome required):
- Set `PAGESPEED_API_KEY` (optional but recommended for production)
- API errors (403 SERVICE_DISABLED) return user-friendly fallback message
- Results cached in Vercel KV with 1hr TTL

## AI Integration

### Provider Configuration
```bash
# OpenAI (default)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini      # Cost-effective: ~$0.15/$0.60 per 1M tokens

# Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Streaming Implementation
- `lib/ai/client.ts`: Provider config and model selection
- `lib/ai/prompts.ts`: System prompts with expert persona and metric formatting
- `lib/ai/streaming.ts`: Vercel AI SDK utilities with retry logic
- Insights API returns Server-Sent Events for real-time streaming

## Code Conventions

### Styling
- **Tailwind CSS 4** with custom theme and strategy color coding
- Use `cn()` utility from `lib/utils.ts` for className merging
- shadcn/ui components with CVA (class-variance-authority) for variants

### Performance Monitoring
- `instrumentation.ts`: Split for Node.js and Edge runtimes
- `components/web-vitals-reporter.tsx`: Client-side Web Vitals tracking
- Mock metrics use time-based sine waves (not random) for realistic, observable trends

### Error Handling
- `components/error-boundary.tsx`: Global error boundary in root layout
- Each parallel route has its own `error.tsx` for isolated failure handling
- API routes return structured error responses with `code`, `message`, `details`

### Historical Data
- `lib/storage/historical.ts`: Save/retrieve performance snapshots
- Store 50 data points max per project with circular buffer
- Support multi-project tracking via project IDs

## Project Structure Insights

### Documentation
- `specs/001-nextjs-render-analyzer/`: Full spec, plan, and 155 tracked tasks
- `docs/parallel-routes-refactor.md`: Detailed parallel routes architecture decisions
- `docs/AI_INSIGHTS.md`: AI integration guide with provider setup and cost analysis
- `README.md`: Phase-based implementation roadmap (Phases 1-9, MVP complete)

### Phase Status (as of Phase 9)
- ✅ Phase 1-9: Setup through Production readiness complete
- Dashboard with parallel routes, lab demos, URL analysis, AI insights, platform features, trends tracking all implemented
- 146 passing tests across all features

## Common Tasks

**Add new rendering strategy demo**: Create `app/lab/[strategy]/page.tsx` with appropriate route config exports, add to lab overview navigation

**Add new metric**: Update `types/performance.ts` with threshold, add to mock generator in `app/api/metrics/route.ts`, update display components

**Integrate new AI provider**: Add config in `lib/ai/client.ts`, update env validation, test streaming in `/api/insights`

**Add platform demo**: Create route in `app/platform/[demo]/page.tsx`, follow Edge vs Node runtime patterns from existing demos

**Update historical trends**: Modify `lib/storage/historical.ts` for new data structure, update `app/api/historical/route.ts` endpoint

## Anti-Patterns to Avoid

❌ Don't use random values for metrics - use time-based sine waves for smooth, realistic variations
❌ Don't mix Edge and Node.js runtimes without explicit `runtime` export
❌ Don't forget `default.tsx` files when adding parallel routes
❌ Don't skip runtime/dynamic exports in lab demos - they control the rendering strategy being demonstrated
❌ Don't create temporary files for Python execution - use workspace environment tools directly
