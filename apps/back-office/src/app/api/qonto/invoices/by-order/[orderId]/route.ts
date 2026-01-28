/**
 * API Route: GET /api/qonto/invoices/by-order/[orderId]
 *
 * Liste toutes les factures liées à une commande spécifique
 * Utilisé pour afficher les factures dans la page détail commande
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

interface Invoice {
  id: string;
  document_number: string;
  workflow_status: string;
  status: string;
  total_ttc: number;
  amount_paid: number;
  document_date: string;
  due_date: string | null;
  qonto_invoice_id: string | null;
  qonto_pdf_url: string | null;
  synchronized_at: string | null;
  validated_to_draft_at: string | null;
  finalized_at: string | null;
  sent_at: string | null;
}

interface InvoicesByOrderResponse {
  success: boolean;
  invoices?: Invoice[];
  count?: number;
  error?: string;
}

/**
 * GET /api/qonto/invoices/by-order/[orderId]
 * Liste les factures d'une commande
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse<InvoicesByOrderResponse>> {
  try {
    const { orderId } = await params;
    const supabase = await createServerClient();

    // Validation UUID format
    if (
      !orderId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid order ID format',
        },
        { status: 400 }
      );
    }

    // Récupérer factures liées à la commande
    const { data: invoices, error } = await supabase
      .from('financial_documents')
      .select(
        `
        id,
        document_number,
        workflow_status,
        status,
        total_ttc,
        amount_paid,
        document_date,
        due_date,
        qonto_invoice_id,
        qonto_pdf_url,
        synchronized_at,
        validated_to_draft_at,
        finalized_at,
        sent_at
      `
      )
      .eq('sales_order_id', orderId)
      .eq('document_type', 'customer_invoice')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Invoices by order] Query failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    console.warn(
      `[Invoices by order] Found ${invoices?.length ?? 0} invoices for order ${orderId}`
    );

    return NextResponse.json({
      success: true,
      invoices: invoices as Invoice[],
      count: invoices?.length ?? 0,
    });
  } catch (error) {
    console.error('[Invoices by order] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
