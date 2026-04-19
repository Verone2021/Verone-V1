/**
 * DB persistence for POST /api/qonto/quotes
 * Extracted from route.context.ts to comply with 400-line rule.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@verone/types';

import { generateLocalDocNumber } from './route.helpers';
import type { IQuoteItem, IFeesData } from './route.helpers';

export interface ISaveLocalDbAddress {
  address_line1?: string;
  postal_code?: string;
  city?: string;
  country?: string;
}

export interface ISaveLocalDbParams {
  supabase: SupabaseClient;
  userId: string;
  items: IQuoteItem[];
  quoteId: string;
  pdfUrl: string | null | undefined;
  publicUrl: string | null | undefined;
  issueDate: string;
  expiryDate: string;
  consultationId: string | undefined;
  salesOrderId: string | undefined;
  customerId: string | undefined;
  standaloneCustomerId: string | undefined;
  fees: IFeesData | undefined;
  billingAddress?: ISaveLocalDbAddress;
  shippingAddress?: ISaveLocalDbAddress;
}

export async function saveQuoteToLocalDb(
  params: ISaveLocalDbParams
): Promise<string | null> {
  const {
    supabase,
    userId,
    items,
    quoteId,
    pdfUrl,
    publicUrl,
    issueDate,
    expiryDate,
    consultationId,
    salesOrderId,
    customerId,
    standaloneCustomerId,
    fees,
    billingAddress,
    shippingAddress,
  } = params;

  type FinancialDocumentInsert =
    Database['public']['Tables']['financial_documents']['Insert'];

  // Calcul ligne par ligne — round-per-line (aligné R1 finance.md + migration round_per_line)
  // JAMAIS avgVat (sum/count) : divergence garantie avec multi-taux TVA
  let totalHt = 0;
  let tva = 0;
  for (const item of items) {
    const qty = parseFloat(item.quantity) || 0;
    const unit = parseFloat(item.unitPrice.value) || 0;
    const vatRate = parseFloat(item.vatRate) || 0.2;
    const lineHt = qty * unit;
    const lineTva = Math.round(lineHt * vatRate * 100) / 100;
    totalHt += lineHt;
    tva += lineTva;
  }
  const localDocNumber = generateLocalDocNumber();

  const payload: FinancialDocumentInsert = {
    document_type: 'customer_quote',
    document_direction: 'inbound',
    partner_id: standaloneCustomerId ?? customerId ?? userId,
    partner_type: 'customer',
    document_number: localDocNumber,
    document_date: issueDate,
    due_date: expiryDate,
    validity_date: expiryDate,
    total_ht: totalHt,
    total_ttc: totalHt + tva,
    tva_amount: tva,
    status: 'draft',
    quote_status: 'draft',
    qonto_invoice_id: quoteId,
    qonto_pdf_url: pdfUrl ?? null,
    qonto_public_url: publicUrl ?? null,
    consultation_id: consultationId ?? null,
    sales_order_id: salesOrderId ?? null,
    created_by: userId,
    shipping_cost_ht: fees?.shipping_cost_ht ?? 0,
    handling_cost_ht: fees?.handling_cost_ht ?? 0,
    insurance_cost_ht: fees?.insurance_cost_ht ?? 0,
    fees_vat_rate: fees?.fees_vat_rate ?? 0.2,
    billing_address: (billingAddress ?? null) as Json | null,
    shipping_address: (shippingAddress ?? null) as Json | null,
  };

  const { data: rawDoc, error } = await supabase
    .from('financial_documents')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    console.error('[API Qonto Quotes] Failed to save to local DB:', error);
    return null;
  }
  const doc: { id: string } | null = rawDoc as { id: string } | null;
  const docId: string | null = doc?.id ?? null;
  console.warn(
    `[API Qonto Quotes] Saved to local DB: ${docId} (${localDocNumber})`
  );
  return docId;
}
