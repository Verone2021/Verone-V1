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
}

/**
 * GET /api/qonto/quotes/by-order/[orderId]
 * Reads quote_qonto_id from sales_orders, enriches with live Qonto data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    quotes?: LinkedQuote[];
    count?: number;
    error?: string;
  }>
> {
  try {
    const { orderId } = await params;
    const supabase = createAdminClient();

    // Read linked quote from sales_orders
    const { data: rawOrder } = await supabase
      .from('sales_orders')
      .select('order_number, quote_qonto_id, quote_number')
      .eq('id', orderId)
      .single();

    // Cast new columns (not yet in generated types)
    const order = rawOrder as {
      order_number: string | null;
      quote_qonto_id: string | null;
      quote_number: string | null;
    } | null;

    if (!order) {
      return NextResponse.json({ success: true, quotes: [], count: 0 });
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
              },
            ],
            count: 1,
          });
        }
      } catch {
        // Qonto failed — return DB-only data as fallback
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
            },
          ],
          count: 1,
        });
      }
    }

    // Strategy 2: Fallback to Qonto purchase_order_number matching
    if (order.order_number) {
      try {
        const client = getQontoClient();
        const result = await client.getClientQuotes();
        const matchingQuotes = result.client_quotes
          .filter(
            q =>
              q.purchase_order_number === order.order_number &&
              q.status !== 'declined' &&
              q.status !== 'expired'
          )
          .map(q => {
            const raw = q as typeof q & { number?: string };
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
            };
          });

        if (matchingQuotes.length > 0) {
          return NextResponse.json({
            success: true,
            quotes: matchingQuotes,
            count: matchingQuotes.length,
          });
        }
      } catch {
        // Ignore Qonto errors for fallback strategy
      }
    }

    return NextResponse.json({ success: true, quotes: [], count: 0 });
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
