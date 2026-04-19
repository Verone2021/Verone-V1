/**
 * Résolution de contexte pour POST /api/qonto/quotes
 * Gère la récupération commande, client et vérification doublons.
 */

import { NextResponse } from 'next/server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { QontoClient } from '@verone/integrations/qonto';
import type { Database } from '@verone/types';

import { fetchCustomerFromSupabase } from './route.helpers';
import type {
  ISalesOrderWithItems,
  IQontoQuoteRaw,
  Organisation,
  IndividualCustomer,
  IStandaloneCustomer,
} from './route.helpers';
import type { ISaveLocalDbAddress } from './route.db';

export { saveQuoteToLocalDb } from './route.db';
export type { ISaveLocalDbParams } from './route.db';

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
// Billing org resolution (Option B)
// ---------------------------------------------------------------------------

/**
 * Résout l'org de facturation effective (Option B).
 * Si billingOrgId est présent et différent de l'org commande :
 *   → fetch l'org, retourne { org } ou { errorResponse } si introuvable.
 * Sinon retourne null (comportement par défaut = org commande).
 */
export async function resolveBillingOrg(
  supabase: SupabaseClient,
  billingOrgId: string | null | undefined,
  orderCustomerId: string | undefined
): Promise<
  | { org: Organisation }
  | { errorResponse: NextResponse<{ success: boolean; error?: string }> }
  | null
> {
  if (!billingOrgId || billingOrgId === orderCustomerId) return null;

  const result = await fetchCustomerFromSupabase(
    supabase,
    'organization',
    billingOrgId
  );
  const org = result as Organisation | null;
  if (!org) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Organisation de facturation introuvable' },
        { status: 404 }
      ),
    };
  }
  return { org };
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

// ---------------------------------------------------------------------------
// Org address update helpers
// ---------------------------------------------------------------------------

interface IOrgAddressUpdate {
  supabase: SupabaseClient;
  orgId: string;
  billingAddress?: ISaveLocalDbAddress;
  shippingAddress?: ISaveLocalDbAddress;
  updateOrgBilling?: boolean;
  updateOrgShipping?: boolean;
}

/**
 * Persiste les nouvelles adresses dans la table organisations.
 * Non-bloquant : les erreurs sont loggées mais ne font pas échouer la route.
 * Le devis Qonto doit être créé EN PREMIER (appel avant persistQuoteResults).
 */
export async function updateOrganisationAddresses(
  params: IOrgAddressUpdate
): Promise<void> {
  const {
    supabase,
    orgId,
    billingAddress,
    shippingAddress,
    updateOrgBilling,
    updateOrgShipping,
  } = params;

  type OrgUpdate = Database['public']['Tables']['organisations']['Update'];
  const update: OrgUpdate = {};

  if (updateOrgBilling && billingAddress?.city) {
    update.billing_address_line1 = billingAddress.address_line1 ?? null;
    update.billing_postal_code = billingAddress.postal_code ?? null;
    update.billing_city = billingAddress.city;
    update.billing_country = billingAddress.country ?? 'FR';
  }

  if (updateOrgShipping && shippingAddress?.city) {
    update.shipping_address_line1 = shippingAddress.address_line1 ?? null;
    update.shipping_postal_code = shippingAddress.postal_code ?? null;
    update.shipping_city = shippingAddress.city;
    update.shipping_country = shippingAddress.country ?? 'FR';
    update.has_different_shipping_address = true;
  }

  if (Object.keys(update).length === 0) return;

  try {
    const { error } = await supabase
      .from('organisations')
      .update(update as Record<string, unknown>)
      .eq('id', orgId);

    if (error) {
      console.error(
        '[API Qonto Quotes] Failed to update org addresses (non-blocking):',
        error
      );
    } else {
      console.warn(
        `[API Qonto Quotes] Updated org ${orgId} addresses (billing=${updateOrgBilling}, shipping=${updateOrgShipping})`
      );
    }
  } catch (e) {
    console.error(
      '[API Qonto Quotes] Exception updating org addresses (non-blocking):',
      e
    );
  }
}
