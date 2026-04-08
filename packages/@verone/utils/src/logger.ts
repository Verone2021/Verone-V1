/**
 * 📊 D-Log Style Logging System - Vérone Back Office
 *
 * Système de logging structuré inspiré des bonnes pratiques D-Log :
 * - Logs structurés JSON pour parsing automatique
 * - Niveaux hiérarchisés avec contexte business
 * - Métadonnées enrichies pour debugging et monitoring
 * - Performance tracking et business metrics
 * - Sécurité : pas de données sensibles dans les logs
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogContext = {
  // Business Context
  userId?: string;
  organisationId?: string;
  sessionId?: string;

  // Technical Context
  requestId?: string;
  traceId?: string;
  userAgent?: string;
  ip?: string;

  // Performance Context
  duration?: number;
  memory?: number;

  // Business Operations
  operation?: string;
  resource?: string;
  action?: string;

  // Additional metadata
  [key: string]: unknown;
};

export interface LogEntry {
  // Core fields
  timestamp: string;
  level: LogLevel;
  message: string;

  // Context
  context?: LogContext;

  // Error details
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };

  // Metrics
  metrics?: {
    [key: string]: number | string;
  };

  // Environment
  environment: 'development' | 'staging' | 'production';
  service: string;
  version: string;
}

class VeroneLogger {
  private serviceName: string;
  private environment: string;
  private version: string;

  constructor() {
    this.serviceName = 'verone-back-office';
    this.environment =
      (process.env.NODE_ENV as LogEntry['environment'] | undefined) ??
      'development';
    this.version = process.env.npm_package_version ?? '1.0.0';
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    metrics?: Record<string, number | string>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: this.environment as LogEntry['environment'],
      service: this.serviceName,
      version: this.version,
    };

    if (context) {
      // Sanitize context - remove sensitive data
      const sanitizedContext = this.sanitizeContext(context);
      entry.context = sanitizedContext;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.environment !== 'production' ? error.stack : undefined,
        code: (error as Error & { code?: string }).code,
      };
    }

    if (metrics) {
      entry.metrics = metrics;
    }

    return entry;
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'apiKey',
      'authorization',
      'cookie',
      'session',
    ];

    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    // Truncate long strings
    Object.keys(sanitized).forEach(key => {
      const val = sanitized[key];
      if (typeof val === 'string' && val.length > 1000) {
        sanitized[key] = val.substring(0, 997) + '...';
      }
    });

    return sanitized;
  }

  private output(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    // Dispatch vers la bonne méthode console selon le niveau
    const consoleMethod: 'debug' | 'info' | 'warn' | 'error' =
      entry.level === 'debug'
        ? 'debug'
        : entry.level === 'info'
          ? 'info'
          : entry.level === 'warn'
            ? 'warn'
            : 'error';

    // En development, output lisible
    if (this.environment === 'development') {
      const emoji = this.getLevelEmoji(entry.level);
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      // eslint-disable-next-line no-console
      console[consoleMethod](
        `${emoji} ${timestamp} [${entry.level.toUpperCase()}] ${entry.message}`
      );

      if (entry.context) {
        // eslint-disable-next-line no-console
        console[consoleMethod]('  Context:', entry.context);
      }

      if (entry.error) {
        console.error('  Error:', entry.error.name, entry.error.message);
        if (entry.error.stack) {
          console.error('  Stack:', entry.error.stack);
        }
      }

      if (entry.metrics) {
        // eslint-disable-next-line no-console
        console[consoleMethod]('  Metrics:', entry.metrics);
      }
    } else {
      // En production, JSON structuré pour parsing
      // eslint-disable-next-line no-console
      console[consoleMethod](logString);
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      fatal: '💀',
    };
    return emojis[level] || 'ℹ️';
  }

  // Public logging methods
  debug(
    message: string,
    context?: LogContext,
    metrics?: Record<string, number | string>
  ): void {
    const entry = this.createLogEntry(
      'debug',
      message,
      context,
      undefined,
      metrics
    );
    this.output(entry);
  }

  info(
    message: string,
    context?: LogContext,
    metrics?: Record<string, number | string>
  ): void {
    const entry = this.createLogEntry(
      'info',
      message,
      context,
      undefined,
      metrics
    );
    this.output(entry);
  }

  warn(
    message: string,
    context?: LogContext,
    metrics?: Record<string, number | string>
  ): void {
    const entry = this.createLogEntry(
      'warn',
      message,
      context,
      undefined,
      metrics
    );
    this.output(entry);
  }

  error(
    message: string,
    error?: Error,
    context?: LogContext,
    metrics?: Record<string, number | string>
  ): void {
    const entry = this.createLogEntry(
      'error',
      message,
      context,
      error,
      metrics
    );
    this.output(entry);
  }

  fatal(
    message: string,
    error?: Error,
    context?: LogContext,
    metrics?: Record<string, number | string>
  ): void {
    const entry = this.createLogEntry(
      'fatal',
      message,
      context,
      error,
      metrics
    );
    this.output(entry);
  }

  // Business-specific logging methods
  business(
    operation: string,
    context?: LogContext,
    metrics?: Record<string, number | string>
  ): void {
    const businessContext = {
      ...context,
      operation,
      category: 'business',
    };

    this.info(`Business Operation: ${operation}`, businessContext, metrics);
  }

  performance(operation: string, duration: number, context?: LogContext): void {
    const perfContext = {
      ...context,
      operation,
      category: 'performance',
    };

    const metrics = {
      duration_ms: duration,
      memory_mb: process.memoryUsage().heapUsed / 1024 / 1024,
    };

    // Log warning si performance dégradée
    if (duration > 2000) {
      this.warn(
        `Slow Operation: ${operation} took ${duration}ms`,
        perfContext,
        metrics
      );
    } else {
      this.info(`Performance: ${operation}`, perfContext, metrics);
    }
  }

  security(event: string, context?: LogContext): void {
    const securityContext = {
      ...context,
      category: 'security',
      event,
    };

    this.warn(`Security Event: ${event}`, securityContext);
  }

  audit(action: string, resource: string, context?: LogContext): void {
    const auditContext = {
      ...context,
      category: 'audit',
      action,
      resource,
    };

    this.info(`Audit: ${action} on ${resource}`, auditContext);
  }

  // Méthodes utilitaires pour middleware
  startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }

  // Helper pour créer le contexte depuis une requête
  createRequestContext(req: {
    headers:
      | Record<string, string | undefined>
      | { get?: (name: string) => string | null };
    method?: string;
    url?: string;
    connection?: { remoteAddress?: string };
  }): LogContext {
    const getHeader = (name: string): string | undefined => {
      if ('get' in req.headers && typeof req.headers.get === 'function') {
        return req.headers.get(name) ?? undefined;
      }
      return (req.headers as Record<string, string | undefined>)[name];
    };
    return {
      requestId: getHeader('x-request-id') ?? crypto.randomUUID(),
      userAgent: getHeader('user-agent'),
      ip: getHeader('x-forwarded-for') ?? req.connection?.remoteAddress,
      method: req.method,
      url: req.url,
      sessionId: getHeader('x-session-id'),
    };
  }
}

// Instance singleton
export const logger = new VeroneLogger();

// Helper functions
export const createBusinessMetrics = (
  catalogueViews?: number,
  feedGenerations?: number,
  pdfExports?: number,
  customMetrics?: Record<string, number>
) => ({
  catalogue_views: catalogueViews,
  feed_generations: feedGenerations,
  pdf_exports: pdfExports,
  ...customMetrics,
});

export const createPerformanceMetrics = (
  responseTime?: number,
  dbQueries?: number,
  cacheHits?: number,
  customMetrics?: Record<string, number>
) => ({
  response_time_ms: responseTime,
  db_queries: dbQueries,
  cache_hits: cacheHits,
  ...customMetrics,
});

// Business-specific loggers
export const catalogueLogger = {
  productViewed: (productId: string, userId?: string) => {
    logger.business('product_viewed', {
      userId,
      resource: 'product',
      productId,
    });
  },

  collectionGenerated: (
    collectionId: string,
    productCount: number,
    userId?: string
  ) => {
    logger.business(
      'collection_generated',
      {
        userId,
        resource: 'collection',
        collectionId,
      },
      {
        product_count: productCount,
      }
    );
  },

  feedGenerated: (feedType: string, productCount: number, duration: number) => {
    logger.business(
      'feed_generated',
      {
        operation: 'generate_feed',
        feedType,
      },
      {
        product_count: productCount,
        generation_time_ms: duration,
      }
    );
  },

  pdfExported: (
    collectionId: string,
    productCount: number,
    duration: number
  ) => {
    logger.business(
      'pdf_exported',
      {
        operation: 'export_pdf',
        collectionId,
      },
      {
        product_count: productCount,
        export_time_ms: duration,
      }
    );
  },
};

export default logger;
