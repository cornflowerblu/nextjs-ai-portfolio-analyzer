# AI Portfolio Analyzer Constitution

## Core Principles

### I. Performance-First Architecture

Every component must demonstrate measurable performance improvements. All features require benchmarking before and after implementation. Core Web Vitals (FCP, LCP, CLS, INP, TTFB) must be tracked for every rendering strategy. No feature ships without performance metrics dashboard integration.

### II. Explicit Rendering Strategies

All rendering approaches must be explicitly declared using Next.js 16 Cache Components and 'use cache' directives. Each route must document its rendering strategy (SSR, SSG, ISR, or Cache Components). Performance trade-offs must be visible and measurable. No implicit caching or hidden optimizations.

### III. Test-First Development (NON-NEGOTIABLE)

TDD mandatory: Write performance tests → Define acceptance criteria → Tests fail → Implement → Tests pass. Every rendering strategy requires automated Lighthouse tests. E2E tests must validate Core Web Vitals. Unit tests required for all metric calculations and AI integrations.

### IV. AI-Driven Insights

AI analysis must provide streaming, actionable recommendations based on real metrics. Support multiple models (OpenAI GPT-4, Anthropic Claude) with graceful fallback. Context-aware suggestions must reference specific performance data. All AI responses must include confidence scores and source attribution.

### V. Platform Feature Maximization

Leverage all Vercel platform capabilities: KV for caching, Postgres for metrics, Blob for reports, Edge Config for feature flags. Demonstrate Edge vs Serverless performance differences. Implement geographic latency testing. Show real cost/performance trade-offs.

### VI. Developer Experience Excellence

Code must be self-documenting with comprehensive TypeScript types and JSDoc comments. Hot-reload must include real-time performance metrics. Clear separation of concerns between rendering, metrics, and AI logic. Interactive documentation with live code examples.

### VII. Progressive Enhancement

Start with static content, enhance with dynamic features based on measured needs. Use React Suspense boundaries for progressive loading. Implement graceful degradation for AI features. Cache Components for instant navigation without full page reloads.

## Technical Constraints

### Architecture Requirements

- **Framework**: Next.js 16 with Cache Components enabled
- **Runtime**: Edge runtime for performance-critical paths, Node.js for complex operations
- **Database**: Vercel Postgres for metrics storage, Vercel KV for caching
- **Styling**: Tailwind CSS with Shadcn/ui components
- **State Management**: React Server Components with Server Actions
- **Monitoring**: Vercel Analytics and Speed Insights integrated

### Performance Standards

- Lighthouse score > 95 for all rendering strategies
- Time to Interactive < 2 seconds
- AI streaming response < 500ms to first byte
- Cache hit ratio > 80% for repeated analyses
- Bundle size increase < 10KB per feature
- Build time < 60 seconds

### Security Requirements

- Input validation for all URL testing
- Rate limiting on API endpoints (100 req/min per IP)
- No PII collection or storage
- Secure API key management via environment variables
- CORS properly configured for API routes
- XSS and injection attack prevention

## Development Workflow

### Code Quality Gates

- TypeScript strict mode with no any types
- ESLint with Next.js recommended rules
- Prettier for consistent formatting
- Pre-commit hooks for linting and type checking
- Minimum 80% test coverage for business logic
- Performance budget enforcement via CI

### Commit Strategy

- Atomic commits per rendering strategy feature
- Conventional commit messages: `feat(rendering): implement SSR with metrics`
- Performance metrics included in PR descriptions
- No direct commits to main branch
- Squash and merge for clean history

### Review Process

- All PRs require performance impact analysis
- Lighthouse CI must pass before merge
- AI-generated code must be reviewed for accuracy
- Documentation updates required for new features
- Demo link required for UI changes

## Governance

Constitution supersedes all implementation decisions. Performance regressions require immediate rollback or remediation. All architectural decisions must reference constitutional articles. Complexity must be justified by measurable performance gains > 20%. Breaking changes require migration guide and 2-week deprecation notice.

**Version**: 1.0.0 | **Ratified**: 2024-11-18 | **Last Amended**: N/A
