/**
 * API Route: GET /api/qonto/quotes/by-order/[orderId]
 *
 * Find quotes linked to a sales order from financial_documents (local DB).
 * Same pattern as invoices by-order — source of truth is local DB.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@verone/utils/supabase/server';

interface LinkedQuote {
  id: string;
  quote_number: string;
  status: string;
  total_amount: number;
  currency: string;
  issue_date: string;
  expiry_date: string;
  qonto_invoice_id: string | null;
}

/**
 * GET /api/qonto/quotes/by-order/[orderId]
 * Returns quotes linked to a sales order via financial_documents.sales_order_id
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

    const { data, error: queryError } = await supabase
      .from('financial_documents')
      .select(
        'id, document_number, quote_status, total_ttc, qonto_invoice_id, document_date, validity_date'
      )
      .eq('sales_order_id', orderId)
      .eq('document_type', 'customer_quote')
      .is('deleted_at', null)
      .not('quote_status', 'in', '("declined","expired")')
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('[Quotes by order] DB error:', queryError);
      return NextResponse.json(
        { success: false, error: queryError.message },
        { status: 500 }
      );
    }

    const quotes: LinkedQuote[] = (data ?? []).map(row => ({
      id: row.id,
      quote_number: row.document_number ?? '-',
      status: row.quote_status ?? 'draft',
      total_amount: row.total_ttc ?? 0,
      currency: 'EUR',
      issue_date: row.document_date ?? '',
      expiry_date: row.validity_date ?? '',
      qonto_invoice_id: row.qonto_invoice_id,
    }));

    return NextResponse.json({
      success: true,
      quotes,
      count: quotes.length,
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
