/**
 * API Route: GET /api/complete-info/[token]
 * Validates token and returns info request + order summary + existing data for public form
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
          { error: 'Ce lien a expir\u00e9', code: 'EXPIRED' },
          { status: 410 }
        );
      }
    }

    // Check if cancelled
    if (infoRequest.cancelled_at) {
      return NextResponse.json(
        {
          error:
            "Ces informations ont d\u00e9j\u00e0 \u00e9t\u00e9 compl\u00e9t\u00e9es par quelqu'un d'autre",
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
          error: 'Ces informations ont d\u00e9j\u00e0 \u00e9t\u00e9 soumises',
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
          id, trade_name, legal_name, siret
        )
      `
      )
      .eq('id', infoRequest.sales_order_id)
      .single();

    // Fetch linkme details for existing data
    const { data: linkmeDetails } = await supabase
      .from('sales_order_linkme_details')
      .select(
        'requester_name, requester_email, requester_phone, requester_position, billing_name, billing_email, billing_phone, delivery_contact_name, delivery_contact_email, delivery_contact_phone, delivery_address, delivery_postal_code, delivery_city'
      )
      .eq('sales_order_id', infoRequest.sales_order_id)
      .single();

    // Build response
    const orgArray = order?.organisations as Array<{
      id: string;
      trade_name: string | null;
      legal_name: string;
      siret: string | null;
    }> | null;
    const organisation = orgArray?.[0] ?? null;

    // Build existingData from linkme_details + organisation
    const existingData: Record<string, string | null> = {
      requester_name: linkmeDetails?.requester_name ?? null,
      requester_email: linkmeDetails?.requester_email ?? null,
      requester_phone: linkmeDetails?.requester_phone ?? null,
      requester_position: linkmeDetails?.requester_position ?? null,
      billing_name: linkmeDetails?.billing_name ?? null,
      billing_email: linkmeDetails?.billing_email ?? null,
      billing_phone: linkmeDetails?.billing_phone ?? null,
      delivery_contact_name: linkmeDetails?.delivery_contact_name ?? null,
      delivery_contact_email: linkmeDetails?.delivery_contact_email ?? null,
      delivery_contact_phone: linkmeDetails?.delivery_contact_phone ?? null,
      delivery_address: linkmeDetails?.delivery_address ?? null,
      delivery_postal_code: linkmeDetails?.delivery_postal_code ?? null,
      delivery_city: linkmeDetails?.delivery_city ?? null,
      organisation_siret: organisation?.siret ?? null,
    };

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
      existingData,
    });
  } catch (error) {
    console.error('[API complete-info GET] error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
