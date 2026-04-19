/**
 * POST helpers pour /api/qonto/quotes
 * Extraits de route.ts pour respecter la limite 400 lignes.
 */

import { NextResponse } from 'next/server';

import type {
  QontoClient,
  CreateClientQuoteParams,
} from '@verone/integrations/qonto';
import type { createAdminClient } from '@verone/utils/supabase/server';

import {
  resolveBillingAddress,
  resolveCustomerInfo,
  buildQuoteItems,
  computeQuoteDates,
  resolveQontoClient,
  mapQontoQuote,
} from './route.helpers';
import type {
  IPostRequestBody,
  IQontoQuoteRaw,
  IResolvedBillingAddress,
  IQuoteItem,
  Organisation,
} from './route.helpers';
import {
  linkQuoteToOrder,
  saveQuoteToLocalDb,
  updateOrganisationAddresses,
} from './route.context';
import type { IRequestContext, MappedQuote } from './route.context';
import { propagateOrderCustomer } from '../invoices/_lib/propagate-order-customer';

type Supabase = ReturnType<typeof createAdminClient>;

// ---------------------------------------------------------------------------
// Build + create Qonto quote
// ---------------------------------------------------------------------------

export async function buildAndCreateQontoQuote(
  qontoClient: QontoClient,
  ctx: IRequestContext,
  body: IPostRequestBody,
  billingOrg: Organisation | null
): Promise<
  | {
      quote: MappedQuote;
      items: IQuoteItem[];
      issueDate: string;
      expiryDate: string;
      raw: IQontoQuoteRaw;
    }
  | NextResponse<{ success: boolean; error?: string }>
> {
  // Option B : si billingOrg présente, elle remplace l'org commande pour Qonto
  const effectiveCustomer = billingOrg ?? ctx.customer;
  const effectiveCustomerType = billingOrg ? 'organization' : ctx.customerType;

  const {
    email: customerEmail,
    name: customerName,
    vatNumber,
    taxId,
  } = resolveCustomerInfo(
    effectiveCustomerType,
    effectiveCustomer,
    body.customerEmail
  );

  const qontoAddress: IResolvedBillingAddress | null = resolveBillingAddress(
    body.billingAddress,
    ctx.orderBillingAddress,
    effectiveCustomerType,
    effectiveCustomer
  );
  if (!qontoAddress) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Adresse de facturation incomplète. Ville et code postal requis.',
      },
      { status: 400 }
    );
  }

  const qontoClientType =
    effectiveCustomerType === 'organization' ? 'company' : 'individual';
  const qontoClientId = await resolveQontoClient(
    qontoClient,
    customerName,
    customerEmail,
    qontoClientType,
    qontoAddress,
    vatNumber,
    taxId
  );

  const items = buildQuoteItems(
    ctx.orderItems,
    body.fees,
    ctx.orderFees,
    body.customLines
  );
  const { issueDate, expiryDate } = computeQuoteDates(body.expiryDays ?? 30);

  const shippingFooter =
    body.shippingAddress?.city && body.shippingAddress?.address_line1
      ? `Adresse de livraison : ${body.shippingAddress.address_line1}, ${body.shippingAddress.postal_code ?? ''} ${body.shippingAddress.city}${body.shippingAddress.country && body.shippingAddress.country !== 'FR' ? `, ${body.shippingAddress.country}` : ''}`
      : undefined;

  const quoteParams: CreateClientQuoteParams = {
    clientId: qontoClientId,
    currency: 'EUR',
    issueDate,
    expiryDate,
    purchaseOrderNumber: ctx.orderNumber,
    items,
    ...(shippingFooter ? { footer: shippingFooter } : {}),
  };

  const rawQuote = await qontoClient.createClientQuote(quoteParams);
  const raw = rawQuote as IQontoQuoteRaw;
  return {
    quote: mapQontoQuote(raw, true) as MappedQuote,
    items,
    issueDate,
    expiryDate,
    raw,
  };
}

// ---------------------------------------------------------------------------
// Persist quote results to DB
// ---------------------------------------------------------------------------

export async function persistQuoteResults(
  supabase: Supabase,
  ctx: IRequestContext,
  quoteResult: {
    quote: MappedQuote;
    items: IQuoteItem[];
    issueDate: string;
    expiryDate: string;
    raw: IQontoQuoteRaw;
  },
  body: IPostRequestBody,
  billingOrg: Organisation | null
): Promise<string | null> {
  const { quote, items, issueDate, expiryDate, raw } = quoteResult;

  if (body.salesOrderId) {
    await linkQuoteToOrder(
      supabase,
      body.salesOrderId,
      quote.id,
      quote.quote_number
    );
  }

  if (!((body.consultationId ?? body.salesOrderId) && body.userId)) {
    if (body.consultationId ?? body.salesOrderId) {
      console.error('[API Qonto Quotes] No userId provided for DB save');
    }
    return null;
  }

  try {
    // Option B : si billingOrg présente → elle devient le partner_id du document local
    const orderCustomerId = (ctx.customer as { id?: string } | null)?.id;
    const effectiveCustomerId = billingOrg?.id ?? orderCustomerId;

    // [BO-FIN-037] Propager billingOrg + adresses vers la commande source si draft (R6)
    if (body.salesOrderId && billingOrg && billingOrg.id !== orderCustomerId) {
      await propagateOrderCustomer({
        supabase,
        salesOrderId: body.salesOrderId,
        billingOrgId: billingOrg.id,
        billingAddress: body.billingAddress,
        shippingAddress: body.shippingAddress,
      });
    }

    // Persist addresses to organisation si demandé (non-bloquant)
    if (
      (body.updateOrgBilling ?? body.updateOrgShipping) &&
      effectiveCustomerId
    ) {
      await updateOrganisationAddresses({
        supabase,
        orgId: effectiveCustomerId,
        billingAddress: body.billingAddress,
        shippingAddress: body.shippingAddress,
        updateOrgBilling: body.updateOrgBilling,
        updateOrgShipping: body.updateOrgShipping,
      });
    }

    return await saveQuoteToLocalDb({
      supabase,
      userId: body.userId,
      items,
      quoteId: quote.id,
      pdfUrl: raw.pdf_url,
      publicUrl: raw.public_url,
      issueDate,
      expiryDate,
      consultationId: body.consultationId,
      salesOrderId: body.salesOrderId,
      customerId: effectiveCustomerId,
      standaloneCustomerId: body.customer?.customerId,
      fees: body.fees,
      billingAddress: body.billingAddress,
      shippingAddress: body.shippingAddress,
    });
  } catch (e) {
    console.error('[API Qonto Quotes] DB save error (non-blocking):', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Validate POST body
// ---------------------------------------------------------------------------

export function validatePostBody(
  body: IPostRequestBody
): NextResponse<{ success: boolean; error?: string }> | null {
  const { salesOrderId, customer, customLines } = body;
  if (!salesOrderId && !customer) {
    return NextResponse.json(
      { success: false, error: 'salesOrderId ou customer est requis' },
      { status: 400 }
    );
  }
  if (!salesOrderId && (!customLines || customLines.length === 0)) {
    return NextResponse.json(
      {
        success: false,
        error:
          'customLines est requis pour un devis standalone (sans commande)',
      },
      { status: 400 }
    );
  }
  return null;
}
