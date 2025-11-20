import type { CoreWebVitals } from '@/types/performance';
import { RenderingStrategyType } from './strategy';

export interface StrategyMetrics {
  strategy: RenderingStrategyType;
  metrics: CoreWebVitals;
  timestamp: string;
}