import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteFooter } from '@/components/site-footer';

describe('SiteFooter', () => {
  describe('Rendering', () => {
    it('renders the footer element', () => {
      const { container } = render(<SiteFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('displays the correct text content', () => {
      render(<SiteFooter />);
      expect(screen.getByText(/Next.js Rendering Strategy Analyzer/i)).toBeInTheDocument();
      expect(screen.getByText(/Built with Next.js 16 & React 19/i)).toBeInTheDocument();
    });

    it('applies correct styling classes', () => {
      const { container } = render(<SiteFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('border-t', 'border-border', 'bg-background');
    });

    it('centers the content with container and text-center classes', () => {
      const { container } = render(<SiteFooter />);
      const contentDiv = container.querySelector('.container');
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv).toHaveClass('mx-auto', 'text-center');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic footer element', () => {
      const { container } = render(<SiteFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
      expect(footer?.tagName).toBe('FOOTER');
    });
  });
});
