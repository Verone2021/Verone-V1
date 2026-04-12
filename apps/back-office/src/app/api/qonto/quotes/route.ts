/**
 * API Route: /api/qonto/quotes
 * Gestion des devis clients via Qonto API
 *
 * GET  - Liste les devis
 * POST - Crée un devis depuis une commande
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import type { CreateClientQuoteParams } from '@verone/integrations/qonto';
import { createAdminClient } from '@verone/utils/supabase/server';

import {
  mapQontoQuote,
  resolveBillingAddress,
  resolveCustomerInfo,
  buildQuoteItems,
  computeQuoteDates,
  resolveQontoClient,
} from './route.helpers';
import type {
  IPostRequestBody,
  IQontoQuoteRaw,
  IResolvedBillingAddress,
  IQuoteItem,
} from './route.helpers';
import {
  resolveRequestContext,
  linkQuoteToOrder,
  markQuotesSuperseded,
  saveQuoteToLocalDb,
} from './route.context';
import type { IRequestContext, MappedQuote } from './route.context';

type Supabase = ReturnType<typeof createAdminClient>;

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

// ---------------------------------------------------------------------------
// GET /api/qonto/quotes
// ---------------------------------------------------------------------------

type QuoteStatus =
  | 'draft'
  | 'finalized'
  | 'accepted'
  | 'declined'
  | 'expired'
  | null;

/**
 * GET /api/qonto/quotes — Liste les devis avec filtre optionnel par status
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    quotes?: unknown[];
    count?: number;
    meta?: unknown;
    error?: string;
  }>
> {
  try {
    const status = new URL(request.url).searchParams.get(
      'status'
    ) as QuoteStatus;
    const client = getQontoClient();
    const result = await client.getClientQuotes(
      status ? { status } : undefined
    );
    const quotes = result.client_quotes.map(q =>
      mapQontoQuote(q as IQontoQuoteRaw, false)
    );

    // Enrich quotes with linked order numbers from sales_orders
    const qontoIds = quotes.map(q => String(q.id)).filter(Boolean);
    const supabase = createAdminClient();
    const { data: linkedOrders } = await supabase
      .from('sales_orders')
      .select('quote_qonto_id, order_number')
      .in('quote_qonto_id', qontoIds);

    const orderMap = new Map(
      (linkedOrders ?? []).map(o => [o.quote_qonto_id, o.order_number])
    );

    const enrichedQuotes = quotes.map(q => ({
      ...q,
      order_number: orderMap.get(String(q.id)) ?? null,
    }));

    return NextResponse.json({
      success: true,
      quotes: enrichedQuotes,
      count: enrichedQuotes.length,
      meta: result.meta,
    });
  } catch (error) {
    console.error('[API Qonto Quotes] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST helpers — Qonto quote creation
// ---------------------------------------------------------------------------

async function buildAndCreateQontoQuote(
  qontoClient: QontoClient,
  ctx: IRequestContext,
  body: IPostRequestBody
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
  const {
    email: customerEmail,
    name: customerName,
    vatNumber,
    taxId,
  } = resolveCustomerInfo(ctx.customerType, ctx.customer, body.customerEmail);

  const qontoAddress: IResolvedBillingAddress | null = resolveBillingAddress(
    body.billingAddress,
    ctx.orderBillingAddress,
    ctx.customerType,
    ctx.customer
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
    ctx.customerType === 'organization' ? 'company' : 'individual';
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

  const quoteParams: CreateClientQuoteParams = {
    clientId: qontoClientId,
    currency: 'EUR',
    issueDate,
    expiryDate,
    purchaseOrderNumber: ctx.orderNumber,
    items,
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
// POST helpers — persistence
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// POST helpers — persistence
// ---------------------------------------------------------------------------

async function persistQuoteResults(
  supabase: Supabase,
  ctx: IRequestContext,
  quoteResult: {
    quote: MappedQuote;
    items: IQuoteItem[];
    issueDate: string;
    expiryDate: string;
    raw: IQontoQuoteRaw;
  },
  body: IPostRequestBody
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
    const customerId = (ctx.customer as { id?: string } | null)?.id;
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
      customerId,
      standaloneCustomerId: body.customer?.customerId,
      fees: body.fees,
    });
  } catch (e) {
    console.error('[API Qonto Quotes] DB save error (non-blocking):', e);
    return null;
  }
}

function validatePostBody(
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

// ---------------------------------------------------------------------------
// POST /api/qonto/quotes
// ---------------------------------------------------------------------------

/**
 * POST /api/qonto/quotes
 * Crée un devis depuis une commande client
 *
 * Body:
 * - salesOrderId?: UUID de la commande (optionnel pour devis standalone)
 * - customer?: { customerId, customerType } (requis si pas de salesOrderId)
 * - expiryDays: nombre de jours avant expiration (défaut: 30)
 * - customLines: lignes personnalisées (requises si pas de salesOrderId)
 */
export async function POST(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    quote?: unknown;
    message?: string;
    error?: string;
  }>
> {
  try {
    const body = (await request.json()) as IPostRequestBody;
    const validationError = validatePostBody(body);
    if (validationError) return validationError;

    const supabase = createAdminClient();
    const qontoClient = getQontoClient();

    const ctxResult = await resolveRequestContext(
      supabase,
      qontoClient,
      body.salesOrderId,
      body.customer
    );
    if ('errorResponse' in ctxResult) return ctxResult.errorResponse;

    const quoteResult = await buildAndCreateQontoQuote(
      qontoClient,
      ctxResult,
      body
    );
    if (quoteResult instanceof NextResponse) return quoteResult;

    const localDocId = await persistQuoteResults(
      supabase,
      ctxResult,
      quoteResult,
      body
    );

    if (body.supersededQuoteIds && body.supersededQuoteIds.length > 0) {
      await markQuotesSuperseded(supabase, body.supersededQuoteIds);
    }

    return NextResponse.json({
      success: true,
      quote: quoteResult.quote,
      localDocId,
      message: 'Quote created as draft',
    });
  } catch (error) {
    console.error('[API Qonto Quotes] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
