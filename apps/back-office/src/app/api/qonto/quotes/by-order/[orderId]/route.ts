/**
 * API Route: GET /api/qonto/quotes/by-order/[orderId]
 *
 * Find Qonto quotes linked to a sales order via purchase_order_number.
 * Used in OrderDetailModal to show existing quotes instead of "Create" button.
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
 * Finds Qonto quotes by matching purchase_order_number = order.order_number
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

    // Get order_number from sales_orders
    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select('order_number')
      .eq('id', orderId)
      .single();

    if (orderError || !order?.order_number) {
      return NextResponse.json({
        success: true,
        quotes: [],
        count: 0,
      });
    }

    // Search Qonto quotes with matching purchase_order_number
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
          total_amount: q.total_amount_cents ? q.total_amount_cents / 100 : 0,
          currency: q.currency ?? 'EUR',
          issue_date: q.issue_date,
          expiry_date: q.expiry_date,
        };
      });

    return NextResponse.json({
      success: true,
      quotes: matchingQuotes,
      count: matchingQuotes.length,
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
