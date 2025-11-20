# Dashboard Parallel Routes Refactor Plan

**Created**: 2025-11-19
**Status**: Planning
**Goal**: Refactor dashboard to use Next.js parallel routes for independent section loading and better showcase of platform expertise

## Executive Summary

Refactor `/dashboard` from a single-page implementation to use Next.js parallel routes (`@metrics`, `@comparison`, `@insights`). This demonstrates advanced Next.js routing capabilities, prepares for AI insights streaming in Phase 6, and showcases architectural planning for a portfolio piece targeting Vercel platform expertise.

## Current State Analysis

### Existing Architecture
```
app/dashboard/
└── page.tsx                 # Single client component with all sections
```

**Current Implementation**:
- Single `page.tsx` with all dashboard sections
- One SWR data fetch for all metrics
- Shared loading/error states
- Components: StrategyCard, MetricsPanel, ComparisonChart, RealTimeIndicator

**Data Flow**:
```typescript
useSWR('/api/metrics') → {
  StrategyCards,
  MetricsPanels,
  ComparisonCharts
}
```

### Why Current Approach Works
- Simple and maintainable
- Appropriate for single data source
- Fast development velocity
- Low cognitive overhead

### Why We Should Refactor Anyway
1. **Portfolio showcase**: Demonstrates advanced Next.js knowledge
2. **Future-proofing**: Prepares for AI streaming in Phase 6
3. **Progressive loading**: Better UX when sections have different load times
4. **Resilience**: Independent error boundaries per section
5. **Scalability**: Easy to add more sections or data sources

## Target Architecture

### File Structure
```
app/dashboard/
├── layout.tsx              # NEW: Composes parallel route slots
├── page.tsx                # MODIFIED: Header and real-time indicator only
├── @metrics/
│   ├── page.tsx           # NEW: Metrics panels section
│   ├── loading.tsx        # NEW: CardSkeleton grid
│   ├── error.tsx          # NEW: Error boundary for metrics
│   └── default.tsx        # NEW: Fallback for non-matching routes
├── @comparison/
│   ├── page.tsx           # NEW: Comparison charts section
│   ├── loading.tsx        # NEW: ChartSkeleton grid
│   ├── error.tsx          # NEW: Error boundary for comparison
│   └── default.tsx        # NEW: Fallback
└── @insights/
    ├── page.tsx           # NEW: Placeholder (AI insights in Phase 6)
    ├── loading.tsx        # NEW: Skeleton
    ├── error.tsx          # NEW: Error boundary
    └── default.tsx        # NEW: Fallback
```

### Layout Composition
```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,    // Main page.tsx content (header, real-time indicator)
  metrics,     // @metrics slot
  comparison,  // @comparison slot
  insights,    // @insights slot
}: {
  children: React.ReactNode;
  metrics: React.ReactNode;
  comparison: React.ReactNode;
  insights: React.ReactNode;
}) {
  return (
    <div className="min-h-screen p-8 space-y-8">
      {children}
      <Suspense fallback={<MetricsSkeleton />}>
        {metrics}
      </Suspense>
      <Suspense fallback={<ComparisonSkeleton />}>
        {comparison}
      </Suspense>
      <Suspense fallback={<InsightsSkeleton />}>
        {insights}
      </Suspense>
    </div>
  );
}
```

### Data Flow Changes
```typescript
// Each slot fetches independently
@metrics/page.tsx       → useSWR('/api/metrics')
@comparison/page.tsx    → useSWR('/api/metrics') (same endpoint for now)
@insights/page.tsx      → Placeholder (will use SSE streaming later)
```

## Implementation Steps

### Phase 1: Create Directory Structure (5 min)
- [ ] Create `app/dashboard/@metrics/` directory
- [ ] Create `app/dashboard/@comparison/` directory
- [ ] Create `app/dashboard/@insights/` directory

### Phase 2: Extract Metrics Section (10 min)
- [ ] Create `app/dashboard/@metrics/page.tsx`
  - Move metrics panel grid from main page
  - Add SWR data fetching hook
  - Export as default component
- [ ] Create `app/dashboard/@metrics/loading.tsx`
  - Render CardSkeleton grid (4 columns)
- [ ] Create `app/dashboard/@metrics/error.tsx`
  - Error boundary with retry button
- [ ] Create `app/dashboard/@metrics/default.tsx`
  - Return null (required for parallel routes)

### Phase 3: Extract Comparison Section (10 min)
- [ ] Create `app/dashboard/@comparison/page.tsx`
  - Move comparison charts grid from main page
  - Add SWR data fetching hook
  - Export as default component
- [ ] Create `app/dashboard/@comparison/loading.tsx`
  - Render ChartSkeleton grid (2 columns, 4 charts)
- [ ] Create `app/dashboard/@comparison/error.tsx`
  - Error boundary with retry button
- [ ] Create `app/dashboard/@comparison/default.tsx`
  - Return null

### Phase 4: Create Insights Placeholder (5 min)
- [ ] Create `app/dashboard/@insights/page.tsx`
  - Placeholder card with "AI Insights coming in Phase 6"
  - Future: Will use Server-Sent Events for streaming
- [ ] Create `app/dashboard/@insights/loading.tsx`
  - Simple skeleton
- [ ] Create `app/dashboard/@insights/error.tsx`
  - Error boundary
- [ ] Create `app/dashboard/@insights/default.tsx`
  - Return null

### Phase 5: Create Dashboard Layout (10 min)
- [ ] Create `app/dashboard/layout.tsx`
  - Accept children, metrics, comparison, insights props
  - Wrap each slot in Suspense with appropriate fallback
  - Compose sections with proper spacing
  - Add TypeScript types for slot props

### Phase 6: Refactor Main Page (5 min)
- [ ] Modify `app/dashboard/page.tsx`
  - Keep only: header, RealTimeIndicator, StrategyCards grid
  - Remove: MetricsPanels, ComparisonCharts (now in slots)
  - Keep SWR hook for lastUpdate timestamp
  - Remove old section wrappers

### Phase 7: Update Components (if needed) (5 min)
- [ ] Review MetricsPanel component - ensure it's reusable
- [ ] Review ComparisonChart component - ensure it's reusable
- [ ] Update imports in new slot files

### Phase 8: Testing & Validation (10 min)
- [ ] Test dashboard loads with all sections
- [ ] Test individual section loading states
- [ ] Test error boundaries (simulate API failure)
- [ ] Test fallback routes work
- [ ] Verify no console errors
- [ ] Test real-time updates still work (1-second polling)
- [ ] Verify responsive layout on mobile/tablet

## Code Templates

### Template: Slot Page with Data Fetching
```typescript
// app/dashboard/@metrics/page.tsx
'use client';

import useSWR from 'swr';
import { MetricsPanel } from '@/components/dashboard/metrics-panel';
import { RENDERING_STRATEGIES } from '@/types/strategy';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MetricsSlot() {
  const { data, error } = useSWR('/api/metrics', fetcher, {
    refreshInterval: 1000,
  });

  if (error) throw error; // Caught by error.tsx
  if (!data) return null; // Show loading.tsx

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Core Web Vitals</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((strategyData) => (
          <MetricsPanel
            key={strategyData.strategy}
            metrics={strategyData.metrics}
            strategyName={RENDERING_STRATEGIES[strategyData.strategy].displayName}
          />
        ))}
      </div>
    </section>
  );
}
```

### Template: Loading State
```typescript
// app/dashboard/@metrics/loading.tsx
import { CardSkeleton } from '@/components/ui/skeleton';

export default function MetricsLoading() {
  return (
    <section>
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
```

### Template: Error Boundary
```typescript
// app/dashboard/@metrics/error.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MetricsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Core Web Vitals</h2>
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="text-red-600">Failed to Load Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={reset} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
```

### Template: Default (Fallback)
```typescript
// app/dashboard/@metrics/default.tsx
export default function MetricsDefault() {
  return null;
}
```

## Benefits of This Refactor

### 1. Portfolio Showcase
- **Advanced Next.js Feature**: Parallel routes are not commonly used
- **Architectural Thinking**: Shows planning and scalability
- **Platform Expertise**: Demonstrates deep Next.js knowledge
- **Interview Talking Point**: Can explain routing strategy decisions

### 2. Technical Benefits
- **Independent Loading**: Each section can load at its own pace
- **Progressive Rendering**: Metrics can display while charts compute
- **Error Isolation**: One section failing doesn't break entire dashboard
- **Better UX**: Users see content progressively, not all-or-nothing

### 3. Future-Proofing
- **AI Streaming Ready**: `@insights` slot prepared for SSE in Phase 6
- **Multiple Data Sources**: Easy to add different endpoints per section
- **Conditional Rendering**: Can show/hide sections based on features flags
- **A/B Testing**: Can swap slot implementations without touching layout

### 4. Performance
- **Code Splitting**: Each slot is a separate chunk
- **Suspense Optimization**: React can prioritize rendering
- **Concurrent Features**: Better React 18/19 compatibility

## Potential Challenges & Solutions

### Challenge 1: Duplicate SWR Calls
**Problem**: Each slot calls `/api/metrics` independently
**Solution**: SWR deduplicates requests automatically; all three slots share cache

### Challenge 2: Loading State Flickering
**Problem**: Fast loads might cause layout shift
**Solution**: Use `suspense: true` in SWR config for better Suspense integration

### Challenge 3: Shared State (Strategy Selection)
**Problem**: StrategyCard selection state needs to work across slots
**Solution**:
- Option A: Lift state to layout (use React Context)
- Option B: Use URL search params (`?strategy=SSR`)
- **Recommendation**: URL params for shareable state

### Challenge 4: Real-Time Updates
**Problem**: Ensure 1-second polling works across all slots
**Solution**: SWR's `refreshInterval` works per hook; all slots update together

## Testing Strategy

### Manual Testing Checklist
- [ ] Dashboard loads successfully
- [ ] All four strategy cards display
- [ ] All four metrics panels display with correct values
- [ ] All four comparison charts render correctly
- [ ] Real-time indicator shows "Live" status
- [ ] Metrics update every second (verify timestamp changes)
- [ ] Strategy card selection works (if implemented)
- [ ] Loading skeletons appear during initial load
- [ ] Error boundaries work (test by breaking API)
- [ ] Retry button in error state re-fetches data
- [ ] Mobile responsive layout works
- [ ] No console errors or warnings

### Automated Testing (Future)
```typescript
// __tests__/dashboard/parallel-routes.test.tsx
describe('Dashboard Parallel Routes', () => {
  it('renders all three slots independently', () => {});
  it('shows loading states while fetching', () => {});
  it('handles errors in individual slots', () => {});
  it('shares SWR cache between slots', () => {});
});
```

## Migration Path

### Development Flow
1. Create new slot directories alongside existing `page.tsx`
2. Build and test slots incrementally
3. Create layout to compose slots
4. Verify functionality matches current implementation
5. Remove old code from `page.tsx`
6. Test thoroughly
7. Commit with detailed message

### Rollback Plan
If issues arise:
- Keep original `page.tsx` in git history
- Can revert layout and slots in single commit
- No data structure changes, so API stays compatible

## Success Criteria

### Must Have
- ✅ Dashboard displays all sections correctly
- ✅ Real-time updates continue working
- ✅ No visual regressions from current implementation
- ✅ Loading states work for each section
- ✅ Error boundaries catch and display errors

### Nice to Have
- ✅ Improved perceived performance (progressive loading)
- ✅ Cleaner code organization
- ✅ Better separation of concerns
- ✅ Easier to add AI insights in Phase 6

### Demo Points for Portfolio
- ✅ Can explain parallel routes architecture in interviews
- ✅ Shows advanced Next.js routing knowledge
- ✅ Demonstrates forward-thinking design
- ✅ Proves understanding of React Suspense
- ✅ Showcases error boundary implementation

## Timeline Estimate

- **Planning**: 15 minutes (this document) ✅
- **Implementation**: 60 minutes
  - Directory setup: 5 min
  - Metrics slot: 10 min
  - Comparison slot: 10 min
  - Insights slot: 5 min
  - Layout creation: 10 min
  - Page refactor: 5 min
  - Component updates: 5 min
  - Testing: 10 min
- **Documentation**: 10 minutes (update tasks.md, add comments)
- **Total**: ~1.5 hours

## Next Steps

1. Review and approve this plan
2. Create git branch: `feat/dashboard-parallel-routes`
3. Implement Phase 1-8 sequentially
4. Test thoroughly against success criteria
5. Update `specs/001-nextjs-render-analyzer/tasks.md` (mark T024-T026 complete)
6. Create comprehensive commit message
7. Merge to `phase-3-mvp` branch

## References

- [Next.js Parallel Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [React Suspense Documentation](https://react.dev/reference/react/Suspense)
- [SWR with Suspense](https://swr.vercel.app/docs/suspense)
- Original project spec: `/specs/001-nextjs-render-analyzer/plan.md` (lines 204-210)

---

**Prepared by**: AI Assistant
**Review Status**: Pending approval
**Implementation Status**: Not started
