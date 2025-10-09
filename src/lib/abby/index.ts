// =====================================================================
// Abby API - Index Exports
// Date: 2025-10-11
// Description: Exports centralisés pour module Abby
// =====================================================================

// Client
export { AbbyClient, getAbbyClient } from './client';
export type { default as AbbyClientClass } from './client';

// Types
export type {
  AbbyCustomer,
  CreateCustomerPayload,
  AbbyInvoice,
  AbbyInvoiceLine,
  CreateInvoicePayload,
  AddInvoiceLinePayload,
  AbbyPayment,
  AbbyWebhookEvent,
  AbbyApiResponse,
  AbbyApiError,
  AbbyClientConfig,
  RetryOptions,
  RetryState,
} from './types';

// Errors
export {
  AbbyError,
  AbbyAuthenticationError,
  AbbyRateLimitError,
  AbbyValidationError,
  AbbyNotFoundError,
  AbbyNetworkError,
  AbbyTimeoutError,
  AbbyRetryExhaustedError,
  createAbbyErrorFromResponse,
  shouldRetryError,
} from './errors';
