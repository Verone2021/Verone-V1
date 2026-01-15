/**
 * Next.js Instrumentation - LinkMe
 * Charge la config Sentry selon le runtime (Node.js ou Edge)
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

/**
 * Hook Next.js 15 pour capturer les erreurs RSC
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#errors-from-nested-react-server-components
 */
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
