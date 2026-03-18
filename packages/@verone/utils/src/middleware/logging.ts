/**
 * 🔗 Middleware de Logging pour API Routes - Vérone Back Office
 *
 * Middleware automatique qui log toutes les requêtes et réponses API
 * avec métriques de performance et contexte business enrichi.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { LogContext } from '@verone/utils/logger';
import { logger } from '@verone/utils/logger';

export interface LoggingOptions {
  // Exclure certains endpoints du logging (ex: health checks)
  excludePaths?: string[];
  // Inclure le body des requêtes (attention aux données sensibles)
  logRequestBody?: boolean;
  // Inclure le body des réponses
  logResponseBody?: boolean;
  // Seuil de performance (ms) pour logging automatique des lenteurs
  slowRequestThreshold?: number;
}

const DEFAULT_OPTIONS: LoggingOptions = {
  excludePaths: ['/api/health', '/api/_next'],
  logRequestBody: false,
  logResponseBody: false,
  slowRequestThreshold: 2000,
};

/**
 * Middleware de logging pour API Routes Next.js
 */
export function withLogging<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  options: LoggingOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const timer = logger.startTimer();

    // Créer le contexte de la requête
    const requestContext = logger.createRequestContext(req);
    const pathname = new URL(req.url).pathname;

    // Skip logging pour les paths exclus
    if (opts.excludePaths?.some(path => pathname.startsWith(path))) {
      return handler(req, ...args);
    }

    // Log début de requête
    logger.info(`→ ${req.method} ${pathname}`, {
      ...requestContext,
      operation: 'api_request_start',
      category: 'api',
    });

    // Log request body si activé et présent
    if (opts.logRequestBody && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        const body = await req.clone().text();
        if (body) {
          const sanitizedBody: unknown = sanitizeRequestBody(body);
          logger.debug('Request body', {
            ...requestContext,
            body: sanitizedBody,
          });
        }
      } catch (_error) {
        // Ignore les erreurs de parsing du body
      }
    }

    let response: NextResponse;
    let responseSize = 0;
    let error: Error | null = null;

    try {
      // Exécuter le handler
      response = await handler(req, ...args);

      // Calculer taille de réponse approximative
      const responseText = await response.clone().text();
      responseSize = new Blob([responseText]).size;
    } catch (err) {
      error = err as Error;

      // Log l'erreur
      logger.error(`API Error: ${req.method} ${pathname}`, error, {
        ...requestContext,
        operation: 'api_request_error',
        category: 'api',
      });

      // Créer une réponse d'erreur
      response = NextResponse.json(
        {
          error: 'Internal Server Error',
          requestId: requestContext.requestId,
        },
        { status: 500 }
      );
    }

    const duration = timer();
    const statusCode = response.status;

    // Créer contexte enrichi pour log de fin
    const endContext: LogContext = {
      ...requestContext,
      operation: 'api_request_end',
      category: 'api',
      statusCode,
      duration,
    };

    // Métriques de performance
    const metrics = {
      duration_ms: duration,
      status_code: statusCode,
      response_size_bytes: responseSize,
      memory_mb: process.memoryUsage().heapUsed / 1024 / 1024,
    };

    // Déterminer niveau de log selon performance et statut
    let logLevel: 'info' | 'warn' | 'error' = 'info';
    let message = `← ${req.method} ${pathname} ${statusCode} (${duration}ms)`;

    if (error || statusCode >= 500) {
      logLevel = 'error';
    } else if (statusCode >= 400) {
      logLevel = 'warn';
    } else if (duration > (opts.slowRequestThreshold ?? 2000)) {
      logLevel = 'warn';
      message = `🐌 SLOW REQUEST: ${message}`;
    }

    // Log de fin de requête
    if (logLevel === 'error') {
      logger.error(
        message,
        error instanceof Error ? error : undefined,
        endContext,
        metrics
      );
    } else {
      logger[logLevel](message, endContext, metrics);
    }

    // Log response body si activé
    if (opts.logResponseBody && statusCode >= 400) {
      try {
        const responseText = await response.clone().text();
        logger.debug('Response body', {
          ...requestContext,
          body: sanitizeResponseBody(responseText),
        });
      } catch (_error) {
        // Ignore les erreurs de parsing du body
      }
    }

    // Logs business spécialisés selon endpoint
    logBusinessMetrics(
      pathname,
      req.method,
      statusCode,
      duration,
      requestContext
    );

    // Ajouter headers de tracing
    response.headers.set(
      'X-Request-ID',
      (requestContext.requestId as string) ?? ''
    );
    response.headers.set('X-Response-Time', duration.toString());

    return response;
  };
}

/**
 * Sanitize request body pour logging sécurisé
 */
function sanitizeRequestBody(body: string): unknown {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (field in parsed) {
        parsed[field] = '[REDACTED]';
      }
    });

    return parsed;
  } catch {
    // Si pas du JSON, tronquer le string
    return body.length > 500 ? body.substring(0, 497) + '...' : body;
  }
}

/**
 * Sanitize response body pour logging sécurisé
 */
function sanitizeResponseBody(body: string): unknown {
  try {
    const parsed: unknown = JSON.parse(body);

    // Truncate si trop large
    const stringified = JSON.stringify(parsed);
    if (stringified.length > 1000) {
      return {
        truncated: true,
        preview: stringified.substring(0, 997) + '...',
      };
    }

    return parsed;
  } catch {
    return body.length > 500 ? body.substring(0, 497) + '...' : body;
  }
}

/**
 * Log de métriques business selon l'endpoint
 */
function logBusinessMetrics(
  pathname: string,
  _method: string,
  statusCode: number,
  duration: number,
  context: LogContext
) {
  // Catalogue endpoints
  if (pathname.startsWith('/api/catalogue')) {
    logger.business(
      'catalogue_api_usage',
      {
        ...context,
        category: 'business',
        resource: 'catalogue',
      },
      {
        response_time_ms: duration,
        success: statusCode < 400 ? 1 : 0,
      }
    );
  }

  // Feeds endpoints
  if (pathname.startsWith('/api/feeds/')) {
    const feedType = pathname.split('/').pop() ?? 'unknown';
    logger.business(
      'feed_api_usage',
      {
        ...context,
        category: 'business',
        resource: 'feed',
        feedType,
      },
      {
        generation_time_ms: duration,
        success: statusCode < 400 ? 1 : 0,
      }
    );
  }

  // Auth endpoints
  if (pathname.startsWith('/api/auth/')) {
    logger.security('auth_api_usage', {
      ...context,
      category: 'security',
      resource: 'auth',
    });
  }

  // Webhooks endpoints
  if (pathname.startsWith('/api/webhooks/')) {
    const source = pathname.split('/').pop() ?? 'unknown';
    logger.business(
      'webhook_received',
      {
        ...context,
        category: 'business',
        resource: 'webhook',
        source,
      },
      {
        processing_time_ms: duration,
        success: statusCode < 400 ? 1 : 0,
      }
    );
  }
}

/**
 * Middleware simple pour Route Handlers (app router)
 */
export function logApiRoute(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  options: LoggingOptions = {}
) {
  return withLogging(handler, options);
}

/**
 * Hook pour logging manuel dans les composants
 */
export function useApiLogger() {
  return {
    logApiCall: (
      endpoint: string,
      method: string,
      duration: number,
      success: boolean
    ) => {
      logger.business(
        'client_api_call',
        {
          operation: 'client_api_call',
          category: 'frontend',
          endpoint,
          method,
        },
        {
          duration_ms: duration,
          success: success ? 1 : 0,
        }
      );
    },

    logUserAction: (action: string, resource: string, context?: LogContext) => {
      logger.audit(action, resource, {
        ...context,
        category: 'user_action',
      });
    },
  };
}

export default withLogging;
