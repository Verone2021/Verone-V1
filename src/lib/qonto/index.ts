// =====================================================================
// Qonto Library - Exports
// Date: 2025-10-11
// Description: Point d'entrée unique pour intégration Qonto Banking API
// =====================================================================

// Client HTTP
export { QontoClient, getQontoClient } from './client';

// Types
export type {
  QontoConfig,
  QontoBankAccount,
  QontoBalance,
  QontoTransaction,
  QontoTransactionStatus,
  QontoTransactionSide,
  QontoOperationType,
  QontoCounterparty,
  QontoAttachment,
  QontoApiResponse,
  QontoTransactionsResponse,
  QontoWebhookEvent,
  QontoWebhookPayload,
  GetTransactionsParams,
  MatchingStatus,
  BankTransaction,
  AutoMatchResult,
} from './types';

// Erreurs
export { QontoError, createQontoErrorFromResponse, isQontoError } from './errors';
export type { QontoErrorCode } from './errors';
