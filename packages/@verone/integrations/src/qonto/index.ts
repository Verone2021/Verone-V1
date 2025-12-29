/**
 * Qonto integration
 */

// Client class
export { QontoClient, getQontoClient } from './client';

// Errors
export * from './errors';

// Types - exclude QontoClient type alias to avoid conflict with class
export type {
  QontoAuthMode,
  QontoConfig,
  QontoHealthCheckResult,
  QontoBankAccount,
  QontoBalance,
  QontoTransactionStatus,
  QontoTransactionSide,
  QontoOperationType,
  QontoCounterparty,
  QontoAttachment,
  QontoTransaction,
  QontoApiResponse,
  QontoTransactionsResponse,
  QontoWebhookEvent,
  QontoWebhookPayload,
  GetTransactionsParams,
  MatchingStatus,
  BankTransaction,
  AutoMatchResult,
  QontoInvoiceStatus,
  QontoInvoiceItem,
  QontoClientInvoice,
  QontoClientAddress,
  QontoClientEntity,
  QontoLabel,
  // Params de création (corrigés selon doc Qonto)
  QontoPaymentMethods,
  QontoAmount,
  CreateClientInvoiceParams,
  CreateInvoiceItemParams,
  CreateClientParams,
  // Supplier invoices
  UploadSupplierInvoiceParams,
  QontoSupplierInvoice,
  UploadSupplierInvoicesResult,
  // Sync
  QontoSyncResult,
} from './types';
