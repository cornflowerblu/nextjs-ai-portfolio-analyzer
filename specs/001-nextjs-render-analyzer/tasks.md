# Tasks: Next.js Rendering Strategy Analyzer

**Input**: Design documents from `/specs/001-nextjs-render-analyzer/`
**Prerequisites**: plan.md ✓, spec.md ✓

**Organization**: Tasks are grouped by user story (P1-P7) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US7)
- File paths follow structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure required before any user story work

- [x] T001 Initialize Next.js 16 project with TypeScript in root directory
- [x] T002 Install core dependencies: React 19, Tailwind CSS, shadcn/ui, Recharts, Framer Motion per plan.md
- [x] T003 [P] Configure Tailwind CSS in tailwind.config.ts with custom theme for strategy visualization
- [x] T004 [P] Setup shadcn/ui component library with init command and configure components.json
- [x] T005 [P] Configure TypeScript strict mode in tsconfig.json with path aliases for @/components, @/lib, @/types
- [x] T006 [P] Setup ESLint and Prettier with Next.js recommended config in eslint.config.mjs
- [x] T007 Create base TypeScript types in types/performance.ts for Core Web Vitals (FCP, LCP, CLS, INP, TTFB)
- [x] T008 [P] Create types in types/strategy.ts for rendering strategies (SSR, SSG, ISR, Cache Components)
- [x] T009 [P] Setup environment variables template in .env.example with AI provider, KV, Edge Config keys
- [x] T010 Create global styles in app/globals.css with CSS variables for strategy color coding

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Setup Vercel KV client in lib/storage/kv.ts with connection helper functions
- [x] T012 [P] Create cache key generation utilities in lib/storage/cache-keys.ts for metrics, analysis results
- [x] T013 [P] Implement historical data management in lib/storage/historical.ts with save and retrieve functions
- [x] T014 [P] Create Performance Observer API wrapper in lib/performance/web-vitals.ts for Core Web Vitals capture
- [x] T015 [P] Implement render time measurement utility in lib/performance/measure-render.ts
- [x] T016 [P] Build cache behavior analyzer in lib/performance/cache-analyzer.ts to detect hits/misses
- [x] T017 Create base shadcn/ui components: button, card, badge in components/ui/
- [x] T018 [P] Create chart component wrapper in components/ui/chart.tsx using Recharts with responsive config
- [x] T019 [P] Implement data formatting utilities in lib/utils/format.ts for metrics display (ms, score formatting)
- [x] T020 [P] Create color scheme constants in lib/utils/colors.ts for consistent strategy visualization
- [x] T021 Setup root layout in app/layout.tsx with fonts, metadata, and global providers
- [x] T022 [P] Implement error boundary component in components/error-boundary.tsx for graceful failure handling
- [x] T023 [P] Create loading skeleton components in components/ui/skeleton.tsx for async content

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Rendering Strategy Comparisons (Priority: P1) 🎯 MVP

**Goal**: Dashboard displaying side-by-side comparisons of SSR, SSG, ISR, and Cache Components with Core Web Vitals

**Independent Test**: Load dashboard at `/` and verify all four rendering strategies display with their respective Core Web Vitals metrics

### Implementation for User Story 1

- [x] T024 [P] [US1] Create parallel route slot @metrics in app/@metrics/default.tsx for metrics panel
- [x] T025 [P] [US1] Create parallel route slot @comparison in app/@comparison/default.tsx for comparison view
- [x] T026 [P] [US1] Create parallel route slot @insights in app/@insights/default.tsx for AI insights (placeholder)
- [x] T027 [US1] Implement main dashboard page in app/dashboard/page.tsx with parallel routes layout and sections (Note: Intentionally changed from app/page.tsx to app/dashboard/page.tsx to separate landing page from dashboard, allowing for better UX and navigation structure)
- [x] T028 [P] [US1] Create StrategyCard component in components/dashboard/strategy-card.tsx displaying strategy name, description, icon
- [x] T029 [P] [US1] Create MetricsPanel component in components/dashboard/metrics-panel.tsx displaying all 5 Core Web Vitals
- [x] T030 [US1] Build ComparisonChart component in components/dashboard/comparison-chart.tsx with side-by-side bar charts using Recharts
- [x] T031 [P] [US1] Create RealTimeIndicator component in components/dashboard/real-time-indicator.tsx showing live update status
- [x] T032 [US1] Implement metrics API route in app/api/metrics/route.ts to provide mock/sample performance data for each strategy
- [x] T033 [US1] Add client-side metrics fetching in dashboard with SWR or React Query for real-time updates
- [x] T034 [US1] Style dashboard layout with Tailwind CSS grid for responsive 4-column strategy comparison
- [x] T035 [P] [US1] Add visual indicators (colors, badges) to MetricsPanel to highlight best/worst performing strategies
- [x] T036 [US1] Implement real-time update mechanism using polling (1-second interval) to refresh metrics without page reload
- [x] T037 [US1] Test dashboard loads in under 3 seconds and displays all strategy cards with metrics

**Checkpoint**: MVP complete - users can understand rendering strategy differences through dashboard comparison

---

## Phase 4: User Story 2 - Interact with Live Rendering Demos (Priority: P2)

**Goal**: Lab section with interactive demos of each rendering strategy showing metrics, cache status, and source code

**Independent Test**: Navigate to `/lab/ssr`, trigger re-render, verify metrics update and cache status displays

### Implementation for User Story 2

- [X] T038 [P] [US2] Create lab overview page in app/lab/page.tsx with navigation to all four demos
- [X] T038.1 [US2] Add navigation functionality to dashboard StrategyCard components to link to corresponding lab demo pages (e.g., clicking SSR card navigates to /lab/ssr)
- [X] T039 [P] [US2] Implement SSR demo page in app/lab/ssr/page.tsx with server-side rendering configuration
- [X] T040 [P] [US2] Implement SSG demo page in app/lab/ssg/page.tsx with static generation using generateStaticParams
- [X] T041 [P] [US2] Implement ISR demo page in app/lab/isr/page.tsx with revalidation configuration
- [X] T042 [P] [US2] Implement Cache Components demo in app/lab/cache/page.tsx showcasing Next.js 16 cache directive
- [X] T043 [P] [US2] Create DemoContainer component in components/lab/demo-container.tsx with controls and metrics overlay
- [X] T044 [P] [US2] Build MetricsDisplay component in components/lab/metrics-display.tsx showing real-time render metrics
- [X] T045 [P] [US2] Create CacheStatus component in components/lab/cache-status.tsx with hit/miss indicator and visual feedback
- [X] T046 [P] [US2] Build SourceCodeViewer component in components/lab/source-code-viewer.tsx using Shiki for syntax highlighting
- [X] T047 [P] [US2] Create ReRenderControls component in components/lab/re-render-controls.tsx with buttons to trigger refreshes
- [X] T048 [US2] Implement demo data API route in app/api/demo/[strategy]/route.ts to capture render metrics per strategy
- [X] T049 [US2] Add timestamp tracking to each demo to show when last rendered and cache age
- [X] T050 [US2] Integrate web-vitals library in lab pages to capture actual FCP, LCP, CLS, INP, TTFB on re-render
- [X] T051 [US2] Implement re-render logic with cache busting using query parameters or router refresh
- [X] T052 [US2] Display source code for each demo's page.tsx implementation in SourceCodeViewer
- [X] T053 [US2] Style lab section with side-by-side layout: demo content on left, metrics/code on right
- [X] T054 [US2] Test all four demos can be triggered to re-render and show updated metrics within 1 second

**Checkpoint**: Lab functional - users can interact with live demos and observe rendering strategy behavior

---

## Phase 5: User Story 3 - Analyze Custom Website URLs (Priority: P3)

**Goal**: URL analyzer that runs Lighthouse tests and provides rendering strategy recommendations

**Independent Test**: Enter "https://example.com", wait for analysis, verify Lighthouse scores and recommendations display

### Implementation for User Story 3

- [ ] T055 [P] [US3] Create analyze page in app/analyze/page.tsx with URL input form and results display
- [ ] T056 [P] [US3] Build UrlInputForm component in components/analyze/url-input-form.tsx with validation using Zod
- [ ] T057 [P] [US3] Create LighthouseScores component in components/analyze/lighthouse-scores.tsx displaying 4 Lighthouse metrics
- [ ] T058 [P] [US3] Build StrategyRecommendations component in components/analyze/strategy-recommendations.tsx with migration suggestions
- [ ] T059 [P] [US3] Create PerformanceComparison component in components/analyze/performance-comparison.tsx showing before/after metrics
- [ ] T060 [P] [US3] Setup Lighthouse integration in lib/lighthouse/runner.ts to execute tests programmatically
- [ ] T061 [P] [US3] Implement Lighthouse result parser in lib/lighthouse/parser.ts to extract key metrics and scores
- [ ] T062 [P] [US3] Build strategy simulator in lib/lighthouse/simulator.ts to estimate performance with different strategies
- [ ] T063 [P] [US3] Create Lighthouse types in types/lighthouse.ts for scores, metrics, and recommendations
- [ ] T064 [US3] Implement analyze API route in app/api/analyze/route.ts to run Lighthouse and return results
- [ ] T065 [US3] Add URL validation in analyze API to check for valid HTTP(S) URLs and reject invalid protocols
- [ ] T066 [US3] Implement Lighthouse result caching in KV with 1-hour TTL to avoid redundant tests
- [ ] T067 [US3] Handle timeout errors in analyze API with 60-second limit and clear error messages
- [ ] T068 [US3] Build recommendation engine that compares current Lighthouse score with simulated strategy scores
- [ ] T069 [US3] Display expected performance gains (e.g., "LCP: 3.2s → 1.1s with SSG") in PerformanceComparison
- [ ] T070 [US3] Add loading states with progress indicator while Lighthouse test is running
- [ ] T071 [US3] Implement error handling for unreachable URLs with user-friendly messages
- [ ] T072 [US3] Test complete URL analysis flow completes in under 60 seconds for typical websites

**Checkpoint**: URL analysis functional - users can analyze existing websites and get strategy recommendations

---

## Phase 6: User Story 4 - Get AI-Powered Optimization Insights (Priority: P4)

**Goal**: AI assistant that analyzes performance data and streams actionable optimization insights

**Independent Test**: Trigger AI insights with performance metrics, verify streaming response with specific recommendations

### Implementation for User Story 4

- [ ] T073 [P] [US4] Setup AI provider client in lib/ai/client.ts using Vercel AI SDK with OpenAI or Anthropic
- [ ] T074 [P] [US4] Create prompt templates in lib/ai/prompts.ts for performance analysis and optimization suggestions
- [ ] T075 [P] [US4] Implement streaming handler in lib/ai/streaming.ts to process AI responses incrementally
- [ ] T076 [P] [US4] Create AI response types in types/ai.ts for insights, suggestions, and chat messages
- [ ] T077 [P] [US4] Build InsightsPanel component in components/ai/insights-panel.tsx as container for AI content
- [ ] T078 [P] [US4] Create StreamingResponse component in components/ai/streaming-response.tsx showing real-time AI text
- [ ] T079 [P] [US4] Build ChatInterface component in components/ai/chat-interface.tsx for follow-up questions
- [ ] T080 [P] [US4] Create OptimizationCard component in components/ai/optimization-card.tsx for individual suggestions
- [ ] T081 [US4] Implement insights API route in app/api/insights/route.ts with streaming SSE response
- [ ] T082 [US4] Pass performance metrics as context to AI prompt including Core Web Vitals and strategy comparisons
- [ ] T083 [US4] Format AI responses to include specific metric references and concrete action items
- [ ] T084 [US4] Implement follow-up question handling with context preservation from previous messages
- [ ] T085 [US4] Add retry mechanism for AI streaming interruptions with exponential backoff
- [ ] T086 [US4] Update dashboard @insights parallel route to use InsightsPanel with real AI integration
- [ ] T087 [US4] Style AI insights with distinct visual treatment and streaming indicator animation
- [ ] T088 [US4] Test AI insights begin streaming within 3 seconds and provide actionable recommendations

**Checkpoint**: AI assistant functional - users receive streaming optimization insights based on performance data

---

## Phase 7: User Story 5 - Explore Vercel Platform Features (Priority: P5)

**Goal**: Showcase Edge Functions, KV caching, Edge Config, and geographic latency with live measurements

**Independent Test**: Navigate to platform features, trigger demos, verify real measurements display (not mocked)

### Implementation for User Story 5

- [ ] T089 [P] [US5] Create platform overview page in app/platform/page.tsx with navigation to all feature demos
- [ ] T090 [P] [US5] Implement Edge vs Serverless comparison page in app/platform/edge-vs-serverless/page.tsx
- [ ] T091 [P] [US5] Create KV caching demo page in app/platform/kv-cache/page.tsx with latency measurements
- [ ] T092 [P] [US5] Build Edge Config demo page in app/platform/edge-config/page.tsx with feature flag toggles
- [ ] T093 [P] [US5] Create geographic latency page in app/platform/geo-latency/page.tsx with multi-region testing
- [ ] T094 [P] [US5] Build EdgeComparison component in components/platform/edge-comparison.tsx with execution time chart
- [ ] T095 [P] [US5] Create KvLatencyDisplay component in components/platform/kv-latency-display.tsx showing read/write timing
- [ ] T096 [P] [US5] Build FeatureFlagToggle component in components/platform/feature-flag-toggle.tsx with real-time config updates
- [ ] T097 [P] [US5] Create GeoMap component in components/platform/geo-map.tsx visualizing response times by region
- [ ] T098 [P] [US5] Implement Edge Function in app/edge/measure/route.ts with performance.now() timing
- [ ] T099 [P] [US5] Create standard serverless function in app/api/platform/serverless/route.ts for comparison
- [ ] T100 [US5] Implement KV operations with timing in lib/storage/kv.ts measuring actual read/write latency
- [ ] T101 [P] [US5] Setup Edge Config integration in lib/platform/edge-config.ts with read and update operations
- [ ] T102 [P] [US5] Build geographic latency tester in lib/platform/geo-test.ts pinging multiple Vercel regions
- [ ] T103 [P] [US5] Create function timer utility in lib/platform/function-timer.ts for accurate execution measurement
- [ ] T104 [US5] Implement platform features API in app/api/platform/[feature]/route.ts handling all demos
- [ ] T105 [US5] Display cold start times for both Edge and Serverless functions in comparison
- [ ] T106 [US5] Show cache hit rates and operation latencies in KV demo with real millisecond measurements
- [ ] T107 [US5] Demonstrate Edge Config propagation time by measuring flag update visibility
- [ ] T108 [US5] Test all platform demos display real measurements, not simulated values

**Checkpoint**: Platform features showcased - users understand Vercel capabilities with measurable benefits

---

## Phase 8: User Story 6 - View Historical Performance Trends (Priority: P6)

**Goal**: Historical data storage and trend visualization showing Core Web Vitals evolution over time

**Independent Test**: View trends section with historical data, verify charts show metrics over time with timestamps

### Implementation for User Story 6

- [ ] T109 [P] [US6] Create trends page in app/trends/page.tsx with time-series charts for all strategies
- [ ] T110 [P] [US6] Build TrendChart component in components/trends/trend-chart.tsx using Recharts LineChart
- [ ] T111 [P] [US6] Create RegressionIndicator component in components/trends/regression-indicator.tsx highlighting performance drops
- [ ] T112 [P] [US6] Build ProjectSelector component in components/trends/project-selector.tsx for multi-project switching
- [ ] T113 [US6] Enhance historical data manager in lib/storage/historical.ts to query by date range
- [ ] T114 [US6] Implement historical data API in app/api/historical/route.ts returning time-series performance data
- [ ] T115 [US6] Store performance snapshots on every metrics capture with timestamp and strategy metadata
- [ ] T116 [US6] Build aggregation logic to group historical data by day/week/month for trend views
- [ ] T117 [US6] Implement regression detection algorithm comparing recent vs historical averages
- [ ] T118 [US6] Add hover tooltips to trend charts showing exact metric values and timestamps
- [ ] T119 [US6] Create date range selector for trends view (7 days, 30 days, 90 days options)
- [ ] T120 [US6] Add annotations to charts for significant performance changes with automatic detection
- [ ] T121 [US6] Implement multi-project tracking with project ID in KV keys
- [ ] T122 [US6] Test trends display correctly for data spanning multiple weeks with clear temporal progression

**Checkpoint**: Historical trends functional - users can track performance changes over time

---

## Phase 9: User Story 7 - Export Performance Reports and Guides (Priority: P7)

**Goal**: Export functionality for reports (PDF), implementation guides (Markdown), and optimization checklists (JSON)

**Independent Test**: Click export buttons, verify generated files contain complete data, charts, and recommendations

### Implementation for User Story 7

- [ ] T123 [P] [US7] Create ExportButton component in components/export/export-button.tsx with format selection
- [ ] T124 [P] [US7] Build FormatSelector component in components/export/format-selector.tsx for PDF/Markdown/JSON choice
- [ ] T125 [P] [US7] Create ReportGenerator component in components/export/report-generator.tsx composing export content
- [ ] T126 [P] [US7] Implement PDF generator in lib/export/pdf-generator.ts using library like jsPDF or Puppeteer
- [ ] T127 [P] [US7] Create Markdown formatter in lib/export/markdown-formatter.ts converting data to Markdown syntax
- [ ] T128 [P] [US7] Build JSON serializer in lib/export/json-serializer.ts with complete data structure
- [ ] T129 [P] [US7] Create export types in types/export.ts defining format options and content structure
- [ ] T130 [US7] Implement export API route in app/api/export/route.ts generating files on demand
- [ ] T131 [US7] Add chart image export functionality for including visualizations in PDF/Markdown reports
- [ ] T132 [US7] Generate implementation guides with step-by-step instructions and code examples per recommended strategy
- [ ] T133 [US7] Create optimization checklists with prioritized action items based on AI insights and analysis
- [ ] T134 [US7] Include all performance metrics, comparisons, and AI recommendations in comprehensive reports
- [ ] T135 [US7] Add export buttons to dashboard, analyze page, and trends section
- [ ] T136 [US7] Implement file download trigger with appropriate filename and content-type headers
- [ ] T137 [US7] Test all three export formats generate complete, valid files with all expected content

**Checkpoint**: Export functionality complete - users can share findings and implementation guides with teams

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, performance optimization, and production readiness

- [ ] T138 [P] Implement responsive design for mobile and tablet viewports across all pages
- [ ] T139 [P] Add loading skeletons to all async content sections for better perceived performance
- [ ] T140 [P] Optimize image assets and ensure proper next/image usage throughout
- [ ] T141 [P] Implement dynamic imports for heavy components (charts, code viewers) to reduce bundle size
- [ ] T142 [P] Add comprehensive error handling with user-friendly messages for all API failures
- [ ] T143 [P] Create 404 and error pages with helpful navigation back to main sections
- [ ] T144 [P] Implement analytics tracking for user interactions (demo triggers, exports, AI queries)
- [ ] T145 [P] Add accessibility improvements: ARIA labels, keyboard navigation, focus management
- [ ] T146 [P] Setup performance monitoring with Next.js instrumentation and Web Vitals reporting
- [ ] T147 [P] Create README.md with setup instructions, environment variables, and deployment guide
- [ ] T148 [P] Add inline documentation and JSDoc comments to key utilities and components
- [ ] T149 Optimize bundle size and verify total JavaScript < 200KB initial load
- [ ] T150 Run Lighthouse against deployed application and achieve scores > 90 in all categories
- [ ] T151 Test application across Chrome, Firefox, Safari, Edge latest versions
- [ ] T152 Verify all Core Web Vitals in "Good" range: FCP < 1.8s, LCP < 2.5s, CLS < 0.1, INP < 200ms, TTFB < 800ms
- [ ] T153 Test graceful degradation when parallel routes fail to load
- [ ] T154 Verify 50 concurrent URL analyses don't cause performance degradation beyond 20%
- [ ] T155 Final review: ensure all 7 user stories are fully functional and independently testable

---

## Dependencies Between User Stories

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation) ← MUST complete before any user story
    ↓
    ├─→ Phase 3 (US1 - Dashboard) ← MVP, can start immediately
    │       ↓
    ├─→ Phase 4 (US2 - Lab Demos) ← Depends on US1 metrics display patterns
    │       ↓
    ├─→ Phase 5 (US3 - URL Analysis) ← Independent from US1/US2
    │       ↓
    ├─→ Phase 6 (US4 - AI Insights) ← Depends on US1 (metrics) and US3 (analysis data)
    │       ↓
    ├─→ Phase 7 (US5 - Platform) ← Independent from other stories
    │       ↓
    ├─→ Phase 8 (US6 - Trends) ← Depends on US1 (metrics storage)
    │       ↓
    └─→ Phase 9 (US7 - Export) ← Depends on all previous stories for complete data
            ↓
        Phase 10 (Polish)
```

## Parallel Execution Opportunities

**Phase 1 Setup**: Tasks T003-T010 can run in parallel (different config files)

**Phase 2 Foundation**:

- T012, T013, T014, T015, T016 (different lib/ files)
- T017, T018, T019, T020, T022, T023 (different components)

**Phase 3 (US1)**:

- T024, T025, T026 (parallel route slots)
- T028, T029, T031, T035 (different components)

**Phase 4 (US2)**:

- T039, T040, T041, T042 (different demo pages)
- T043, T044, T045, T046, T047 (different components)

**Phase 5 (US3)**:

- T056-T063 (all components and lib files)

**Phase 6 (US4)**:

- T073-T080 (all AI-related files)

**Phase 7 (US5)**:

- T090-T102 (all platform pages, components, and utilities)

**Phase 8 (US6)**:

- T110, T111, T112 (different trend components)

**Phase 9 (US7)**:

- T123-T129 (all export-related components and utilities)

**Phase 10 Polish**:

- T138-T148 (most polish tasks are independent)

## Implementation Strategy

### MVP First (Minimum Viable Product)

**Phase 3 (US1) = MVP**: Dashboard with rendering strategy comparisons and Core Web Vitals

- Delivers immediate value
- Validates core concept
- Foundation for other features

### Incremental Delivery

1. **Week 1**: Setup + Foundation + US1 (MVP) → Deployable product
2. **Week 2**: US2 (Lab) + US3 (Analysis) → Interactive learning
3. **Week 3**: US4 (AI) + US5 (Platform) → Advanced features
4. **Week 4**: US6 (Trends) + US7 (Export) + Polish → Complete product

### Testing Approach

Each phase includes its "Independent Test" criteria - complete that test before moving to next phase to ensure quality.

---

**Total Tasks**: 155

- Setup: 10 tasks
- Foundation: 13 tasks
- US1 (P1): 14 tasks - MVP
- US2 (P2): 17 tasks
- US3 (P3): 18 tasks
- US4 (P4): 16 tasks
- US5 (P5): 20 tasks
- US6 (P6): 14 tasks
- US7 (P7): 15 tasks
- Polish: 18 tasks

**Parallelizable Tasks**: 89 tasks marked with [P] (57% can run in parallel within their phase)

**MVP Scope**: Phase 1 (10) + Phase 2 (13) + Phase 3 (14) = 37 tasks to deliver core value
