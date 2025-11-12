/**
 * Token Bucket Rate Limiter for Packlink API
 * Algorithm: Token Bucket (100 requests/minute conservateur)
 * Date: 2025-11-12
 *
 * Note: Packlink n'a pas documenté ses rate limits publiquement.
 * Nous utilisons un limite conservatrice de 100 req/min.
 */

export interface RateLimiterConfig {
  maxTokens: number; // Maximum tokens dans le bucket
  refillRate: number; // Tokens ajoutés par seconde
  refillInterval: number; // Intervalle refill (ms)
}

export class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly refillInterval: number;
  private lastRefillTime: number;
  private refillTimer?: NodeJS.Timeout;

  constructor(config?: Partial<RateLimiterConfig>) {
    // Defaults: 100 req/min = 1.67 req/sec
    this.maxTokens = config?.maxTokens ?? 100;
    this.refillRate = config?.refillRate ?? 1.67; // tokens/sec
    this.refillInterval = config?.refillInterval ?? 1000; // 1 sec

    this.tokens = this.maxTokens; // Start with full bucket
    this.lastRefillTime = Date.now();

    // Start refill timer
    this.startRefillTimer();
  }

  /**
   * Start automatic token refill timer
   */
  private startRefillTimer(): void {
    this.refillTimer = setInterval(() => {
      this.refill();
    }, this.refillInterval);

    // Prevent timer from keeping process alive
    if (this.refillTimer.unref) {
      this.refillTimer.unref();
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  /**
   * Try to consume 1 token
   * Returns true if successful, false if rate limit exceeded
   */
  public tryConsume(): boolean {
    this.refill(); // Update tokens before check

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false; // Rate limit exceeded
  }

  /**
   * Wait until a token is available
   * Returns Promise that resolves when token acquired
   */
  public async waitForToken(): Promise<void> {
    if (this.tryConsume()) {
      return; // Token available immediately
    }

    // Calculate wait time for next token
    const tokensNeeded = 1 - this.tokens;
    const waitTimeMs = Math.ceil((tokensNeeded / this.refillRate) * 1000);

    await new Promise(resolve => setTimeout(resolve, waitTimeMs));

    // Try again after wait
    await this.waitForToken();
  }

  /**
   * Get current tokens available
   */
  public getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Reset rate limiter (useful for testing)
   */
  public reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefillTime = Date.now();
  }

  /**
   * Stop refill timer
   */
  public destroy(): void {
    if (this.refillTimer) {
      clearInterval(this.refillTimer);
      this.refillTimer = undefined;
    }
  }
}

/**
 * Global rate limiter instance for Packlink API
 * Shared across all requests to enforce global limit
 */
let globalRateLimiter: RateLimiter | null = null;

/**
 * Get or create global rate limiter instance
 */
export function getGlobalRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter({
      maxTokens: 100, // 100 requests max
      refillRate: 1.67, // 100 per minute = 1.67 per second
      refillInterval: 1000, // Refill every second
    });
  }
  return globalRateLimiter;
}

/**
 * Reset global rate limiter (useful for testing)
 */
export function resetGlobalRateLimiter(): void {
  if (globalRateLimiter) {
    globalRateLimiter.destroy();
    globalRateLimiter = null;
  }
}
