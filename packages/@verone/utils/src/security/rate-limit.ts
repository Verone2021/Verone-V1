/**
 * Rate Limiting - Verone Security Layer
 *
 * Sliding window rate limiter with support for:
 * - In-memory storage (development/single instance)
 * - Upstash Redis (production/serverless) - requires @upstash/ratelimit
 *
 * @see https://upstash.com/docs/oss/sdks/ts/ratelimit/overview
 */

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  /** Whether the request should be allowed */
  success: boolean;
  /** Max requests allowed */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** Unix timestamp (ms) when the window resets */
  reset: number;
  /** Headers to include in response */
  headers: Record<string, string>;
}

// In-memory store for development/single-instance
// In production with multiple instances, use Upstash Redis
const memoryStore = new Map<string, { tokens: number; lastRefill: number }>();

// Default configurations per endpoint type
export const RATE_LIMIT_PRESETS = {
  /** Strict limit for auth endpoints (prevent brute force) */
  auth: { limit: 5, windowSeconds: 60 },
  /** Standard API limit */
  api: { limit: 60, windowSeconds: 60 },
  /** Relaxed limit for read-only endpoints */
  read: { limit: 120, windowSeconds: 60 },
  /** Very strict for sensitive operations */
  sensitive: { limit: 3, windowSeconds: 60 },
  /** Webhook endpoints (external callers) */
  webhook: { limit: 30, windowSeconds: 60 },
} as const;

/**
 * Check rate limit for an identifier (IP, user ID, etc.)
 *
 * Uses sliding window algorithm for smooth rate limiting
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_PRESETS.api
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = `${identifier}:${config.limit}:${config.windowSeconds}`;

  // Get or initialize bucket
  let bucket = memoryStore.get(key);

  if (!bucket) {
    bucket = { tokens: config.limit, lastRefill: now };
    memoryStore.set(key, bucket);
  }

  // Calculate tokens to add based on time elapsed (sliding window)
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((elapsed / windowMs) * config.limit);

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(config.limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Check if we have tokens available
  const success = bucket.tokens > 0;
  const remaining = Math.max(0, bucket.tokens - (success ? 1 : 0));
  const reset = bucket.lastRefill + windowMs;

  // Consume token if allowed
  if (success) {
    bucket.tokens--;
  }

  // Cleanup old entries periodically (every 100th call)
  if (Math.random() < 0.01) {
    cleanupMemoryStore(windowMs);
  }

  return {
    success,
    limit: config.limit,
    remaining,
    reset,
    headers: {
      'X-RateLimit-Limit': config.limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(reset / 1000).toString(),
      ...(success ? {} : { 'Retry-After': config.windowSeconds.toString() }),
    },
  };
}

/**
 * Cleanup expired entries from memory store
 */
function cleanupMemoryStore(windowMs: number) {
  const now = Date.now();
  const expiry = now - windowMs * 2; // Keep entries for 2x window duration

  for (const [key, value] of memoryStore.entries()) {
    if (value.lastRefill < expiry) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Extract client identifier from request
 * Priority: User ID > X-Forwarded-For > X-Real-IP > 'anonymous'
 */
export function getClientIdentifier(
  request: Request,
  userId?: string | null
): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP from headers (behind proxy/load balancer)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (client IP)
    const clientIp = forwardedFor.split(',')[0].trim();
    return `ip:${clientIp}`;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp}`;
  }

  return 'ip:anonymous';
}

/**
 * Rate limit middleware wrapper for API routes
 *
 * Usage:
 * ```ts
 * export async function POST(request: Request) {
 *   const rateLimitResult = await withRateLimit(request, RATE_LIMIT_PRESETS.auth);
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *
 *   // Your handler logic here...
 * }
 * ```
 */
export function withRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMIT_PRESETS.api,
  userId?: string | null
):
  | {
      success: true;
      result: RateLimitResult;
    }
  | {
      success: false;
      response: Response;
      result: RateLimitResult;
    } {
  const identifier = getClientIdentifier(request, userId);
  const result = checkRateLimit(identifier, config);

  if (!result.success) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: config.windowSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...result.headers,
          },
        }
      ),
      result,
    };
  }

  return { success: true, result };
}

/**
 * Get current rate limit store size (for monitoring)
 */
export function getRateLimitStoreSize(): number {
  return memoryStore.size;
}

/**
 * Clear rate limit store (for testing)
 */
export function clearRateLimitStore(): void {
  memoryStore.clear();
}
