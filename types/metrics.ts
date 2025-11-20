/**
 * Metrics Types
 * Shared type definitions for dashboard metrics
 */

import type { CoreWebVitals } from './performance';
import type { RenderingStrategyType } from './strategy';

export interface StrategyMetrics {
  strategy: RenderingStrategyType;
  metrics: CoreWebVitals;
  timestamp: string;
}
