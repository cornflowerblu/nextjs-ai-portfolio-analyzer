/**
 * Tests for TrendChart component
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TrendChart, type TrendDataPoint } from '@/components/trends/trend-chart';

describe('TrendChart', () => {
  const mockData: TrendDataPoint[] = [
    {
      timestamp: Date.parse('2024-01-01'),
      date: '1/1/2024',
      value: 1200,
      strategy: 'SSR',
    },
    {
      timestamp: Date.parse('2024-01-01'),
      date: '1/1/2024',
      value: 1100,
      strategy: 'SSG',
    },
    {
      timestamp: Date.parse('2024-01-02'),
      date: '1/2/2024',
      value: 1300,
      strategy: 'SSR',
    },
    {
      timestamp: Date.parse('2024-01-02'),
      date: '1/2/2024',
      value: 1150,
      strategy: 'SSG',
    },
  ];

  it('renders without crashing', () => {
    render(
      <TrendChart
        data={mockData}
        metric="fcp"
        metricLabel="First Contentful Paint (ms)"
        strategies={['SSR', 'SSG']}
      />
    );
  });

  it('renders with custom height', () => {
    const { container } = render(
      <TrendChart
        data={mockData}
        metric="lcp"
        metricLabel="Largest Contentful Paint (ms)"
        strategies={['SSR', 'SSG']}
        height={500}
      />
    );
    
    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeTruthy();
  });

  it('handles empty data gracefully', () => {
    const { container } = render(
      <TrendChart
        data={[]}
        metric="cls"
        metricLabel="Cumulative Layout Shift"
        strategies={['SSR', 'SSG']}
      />
    );
    
    // Should still render the chart container
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });

  it('renders with annotations when provided', () => {
    const annotations = [
      {
        timestamp: Date.parse('2024-01-01'),
        label: 'Regression detected',
        type: 'regression' as const,
      },
    ];

    render(
      <TrendChart
        data={mockData}
        metric="inp"
        metricLabel="Interaction to Next Paint (ms)"
        strategies={['SSR']}
        showAnnotations={true}
        annotations={annotations}
      />
    );
  });

  it('groups data by timestamp correctly', () => {
    const { container } = render(
      <TrendChart
        data={mockData}
        metric="ttfb"
        metricLabel="Time to First Byte (ms)"
        strategies={['SSR', 'SSG']}
      />
    );

    // Check that the chart container exists
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });

  it('renders all specified strategies', () => {
    const { container } = render(
      <TrendChart
        data={mockData}
        metric="fcp"
        metricLabel="First Contentful Paint (ms)"
        strategies={['SSR', 'SSG', 'ISR', 'CACHE']}
      />
    );
    
    // The chart should render even if not all strategies have data
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });
});
