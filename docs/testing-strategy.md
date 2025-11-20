# Testing Strategy & Implementation Plan

## Executive Summary

This document outlines the comprehensive testing strategy for the Next.js Rendering Strategy Analyzer project. Currently, the project has **no testing infrastructure** and only runs Lighthouse CI on builds. This plan establishes a robust testing foundation with unit tests, integration tests, and CI/CD integration to ensure code quality and prevent regressions.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Testing Infrastructure Setup](#testing-infrastructure-setup)
3. [Test Coverage Plan](#test-coverage-plan)
4. [CI/CD Integration](#cicd-integration)
5. [Coverage Goals](#coverage-goals)
6. [Sample Test Examples](#sample-test-examples)
7. [Implementation Timeline](#implementation-timeline)

---

## Current State Analysis

### Existing Testing Infrastructure: NONE

**What We Have:**
- ❌ No test scripts in package.json
- ❌ No testing dependencies installed
- ❌ No test configuration files
- ❌ No test files (no `__tests__` folders or `.test`/`.spec` files)
- ✅ TypeScript strict mode enabled
- ✅ Lighthouse CI workflow (`.github/workflows/lighthouse-ci.yml`)

**Current CI/CD Pipeline:**
- Single workflow: Lighthouse CI
- Runs on all pushes and pull requests
- Performs: checkout → install → build → Lighthouse audit
- Missing: linting step, testing step

**Current Dependencies:**
```json
{
  "dependencies": {
    "next": "16.0.3",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "swr": "^2.3.6",
    "recharts": "^3.4.1",
    "lucide-react": "^0.554.0",
    // ... other UI and utility libraries
  },
  "devDependencies": {
    "typescript": "^5",
    "eslint": "^9",
    "eslint-config-next": "16.0.3",
    "@types/react": "^19",
    "@types/react-dom": "^19"
  }
}
```

### Project Structure Requiring Tests

```
ai-portfolio-analyzer/
├── app/
│   ├── api/metrics/route.ts          (API endpoint - needs testing)
│   ├── dashboard/page.tsx            (Client component - needs testing)
│   ├── layout.tsx                    (Server component - integration tests)
│   └── page.tsx                      (Home page)
├── components/
│   ├── dashboard/
│   │   ├── comparison-chart.tsx      (Client component - needs testing)
│   │   ├── metrics-panel.tsx         (Client component - needs testing)
│   │   ├── real-time-indicator.tsx   (Client component - needs testing)
│   │   └── strategy-card.tsx         (Client component - needs testing)
│   └── ui/                           (shadcn/ui components)
├── lib/
│   ├── utils/
│   │   ├── format.ts                 (25+ pure functions - HIGH PRIORITY)
│   │   └── colors.ts                 (Pure functions - needs testing)
│   ├── storage/
│   │   └── kv.ts                     (Redis client - needs mocking)
│   └── performance/
│       └── web-vitals.ts             (Performance utilities)
└── types/
    ├── performance.ts                (getRating function - needs testing)
    └── strategy.ts                   (Type definitions)
```

---

## Testing Infrastructure Setup

### Phase 1.1: Install Testing Dependencies

**Core Testing Libraries:**
```bash
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitest/coverage-v8
npm install -D msw
```

**Why Vitest over Jest?**

| Feature | Vitest | Jest |
|---------|--------|------|
| ESM Support | ✅ Native | ⚠️ Experimental |
| Next.js 16 Compatibility | ✅ Excellent | ⚠️ Requires config |
| TypeScript Support | ✅ Out of the box | ⚠️ Requires ts-jest |
| Speed | ✅ Faster (Vite) | ❌ Slower |
| API Compatibility | ✅ Jest-compatible | ✅ Native |
| Watch Mode | ✅ HMR-like | ✅ Standard |

**Verdict:** Vitest is the better choice for Next.js 16 + TypeScript + ESM

### Phase 1.2: Create Configuration Files

**`vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        'coverage/',
        '**/*.config.*',
        '**/*.d.ts',
        '__mocks__/',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/types': path.resolve(__dirname, './types'),
      '@/app': path.resolve(__dirname, './app'),
    },
  },
});
```

**`vitest.setup.ts`:**
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.matchMedia (for dark mode tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

**Update `package.json`:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Phase 1.3: Create Test Directory Structure

```
ai-portfolio-analyzer/
├── __tests__/
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── format.test.ts
│   │   │   └── colors.test.ts
│   │   ├── storage/
│   │   │   └── kv.test.ts
│   │   └── performance/
│   │       └── web-vitals.test.ts
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── metrics-panel.test.tsx
│   │   │   ├── comparison-chart.test.tsx
│   │   │   ├── strategy-card.test.tsx
│   │   │   └── real-time-indicator.test.tsx
│   │   └── ui/
│   │       └── badge.test.tsx
│   ├── app/
│   │   └── api/
│   │       └── metrics/
│   │           └── route.test.ts
│   └── types/
│       └── performance.test.ts
├── __mocks__/
│   ├── swr.ts
│   ├── recharts.tsx
│   └── redis.ts
└── vitest.config.ts
```

---

## Test Coverage Plan

### Priority 1: Utility Functions (Highest ROI)

**File:** `lib/utils/format.ts`

**Why Priority 1?**
- ✅ Pure functions (no side effects)
- ✅ Easy to test (input → output)
- ✅ Used throughout the application
- ✅ High impact on correctness
- ✅ 25+ functions to test

**Functions to Test:**
- `formatMs(ms: number)` - Format milliseconds to readable string
- `formatMetricValue(key, value)` - Format Core Web Vitals values
- `formatRelativeTime(timestamp)` - Format relative time ("2 minutes ago")
- `formatPercentage(value)` - Format percentage values
- `formatBytes(bytes)` - Format byte sizes
- `formatDuration(ms)` - Format duration strings

**Test Coverage Goal:** 90%+

**Estimated Test Cases:** 50+

---

### Priority 2: Type Utilities & Business Logic

**File:** `types/performance.ts`

**Function to Test:** `getRating(value, thresholds)`

**Test Cases:**
```typescript
describe('getRating', () => {
  it('returns "good" for values below good threshold', () => {
    expect(getRating(1500, CORE_WEB_VITALS_THRESHOLDS.fcp)).toBe('good');
  });

  it('returns "needs-improvement" for values between thresholds', () => {
    expect(getRating(2000, CORE_WEB_VITALS_THRESHOLDS.fcp)).toBe('needs-improvement');
  });

  it('returns "poor" for values above needs-improvement threshold', () => {
    expect(getRating(3500, CORE_WEB_VITALS_THRESHOLDS.fcp)).toBe('poor');
  });

  it('handles edge cases at exact threshold values', () => {
    expect(getRating(1800, CORE_WEB_VITALS_THRESHOLDS.fcp)).toBe('good');
    expect(getRating(3000, CORE_WEB_VITALS_THRESHOLDS.fcp)).toBe('needs-improvement');
  });
});
```

**Test Coverage Goal:** 100%

---

### Priority 3: API Routes

**File:** `app/api/metrics/route.ts`

**Why Priority 3?**
- ✅ Critical functionality (serves data to dashboard)
- ✅ Public API endpoint
- ✅ Needs validation testing
- ✅ Error handling coverage

**Test Cases:**
```typescript
describe('GET /api/metrics', () => {
  it('returns metrics for all 4 strategies when no query param', async () => {
    const request = new Request('http://localhost:3000/api/metrics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(4);
    expect(data.map(d => d.strategy)).toEqual(['SSR', 'SSG', 'ISR', 'CACHE']);
  });

  it('returns metrics for specific strategy with query param', async () => {
    const request = new Request('http://localhost:3000/api/metrics?strategy=SSR');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.strategy).toBe('SSR');
    expect(data.metrics).toHaveProperty('fcp');
    expect(data.metrics).toHaveProperty('lcp');
    expect(data.metrics).toHaveProperty('cls');
    expect(data.metrics).toHaveProperty('inp');
    expect(data.metrics).toHaveProperty('ttfb');
  });

  it('validates metric structure', async () => {
    const request = new Request('http://localhost:3000/api/metrics?strategy=SSG');
    const response = await GET(request);
    const data = await response.json();

    expect(data.metrics.fcp).toMatchObject({
      value: expect.any(Number),
      rating: expect.stringMatching(/^(good|needs-improvement|poor)$/),
      delta: expect.any(Number),
    });
  });

  it('returns 400 for invalid strategy', async () => {
    const request = new Request('http://localhost:3000/api/metrics?strategy=INVALID');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
```

**Test Coverage Goal:** 80%+

---

### Priority 4: Dashboard Components

**Files:**
- `components/dashboard/metrics-panel.tsx`
- `components/dashboard/comparison-chart.tsx`
- `components/dashboard/strategy-card.tsx`
- `components/dashboard/real-time-indicator.tsx`

**Why Priority 4?**
- ✅ User-facing components
- ✅ Complex UI logic
- ✅ Need to test rendering, interactions, state

**Test Coverage Goal:** 60%+

#### Example: MetricsPanel Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsPanel } from '@/components/dashboard/metrics-panel';
import { CoreWebVitals } from '@/types/performance';

const mockMetrics: CoreWebVitals = {
  fcp: { value: 1200, rating: 'good', delta: 0 },
  lcp: { value: 1800, rating: 'good', delta: 0 },
  cls: { value: 0.05, rating: 'good', delta: 0 },
  inp: { value: 150, rating: 'good', delta: 0 },
  ttfb: { value: 600, rating: 'good', delta: 0 },
  timestamp: '2025-11-19T00:00:00.000Z',
};

describe('MetricsPanel', () => {
  it('renders strategy name in title', () => {
    render(<MetricsPanel metrics={mockMetrics} strategyName="SSR" />);
    expect(screen.getByText(/SSR Performance/i)).toBeInTheDocument();
  });

  it('renders all 5 Core Web Vitals', () => {
    render(<MetricsPanel metrics={mockMetrics} strategyName="SSR" />);

    expect(screen.getByText('First Contentful Paint')).toBeInTheDocument();
    expect(screen.getByText('Largest Contentful Paint')).toBeInTheDocument();
    expect(screen.getByText('Cumulative Layout Shift')).toBeInTheDocument();
    expect(screen.getByText('Interaction to Next Paint')).toBeInTheDocument();
    expect(screen.getByText('Time to First Byte')).toBeInTheDocument();
  });

  it('displays formatted metric values', () => {
    render(<MetricsPanel metrics={mockMetrics} strategyName="SSR" />);

    expect(screen.getByText('1200ms')).toBeInTheDocument();
    expect(screen.getByText('1800ms')).toBeInTheDocument();
    expect(screen.getByText('0.050')).toBeInTheDocument();
  });

  it('shows rating badges with correct colors', () => {
    render(<MetricsPanel metrics={mockMetrics} strategyName="SSR" />);

    const badges = screen.getAllByText('good');
    expect(badges).toHaveLength(5);
  });

  it('handles poor ratings correctly', () => {
    const poorMetrics: CoreWebVitals = {
      ...mockMetrics,
      fcp: { value: 4000, rating: 'poor', delta: 0 },
    };

    render(<MetricsPanel metrics={poorMetrics} strategyName="SSR" />);

    expect(screen.getByText('4000ms')).toBeInTheDocument();
    expect(screen.getByText('poor')).toBeInTheDocument();
  });
});
```

#### Example: StrategyCard Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrategyCard } from '@/components/dashboard/strategy-card';
import { RENDERING_STRATEGIES } from '@/types/strategy';

describe('StrategyCard', () => {
  const mockStrategy = RENDERING_STRATEGIES.SSR;
  const mockOnClick = vi.fn();

  it('renders strategy information', () => {
    render(
      <StrategyCard
        strategy={mockStrategy}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('SSR')).toBeInTheDocument();
    expect(screen.getByText('Server-Side Rendering')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    render(
      <StrategyCard
        strategy={mockStrategy}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies active styles when isActive is true', () => {
    const { container } = render(
      <StrategyCard
        strategy={mockStrategy}
        isActive={true}
        onClick={mockOnClick}
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('ring-2');
  });
});
```

---

### Priority 5: Storage & Infrastructure

**File:** `lib/storage/kv.ts`

**Why Priority 5?**
- ⚠️ Requires Redis mocking
- ⚠️ Integration testing complexity
- ✅ Critical for production

**Mocking Strategy:**
```typescript
// __mocks__/redis.ts
import { vi } from 'vitest';

export const createClient = vi.fn(() => ({
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
  isOpen: true,
  isReady: true,
}));
```

**Test Coverage Goal:** 50%+

---

## CI/CD Integration

### Current Workflow Analysis

**Existing:** `.github/workflows/lighthouse-ci.yml`

**Problems:**
- ❌ No linting step
- ❌ No testing step
- ❌ Sequential execution (slow)
- ❌ Rebuilds for each job

**Solution:** New comprehensive CI workflow

### New Workflow: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, phase-*]
  pull_request:
    branches: [main, phase-*]

jobs:
  # Job 1: Linting (runs in parallel with test)
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

  # Job 2: Unit & Integration Tests (runs in parallel with lint)
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage reports to Codecov
        uses: codecov/codecov-action@v3
        if: always()
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false

  # Job 3: Build (depends on lint + test passing)
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js app
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: next-build
          path: |
            .next/
            public/
          retention-days: 1

  # Job 4: Lighthouse CI (depends on build, reuses artifacts)
  lighthouse:
    name: Lighthouse Audit
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: next-build
          path: .next/

      - name: Install dependencies
        run: npm ci

      - name: Install Lighthouse CI
        run: npm install -g @lhci/cli@0.14.x

      - name: Run Lighthouse CI
        run: lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          LHCI_GITHUB_REF: ${{ github.ref }}
```

**Benefits:**
- ✅ Parallel execution (lint + test run simultaneously)
- ✅ Build only runs if lint + test pass
- ✅ Lighthouse reuses build artifacts (faster)
- ✅ Coverage reports uploaded to Codecov
- ✅ Runs on all branches matching pattern

---

## Coverage Goals

### Initial Target: 70% Overall Coverage

| Category | Target | Priority |
|----------|--------|----------|
| Utilities (`lib/utils/*.ts`) | 90%+ | High |
| Types (`types/*.ts`) | 100% | High |
| API Routes (`app/api/**/*.ts`) | 80%+ | High |
| Components (`components/**/*.tsx`) | 60%+ | Medium |
| Storage (`lib/storage/*.ts`) | 50%+ | Low |

### Production Target: 80% Overall Coverage

**Rationale:**
- 70% is achievable in Phase 1
- 80% requires additional integration tests
- 90%+ requires E2E tests (future phase)

### Coverage Enforcement

**CI Failure Conditions:**
- Coverage drops below 70%
- Any test fails
- Build fails
- Linting errors

**PR Requirements:**
- All CI checks must pass
- Coverage report comment added
- No decrease in overall coverage

---

## Sample Test Examples

### Example 1: Utility Function Tests

**File:** `__tests__/lib/utils/format.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  formatMs,
  formatMetricValue,
  formatRelativeTime,
  formatPercentage,
  formatBytes,
} from '@/lib/utils/format';
import { CORE_WEB_VITALS_THRESHOLDS } from '@/types/performance';

describe('formatMs', () => {
  it('formats milliseconds below 1000ms', () => {
    expect(formatMs(0)).toBe('0ms');
    expect(formatMs(500)).toBe('500ms');
    expect(formatMs(999)).toBe('999ms');
  });

  it('formats milliseconds as seconds above 1000ms', () => {
    expect(formatMs(1000)).toBe('1.00s');
    expect(formatMs(1500)).toBe('1.50s');
    expect(formatMs(2345)).toBe('2.35s');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatMs(1234)).toBe('1.23s');
    expect(formatMs(1236)).toBe('1.24s');
  });
});

describe('formatMetricValue', () => {
  it('formats FCP with ms suffix', () => {
    expect(formatMetricValue('fcp', 1200)).toBe('1200ms');
    expect(formatMetricValue('fcp', 500)).toBe('500ms');
  });

  it('formats LCP with ms suffix', () => {
    expect(formatMetricValue('lcp', 2500)).toBe('2500ms');
  });

  it('formats CLS with 3 decimal places', () => {
    expect(formatMetricValue('cls', 0.1)).toBe('0.100');
    expect(formatMetricValue('cls', 0.12345)).toBe('0.123');
  });

  it('formats INP with ms suffix', () => {
    expect(formatMetricValue('inp', 200)).toBe('200ms');
  });

  it('formats TTFB with ms suffix', () => {
    expect(formatMetricValue('ttfb', 800)).toBe('800ms');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for times less than 60 seconds ago', () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now');
  });

  it('formats minutes correctly', () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    expect(formatRelativeTime(twoMinutesAgo)).toBe('2 minutes ago');
  });

  it('handles singular minute', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('formats hours correctly', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
  });

  it('accepts Date, string, and number formats', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
    expect(formatRelativeTime(oneMinuteAgo.toISOString())).toBe('1 minute ago');
    expect(formatRelativeTime(oneMinuteAgo.getTime())).toBe('1 minute ago');
  });
});

describe('formatPercentage', () => {
  it('formats decimal as percentage with 1 decimal place', () => {
    expect(formatPercentage(0.5)).toBe('50.0%');
    expect(formatPercentage(0.12345)).toBe('12.3%');
    expect(formatPercentage(1)).toBe('100.0%');
  });

  it('handles edge cases', () => {
    expect(formatPercentage(0)).toBe('0.0%');
    expect(formatPercentage(0.999)).toBe('99.9%');
  });
});

describe('formatBytes', () => {
  it('formats bytes below 1KB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1536)).toBe('1.50 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.50 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
  });
});
```

### Example 2: API Route Tests

**File:** `__tests__/app/api/metrics/route.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/metrics/route';

describe('GET /api/metrics', () => {
  it('returns metrics for all 4 strategies by default', async () => {
    const request = new Request('http://localhost:3000/api/metrics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(data).toHaveLength(4);
    expect(data.map((d: any) => d.strategy)).toEqual(['SSR', 'SSG', 'ISR', 'CACHE']);
  });

  it('returns metrics for a specific strategy with query param', async () => {
    const request = new Request('http://localhost:3000/api/metrics?strategy=SSR');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.strategy).toBe('SSR');
    expect(data).toHaveProperty('metrics');
    expect(data).toHaveProperty('timestamp');
  });

  it('validates Core Web Vitals structure', async () => {
    const request = new Request('http://localhost:3000/api/metrics?strategy=SSG');
    const response = await GET(request);
    const data = await response.json();

    // Check FCP structure
    expect(data.metrics.fcp).toMatchObject({
      value: expect.any(Number),
      rating: expect.stringMatching(/^(good|needs-improvement|poor)$/),
      delta: expect.any(Number),
    });

    // Check all metrics exist
    expect(data.metrics).toHaveProperty('fcp');
    expect(data.metrics).toHaveProperty('lcp');
    expect(data.metrics).toHaveProperty('cls');
    expect(data.metrics).toHaveProperty('inp');
    expect(data.metrics).toHaveProperty('ttfb');
    expect(data.metrics).toHaveProperty('timestamp');
  });

  it('ensures metric values are within realistic ranges', async () => {
    const request = new Request('http://localhost:3000/api/metrics?strategy=ISR');
    const response = await GET(request);
    const data = await response.json();

    // FCP: 0-5000ms
    expect(data.metrics.fcp.value).toBeGreaterThanOrEqual(0);
    expect(data.metrics.fcp.value).toBeLessThanOrEqual(5000);

    // CLS: 0-1 (score)
    expect(data.metrics.cls.value).toBeGreaterThanOrEqual(0);
    expect(data.metrics.cls.value).toBeLessThanOrEqual(1);
  });

  it('generates different metrics for different strategies', async () => {
    const ssrRequest = new Request('http://localhost:3000/api/metrics?strategy=SSR');
    const ssgRequest = new Request('http://localhost:3000/api/metrics?strategy=SSG');

    const ssrResponse = await GET(ssrRequest);
    const ssgResponse = await GET(ssgRequest);

    const ssrData = await ssrResponse.json();
    const ssgData = await ssgResponse.json();

    // Metrics should differ (with very high probability)
    expect(ssrData.metrics.fcp.value).not.toBe(ssgData.metrics.fcp.value);
  });
});
```

### Example 3: Component Tests with User Interactions

**File:** `__tests__/components/dashboard/strategy-card.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrategyCard } from '@/components/dashboard/strategy-card';
import { RENDERING_STRATEGIES } from '@/types/strategy';

describe('StrategyCard', () => {
  const mockStrategy = RENDERING_STRATEGIES.SSR;
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders strategy name and display name', () => {
    render(
      <StrategyCard
        strategy={mockStrategy}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('SSR')).toBeInTheDocument();
    expect(screen.getByText('Server-Side Rendering')).toBeInTheDocument();
  });

  it('renders strategy description', () => {
    render(
      <StrategyCard
        strategy={mockStrategy}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText(mockStrategy.description)).toBeInTheDocument();
  });

  it('calls onClick handler when card is clicked', async () => {
    const user = userEvent.setup();

    render(
      <StrategyCard
        strategy={mockStrategy}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies active styling when isActive is true', () => {
    const { container } = render(
      <StrategyCard
        strategy={mockStrategy}
        isActive={true}
        onClick={mockOnClick}
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('ring-2');
  });

  it('does not apply active styling when isActive is false', () => {
    const { container } = render(
      <StrategyCard
        strategy={mockStrategy}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    const card = container.firstChild;
    expect(card).not.toHaveClass('ring-2');
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();

    render(
      <StrategyCard
        strategy={mockStrategy}
        isActive={false}
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole('button');
    card.focus();

    await user.keyboard('{Enter}');
    expect(mockOnClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' '); // Space key
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });
});
```

---

## Implementation Timeline

### Week 1: Foundation
- ✅ Day 1-2: Install dependencies, create configs
- ✅ Day 3-4: Write utility function tests (90%+ coverage)
- ✅ Day 5: Write type utility tests (100% coverage)

### Week 2: Core Functionality
- ✅ Day 1-2: Write API route tests (80%+ coverage)
- ✅ Day 3-5: Write component tests (60%+ coverage)

### Week 3: Integration & CI
- ✅ Day 1: Create test mocks
- ✅ Day 2-3: Create GitHub Actions CI workflow
- ✅ Day 4: Test CI workflow on feature branch
- ✅ Day 5: Merge to main, monitor CI

### Week 4: Optimization
- ✅ Day 1-2: Increase coverage to 80%
- ✅ Day 3: Add Codecov integration
- ✅ Day 4-5: Documentation and team training

---

## Success Metrics

### Quantitative
- ✅ 70%+ code coverage achieved
- ✅ All tests passing in CI
- ✅ CI pipeline runs under 10 minutes
- ✅ Zero false positives in test failures

### Qualitative
- ✅ Developers confident adding new tests
- ✅ Tests catch real bugs before production
- ✅ Faster development with test-driven approach
- ✅ Improved code quality and maintainability

---

## Next Steps

1. ✅ Review and approve this testing strategy
2. ✅ Install testing dependencies
3. ✅ Create configuration files
4. ✅ Start with utility function tests
5. ✅ Expand to API routes and components
6. ✅ Integrate with CI/CD pipeline
7. ✅ Monitor and iterate

---

## Resources

**Documentation:**
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/testing)

**Tools:**
- Vitest: Fast test runner with Vite integration
- React Testing Library: Test React components
- MSW: Mock Service Worker for API mocking
- Codecov: Coverage reporting

**Best Practices:**
- Test behavior, not implementation
- Write tests before fixing bugs
- Keep tests simple and readable
- Mock external dependencies
- Use descriptive test names

---

*Last Updated: 2025-11-19*
*Status: Ready for Implementation*
