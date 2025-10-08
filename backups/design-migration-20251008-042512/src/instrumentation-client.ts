// import * as Sentry from "@sentry/nextjs"; // Temporairement désactivé

// Sentry temporairement désactivé pour résoudre erreurs de compilation
// Sera réactivé après mise à jour version Sentry compatible

// Sentry.init({
//   dsn: "https://5399dfa32831b088e01b5ba24059330d@o4510076285943808.ingest.de.sentry.io/4510076999762000",

//   // Use the tunnel to bypass CSP and ad-blockers
//   tunnel: "/api/monitoring",

//   // Adjust this value in production, or use tracesSampler for greater control
//   tracesSampleRate: 1,

//   // Setting this option to true will print useful information to the console while you're setting up Sentry.
//   debug: process.env.NODE_ENV === 'development' ? false : true, // Reduce console noise in dev

//   // Replays are only captured on errors with this config
//   replaysOnErrorSampleRate: process.env.NODE_ENV === 'development' ? 0 : 1.0, // Disable in dev to avoid worker errors

//   // This sets the sample rate to be 10%. You may want this to be 100% while in development and sample at a lower rate in production.
//   replaysSessionSampleRate: process.env.NODE_ENV === 'development' ? 0 : 0.1, // Disable in dev

//   // You can remove this option if you're not planning to use the Sentry Session Replay feature:
//   integrations: [
//     Sentry.browserTracingIntegration(),
//     // Only enable Replay in production to avoid compression worker errors in development
//     ...(process.env.NODE_ENV === 'production' ? [
//       Sentry.replayIntegration({
//         // Additional Replay configuration goes in here, for example:
//         maskAllText: true,
//         blockAllMedia: true,
//       })
//     ] : []),
//   ],

//   // Configure trace propagation targets to avoid CORS issues
//   tracePropagationTargets: ["localhost", /^https:\/\/aorroydfjsrygmosnzrl\.supabase\.co\/api/],

//   // Custom error filtering for Vérone Back Office
//   beforeSend(event, hint) {
//     // Skip certain development errors
//     if (event.exception) {
//       const error = hint.originalException;
//       if (error && error.message) {
//         // Skip hydration errors in development
//         if (error.message.includes('Hydration failed') && process.env.NODE_ENV === 'development') {
//           return null;
//         }

//         // Skip Next.js internal errors
//         if (error.message.includes('ChunkLoadError') && process.env.NODE_ENV === 'development') {
//           return null;
//         }
//       }
//     }

//     // Add Vérone-specific context
//     event.tags = {
//       ...event.tags,
//       application: 'verone-back-office',
//       environment: process.env.NODE_ENV || 'development',
//     };

//     // Add user context if available
//     if (typeof window !== 'undefined') {
//       const sessionId = localStorage.getItem('verone_session_id');
//       if (sessionId) {
//         event.user = {
//           ...event.user,
//           id: sessionId,
//         };
//       }
//     }

//     return event;
//   },

//   // Performance monitoring
//   beforeSendTransaction(event) {
//     // Add Vérone business context
//     event.tags = {
//       ...event.tags,
//       application: 'verone-back-office',
//       module: 'performance',
//     };
//     return event;
//   },
// });

// Export router transition hook for navigation instrumentation - temporairement désactivé
// export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
export const onRouterTransitionStart = () => {}; // Stub temporaire