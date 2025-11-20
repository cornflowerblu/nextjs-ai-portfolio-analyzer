/**
 * Render time measurement utility
 * Provides utilities for measuring component render times and performance
 */

'use client';

import { useRef } from 'react';

/**
 * Render timing result
 */
export interface RenderTiming {
  componentName: string;
  renderTime: number; // milliseconds
  timestamp: number;
  renderType: 'initial' | 're-render';
}



/**
 * Start measuring render time for a component
 */
export function startRenderMeasure(componentName: string): string {
  if (typeof performance === 'undefined') return '';
  
  const markName = `render-start-${componentName}-${Date.now()}`;
  performance.mark(markName);
  
  return markName;
}

/**
 * End measuring render time and return the duration
 */
export function endRenderMeasure(
  componentName: string,
  startMarkName: string,
  renderType: 'initial' | 're-render' = 'initial'
): RenderTiming | null {
  if (typeof performance === 'undefined') return null;
  
  const endMarkName = `render-end-${componentName}-${Date.now()}`;
  const measureName = `render-${componentName}-${Date.now()}`;
  
  try {
    performance.mark(endMarkName);
    performance.measure(measureName, startMarkName, endMarkName);
    
    const measure = performance.getEntriesByName(measureName)[0];
    const renderTime = Math.round(measure.duration * 100) / 100; // Round to 2 decimals
    
    // Clean up marks
    performance.clearMarks(startMarkName);
    performance.clearMarks(endMarkName);
    performance.clearMeasures(measureName);
    
    return {
      componentName,
      renderTime,
      timestamp: Date.now(),
      renderType,
    };
  } catch (error) {
    console.error('Error measuring render time:', error);
    return null;
  }
}

/**
 * Measure a synchronous render function
 */
export function measureRender<T>(
  componentName: string,
  renderFn: () => T,
  renderType: 'initial' | 're-render' = 'initial'
): { result: T; timing: RenderTiming | null } {
  const startMark = startRenderMeasure(componentName);
  const result = renderFn();
  const timing = endRenderMeasure(componentName, startMark, renderType);
  
  return { result, timing };
}

/**
 * Measure an asynchronous render function
 */
export async function measureRenderAsync<T>(
  componentName: string,
  renderFn: () => Promise<T>,
  renderType: 'initial' | 're-render' = 'initial'
): Promise<{ result: T; timing: RenderTiming | null }> {
  const startMark = startRenderMeasure(componentName);
  const result = await renderFn();
  const timing = endRenderMeasure(componentName, startMark, renderType);
  
  return { result, timing };
}

/**
 * React hook for measuring component render time
 */
export function useRenderTiming(componentName: string) {
  // Use useRef to persist values across renders
  const startMarkNameRef = useRef('');
  const renderCountRef = useRef(0);

  if (typeof window === 'undefined') {
    return { startMeasure: () => {}, endMeasure: () => null };
  }

  const startMeasure = () => {
    renderCountRef.current++;
    startMarkNameRef.current = startRenderMeasure(componentName);
  };

  const endMeasure = (): RenderTiming | null => {
    const renderType = renderCountRef.current === 1 ? 'initial' : 're-render';
    return endRenderMeasure(componentName, startMarkNameRef.current, renderType);
  };

  return { startMeasure, endMeasure };
}

/**
 * Get all render measurements for a component
 */
export function getRenderMeasurements(componentName: string): PerformanceEntry[] {
  if (typeof performance === 'undefined') return [];
  
  return performance.getEntriesByType('measure')
    .filter(entry => entry.name.includes(`render-${componentName}`));
}

/**
 * Calculate average render time for a component
 */
export function getAverageRenderTime(componentName: string): number {
  const measurements = getRenderMeasurements(componentName);
  
  if (measurements.length === 0) return 0;
  
  const total = measurements.reduce((sum, entry) => sum + entry.duration, 0);
  return Math.round((total / measurements.length) * 100) / 100;
}

/**
 * Clear all render measurements for a component
 */
export function clearRenderMeasurements(componentName?: string) {
  if (typeof performance === 'undefined') return;
  
  if (componentName) {
    const measurements = getRenderMeasurements(componentName);
    measurements.forEach(entry => {
      performance.clearMeasures(entry.name);
    });
  } else {
    // Clear all render measurements
    performance.getEntriesByType('measure')
      .filter(entry => entry.name.startsWith('render-'))
      .forEach(entry => {
        performance.clearMeasures(entry.name);
      });
  }
}

/**
 * Measure server-side render time
 * For use in Server Components or API routes
 */
export function measureServerRender<T>(
  label: string,
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = Math.round((performance.now() - start) * 100) / 100;
  
  return { result, duration };
}

/**
 * Measure async server-side render time
 */
export async function measureServerRenderAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = Math.round((performance.now() - start) * 100) / 100;
  
  return { result, duration };
}

/**
 * Performance budget checker
 */
export interface PerformanceBudget {
  initialRender: number; // milliseconds
  reRender: number; // milliseconds
}

export function checkPerformanceBudget(
  timing: RenderTiming,
  budget: PerformanceBudget
): { withinBudget: boolean; overBy: number } {
  const budgetLimit = timing.renderType === 'initial' 
    ? budget.initialRender 
    : budget.reRender;
  
  const withinBudget = timing.renderTime <= budgetLimit;
  const overBy = Math.max(0, timing.renderTime - budgetLimit);
  
  return { withinBudget, overBy };
}

/**
 * Log render timing to console (development only)
 */
export function logRenderTiming(timing: RenderTiming, budget?: PerformanceBudget) {
  if (process.env.NODE_ENV !== 'development') return;
  
  const emoji = timing.renderType === 'initial' ? '🎨' : '🔄';
  let message = `${emoji} ${timing.componentName} rendered in ${timing.renderTime}ms`;
  
  if (budget) {
    const check = checkPerformanceBudget(timing, budget);
    if (!check.withinBudget) {
      message += ` ⚠️ OVER BUDGET by ${check.overBy}ms`;
    } else {
      message += ` ✓`;
    }
  }
  
  console.log(message);
}
