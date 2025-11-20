/**
 * Color scheme constants for consistent strategy visualization
 * Maps to CSS variables defined in globals.css
 */

import type { RenderingStrategyType } from '@/types/strategy';

/**
 * Strategy color mapping
 */
export const STRATEGY_COLORS = {
  SSR: 'var(--strategy-ssr)',
  SSG: 'var(--strategy-ssg)',
  ISR: 'var(--strategy-isr)',
  CACHE: 'var(--strategy-cache)',
} as const satisfies Record<RenderingStrategyType, string>;

/**
 * Tailwind CSS class names for strategy colors
 * 
 * IMPORTANT: These classes use Tailwind v4's arbitrary value syntax with CSS variables.
 * 
 * According to Tailwind CSS v4 documentation:
 * - Arbitrary values with CSS variables (e.g., `bg-[var(--strategy-ssr)]`) ARE supported
 * - These classes work correctly when statically present in source code
 * - Tailwind's content scanner detects them as plain text strings
 * 
 * References:
 * - https://tailwindcss.com/docs/background-color (arbitrary values)
 * - https://tailwindcss.com/docs/theme (CSS variables & theme)
 * - https://tailwindcss.com/docs/detecting-classes-in-source-files (content scanning)
 * 
 * NOTE: Dynamic class generation (e.g., string interpolation like `bg-[var(--strategy-${type})]`)
 * would require safelisting, but these STATIC class strings are safe and will not be purged.
 * 
 * The CSS variables (--strategy-*) are defined in app/globals.css within the :root and .dark
 * selectors, ensuring they're available at runtime.
 */
export const STRATEGY_COLOR_CLASSES = {
  SSR: {
    bg: 'bg-[var(--strategy-ssr)]',
    text: 'text-[var(--strategy-ssr)]',
    border: 'border-[var(--strategy-ssr)]',
    ring: 'ring-[var(--strategy-ssr)]',
  },
  SSG: {
    bg: 'bg-[var(--strategy-ssg)]',
    text: 'text-[var(--strategy-ssg)]',
    border: 'border-[var(--strategy-ssg)]',
    ring: 'ring-[var(--strategy-ssg)]',
  },
  ISR: {
    bg: 'bg-[var(--strategy-isr)]',
    text: 'text-[var(--strategy-isr)]',
    border: 'border-[var(--strategy-isr)]',
    ring: 'ring-[var(--strategy-isr)]',
  },
  CACHE: {
    bg: 'bg-[var(--strategy-cache)]',
    text: 'text-[var(--strategy-cache)]',
    border: 'border-[var(--strategy-cache)]',
    ring: 'ring-[var(--strategy-cache)]',
  },
} as const satisfies Record<RenderingStrategyType, Record<string, string>>;

/**
 * Performance rating colors
 */
export const RATING_COLORS = {
  good: {
    bg: 'bg-green-100 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-300 dark:border-green-800',
    badge: 'bg-green-500',
  },
  'needs-improvement': {
    bg: 'bg-yellow-100 dark:bg-yellow-950',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-300 dark:border-yellow-800',
    badge: 'bg-yellow-500',
  },
  poor: {
    bg: 'bg-red-100 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-300 dark:border-red-800',
    badge: 'bg-red-500',
  },
} as const;

/**
 * Cache status colors
 */
export const CACHE_STATUS_COLORS = {
  HIT: {
    bg: 'bg-green-100 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-300 dark:border-green-800',
    badge: 'bg-green-500',
  },
  MISS: {
    bg: 'bg-red-100 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-300 dark:border-red-800',
    badge: 'bg-red-500',
  },
  STALE: {
    bg: 'bg-yellow-100 dark:bg-yellow-950',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-300 dark:border-yellow-800',
    badge: 'bg-yellow-500',
  },
  REVALIDATING: {
    bg: 'bg-blue-100 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-300 dark:border-blue-800',
    badge: 'bg-blue-500',
  },
  BYPASS: {
    bg: 'bg-gray-100 dark:bg-gray-900',
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-700',
    badge: 'bg-gray-500',
  },
} as const;

/**
 * Chart color palette for Recharts
 */
export const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  quinary: 'hsl(var(--chart-5))',
} as const;

/**
 * Get strategy color
 */
export function getStrategyColor(strategy: RenderingStrategyType): string {
  return STRATEGY_COLORS[strategy];
}

/**
 * Get strategy color classes
 */
export function getStrategyColorClasses(strategy: RenderingStrategyType) {
  return STRATEGY_COLOR_CLASSES[strategy];
}

/**
 * Get rating color classes
 */
export function getRatingColorClasses(rating: 'good' | 'needs-improvement' | 'poor') {
  return RATING_COLORS[rating];
}

/**
 * Get cache status color classes
 */
export function getCacheStatusColorClasses(
  status: 'HIT' | 'MISS' | 'STALE' | 'REVALIDATING' | 'BYPASS'
) {
  return CACHE_STATUS_COLORS[status];
}

/**
 * Get chart color by index
 */
export function getChartColor(index: number): string {
  const colors = Object.values(CHART_COLORS);
  return colors[index % colors.length];
}

/**
 * Strategy color array for charts (in order: SSR, SSG, ISR, CACHE)
 */
export const STRATEGY_CHART_COLORS: string[] = [
  STRATEGY_COLORS.SSR,
  STRATEGY_COLORS.SSG,
  STRATEGY_COLORS.ISR,
  STRATEGY_COLORS.CACHE,
];

/**
 * Get opacity variant of a color
 */
export function getColorWithOpacity(color: string, opacity: number): string {
  // Handle CSS variables
  if (color.startsWith('var(')) {
    return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
  }
  
  // Handle HSL
  if (color.startsWith('hsl(')) {
    return color.replace(')', ` / ${opacity})`);
  }
  
  return color;
}

/**
 * Gradient definitions for backgrounds
 */
export const GRADIENTS = {
  primary: 'bg-gradient-to-br from-blue-500 to-purple-600',
  success: 'bg-gradient-to-br from-green-400 to-green-600',
  warning: 'bg-gradient-to-br from-yellow-400 to-orange-500',
  danger: 'bg-gradient-to-br from-red-400 to-red-600',
  info: 'bg-gradient-to-br from-blue-400 to-cyan-500',
  neutral: 'bg-gradient-to-br from-gray-400 to-gray-600',
} as const;

/**
 * Get gradient by name
 */
export function getGradient(name: keyof typeof GRADIENTS): string {
  return GRADIENTS[name];
}
