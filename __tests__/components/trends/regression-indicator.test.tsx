/**
 * Tests for RegressionIndicator component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RegressionIndicator, type Regression } from '@/components/trends/regression-indicator';

describe('RegressionIndicator', () => {
  const mockRegressions: Regression[] = [
    {
      metric: 'lcp',
      current: 2500,
      baseline: 2000,
      change: 0.25,
      strategy: 'SSR',
    },
    {
      metric: 'fcp',
      current: 1500,
      baseline: 1200,
      change: 0.25,
      strategy: 'SSG',
    },
  ];

  it('renders without crashing', () => {
    render(<RegressionIndicator regressions={mockRegressions} />);
  });

  it('displays regressions with correct formatting', () => {
    render(<RegressionIndicator regressions={mockRegressions} />);
    
    // Check that the component renders
    expect(screen.getAllByText(/\+25\.0%/).length).toBeGreaterThan(0);
  });

  it('shows no regressions message when empty', () => {
    render(<RegressionIndicator regressions={[]} />);
    
    const message = screen.getByText(/No Performance Regressions/i);
    expect(message).toBeTruthy();
  });

  it('displays regression details correctly', () => {
    render(<RegressionIndicator regressions={mockRegressions} />);
    
    // Check that percentage change is displayed (there should be 2 instances)
    const badges = screen.getAllByText(/\+25\.0%/);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('groups regressions by strategy', () => {
    const multiStrategyRegressions: Regression[] = [
      ...mockRegressions,
      {
        metric: 'cls',
        current: 0.15,
        baseline: 0.10,
        change: 0.50,
        strategy: 'SSR',
      },
    ];

    render(<RegressionIndicator regressions={multiStrategyRegressions} />);
    
    // Should display SSR and SSG strategy labels
    expect(screen.getByText('SSR')).toBeTruthy();
    expect(screen.getByText('SSG')).toBeTruthy();
  });

  it('displays severity badges correctly', () => {
    const severeRegressions: Regression[] = [
      {
        metric: 'lcp',
        current: 3000,
        baseline: 2000,
        change: 0.50, // 50% regression
        strategy: 'CACHE',
      },
    ];

    render(<RegressionIndicator regressions={severeRegressions} />);
    
    expect(screen.getByText(/\+50\.0%/)).toBeTruthy();
  });

  it('formats metric labels correctly', () => {
    render(<RegressionIndicator regressions={mockRegressions} />);
    
    // Should display human-readable metric names
    expect(screen.getByText(/Largest Contentful Paint/i)).toBeTruthy();
    expect(screen.getByText(/First Contentful Paint/i)).toBeTruthy();
  });

  it('handles large numbers of regressions', () => {
    const manyRegressions: Regression[] = Array.from({ length: 10 }, (_, i) => ({
      metric: 'fcp',
      current: 1500 + i * 100,
      baseline: 1200,
      change: 0.25 + i * 0.05,
      strategy: ['SSR', 'SSG', 'ISR', 'CACHE'][i % 4] as 'SSR' | 'SSG' | 'ISR' | 'CACHE',
    }));

    render(<RegressionIndicator regressions={manyRegressions} />);
    
    // Should render without errors
    expect(screen.getByText(/Performance Regressions/i)).toBeTruthy();
  });
});
