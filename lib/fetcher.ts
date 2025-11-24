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
 * - Automatic 401 retry with session refresh
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);

  // If the status code is not in the range 200-299, handle error
  if (!response.ok) {
    // Special handling for 401 Unauthorized - attempt session refresh and retry once
    if (response.status === 401) {
      console.log('Received 401 error, attempting session refresh...');

      try {
        // Dynamically import to avoid circular dependency
        const { refreshSession } = await import('./firebase/auth');
        const refreshed = await refreshSession();

        if (refreshed) {
          console.log('Session refreshed, retrying request...');

          // Retry the original request
          const retryResponse = await fetch(url);

          if (retryResponse.ok) {
            return retryResponse.json();
          }

          // If retry also fails, fall through to throw error
          console.warn('Retry after refresh also failed');
        } else {
          console.warn('Session refresh failed');
        }
      } catch (refreshError) {
        console.error('Error during session refresh:', refreshError);
      }
    }

    const info = await response.json().catch(() => ({}));
    throw new FetchError(
      `An error occurred while fetching the data: ${response.statusText}`,
      response.status,
      info
    );
  }

  return response.json();
}