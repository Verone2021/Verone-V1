/**
 * Helpers pour POST /api/qonto/invoices/by-order/[orderId]/regenerate-proforma
 */

import type { Database, Json } from '@verone/types';
import type { ISalesOrderWithCustomer, IFeesData } from '../../../_lib/types';

// ---------------------------------------------------------------------------
// Calcul totaux (round-per-line, R1)
// ---------------------------------------------------------------------------

export interface IInvoiceItemTotals {
  unit_price_ht?: number;
  quantity_num?: number;
  vat_rate_num?: number;
}

export function computeProformaTotals(items: IInvoiceItemTotals[]): {
  totalHt: number;
  totalVat: number;
  totalTtc: number;
} {
  let totalHt = 0;
  let totalVat = 0;
  for (const item of items) {
    const lineHt = (item.unit_price_ht ?? 0) * (item.quantity_num ?? 1);
    const lineVat = Math.round(lineHt * (item.vat_rate_num ?? 0.2) * 100) / 100;
    totalHt += lineHt;
    totalVat += lineVat;
  }
  return { totalHt, totalVat, totalTtc: totalHt + totalVat };
}

// ---------------------------------------------------------------------------
// Construction payload insertion locale financial_documents
// ---------------------------------------------------------------------------

export interface IBuildProformaPayloadParams {
  orderId: string;
  typedOrder: ISalesOrderWithCustomer;
  invoice: { id: string; pdf_url?: string | null; public_url?: string | null };
  issueDate: string;
  dueDate: string;
  totalHt: number;
  totalTtc: number;
  totalVat: number;
  partnerId: string;
  currentUserId: string;
  fees: IFeesData | undefined;
  billingAddress?: {
    address_line1?: string;
    address_line2?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  };
  shippingAddress?: {
    address_line1?: string;
    address_line2?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  };
  preservedNotes: string | undefined;
}

export function buildProformaInsertPayload(
  p: IBuildProformaPayloadParams
): Database['public']['Tables']['financial_documents']['Insert'] {
  return {
    document_type: 'customer_invoice',
    document_direction: 'inbound',
    document_number: `PROFORMA-${p.typedOrder.order_number}`,
    partner_id: p.partnerId,
    partner_type: 'customer',
    document_date: p.issueDate,
    due_date: p.dueDate,
    total_ht: p.totalHt,
    total_ttc: p.totalTtc,
    tva_amount: p.totalVat,
    amount_paid: 0,
    status: 'draft',
    sales_order_id: p.orderId,
    qonto_invoice_id: p.invoice.id,
    qonto_pdf_url: p.invoice.pdf_url ?? null,
    qonto_public_url: p.invoice.public_url ?? null,
    synchronized_at: new Date().toISOString(),
    created_by: p.currentUserId,
    billing_address: (p.billingAddress ?? p.typedOrder.billing_address) as Json,
    shipping_address: (p.shippingAddress ??
      p.typedOrder.shipping_address) as Json,
    shipping_cost_ht:
      p.fees?.shipping_cost_ht ?? p.typedOrder.shipping_cost_ht ?? 0,
    handling_cost_ht:
      p.fees?.handling_cost_ht ?? p.typedOrder.handling_cost_ht ?? 0,
    insurance_cost_ht:
      p.fees?.insurance_cost_ht ?? p.typedOrder.insurance_cost_ht ?? 0,
    fees_vat_rate: p.fees?.fees_vat_rate ?? p.typedOrder.fees_vat_rate ?? 0.2,
    billing_contact_id: p.typedOrder.billing_contact_id ?? null,
    delivery_contact_id: p.typedOrder.delivery_contact_id ?? null,
    responsable_contact_id: p.typedOrder.responsable_contact_id ?? null,
    notes: p.preservedNotes ?? null,
  };
}
