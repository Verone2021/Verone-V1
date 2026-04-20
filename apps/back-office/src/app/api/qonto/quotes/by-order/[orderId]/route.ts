/**
 * API Route: GET /api/qonto/quotes/by-order/[orderId]
 *
 * Find Qonto quotes linked to a sales order.
 * Strategy: read quote_qonto_id from sales_orders, then fetch live status from Qonto.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createAdminClient } from '@verone/utils/supabase/server';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

interface LinkedQuote {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number;
  currency: string;
  issue_date: string;
  expiry_date: string;
  /** [BO-FIN-009 Phase 4] Timestamp création doc local (financial_documents.created_at).
   *  Sert à détecter si la commande a été modifiée APRÈS (badge out-of-sync). */
  document_created_at?: string | null;
  /** [BO-FIN-009 Phase 4] Notes libres stockées sur le document local */
  document_notes?: string | null;
}

interface LinkedQuotesResponse {
  success: boolean;
  quotes?: LinkedQuote[];
  count?: number;
  /** [BO-FIN-009 Phase 4] Dernière modification commande pour comparer avec document_created_at */
  order_updated_at?: string | null;
  error?: string;
}

/**
 * GET /api/qonto/quotes/by-order/[orderId]
 * Reads quote_qonto_id from sales_orders, enriches with live Qonto data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse<LinkedQuotesResponse>> {
  try {
    const { orderId } = await params;
    const supabase = createAdminClient();

    // Read linked quote from sales_orders + updated_at (BO-FIN-009 Phase 4)
    const { data: rawOrder } = await supabase
      .from('sales_orders')
      .select('order_number, quote_qonto_id, quote_number, updated_at')
      .eq('id', orderId)
      .single();

    const order = rawOrder as {
      order_number: string | null;
      quote_qonto_id: string | null;
      quote_number: string | null;
      updated_at: string | null;
    } | null;

    const orderUpdatedAt = order?.updated_at ?? null;

    if (!order) {
      return NextResponse.json({
        success: true,
        quotes: [],
        count: 0,
        order_updated_at: null,
      });
    }

    // [BO-FIN-009 Phase 4] Enrichir avec created_at + notes du financial_document local
    // pour détection out-of-sync et pré-remplissage modal régénération
    async function fetchLocalQuoteMetadata(qontoQuoteId: string): Promise<{
      document_created_at: string | null;
      document_notes: string | null;
    }> {
      const { data: localDoc } = await supabase
        .from('financial_documents')
        .select('created_at, notes')
        .eq('qonto_invoice_id', qontoQuoteId)
        .eq('document_type', 'customer_quote')
        .is('deleted_at', null)
        .neq('quote_status', 'superseded')
        .order('revision_number', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      const doc = localDoc as {
        created_at: string | null;
        notes: string | null;
      } | null;
      return {
        document_created_at: doc?.created_at ?? null,
        document_notes: doc?.notes ?? null,
      };
    }

    // Strategy 1: quote_qonto_id stored on the order (preferred)
    if (order.quote_qonto_id) {
      try {
        const client = getQontoClient();
        const result = await client.getClientQuotes();
        const match = result.client_quotes.find(
          q => q.id === order.quote_qonto_id
        );

        if (
          match &&
          match.status !== 'declined' &&
          match.status !== 'expired'
        ) {
          const raw = match as typeof match & { number?: string };
          const localMeta = await fetchLocalQuoteMetadata(match.id);
          return NextResponse.json({
            success: true,
            quotes: [
              {
                id: match.id,
                quote_number: raw.number ?? match.quote_number ?? '-',
                status: match.status,
                total_amount: match.total_amount_cents
                  ? match.total_amount_cents / 100
                  : 0,
                currency: match.currency ?? 'EUR',
                issue_date: match.issue_date,
                expiry_date: match.expiry_date,
                document_created_at: localMeta.document_created_at,
                document_notes: localMeta.document_notes,
              },
            ],
            count: 1,
            order_updated_at: orderUpdatedAt,
          });
        }
      } catch {
        // Qonto failed — return DB-only data as fallback
        const fallbackMeta = await fetchLocalQuoteMetadata(
          order.quote_qonto_id
        );
        return NextResponse.json({
          success: true,
          quotes: [
            {
              id: order.quote_qonto_id,
              quote_number: order.quote_number ?? '-',
              status: 'draft',
              total_amount: 0,
              currency: 'EUR',
              issue_date: '',
              expiry_date: '',
              document_created_at: fallbackMeta.document_created_at,
              document_notes: fallbackMeta.document_notes,
            },
          ],
          count: 1,
          order_updated_at: orderUpdatedAt,
        });
      }
    }

    // Strategy 2: Fallback to Qonto purchase_order_number matching
    if (order.order_number) {
      try {
        const client = getQontoClient();
        const result = await client.getClientQuotes();
        const matchingQuotesRaw = result.client_quotes.filter(
          q =>
            q.purchase_order_number === order.order_number &&
            q.status !== 'declined' &&
            q.status !== 'expired'
        );

        const matchingQuotes = await Promise.all(
          matchingQuotesRaw.map(async q => {
            const raw = q as typeof q & { number?: string };
            const localMeta = await fetchLocalQuoteMetadata(q.id);
            return {
              id: q.id,
              quote_number: raw.number ?? q.quote_number ?? '-',
              status: q.status,
              total_amount: q.total_amount_cents
                ? q.total_amount_cents / 100
                : 0,
              currency: q.currency ?? 'EUR',
              issue_date: q.issue_date,
              expiry_date: q.expiry_date,
              document_created_at: localMeta.document_created_at,
              document_notes: localMeta.document_notes,
            };
          })
        );

        if (matchingQuotes.length > 0) {
          return NextResponse.json({
            success: true,
            quotes: matchingQuotes,
            count: matchingQuotes.length,
            order_updated_at: orderUpdatedAt,
          });
        }
      } catch {
        // Ignore Qonto errors for fallback strategy
      }
    }

    return NextResponse.json({
      success: true,
      quotes: [],
      count: 0,
      order_updated_at: orderUpdatedAt,
    });
  } catch (error) {
    console.error('[Quotes by order] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
