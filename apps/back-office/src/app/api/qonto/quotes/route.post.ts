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

  // [BO-FIN-039] Guard SIRET strict devis (règle R4 renforcée — symétrie avec invoice guard)
  if (effectiveCustomerType === 'organization' && !vatNumber && !taxId) {
    return NextResponse.json(
      {
        success: false,
        error:
          "SIRET ou numéro TVA requis pour émettre un devis. Choisissez l'organisation maison mère ayant un SIRET.",
      },
      { status: 400 }
    );
  }

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
    body.customLines,
    body.itemComments
  );
  const computed = computeQuoteDates(body.expiryDays ?? 30);
  const issueDate = body.issueDate ?? computed.issueDate;
  const expiryDaysCount = body.expiryDays ?? 30;
  const expiryDate = body.issueDate
    ? new Date(new Date(body.issueDate).getTime() + expiryDaysCount * 86400000)
        .toISOString()
        .slice(0, 10)
    : computed.expiryDate;

  // [BO-FIN-044] L'API Qonto n'a pas de champ shipping_address structuré pour les
  // quotes clients. On utilise header pour l'adresse de livraison (visible en haut
  // du devis) et footer pour les commentaires libres de l'utilisateur.
  const shippingHeader =
    body.shippingAddress?.city && body.shippingAddress?.address_line1
      ? `ADRESSE DE LIVRAISON\n${body.shippingAddress.address_line1}\n${body.shippingAddress.postal_code ?? ''} ${body.shippingAddress.city}${body.shippingAddress.country && body.shippingAddress.country !== 'FR' ? `\n${body.shippingAddress.country}` : ''}`
      : undefined;

  const footerCustom =
    body.footerNote && body.footerNote.trim().length > 0
      ? body.footerNote.trim()
      : undefined;

  const quoteParams: CreateClientQuoteParams = {
    clientId: qontoClientId,
    currency: 'EUR',
    issueDate,
    expiryDate,
    purchaseOrderNumber: ctx.orderNumber,
    items,
    ...(shippingHeader ? { header: shippingHeader } : {}),
    ...(footerCustom ? { footer: footerCustom } : {}),
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
    // [BO-FIN-039] partner_id = org commande TOUJOURS (R5 finance.md)
    // billing_org_id porte l'org de facturation si différente
    const orderCustomerId = (ctx.customer as { id?: string } | null)?.id;
    const effectiveCustomerId = orderCustomerId;

    // Persist addresses to organisation si demandé (non-bloquant)
    // Utilise l'org commande (effectiveCustomerId) et non billingOrg (facturation)
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
      billingOrgId: billingOrg?.id,
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
