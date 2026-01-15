/**
 * Sentry Server Configuration - LinkMe
 * Config pour Node.js runtime (Server Components, API Routes)
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% des transactions

  // Environnement
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',

  // Desactiver en dev local
  enabled: process.env.NODE_ENV === 'production',
});
