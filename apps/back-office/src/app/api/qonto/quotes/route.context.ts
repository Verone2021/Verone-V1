/**
 * Résolution de contexte pour POST /api/qonto/quotes
 * Gère la récupération commande, client et vérification doublons.
 */

import { NextResponse } from 'next/server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { QontoClient } from '@verone/integrations/qonto';

import {
  fetchCustomerFromSupabase,
  generateLocalDocNumber,
} from './route.helpers';
import type {
  ISalesOrderWithItems,
  IQontoQuoteRaw,
  Organisation,
  IndividualCustomer,
  IStandaloneCustomer,
  IQuoteItem,
  IFeesData,
} from './route.helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IOrderFees {
  shippingCostHt: number;
  handlingCostHt: number;
  insuranceCostHt: number;
  feesVatRate: number;
}

export interface IRequestContext {
  customer: Organisation | IndividualCustomer | null;
  customerType: string;
  orderNumber: string | undefined;
  orderItems: ISalesOrderWithItems['sales_order_items'];
  orderFees: IOrderFees;
  orderBillingAddress: Record<string, string> | null;
}

export type ContextResult =
  | IRequestContext
  | { errorResponse: NextResponse<{ success: boolean; error?: string }> };

export type MappedQuote = {
  id: string;
  quote_number: string;
  status: string;
  currency: string;
  total_amount: number;
  issue_date?: string;
  expiry_date?: string;
  pdf_url?: string | null;
  public_url?: string | null;
};

// ---------------------------------------------------------------------------
// Duplicate check
// ---------------------------------------------------------------------------

export async function checkDuplicateQuoteError(
  qontoClient: QontoClient,
  orderNumber: string
): Promise<{
  errorResponse: NextResponse<{ success: boolean; error?: string }>;
} | null> {
  try {
    const existing = await qontoClient.getClientQuotes();
    const dup = existing.client_quotes.find(
      q =>
        q.purchase_order_number === orderNumber &&
        q.status !== 'declined' &&
        q.status !== 'expired'
    );
    if (dup) {
      const d = dup as IQontoQuoteRaw;
      const num = d.number ?? d.quote_number ?? dup.id;
      return {
        errorResponse: NextResponse.json(
          {
            success: false,
            error: `Un devis existe déjà pour la commande ${orderNumber} (${num}). Modifiez-le ou supprimez-le avant d'en créer un nouveau.`,
            existingQuoteId: dup.id,
          },
          { status: 409 }
        ),
      };
    }
  } catch (e) {
    console.warn(
      '[API Qonto Quotes] Duplicate check failed (non-blocking):',
      e
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Order context resolution
// ---------------------------------------------------------------------------

export async function fetchAndBuildOrderContext(
  supabase: SupabaseClient,
  qontoClient: QontoClient,
  salesOrderId: string
): Promise<ContextResult> {
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select(
      `id, order_number, customer_id, customer_type, individual_customer_id,
      billing_address, shipping_address,
      shipping_cost_ht, handling_cost_ht, insurance_cost_ht, fees_vat_rate,
      sales_order_items (
        id, quantity, unit_price_ht, tax_rate, notes,
        products:product_id (id, name, sku)
      )`
    )
    .eq('id', salesOrderId)
    .single();

  if (orderError || !order) {
    console.error('[API Qonto Quotes] Order fetch error:', orderError);
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      ),
    };
  }

  const o = order as unknown as ISalesOrderWithItems;
  const orderNumber = o.order_number ?? undefined;

  if (orderNumber) {
    const dupError = await checkDuplicateQuoteError(qontoClient, orderNumber);
    if (dupError) return dupError;
  }

  const customerType = o.customer_type ?? 'organization';
  const customer =
    o.customer_id && o.customer_type
      ? await fetchCustomerFromSupabase(
          supabase,
          o.customer_type,
          o.customer_id,
          o.individual_customer_id
        )
      : null;

  return {
    customer,
    customerType,
    orderNumber,
    orderItems: o.sales_order_items ?? [],
    orderFees: {
      shippingCostHt: o.shipping_cost_ht ?? 0,
      handlingCostHt: o.handling_cost_ht ?? 0,
      insuranceCostHt: o.insurance_cost_ht ?? 0,
      feesVatRate: o.fees_vat_rate ?? 0.2,
    },
    orderBillingAddress: (o.billing_address as Record<string, string>) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Full context resolution (salesOrder OR standalone customer)
// ---------------------------------------------------------------------------

const EMPTY_CONTEXT: IRequestContext = {
  customer: null,
  customerType: 'organization',
  orderNumber: undefined,
  orderItems: [],
  orderFees: {
    shippingCostHt: 0,
    handlingCostHt: 0,
    insuranceCostHt: 0,
    feesVatRate: 0.2,
  },
  orderBillingAddress: null,
};

export async function resolveRequestContext(
  supabase: SupabaseClient,
  qontoClient: QontoClient,
  salesOrderId: string | undefined,
  standaloneCustomer: IStandaloneCustomer | undefined
): Promise<ContextResult> {
  if (salesOrderId) {
    return fetchAndBuildOrderContext(supabase, qontoClient, salesOrderId);
  }

  if (standaloneCustomer) {
    const customer = await fetchCustomerFromSupabase(
      supabase,
      standaloneCustomer.customerType,
      standaloneCustomer.customerId
    );
    if (!customer) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: 'Client introuvable' },
          { status: 404 }
        ),
      };
    }
    return {
      ...EMPTY_CONTEXT,
      customer,
      customerType: standaloneCustomer.customerType,
    };
  }

  return EMPTY_CONTEXT;
}

// ---------------------------------------------------------------------------
// DB persistence helpers
// ---------------------------------------------------------------------------

export async function linkQuoteToOrder(
  supabase: SupabaseClient,
  salesOrderId: string,
  quoteId: string,
  quoteNumber: string
): Promise<void> {
  try {
    await supabase
      .from('sales_orders')
      .update({ quote_qonto_id: quoteId, quote_number: quoteNumber } as Record<
        string,
        unknown
      >)
      .eq('id', salesOrderId);
  } catch (e) {
    console.warn(
      '[API Qonto Quotes] Failed to link quote to order (non-blocking):',
      e
    );
  }
}

export async function markQuotesSuperseded(
  supabase: SupabaseClient,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  try {
    await supabase
      .from('financial_documents')
      .update({ quote_status: 'superseded' } as Record<string, unknown>)
      .in('id', ids);
    console.warn(
      `[API Qonto Quotes] Marked ${ids.length} quotes as superseded`
    );
  } catch (e) {
    console.error('[API Qonto Quotes] Failed to mark quotes as superseded:', e);
  }
}

interface ISaveLocalDbParams {
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
  } = params;

  const totalHt = items.reduce(
    (s, i) =>
      s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice.value) || 0),
    0
  );
  const avgVat =
    items.length > 0
      ? items.reduce((s, i) => s + (parseFloat(i.vatRate) || 0.2), 0) /
        items.length
      : 0.2;
  const tva = totalHt * avgVat;
  const localDocNumber = generateLocalDocNumber();

  const payload = {
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
  };

  const { data: doc, error } = await supabase
    .from('financial_documents')
    .insert([payload] as never)
    .select('id')
    .single();

  if (error) {
    console.error('[API Qonto Quotes] Failed to save to local DB:', error);
    return null;
  }
  const docId = (doc as { id?: string } | null)?.id ?? null;
  console.warn(
    `[API Qonto Quotes] Saved to local DB: ${docId} (${localDocNumber})`
  );
  return docId;
}
