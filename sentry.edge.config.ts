import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5399dfa32831b088e01b5ba24059330d@o4510076285943808.ingest.de.sentry.io/4510076999762000",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'production',

  // Edge runtime configuration
  beforeSend(event, hint) {
    // Add Vérone edge context
    event.tags = {
      ...event.tags,
      application: 'verone-back-office',
      environment: process.env.NODE_ENV || 'development',
      runtime: 'edge',
    };

    return event;
  },
});