/**
 * Next.js Instrumentation
 * HOTFIX 2026-01-20: Sentry désactivé pour corriger MIDDLEWARE_INVOCATION_FAILED
 * Le projet Sentry 'javascript-nextjs' est invalide/introuvable causant un crash Edge Runtime
 * Réactiver après avoir corrigé la configuration du projet sur sentry.io
 */

export async function register() {
  // DISABLED: Sentry initialization causes MIDDLEWARE_INVOCATION_FAILED
  // Original code:
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   await import('./sentry.server.config');
  // }
  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('./sentry.edge.config');
  // }
}

export async function onRequestError(
  _err: unknown,
  _request: { path: string; method: string; headers: Headers }
) {
  // DISABLED: Sentry error capture
  // Original code:
  // Sentry.captureException(err, { ... });
}
