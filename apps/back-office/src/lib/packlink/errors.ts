/**
 * Packlink API Custom Errors
 * Date: 2025-11-12
 */

import type { PacklinkErrorResponse } from './types';

/**
 * Base Packlink Error
 */
export class PacklinkError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;
  public readonly response?: PacklinkErrorResponse;

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    response?: PacklinkErrorResponse
  ) {
    super(message);
    this.name = 'PacklinkError';
    this.code = code;
    this.statusCode = statusCode;
    this.response = response;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PacklinkError);
    }
  }
}

/**
 * Request Timeout Error
 */
export class PacklinkRequestTimeoutError extends PacklinkError {
  constructor(message = 'Packlink API request timed out') {
    super(message, 'REQUEST_TIMEOUT', 408);
    this.name = 'PacklinkRequestTimeoutError';
  }
}

/**
 * Rate Limit Error (429)
 */
export class PacklinkRateLimitError extends PacklinkError {
  public readonly retryAfter?: number; // Seconds to wait before retry

  constructor(
    message = 'Packlink API rate limit exceeded',
    retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'PacklinkRateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Validation Error (400)
 */
export class PacklinkValidationError extends PacklinkError {
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message = 'Packlink API validation failed',
    validationErrors?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'PacklinkValidationError';
    this.validationErrors = validationErrors;
  }
}

/**
 * Authentication Error (401)
 */
export class PacklinkAuthenticationError extends PacklinkError {
  constructor(message = 'Packlink API authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'PacklinkAuthenticationError';
  }
}

/**
 * Not Found Error (404)
 */
export class PacklinkNotFoundError extends PacklinkError {
  constructor(message = 'Packlink resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'PacklinkNotFoundError';
  }
}

/**
 * Server Error (500+)
 */
export class PacklinkServerError extends PacklinkError {
  constructor(message = 'Packlink API server error', statusCode = 500) {
    super(message, 'SERVER_ERROR', statusCode);
    this.name = 'PacklinkServerError';
  }
}

/**
 * Network Error (connection failed)
 */
export class PacklinkNetworkError extends PacklinkError {
  constructor(message = 'Packlink API network error') {
    super(message, 'NETWORK_ERROR');
    this.name = 'PacklinkNetworkError';
  }
}

/**
 * Parse Error Response Helper
 */
export function parsePacklinkError(
  error: unknown,
  statusCode?: number
): PacklinkError {
  // Already a PacklinkError
  if (error instanceof PacklinkError) {
    return error;
  }

  // Fetch/Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new PacklinkNetworkError(error.message);
  }

  // HTTP status code errors
  if (statusCode) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Packlink API error';

    switch (statusCode) {
      case 400:
        return new PacklinkValidationError(message);
      case 401:
        return new PacklinkAuthenticationError(message);
      case 404:
        return new PacklinkNotFoundError(message);
      case 429:
        return new PacklinkRateLimitError(message);
      case 408:
        return new PacklinkRequestTimeoutError(message);
      default:
        if (statusCode >= 500) {
          return new PacklinkServerError(message, statusCode);
        }
        return new PacklinkError(message, 'UNKNOWN_ERROR', statusCode);
    }
  }

  // Generic error
  const message =
    error instanceof Error ? error.message : 'Unknown Packlink error';
  return new PacklinkError(message);
}
