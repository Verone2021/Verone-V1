/**
 * Next.js Instrumentation - Sentry Integration
 * Réactivé 2026-01-21 après migration routes Edge → Node.js
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Headers }
) {
  Sentry.captureException(err, {
    contexts: {
      nextjs: {
        request: {
          path: request.path,
          method: request.method,
        },
      },
    },
  });
}
