/**
 * Sentry Client Configuration (Next.js 15 + Turbopack)
 * HOTFIX 2026-01-20: Sentry désactivé pour corriger MIDDLEWARE_INVOCATION_FAILED
 * Le projet Sentry 'javascript-nextjs' est invalide/introuvable
 * Réactiver après avoir corrigé la configuration du projet sur sentry.io
 */

// DISABLED: Sentry client-side hooks
// Original code:
// import * as Sentry from '@sentry/nextjs';
// export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
// Sentry.init({ ... });

export const onRouterTransitionStart = undefined;
