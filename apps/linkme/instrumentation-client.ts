/**
 * Sentry Client Configuration - LinkMe (Next.js 15 + Turbopack)
 * Nouveau format compatible Turbopack
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% des transactions en prod

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% des sessions normales
  replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreur

  integrations: [
    // Session Replay - enregistre interactions utilisateur
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
    // User Feedback - bouton "Signaler un bug"
    Sentry.feedbackIntegration({
      colorScheme: 'system',
      buttonLabel: 'Signaler un bug',
      submitButtonLabel: 'Envoyer',
      formTitle: 'Signaler un problème',
      messagePlaceholder: 'Décrivez le problème rencontré...',
      successMessageText: 'Merci pour votre retour !',
    }),
  ],

  // Filtrage erreurs connues non-actionables
  ignoreErrors: [
    'ResizeObserver loop',
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    /Loading chunk \d+ failed/,
    'ChunkLoadError',
    'NotAllowedError',
  ],

  // Environnement (Vercel auto-injecte)
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',

  // Désactiver en dev local
  enabled: process.env.NODE_ENV === 'production',
});
