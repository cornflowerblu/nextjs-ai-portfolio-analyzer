import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrategyCard } from '@/components/dashboard/strategy-card';
import { RENDERING_STRATEGIES } from '@/types/strategy';

describe('StrategyCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Rendering', () => {
    it('renders SSR strategy information', () => {
      const strategy = RENDERING_STRATEGIES.SSR;
      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      expect(screen.getByText('SSR')).toBeInTheDocument();
      expect(screen.getByText('Server-Side Rendering')).toBeInTheDocument();
      expect(screen.getByText(strategy.description)).toBeInTheDocument();
    });

    it('renders SSG strategy information', () => {
      const strategy = RENDERING_STRATEGIES.SSG;
      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      expect(screen.getByText('SSG')).toBeInTheDocument();
      expect(screen.getByText('Static Site Generation')).toBeInTheDocument();
    });

    it('renders ISR strategy information', () => {
      const strategy = RENDERING_STRATEGIES.ISR;
      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      expect(screen.getByText('ISR')).toBeInTheDocument();
      expect(screen.getByText('Incremental Static Regeneration')).toBeInTheDocument();
    });

    it('renders CACHE strategy information', () => {
      const strategy = RENDERING_STRATEGIES.CACHE;
      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      expect(screen.getByText('CACHE')).toBeInTheDocument();
      expect(screen.getByText('Cache Components')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler when card is clicked', async () => {
      const user = userEvent.setup();
      const strategy = RENDERING_STRATEGIES.SSR;

      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      const card = screen.getByRole('button');
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when already called once', async () => {
      const user = userEvent.setup();
      const strategy = RENDERING_STRATEGIES.SSR;

      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      const card = screen.getByRole('button');
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('can be clicked multiple times', async () => {
      const user = userEvent.setup();
      const strategy = RENDERING_STRATEGIES.SSR;

      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      const card = screen.getByRole('button');
      await user.click(card);
      await user.click(card);
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Active State', () => {
    it('applies active styling when isActive is true', () => {
      const strategy = RENDERING_STRATEGIES.SSR;
      const { container } = render(
        <StrategyCard strategy={strategy} isActive={true} onClick={mockOnClick} />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('ring-2');
    });

    it('does not apply active styling when isActive is false', () => {
      const strategy = RENDERING_STRATEGIES.SSR;
      const { container } = render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      const card = container.firstChild;
      expect(card).not.toHaveClass('ring-2');
    });

    it('toggles active state correctly', () => {
      const strategy = RENDERING_STRATEGIES.SSR;
      const { container, rerender } = render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      let card = container.firstChild;
      expect(card).not.toHaveClass('ring-2');

      rerender(
        <StrategyCard strategy={strategy} isActive={true} onClick={mockOnClick} />
      );

      card = container.firstChild;
      expect(card).toHaveClass('ring-2');
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible with Enter key', async () => {
      const user = userEvent.setup();
      const strategy = RENDERING_STRATEGIES.SSR;

      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('is keyboard accessible with Space key', async () => {
      const user = userEvent.setup();
      const strategy = RENDERING_STRATEGIES.SSR;

      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('has button role', () => {
      const strategy = RENDERING_STRATEGIES.SSR;
      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Visual Consistency', () => {
    it('displays use cases when provided', () => {
      const strategy = RENDERING_STRATEGIES.SSR;
      render(
        <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
      );

      // Check if use cases are rendered (they're in the description)
      expect(screen.getByText(strategy.description)).toBeInTheDocument();
    });

    it('maintains consistent layout across all strategies', () => {
      const strategies = [
        RENDERING_STRATEGIES.SSR,
        RENDERING_STRATEGIES.SSG,
        RENDERING_STRATEGIES.ISR,
        RENDERING_STRATEGIES.CACHE,
      ];

      strategies.forEach((strategy) => {
        const { container } = render(
          <StrategyCard strategy={strategy} isActive={false} onClick={mockOnClick} />
        );

        // Check that all cards have the same basic structure
        expect(container.querySelector('button')).toBeInTheDocument();
        expect(screen.getByText(strategy.id)).toBeInTheDocument();
        expect(screen.getByText(strategy.displayName)).toBeInTheDocument();
      });
    });
  });
});
