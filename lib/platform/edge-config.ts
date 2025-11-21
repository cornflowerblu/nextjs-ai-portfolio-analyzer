/**
 * Edge Config integration for feature flags and configuration
 * Provides read and update operations with timing measurements
 */

import { get } from '@vercel/edge-config';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  updatedAt?: string;
}

export interface EdgeConfigResult<T> {
  data: T | null;
  latency: number; // milliseconds
  cached: boolean;
}

/**
 * Read a value from Edge Config with timing measurement
 */
export async function readEdgeConfig<T>(
  key: string
): Promise<EdgeConfigResult<T>> {
  const start = performance.now();

  try {
    // Check if Edge Config is available
    if (!process.env.EDGE_CONFIG) {
      console.warn('EDGE_CONFIG not configured - using mock data');
      const latency = performance.now() - start;
      return {
        data: null,
        latency,
        cached: false,
      };
    }

    const data = await get<T>(key);
    const latency = performance.now() - start;

    return {
      data: data ?? null,
      latency,
      cached: false, // Edge Config is always at the edge
    };
  } catch (error) {
    console.error('Edge Config Read Error:', error);
    const latency = performance.now() - start;
    return {
      data: null,
      latency,
      cached: false,
    };
  }
}

/**
 * Read all feature flags from Edge Config
 */
export async function getFeatureFlags(): Promise<EdgeConfigResult<FeatureFlag[]>> {
  return readEdgeConfig<FeatureFlag[]>('featureFlags');
}

/**
 * Read a specific feature flag
 */
export async function getFeatureFlag(
  name: string
): Promise<EdgeConfigResult<boolean>> {
  const result = await getFeatureFlags();

  if (!result.data) {
    return {
      data: null,
      latency: result.latency,
      cached: result.cached,
    };
  }

  const flag = result.data.find((f) => f.name === name);

  return {
    data: flag?.enabled ?? null,
    latency: result.latency,
    cached: result.cached,
  };
}

/**
 * Mock feature flags for development/testing
 */
export function getMockFeatureFlags(): FeatureFlag[] {
  return [
    {
      name: 'enableDarkMode',
      enabled: true,
      description: 'Enable dark mode theme',
      updatedAt: new Date().toISOString(),
    },
    {
      name: 'enableAdvancedMetrics',
      enabled: false,
      description: 'Show advanced performance metrics',
      updatedAt: new Date().toISOString(),
    },
    {
      name: 'enableExperimentalFeatures',
      enabled: false,
      description: 'Enable experimental platform features',
      updatedAt: new Date().toISOString(),
    },
    {
      name: 'enableEdgeFunctions',
      enabled: true,
      description: 'Use Edge Functions for rendering',
      updatedAt: new Date().toISOString(),
    },
  ];
}

/**
 * Measure Edge Config propagation time
 * This would typically require write access to Edge Config,
 * which is done via API, not from the app code
 */
export async function measurePropagationTime(
  key: string,
  expectedValue: unknown,
  maxAttempts: number = 10
): Promise<{
  propagationTime: number;
  attempts: number;
  success: boolean;
}> {
  const startTime = performance.now();
  let attempts = 0;

  for (let i = 0; i < maxAttempts; i++) {
    attempts++;
    const result = await readEdgeConfig(key);

    if (result.data === expectedValue) {
      const propagationTime = performance.now() - startTime;
      return {
        propagationTime,
        attempts,
        success: true,
      };
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const propagationTime = performance.now() - startTime;
  return {
    propagationTime,
    attempts,
    success: false,
  };
}
