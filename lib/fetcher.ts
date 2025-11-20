/**
 * Common fetcher function for SWR
 * Handles JSON parsing and error responses consistently across the app
 */

export class FetchError extends Error {
  status: number;
  info: unknown;

  constructor(message: string, status: number, info: unknown) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.info = info;
  }
}

/**
 * Generic fetcher for SWR that handles:
 * - JSON parsing
 * - HTTP error status codes
 * - Network errors
 * - Type safety
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);

  // If the status code is not in the range 200-299, throw an error
  if (!response.ok) {
    const info = await response.json().catch(() => ({}));
    throw new FetchError(
      `An error occurred while fetching the data: ${response.statusText}`,
      response.status,
      info
    );
  }

  return response.json();
}