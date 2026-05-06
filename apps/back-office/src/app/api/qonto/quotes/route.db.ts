/**
 * DB persistence for POST /api/qonto/quotes
 * Extracted from route.context.ts to comply with 400-line rule.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@verone/types';
import { computeFinancialTotals } from '@verone/finance/lib/finance-totals';
import type {
  FinancialItem,
  FinancialFees,
} from '@verone/finance/lib/finance-totals';

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
  /** [BO-FIN-039] Org de facturation si différente de l'org commande (Option B) */
  billingOrgId?: string;
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
    billingOrgId,
  } = params;

  type FinancialDocumentInsert =
    Database['public']['Tables']['financial_documents']['Insert'];

  // [BO-FIN-046] Module finance-totals unique (R1 zéro discordance)
  const financialItems: FinancialItem[] = items.map(item => ({
    quantity: parseFloat(item.quantity) || 0,
    unit_price_ht: parseFloat(item.unitPrice.value) || 0,
    tax_rate: parseFloat(item.vatRate) || 0,
    description: item.title,
  }));
  const feesForCompute: FinancialFees = {
    shipping_cost_ht: 0, // frais déjà inclus dans items via toQontoLines
    handling_cost_ht: 0,
    insurance_cost_ht: 0,
    fees_vat_rate: 0,
  };
  const computed = computeFinancialTotals(financialItems, feesForCompute, {
    strict: false,
  });
  const totalHt = computed.totalHt;
  const tva = computed.totalVat;
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
    billing_org_id: billingOrgId ?? null,
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
