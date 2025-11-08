// =====================================================================
// Erreurs Custom Abby API
// Date: 2025-10-11
// Description: Custom errors pour intégration Abby.fr
// =====================================================================

import type { AbbyApiError } from './types';

// =====================================================================
// BASE ABBY ERROR
// =====================================================================

export class AbbyError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'ABBY_ERROR',
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AbbyError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintenir stack trace correct
    Object.setPrototypeOf(this, AbbyError.prototype);
  }

  static fromApiError(apiError: AbbyApiError, statusCode?: number): AbbyError {
    return new AbbyError(
      apiError.message,
      apiError.code,
      statusCode,
      apiError.details
    );
  }
}

// =====================================================================
// AUTHENTICATION ERROR
// =====================================================================

export class AbbyAuthenticationError extends AbbyError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'ABBY_AUTH_ERROR', 401);
    this.name = 'AbbyAuthenticationError';
    Object.setPrototypeOf(this, AbbyAuthenticationError.prototype);
  }
}

// =====================================================================
// RATE LIMIT ERROR
// =====================================================================

export class AbbyRateLimitError extends AbbyError {
  public readonly retryAfter?: number; // Secondes avant retry

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'ABBY_RATE_LIMIT', 429);
    this.name = 'AbbyRateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, AbbyRateLimitError.prototype);
  }
}

// =====================================================================
// VALIDATION ERROR
// =====================================================================

export class AbbyValidationError extends AbbyError {
  constructor(
    message: string = 'Validation failed',
    details?: Record<string, unknown>
  ) {
    super(message, 'ABBY_VALIDATION_ERROR', 400, details);
    this.name = 'AbbyValidationError';
    Object.setPrototypeOf(this, AbbyValidationError.prototype);
  }
}

// =====================================================================
// NOT FOUND ERROR
// =====================================================================

export class AbbyNotFoundError extends AbbyError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'ABBY_NOT_FOUND', 404);
    this.name = 'AbbyNotFoundError';
    Object.setPrototypeOf(this, AbbyNotFoundError.prototype);
  }
}

// =====================================================================
// NETWORK ERROR
// =====================================================================

export class AbbyNetworkError extends AbbyError {
  constructor(message: string = 'Network error', originalError?: Error) {
    super(message, 'ABBY_NETWORK_ERROR', undefined, {
      originalError: originalError?.message,
    });
    this.name = 'AbbyNetworkError';
    Object.setPrototypeOf(this, AbbyNetworkError.prototype);
  }
}

// =====================================================================
// TIMEOUT ERROR
// =====================================================================

export class AbbyTimeoutError extends AbbyError {
  constructor(timeout: number) {
    super(`Request timeout after ${timeout}ms`, 'ABBY_TIMEOUT', 408);
    this.name = 'AbbyTimeoutError';
    Object.setPrototypeOf(this, AbbyTimeoutError.prototype);
  }
}

// =====================================================================
// RETRY EXHAUSTED ERROR
// =====================================================================

export class AbbyRetryExhaustedError extends AbbyError {
  public readonly attempts: number;
  public readonly lastError?: Error;

  constructor(attempts: number, lastError?: Error) {
    super(
      `Max retries (${attempts}) exhausted. Last error: ${lastError?.message}`,
      'ABBY_RETRY_EXHAUSTED'
    );
    this.name = 'AbbyRetryExhaustedError';
    this.attempts = attempts;
    this.lastError = lastError;
    Object.setPrototypeOf(this, AbbyRetryExhaustedError.prototype);
  }
}

// =====================================================================
// HELPER: ERROR FACTORY
// =====================================================================

export function createAbbyErrorFromResponse(
  statusCode: number,
  data: unknown
): AbbyError {
  // Si data contient une structure AbbyApiError
  if (
    typeof data === 'object' &&
    data !== null &&
    'code' in data &&
    'message' in data
  ) {
    const apiError = data as AbbyApiError;

    // Mapper codes spécifiques
    switch (apiError.code) {
      case 'UNAUTHORIZED':
      case 'INVALID_API_KEY':
        return new AbbyAuthenticationError(apiError.message);

      case 'VALIDATION_ERROR':
      case 'INVALID_PAYLOAD':
        return new AbbyValidationError(apiError.message, apiError.details);

      case 'NOT_FOUND':
      case 'RESOURCE_NOT_FOUND':
        return new AbbyNotFoundError(apiError.message);

      case 'RATE_LIMIT_EXCEEDED':
        return new AbbyRateLimitError(apiError.message);

      default:
        return AbbyError.fromApiError(apiError, statusCode);
    }
  }

  // Fallback: erreur générique basée sur status code
  switch (statusCode) {
    case 401:
      return new AbbyAuthenticationError();
    case 404:
      return new AbbyNotFoundError();
    case 429:
      return new AbbyRateLimitError();
    case 400:
      return new AbbyValidationError();
    default:
      return new AbbyError(
        `Request failed with status ${statusCode}`,
        'ABBY_HTTP_ERROR',
        statusCode
      );
  }
}

// =====================================================================
// HELPER: SHOULD RETRY?
// =====================================================================

export function shouldRetryError(error: unknown): boolean {
  // Retry sur erreurs réseau
  if (error instanceof AbbyNetworkError) return true;

  // Retry sur timeout
  if (error instanceof AbbyTimeoutError) return true;

  // Retry sur rate limit (après délai)
  if (error instanceof AbbyRateLimitError) return true;

  // Retry sur 5xx (erreurs serveur)
  if (error instanceof AbbyError && error.statusCode) {
    return error.statusCode >= 500 && error.statusCode < 600;
  }

  return false;
}
