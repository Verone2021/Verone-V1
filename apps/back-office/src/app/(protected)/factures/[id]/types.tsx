'use client';

// =====================================================================
// TYPES & HELPERS — Document Detail
// =====================================================================

export type DocumentType = 'invoice' | 'quote' | 'credit_note';

export interface QontoApiResponse {
  success: boolean;
  error?: string;
  invoice?: QontoDocument;
  quote?: QontoDocument;
  credit_note?: QontoDocument;
  localData?: {
    billing_address?: Record<string, unknown>;
    shipping_address?: Record<string, unknown>;
    sales_order_id?: string | null;
    order_number?: string | null;
    partner_legal_name?: string | null;
    partner_trade_name?: string | null;
  } | null;
}

export interface QontoClient {
  id: string;
  name: string;
  email?: string;
  billing_address?: {
    street_address?: string;
    city?: string;
    zip_code?: string;
    country_code?: string;
  };
}

export interface QontoInvoiceItem {
  title: string;
  description?: string;
  quantity: string;
  unit?: string;
  unit_price: { value: string; currency: string };
  vat_rate: string;
  total_amount?: { value: string; currency: string };
}

export interface QontoDocument {
  id: string;
  number?: string;
  // Common fields
  status: string;
  currency: string;
  issue_date: string;
  client_id: string;
  client?: QontoClient;
  items?: QontoInvoiceItem[];
  pdf_url?: string;
  attachment_id?: string;
  public_url?: string;
  created_at: string;
  updated_at: string;
  // Invoice specific
  invoice_number?: string;
  payment_deadline?: string;
  total_amount_cents?: number;
  total_vat_amount_cents?: number;
  subtotal_amount_cents?: number;
  paid_at?: string;
  finalized_at?: string;
  cancelled_at?: string;
  // Quote specific
  quote_number?: string;
  expiry_date?: string;
  converted_to_invoice_id?: string;
  accepted_at?: string;
  declined_at?: string;
  // Credit note specific
  credit_note_number?: string;
  invoice_id?: string;
  reason?: string;
}

// =====================================================================
// HELPERS
// =====================================================================

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatAmount(
  cents: number | undefined,
  currency = 'EUR'
): string {
  if (cents === undefined || cents === null) return '-';
  const amount = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatVatRate(vatRate: string | number | undefined): string {
  if (vatRate === undefined || vatRate === null) return '-';
  // Qonto returns vat_rate as decimal (e.g., "0.20" for 20%)
  const rate = typeof vatRate === 'string' ? parseFloat(vatRate) : vatRate;
  // If rate is less than 1, it's a decimal - multiply by 100
  const percentage = rate < 1 ? rate * 100 : rate;
  return `${percentage.toFixed(percentage % 1 === 0 ? 0 : 1)}%`;
}

// Calculate totals from items if not provided by API
export function calculateTotalsFromItems(items: QontoInvoiceItem[]): {
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
} {
  let subtotalCents = 0;
  let vatCents = 0;

  for (const item of items) {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price?.value ?? '0');
    const vatRate = parseFloat(item.vat_rate ?? '0');

    const itemSubtotal = quantity * unitPrice;
    // vatRate is decimal (0.20 for 20%)
    const itemVat = itemSubtotal * vatRate;

    subtotalCents += Math.round(itemSubtotal * 100);
    vatCents += Math.round(itemVat * 100);
  }

  return {
    subtotalCents,
    vatCents,
    totalCents: subtotalCents + vatCents,
  };
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('422') || msg.includes('unprocessable'))
      return 'Action impossible : le document est dans un état incompatible avec cette opération.';
    if (msg.includes('404') || msg.includes('not found'))
      return 'Document introuvable.';
    if (msg.includes('403') || msg.includes('forbidden'))
      return "Vous n'avez pas les permissions pour cette action.";
    return msg;
  }
  return 'Erreur inconnue';
}

export function isTechnicalEmail(email: string): boolean {
  return (
    email.endsWith('@notprovided.qonto.com') ||
    email.endsWith('@placeholder.qonto.com') ||
    email === 'noreply@qonto.com'
  );
}

export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    invoice: 'Facture',
    quote: 'Devis',
    credit_note: 'Avoir',
  };
  return labels[type] ?? type;
}

export function getDocumentNumber(
  doc: QontoDocument,
  type: DocumentType
): string {
  switch (type) {
    case 'invoice':
      return doc.number ?? doc.invoice_number ?? doc.id;
    case 'quote':
      return doc.number ?? doc.quote_number ?? doc.id;
    case 'credit_note':
      return doc.number ?? doc.credit_note_number ?? doc.id;
    default:
      return doc.number ?? doc.id;
  }
}

// =====================================================================
// SHARED UI COMPONENT
// =====================================================================

import React from 'react';

export function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900">{children}</span>
    </div>
  );
}
