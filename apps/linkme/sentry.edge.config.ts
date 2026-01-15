/**
 * Sentry Edge Configuration - LinkMe
 * Config pour Edge runtime (Middleware, Edge API Routes)
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment et release tracking
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% des transactions

  // Desactiver en dev local
  enabled: process.env.NODE_ENV === 'production',
});
