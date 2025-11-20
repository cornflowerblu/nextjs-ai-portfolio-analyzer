/**
 * Shared SWR fetcher function
 * Used across dashboard components for consistent data fetching
 */

export const fetcher = (url: string) => fetch(url).then((res) => res.json());
