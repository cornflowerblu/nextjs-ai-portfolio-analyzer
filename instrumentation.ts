/**
 * Next.js Instrumentation
 * Performance monitoring and Web Vitals reporting
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    const { registerServerInstrumentation } = await import('./instrumentation.server');
    registerServerInstrumentation();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    const { registerEdgeInstrumentation } = await import('./instrumentation.edge');
    registerEdgeInstrumentation();
  }
}

export async function onRequestError(
  err: Error & { digest?: string },
  request: {
    path: string;
    method: string;
    headers: Headers;
  }
) {
  // Log errors to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Request error:', {
      error: err.message,
      digest: err.digest,
      path: request.path,
      method: request.method,
    });
  }

  // In production, send to error tracking service (e.g., Sentry, DataDog)
  // await sendToErrorTracking({ err, request });
}
