/**
 * RealTimeIndicator Component
 * Shows live update status and last refresh timestamp
 */

'use client';

import { formatRelativeTime } from '@/lib/utils/format';
import { useEffect, useState } from 'react';

interface RealTimeIndicatorProps {
  lastUpdate: Date;
  isUpdating?: boolean;
}

export function RealTimeIndicator({ lastUpdate, isUpdating = false }: RealTimeIndicatorProps) {
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(lastUpdate));

  useEffect(() => {
    // Schedule the state update instead of calling it synchronously
    const timeoutId = setTimeout(() => {
      setRelativeTime(formatRelativeTime(lastUpdate));
    }, 0);

    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(lastUpdate));
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [lastUpdate]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            isUpdating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
          }`}
        />
        <span className="text-sm text-muted-foreground">
          {isUpdating ? 'Updating...' : 'Live'}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">
        Last updated {relativeTime}
      </span>
    </div>
  );
}
