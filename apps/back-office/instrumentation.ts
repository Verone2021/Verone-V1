/**
 * Next.js Instrumentation - Server-side Error & Performance Monitoring
 *
 * This file runs on the server during Next.js initialization.
 * It sets up global error handlers and logging.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logger } = await import('@verone/utils/logger');

    // Log startup
    logger.info('[Instrumentation] Server starting', {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });

    // Global unhandled rejection handler
    process.on('unhandledRejection', (reason, _promise) => {
      const error =
        reason instanceof Error
          ? reason
          : new Error(String(reason));

      logger.error('[Unhandled Rejection]', error, {
        errorType: 'unhandledRejection',
      });
    });

    // Global uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('[Uncaught Exception]', error, {
        errorType: 'uncaughtException',
      });

      // Give time to flush logs before crashing
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    logger.info('[Instrumentation] Global error handlers registered');
  }

  // Edge runtime instrumentation (if needed)
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime has limited capabilities
    // Errors are logged via middleware and API routes
    console.log('[Instrumentation] Edge runtime initialized');
  }
}

/**
 * Instrumentation hook for request lifecycle (experimental)
 * Can be used for tracing and performance monitoring
 */
export function onRequestError({
  error,
  request,
  context,
}: {
  error: Error;
  request: Request;
  context: { routerKind: string; routePath: string; routeType: string };
}) {
  // Log request errors with context
  console.error('[Request Error]', {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    timestamp: new Date().toISOString(),
  });
}
