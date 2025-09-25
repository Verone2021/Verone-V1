import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5399dfa32831b088e01b5ba24059330d@o4510076285943808.ingest.de.sentry.io/4510076999762000",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: true,

  // Server-side configuration
  serverName: process.env.VERCEL_REGION || 'local',

  // Custom error filtering for server-side
  beforeSend(event, hint) {
    // Skip certain development errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message) {
        // Skip development-only errors
        if (error.message.includes('ENOENT') && process.env.NODE_ENV === 'development') {
          return null;
        }
      }
    }

    // Add Vérone server context
    event.tags = {
      ...event.tags,
      application: 'verone-back-office',
      environment: process.env.NODE_ENV || 'development',
      server: 'nextjs',
    };

    // Add database context for Supabase errors
    if (event.exception && event.exception.values) {
      for (const exception of event.exception.values) {
        if (exception.value && exception.value.includes('supabase')) {
          event.tags.database = 'supabase';
          event.contexts = {
            ...event.contexts,
            database: {
              provider: 'supabase',
              url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            },
          };
          break;
        }
      }
    }

    return event;
  },
});