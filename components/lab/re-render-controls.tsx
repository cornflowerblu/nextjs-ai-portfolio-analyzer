/**
 * ReRenderControls Component
 * Buttons to trigger demo refreshes and re-renders
 */

'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw, RotateCw } from 'lucide-react';
import { RenderingStrategyType } from '@/types/strategy';

interface ReRenderControlsProps {
  strategy: RenderingStrategyType;
  onReRender: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function ReRenderControls({
  strategy,
  onReRender,
  onRefresh,
  isLoading = false,
}: ReRenderControlsProps) {
  const getReRenderLabel = (): string => {
    switch (strategy) {
      case 'SSR':
        return 'Trigger New Request';
      case 'SSG':
        return 'Simulate Rebuild';
      case 'ISR':
        return 'Force Revalidation';
      case 'CACHE':
        return 'Clear Component Cache';
      default:
        return 'Re-render';
    }
  };

  const getRefreshLabel = (): string => {
    return 'Soft Refresh';
  };

  const getReRenderDescription = (): string => {
    switch (strategy) {
      case 'SSR':
        return 'Generate a new server-side render';
      case 'SSG':
        return 'Simulate a full rebuild cycle';
      case 'ISR':
        return 'Force immediate revalidation';
      case 'CACHE':
        return 'Bust the component cache';
      default:
        return 'Trigger a new render';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <Button
          onClick={onReRender}
          disabled={isLoading}
          className="w-full"
          size="lg"
          variant="default"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Re-rendering...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {getReRenderLabel()}
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {getReRenderDescription()}
        </p>
      </div>
      <div className="flex-1">
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full"
          size="lg"
          variant="outline"
        >
          <RotateCw className="mr-2 h-4 w-4" />
          {getRefreshLabel()}
        </Button>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Router refresh (soft navigation)
        </p>
      </div>
    </div>
  );
}
