/**
 * Shared SWR configuration
 * Ensures consistent behavior across all dashboard components
 */

export const METRICS_SWR_CONFIG = {
  refreshInterval: 1000, // Poll every 1 second for real-time updates
  revalidateOnFocus: true,
};
