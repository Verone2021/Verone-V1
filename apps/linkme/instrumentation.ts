/**
 * Next.js Instrumentation - LinkMe
 */

export async function register() {
  // No-op: Sentry removed
}

/**
 * Hook Next.js 15 pour capturer les erreurs RSC
 */
export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Headers }
) {
  // Log to console for debugging (Sentry removed)
  console.error('[LinkMe] Request Error:', {
    error: err,
    path: request.path,
    method: request.method,
  });
}
