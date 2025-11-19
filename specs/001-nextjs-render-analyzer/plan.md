# Implementation Plan: Next.js Rendering Strategy Analyzer

**Feature**: Next.js Rendering Strategy Analyzer  
**Branch**: `001-nextjs-render-analyzer`  
**Created**: November 18, 2025

## Tech Stack

### Frontend Framework
- **Next.js 16**: Latest version with Cache Components support
- **React 19**: For UI components and client-side interactivity
- **TypeScript**: Type safety throughout the application

### Styling & UI
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library for consistent UI patterns
- **Recharts**: Interactive charts for performance visualizations
- **Framer Motion**: Smooth animations and transitions

### Data & State Management
- **React Server Components**: Default for static/server content
- **Vercel KV (Redis)**: Caching and historical data storage
- **Vercel Edge Config**: Feature flags and configuration
- **Zustand** (optional): Client-side state management if needed

### Performance & Monitoring
- **web-vitals**: Browser-side Core Web Vitals measurement
- **Lighthouse CI**: Server-side URL analysis
- **Next.js instrumentation**: Performance monitoring

### AI Integration
- **Vercel AI SDK**: Streaming AI responses
- **OpenAI API**: GPT-4 for optimization insights (or Anthropic Claude)

### Code Display
- **Shiki**: Syntax highlighting for demo source code
- **React Syntax Highlighter**: Alternative for dynamic highlighting

### Deployment Platform
- **Vercel**: Required for Edge Functions, KV, Edge Config, and geographic distribution

## Project Structure

```
ai-portfolio-analyzer/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # Root layout
│   ├── page.tsx                            # Dashboard (landing page)
│   ├── globals.css                         # Global styles
│   │
│   ├── @metrics/                           # Parallel route: Metrics panel
│   │   └── default.tsx
│   │
│   ├── @comparison/                        # Parallel route: Strategy comparison
│   │   └── default.tsx
│   │
│   ├── @insights/                          # Parallel route: AI insights
│   │   └── default.tsx
│   │
│   ├── lab/                                # Interactive demos section
│   │   ├── page.tsx                        # Lab overview
│   │   ├── ssr/page.tsx                    # SSR demo (Server-Side Rendering)
│   │   ├── ssg/page.tsx                    # SSG demo (Static Site Generation)
│   │   ├── isr/page.tsx                    # ISR demo (Incremental Static Regen)
│   │   └── cache/page.tsx                  # Cache Components demo
│   │
│   ├── analyze/                            # URL analysis section
│   │   └── page.tsx                        # URL input and results
│   │
│   ├── platform/                           # Vercel platform features
│   │   ├── page.tsx                        # Platform features overview
│   │   ├── edge-vs-serverless/page.tsx     # Edge Functions comparison
│   │   ├── kv-cache/page.tsx               # KV caching demo
│   │   ├── edge-config/page.tsx            # Edge Config demo
│   │   └── geo-latency/page.tsx            # Geographic latency testing
│   │
│   ├── trends/                             # Historical performance trends
│   │   └── page.tsx                        # Trends visualization
│   │
│   ├── api/                                # API routes
│   │   ├── analyze/route.ts                # URL analysis endpoint
│   │   ├── insights/route.ts               # AI insights streaming endpoint
│   │   ├── metrics/route.ts                # Performance metrics endpoint
│   │   ├── demo/[strategy]/route.ts        # Lab demo data endpoints
│   │   ├── platform/[feature]/route.ts     # Platform feature measurements
│   │   ├── export/route.ts                 # Report export endpoint
│   │   └── historical/route.ts             # Historical data endpoint
│   │
│   └── edge/                               # Edge Functions
│       ├── measure/route.ts                # Edge performance measurement
│       └── config/route.ts                 # Edge Config reader
│
├── components/                             # React components
│   ├── ui/                                 # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── chart.tsx
│   │   └── ...
│   │
│   ├── dashboard/                          # Dashboard-specific components
│   │   ├── strategy-card.tsx               # Individual strategy display
│   │   ├── metrics-panel.tsx               # Core Web Vitals display
│   │   ├── comparison-chart.tsx            # Side-by-side comparison
│   │   └── real-time-indicator.tsx         # Live update indicator
│   │
│   ├── lab/                                # Lab demo components
│   │   ├── demo-container.tsx              # Demo wrapper with controls
│   │   ├── metrics-display.tsx             # Real-time metrics overlay
│   │   ├── cache-status.tsx                # Cache hit/miss indicator
│   │   ├── source-code-viewer.tsx          # Code display with syntax highlight
│   │   └── re-render-controls.tsx          # Trigger buttons
│   │
│   ├── analyze/                            # URL analysis components
│   │   ├── url-input-form.tsx              # URL submission form
│   │   ├── lighthouse-scores.tsx           # Lighthouse results display
│   │   ├── strategy-recommendations.tsx    # Migration suggestions
│   │   └── performance-comparison.tsx      # Before/after metrics
│   │
│   ├── ai/                                 # AI assistant components
│   │   ├── insights-panel.tsx              # AI insights container
│   │   ├── streaming-response.tsx          # Real-time AI response
│   │   ├── chat-interface.tsx              # Follow-up questions
│   │   └── optimization-card.tsx           # Individual suggestion card
│   │
│   ├── platform/                           # Platform features components
│   │   ├── edge-comparison.tsx             # Edge vs Serverless chart
│   │   ├── kv-latency-display.tsx          # KV operation timing
│   │   ├── feature-flag-toggle.tsx         # Edge Config demo
│   │   └── geo-map.tsx                     # Geographic latency map
│   │
│   ├── trends/                             # Historical trends components
│   │   ├── trend-chart.tsx                 # Time-series visualization
│   │   ├── regression-indicator.tsx        # Performance regression alerts
│   │   └── project-selector.tsx            # Multi-project switching
│   │
│   └── export/                             # Export functionality
│       ├── export-button.tsx               # Export trigger
│       ├── format-selector.tsx             # PDF/Markdown/JSON selection
│       └── report-generator.tsx            # Report composition
│
├── lib/                                    # Utility libraries
│   ├── performance/                        # Performance measurement
│   │   ├── web-vitals.ts                   # Core Web Vitals capture
│   │   ├── measure-render.ts               # Render time measurement
│   │   └── cache-analyzer.ts               # Cache behavior detection
│   │
│   ├── lighthouse/                         # Lighthouse integration
│   │   ├── runner.ts                       # Run Lighthouse tests
│   │   ├── parser.ts                       # Parse Lighthouse results
│   │   └── simulator.ts                    # Strategy simulation
│   │
│   ├── ai/                                 # AI integration
│   │   ├── client.ts                       # AI provider client setup
│   │   ├── prompts.ts                      # Prompt templates
│   │   └── streaming.ts                    # Streaming response handler
│   │
│   ├── storage/                            # Data persistence
│   │   ├── kv.ts                           # Vercel KV operations
│   │   ├── historical.ts                   # Historical data management
│   │   └── cache-keys.ts                   # Cache key generation
│   │
│   ├── platform/                           # Platform features
│   │   ├── edge-config.ts                  # Edge Config operations
│   │   ├── geo-test.ts                     # Geographic latency testing
│   │   └── function-timer.ts               # Function execution timing
│   │
│   ├── export/                             # Export functionality
│   │   ├── pdf-generator.ts                # PDF report generation
│   │   ├── markdown-formatter.ts           # Markdown export
│   │   └── json-serializer.ts              # JSON data export
│   │
│   └── utils/                              # General utilities
│       ├── format.ts                       # Data formatting
│       ├── colors.ts                       # Chart color schemes
│       └── validation.ts                   # Input validation
│
├── types/                                  # TypeScript type definitions
│   ├── performance.ts                      # Performance metric types
│   ├── strategy.ts                         # Rendering strategy types
│   ├── lighthouse.ts                       # Lighthouse result types
│   ├── ai.ts                               # AI response types
│   └── export.ts                           # Export format types
│
├── public/                                 # Static assets
│   └── examples/                           # Example data for demos
│
├── .env.local                              # Environment variables (not committed)
├── .env.example                            # Environment variable template
├── next.config.ts                          # Next.js configuration
├── tailwind.config.ts                      # Tailwind configuration
├── tsconfig.json                           # TypeScript configuration
└── package.json                            # Dependencies
```

## Architecture Decisions

### Rendering Strategies Demonstrated

1. **SSR (Server-Side Rendering)**: Each request generates HTML on the server
2. **SSG (Static Site Generation)**: HTML generated at build time
3. **ISR (Incremental Static Regeneration)**: Static pages with periodic rebuilds
4. **Cache Components**: Next.js 16 feature for granular caching

### Parallel Routes Architecture

The dashboard uses Next.js parallel routes (`@metrics`, `@comparison`, `@insights`) to:
- Load sections independently without blocking
- Enable selective refreshing of UI sections
- Improve perceived performance through progressive loading
- Demonstrate Next.js advanced routing capabilities

### Real-Time Updates Strategy

**Client-Side Metrics**: Use Performance Observer API
**Server-Sent Events**: For AI streaming responses
**Polling (fallback)**: For browsers without SSE support
**Optimistic UI**: Show loading states immediately

### Data Flow

1. **Browser → Performance Observer API → Client State** (Core Web Vitals)
2. **URL Submission → API Route → Lighthouse CI → KV Storage → Client** (Analysis)
3. **Performance Data → API Route → AI Provider → Streaming → Client** (Insights)
4. **Demo Interaction → Re-render → Performance Capture → Display** (Lab)

### Caching Strategy

- **KV Cache**: Historical performance data (30-day retention)
- **Edge Config**: Feature flags, region configurations
- **Next.js Cache**: SSG/ISR content caching
- **API Response Cache**: Rate-limited Lighthouse results (1 hour TTL)

### Platform Features Integration

**Edge Functions**: Deploy `/app/edge/*` routes to edge for low-latency demos
**Serverless Functions**: Standard API routes for compute-heavy operations
**KV Storage**: Real-time latency measurements for read/write operations
**Edge Config**: Feature flag toggle demonstrations with propagation timing
**Multi-Region**: Utilize Vercel's global network for geographic latency testing

## Key Design Patterns

### Progressive Enhancement
- Core functionality works without JavaScript
- Enhanced interactivity with client-side hydration
- Graceful degradation for unsupported browsers

### Component Composition
- Server Components by default for better performance
- Client Components only where interactivity is needed
- Clear "use client" boundaries

### Error Boundaries
- Parallel route failures don't crash entire dashboard
- Friendly error messages with retry actions
- Fallback content for failed loads

### Performance First
- Minimize client-side JavaScript bundles
- Use dynamic imports for code splitting
- Optimize images and assets
- Implement loading skeletons

## Environment Variables Required

```env
# AI Provider
OPENAI_API_KEY=sk-...                # Or ANTHROPIC_API_KEY

# Vercel Platform (auto-injected in Vercel deployment)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
EDGE_CONFIG=...

# Optional: Custom Lighthouse server
LIGHTHOUSE_SERVER_URL=...            # If self-hosting

# Feature Flags
ENABLE_AI_INSIGHTS=true
ENABLE_HISTORICAL_TRENDS=true
ENABLE_EXPORT_FEATURES=true
```

## Dependencies (package.json highlights)

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@vercel/kv": "latest",
    "@vercel/edge-config": "latest",
    "ai": "latest",
    "openai": "latest",
    "lighthouse": "latest",
    "web-vitals": "latest",
    "recharts": "latest",
    "shiki": "latest",
    "framer-motion": "latest",
    "tailwindcss": "latest",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "typescript": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest"
  }
}
```

## Implementation Strategy

### Phase 1: Foundation (Setup & Infrastructure)
- Initialize Next.js 16 project
- Setup Tailwind CSS and shadcn/ui
- Configure TypeScript and ESLint
- Setup Vercel KV and Edge Config

### Phase 2: Core Dashboard (P1 - User Story 1)
- Implement parallel routes architecture
- Create strategy comparison cards
- Implement Core Web Vitals measurement
- Build real-time metrics display

### Phase 3: Interactive Lab (P2 - User Story 2)
- Create lab section with demo pages
- Implement re-render controls
- Add cache status indicators
- Build source code viewer

### Phase 4: URL Analysis (P3 - User Story 3)
- Integrate Lighthouse CI
- Build URL input form
- Implement strategy simulation
- Create recommendations engine

### Phase 5: AI Insights (P4 - User Story 4)
- Setup AI provider integration
- Implement streaming responses
- Build chat interface
- Create optimization suggestions

### Phase 6: Platform Features (P5 - User Story 5)
- Implement Edge vs Serverless comparison
- Build KV caching demo
- Create Edge Config demonstration
- Implement geo-latency testing

### Phase 7: Historical Trends (P6 - User Story 6)
- Setup historical data storage
- Build trend visualization
- Implement regression detection
- Add multi-project support

### Phase 8: Export & Polish (P7 - User Story 7)
- Implement PDF generation
- Add Markdown export
- Create JSON serialization
- Final polish and testing

## Testing Strategy

- **Manual Testing**: Each demo verifies itself through interaction
- **Type Safety**: TypeScript catches build-time errors
- **Lighthouse**: Run against own application to validate performance
- **Browser Testing**: Chrome, Firefox, Safari, Edge latest versions
- **Performance Budget**: Dashboard < 3s load time, Core Web Vitals in "Good" range

## MVP Definition

**Minimum Viable Product = User Story 1 (P1)**
- Dashboard with four rendering strategy comparisons
- Core Web Vitals display for each strategy
- Real-time metric updates
- Basic visual indicators

This delivers immediate value: developers can understand rendering strategy differences.

## Success Metrics

- Dashboard loads in < 3 seconds
- Real-time updates within 2 seconds
- All Core Web Vitals in "Good" range
- 80% of users understand strategy differences within 30 seconds
- Application demonstrates Cache Components performance advantages
