import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RealTimeIndicator } from '@/components/dashboard/real-time-indicator';

describe('RealTimeIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('displays "Live" status when not updating', () => {
      const lastUpdate = new Date();
      render(<RealTimeIndicator lastUpdate={lastUpdate} isUpdating={false} />);

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('displays "Updating..." status when updating', () => {
      const lastUpdate = new Date();
      render(<RealTimeIndicator lastUpdate={lastUpdate} isUpdating={true} />);

      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });

    it('shows green indicator when not updating', () => {
      const lastUpdate = new Date();
      const { container } = render(
        <RealTimeIndicator lastUpdate={lastUpdate} isUpdating={false} />
      );

      const indicator = container.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });

    it('shows yellow pulsing indicator when updating', () => {
      const lastUpdate = new Date();
      const { container } = render(
        <RealTimeIndicator lastUpdate={lastUpdate} isUpdating={true} />
      );

      const indicator = container.querySelector('.bg-yellow-500.animate-pulse');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Relative Time Display', () => {
    it('displays "just now" for recent updates', () => {
      const now = new Date();
      render(<RealTimeIndicator lastUpdate={now} isUpdating={false} />);

      expect(screen.getByText(/Last updated just now/i)).toBeInTheDocument();
    });

    it('displays minutes for older updates', () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      render(<RealTimeIndicator lastUpdate={twoMinutesAgo} isUpdating={false} />);

      expect(screen.getByText(/Last updated 2 minutes ago/i)).toBeInTheDocument();
    });

    it('displays hours for much older updates', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      render(<RealTimeIndicator lastUpdate={twoHoursAgo} isUpdating={false} />);

      expect(screen.getByText(/Last updated 2 hours ago/i)).toBeInTheDocument();
    });
  });

  describe('Auto-update Behavior', () => {
    it('updates relative time every second', async () => {
      const fiftyNineSecondsAgo = new Date(Date.now() - 59 * 1000);
      render(<RealTimeIndicator lastUpdate={fiftyNineSecondsAgo} isUpdating={false} />);

      expect(screen.getByText(/Last updated just now/i)).toBeInTheDocument();

      // Advance by 10 seconds (to trigger the 10s interval) + 1s to pass the minute threshold
      act(() => {
        vi.advanceTimersByTime(11000);
      });

      // Text should now show "1 minute ago"
      expect(screen.getByText(/Last updated 1 minute ago/i)).toBeInTheDocument();
    });

    it('cleans up interval on unmount', () => {
      const lastUpdate = new Date();
      const { unmount } = render(
        <RealTimeIndicator lastUpdate={lastUpdate} isUpdating={false} />
      );

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Props Handling', () => {
    it('defaults isUpdating to false when not provided', () => {
      const lastUpdate = new Date();
      render(<RealTimeIndicator lastUpdate={lastUpdate} />);

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('accepts Date objects for lastUpdate', () => {
      const lastUpdate = new Date('2025-11-19T12:00:00.000Z');
      render(<RealTimeIndicator lastUpdate={lastUpdate} isUpdating={false} />);

      expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
    });
  });

  describe('State Updates', () => {
    it('updates from not updating to updating', () => {
      const lastUpdate = new Date();
      const { rerender } = render(
        <RealTimeIndicator lastUpdate={lastUpdate} isUpdating={false} />
      );

      expect(screen.getByText('Live')).toBeInTheDocument();

      rerender(<RealTimeIndicator lastUpdate={lastUpdate} isUpdating={true} />);

      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });

    it('updates from updating to not updating', () => {
      const lastUpdate = new Date();
      const { rerender } = render(
        <RealTimeIndicator lastUpdate={lastUpdate} isUpdating={true} />
      );

      expect(screen.getByText('Updating...')).toBeInTheDocument();

      rerender(<RealTimeIndicator lastUpdate={lastUpdate} isUpdating={false} />);

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('updates lastUpdate timestamp', () => {
      const initialUpdate = new Date(Date.now() - 60 * 1000);
      const { rerender } = render(
        <RealTimeIndicator lastUpdate={initialUpdate} isUpdating={false} />
      );

      expect(screen.getByText(/Last updated 1 minute ago/i)).toBeInTheDocument();

      const newUpdate = new Date();
      act(() => {
        rerender(<RealTimeIndicator lastUpdate={newUpdate} isUpdating={false} />);
      });

      // Run only pending timers (setTimeout(0)) without the interval
      act(() => {
        vi.runOnlyPendingTimers();
      });

      expect(screen.getByText(/Last updated just now/i)).toBeInTheDocument();
    });
  });
});
