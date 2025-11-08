// =====================================================================
// Types Abby API
// Date: 2025-10-11
// Description: Types TypeScript pour intégration Abby.fr
// =====================================================================

// =====================================================================
// CUSTOMER TYPES
// =====================================================================

export interface AbbyCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
  siret?: string;
  tvaNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
  siret?: string;
  tvaNumber?: string;
}

// =====================================================================
// INVOICE TYPES
// =====================================================================

export interface AbbyInvoice {
  id: string;
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  totalHT: number;
  totalTTC: number;
  tvaAmount: number;
  lines?: AbbyInvoiceLine[];
  createdAt: string;
  updatedAt: string;
}

export interface AbbyInvoiceLine {
  id?: string;
  description: string;
  quantity: number;
  unitPriceHT: number;
  tvaRate: number; // Pourcentage (ex: 20 pour 20%)
  totalHT?: number;
  totalTTC?: number;
}

export interface CreateInvoicePayload {
  customerId: string;
  invoiceDate: string;
  dueDate?: string;
  reference?: string; // Référence commande Vérone
  lines?: AbbyInvoiceLine[];
}

export interface AddInvoiceLinePayload {
  description: string;
  quantity: number;
  unitPriceHT: number;
  tvaRate: number;
}

// =====================================================================
// PAYMENT TYPES
// =====================================================================

export interface AbbyPayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  createdAt: string;
}

// =====================================================================
// WEBHOOK TYPES
// =====================================================================

export interface AbbyWebhookEvent {
  id: string; // Event ID unique pour idempotency
  type:
    | 'invoice.paid'
    | 'invoice.sent'
    | 'invoice.cancelled'
    | 'payment.received';
  data: {
    invoice?: AbbyInvoice;
    payment?: AbbyPayment;
    [key: string]: unknown;
  };
  createdAt: string;
}

// =====================================================================
// API RESPONSE TYPES
// =====================================================================

export interface AbbyApiResponse<T> {
  success: boolean;
  data?: T;
  error?: AbbyApiError;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
  };
}

export interface AbbyApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =====================================================================
// CLIENT CONFIG TYPES
// =====================================================================

export interface AbbyClientConfig {
  apiKey: string;
  baseUrl: string;
  companyId: string;
  timeout?: number; // En millisecondes (défaut: 10000)
  maxRetries?: number; // Défaut: 3
  retryDelay?: number; // Délai initial en ms (défaut: 1000)
}

// =====================================================================
// RETRY LOGIC TYPES
// =====================================================================

export interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

export interface RetryState {
  attempt: number;
  lastError?: Error;
  nextRetryAt?: Date;
}
