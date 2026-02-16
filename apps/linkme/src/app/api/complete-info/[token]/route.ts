/**
 * API Route: GET /api/complete-info/[token]
 * Validates token and returns info request + order summary for public form
 * Uses service_role to bypass RLS (no anon policies on linkme_info_requests)
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Fetch info request by token
    const { data: infoRequest, error: irError } = await supabase
      .from('linkme_info_requests')
      .select('*')
      .eq('token', token)
      .single();

    if (irError || !infoRequest) {
      return NextResponse.json(
        { error: 'Lien invalide', code: 'INVALID_TOKEN' },
        { status: 404 }
      );
    }

    // Check if expired
    if (infoRequest.token_expires_at) {
      const expiresAt = new Date(infoRequest.token_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Ce lien a expiré', code: 'EXPIRED' },
          { status: 410 }
        );
      }
    }

    // Check if cancelled
    if (infoRequest.cancelled_at) {
      return NextResponse.json(
        {
          error:
            "Ces informations ont déjà été complétées par quelqu'un d'autre",
          code: 'CANCELLED',
          cancelledReason: infoRequest.cancelled_reason,
        },
        { status: 410 }
      );
    }

    // Check if already completed
    if (infoRequest.completed_at) {
      return NextResponse.json(
        {
          error: 'Ces informations ont déjà été soumises',
          code: 'ALREADY_COMPLETED',
          completedAt: infoRequest.completed_at,
          completedByEmail: infoRequest.completed_by_email,
        },
        { status: 410 }
      );
    }

    // Fetch order summary
    const { data: order } = await supabase
      .from('sales_orders')
      .select(
        `
        id,
        order_number,
        total_ttc,
        status,
        customer_id,
        organisations!sales_orders_customer_id_fkey (
          id, trade_name, legal_name
        )
      `
      )
      .eq('id', infoRequest.sales_order_id)
      .single();

    // Build response
    const orgArray = order?.organisations as Array<{
      id: string;
      trade_name: string | null;
      legal_name: string;
    }> | null;
    const organisation = orgArray?.[0] ?? null;

    return NextResponse.json({
      infoRequest: {
        id: infoRequest.id,
        requestedFields: infoRequest.requested_fields,
        customMessage: infoRequest.custom_message,
        recipientName: infoRequest.recipient_name,
        recipientEmail: infoRequest.recipient_email,
        recipientType: infoRequest.recipient_type,
      },
      order: order
        ? {
            id: order.id,
            orderNumber: order.order_number,
            totalTtc: order.total_ttc,
            organisationName:
              organisation?.trade_name ?? organisation?.legal_name ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error('[API complete-info GET] error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
