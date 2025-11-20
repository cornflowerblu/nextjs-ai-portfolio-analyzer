import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsPanel } from '@/components/dashboard/metrics-panel';
import { CoreWebVitals } from '@/types/performance';

const mockGoodMetrics: CoreWebVitals = {
  fcp: { value: 1200, rating: 'good', delta: 0 },
  lcp: { value: 1800, rating: 'good', delta: 0 },
  cls: { value: 0.05, rating: 'good', delta: 0 },
  inp: { value: 150, rating: 'good', delta: 0 },
  ttfb: { value: 600, rating: 'good', delta: 0 },
  timestamp: '2025-11-19T00:00:00.000Z',
};

const mockPoorMetrics: CoreWebVitals = {
  fcp: { value: 4000, rating: 'poor', delta: 0 },
  lcp: { value: 5000, rating: 'poor', delta: 0 },
  cls: { value: 0.3, rating: 'poor', delta: 0 },
  inp: { value: 700, rating: 'poor', delta: 0 },
  ttfb: { value: 2500, rating: 'poor', delta: 0 },
  timestamp: '2025-11-19T00:00:00.000Z',
};

const mockMixedMetrics: CoreWebVitals = {
  fcp: { value: 2000, rating: 'needs-improvement', delta: 0 },
  lcp: { value: 1800, rating: 'good', delta: 0 },
  cls: { value: 0.05, rating: 'good', delta: 0 },
  inp: { value: 350, rating: 'needs-improvement', delta: 0 },
  ttfb: { value: 3000, rating: 'poor', delta: 0 },
  timestamp: '2025-11-19T00:00:00.000Z',
};

describe('MetricsPanel', () => {
  describe('Rendering', () => {
    it('renders strategy name in title', () => {
      render(<MetricsPanel metrics={mockGoodMetrics} strategyName="SSR" />);
      expect(screen.getByText(/SSR Performance/i)).toBeInTheDocument();
    });

    it('renders all 5 Core Web Vitals labels', () => {
      render(<MetricsPanel metrics={mockGoodMetrics} strategyName="SSR" />);

      expect(screen.getByText('First Contentful Paint')).toBeInTheDocument();
      expect(screen.getByText('Largest Contentful Paint')).toBeInTheDocument();
      expect(screen.getByText('Cumulative Layout Shift')).toBeInTheDocument();
      expect(screen.getByText('Interaction to Next Paint')).toBeInTheDocument();
      expect(screen.getByText('Time to First Byte')).toBeInTheDocument();
    });

    it('renders all 5 metric abbreviations', () => {
      render(<MetricsPanel metrics={mockGoodMetrics} strategyName="SSR" />);

      expect(screen.getByText('fcp')).toBeInTheDocument();
      expect(screen.getByText('lcp')).toBeInTheDocument();
      expect(screen.getByText('cls')).toBeInTheDocument();
      expect(screen.getByText('inp')).toBeInTheDocument();
      expect(screen.getByText('ttfb')).toBeInTheDocument();
    });
  });

  describe('Metric Values', () => {
    it('displays formatted metric values correctly', () => {
      render(<MetricsPanel metrics={mockGoodMetrics} strategyName="SSR" />);

      expect(screen.getByText('1200ms')).toBeInTheDocument(); // FCP
      expect(screen.getByText('1800ms')).toBeInTheDocument(); // LCP
      expect(screen.getByText('0.050')).toBeInTheDocument(); // CLS
      expect(screen.getByText('150ms')).toBeInTheDocument(); // INP
      expect(screen.getByText('600ms')).toBeInTheDocument(); // TTFB
    });

    it('handles poor metric values', () => {
      render(<MetricsPanel metrics={mockPoorMetrics} strategyName="SSR" />);

      expect(screen.getByText('4000ms')).toBeInTheDocument(); // FCP
      expect(screen.getByText('5000ms')).toBeInTheDocument(); // LCP
      expect(screen.getByText('0.300')).toBeInTheDocument(); // CLS
      expect(screen.getByText('700ms')).toBeInTheDocument(); // INP
      expect(screen.getByText('2500ms')).toBeInTheDocument(); // TTFB
    });
  });

  describe('Rating Badges', () => {
    it('shows "good" rating badges for good metrics', () => {
      render(<MetricsPanel metrics={mockGoodMetrics} strategyName="SSR" />);

      const badges = screen.getAllByText('good');
      expect(badges).toHaveLength(5); // All 5 metrics have 'good' rating
    });

    it('shows "poor" rating badges for poor metrics', () => {
      render(<MetricsPanel metrics={mockPoorMetrics} strategyName="SSR" />);

      const badges = screen.getAllByText('poor');
      expect(badges).toHaveLength(5); // All 5 metrics have 'poor' rating
    });

    it('shows mixed rating badges correctly', () => {
      render(<MetricsPanel metrics={mockMixedMetrics} strategyName="ISR" />);

      const goodBadges = screen.getAllByText('good');
      const needsImprovementBadges = screen.getAllByText('needs-improvement');
      const poorBadges = screen.getAllByText('poor');

      expect(goodBadges).toHaveLength(2); // LCP, CLS
      expect(needsImprovementBadges).toHaveLength(2); // FCP, INP
      expect(poorBadges).toHaveLength(1); // TTFB
    });
  });

  describe('Different Strategies', () => {
    it('renders correctly for SSG strategy', () => {
      render(<MetricsPanel metrics={mockGoodMetrics} strategyName="SSG" />);
      expect(screen.getByText(/SSG Performance/i)).toBeInTheDocument();
    });

    it('renders correctly for ISR strategy', () => {
      render(<MetricsPanel metrics={mockGoodMetrics} strategyName="ISR" />);
      expect(screen.getByText(/ISR Performance/i)).toBeInTheDocument();
    });

    it('renders correctly for CACHE strategy', () => {
      render(<MetricsPanel metrics={mockGoodMetrics} strategyName="CACHE" />);
      expect(screen.getByText(/CACHE Performance/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders in correct order (FCP, LCP, CLS, INP, TTFB)', () => {
      const { container } = render(<MetricsPanel metrics={mockGoodMetrics} strategyName="SSR" />);

      const metrics = container.querySelectorAll('.text-xs.text-muted-foreground.uppercase');
      expect(metrics[0]).toHaveTextContent('fcp');
      expect(metrics[1]).toHaveTextContent('lcp');
      expect(metrics[2]).toHaveTextContent('cls');
      expect(metrics[3]).toHaveTextContent('inp');
      expect(metrics[4]).toHaveTextContent('ttfb');
    });
  });
});
