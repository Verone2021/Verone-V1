/**
 * 🏥 Health Check API - Vérone Back Office
 *
 * Endpoint de vérification de santé système pour monitoring et alerting.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@verone/utils/logger';
import { withLogging } from '@/lib/middleware/logging';

async function healthCheck(req: NextRequest) {
  const startTime = Date.now();

  // Vérification santé système
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'verone-back-office',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      memory: {
        status: 'healthy',
        usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        limit_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      uptime: {
        status: 'healthy',
        seconds: Math.floor(process.uptime()),
      },
    },
  };

  // Vérification mémoire critique
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  if (memoryUsage > 500) {
    // 500MB limite
    health.checks.memory.status = 'caution';
    health.status = 'caution';
  }

  const responseTime = Date.now() - startTime;

  // Log health check avec métriques
  logger.info(
    'Health check completed',
    {
      operation: 'health_check',
      category: 'system',
    },
    {
      response_time_ms: responseTime,
      memory_usage_mb: memoryUsage,
      uptime_seconds: process.uptime(),
    }
  );

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Check': 'true',
    },
  });
}

// Export avec middleware de logging (mais exclu des logs verbeux)
export const GET = withLogging(healthCheck, {
  excludePaths: ['/api/health'],
});

export const HEAD = GET;
