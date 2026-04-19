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
import { createAdminClient } from '@verone/utils/supabase/server';

import { mapQontoQuote, PostRequestBodySchema } from './route.helpers';
import type {
  IPostRequestBody,
  IQontoQuoteRaw,
  Organisation,
} from './route.helpers';
import {
  resolveRequestContext,
  resolveBillingOrg,
  markQuotesSuperseded,
} from './route.context';
import {
  buildAndCreateQontoQuote,
  persistQuoteResults,
  validatePostBody,
} from './route.post';

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
// POST /api/qonto/quotes
// ---------------------------------------------------------------------------

/**
 * POST /api/qonto/quotes
 * Crée un devis depuis une commande client.
 *
 * Body:
 * - salesOrderId?: UUID de la commande (optionnel pour devis standalone)
 * - customer?: { customerId, customerType } (requis si pas de salesOrderId)
 * - billingOrgId?: UUID de l'org de facturation (Option B — remplace l'org commande pour Qonto)
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
    const rawBody: unknown = await request.json();
    const parsed = PostRequestBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }
    const body: IPostRequestBody = parsed.data;
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

    // Option B : résoudre l'org de facturation si billingOrgId présent
    const orderCustomerId = (ctxResult.customer as { id?: string } | null)?.id;
    const billingOrgResult = await resolveBillingOrg(
      supabase,
      body.billingOrgId,
      orderCustomerId
    );
    if (billingOrgResult !== null && 'errorResponse' in billingOrgResult) {
      return billingOrgResult.errorResponse;
    }
    const billingOrg: Organisation | null =
      billingOrgResult !== null ? billingOrgResult.org : null;

    const quoteResult = await buildAndCreateQontoQuote(
      qontoClient,
      ctxResult,
      body,
      billingOrg
    );
    if (quoteResult instanceof NextResponse) return quoteResult;

    const localDocId = await persistQuoteResults(
      supabase,
      ctxResult,
      quoteResult,
      body,
      billingOrg
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
