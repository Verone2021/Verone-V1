/**
 * API Route: POST /api/complete-info/[token]/submit
 * Submits completed info for an order, updates linkme_details + organisation
 * Uses service_role to bypass RLS
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Valid field keys that map to sales_order_linkme_details columns
const LINKME_DETAILS_FIELDS = new Set([
  'requester_name',
  'requester_email',
  'requester_phone',
  'owner_name',
  'owner_email',
  'owner_phone',
  'owner_company_legal_name',
  'billing_name',
  'billing_email',
  'billing_phone',
  'delivery_contact_name',
  'delivery_contact_email',
  'delivery_contact_phone',
  'delivery_address',
  'delivery_postal_code',
  'delivery_city',
  'desired_delivery_date',
  'mall_email',
]);

const submitSchema = z.object({
  fields: z.record(z.string(), z.string().min(1)),
  submitterEmail: z.string().email(),
});

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const body: unknown = await request.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { fields, submitterEmail } = parsed.data;
    const supabase = getAdminClient();

    // Fetch and validate info request
    const { data: infoRequest, error: irError } = await supabase
      .from('linkme_info_requests')
      .select('*')
      .eq('token', token)
      .single();

    if (irError || !infoRequest) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
    }

    // Validate state
    if (infoRequest.completed_at) {
      return NextResponse.json(
        { error: 'Ces informations ont déjà été soumises' },
        { status: 410 }
      );
    }
    if (infoRequest.cancelled_at) {
      return NextResponse.json(
        { error: 'Cette demande a été annulée' },
        { status: 410 }
      );
    }
    if (
      infoRequest.token_expires_at &&
      new Date(infoRequest.token_expires_at) < new Date()
    ) {
      return NextResponse.json({ error: 'Ce lien a expiré' }, { status: 410 });
    }

    // Separate fields: linkme_details vs organisation
    const linkmeDetailsUpdate: Record<string, string> = {};
    let organisationSiret: string | null = null;

    for (const [key, value] of Object.entries(fields)) {
      if (key === 'organisation_siret') {
        organisationSiret = value;
      } else if (LINKME_DETAILS_FIELDS.has(key)) {
        linkmeDetailsUpdate[key] = value;
      }
    }

    // Update sales_order_linkme_details
    if (Object.keys(linkmeDetailsUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('sales_order_linkme_details')
        .update(linkmeDetailsUpdate)
        .eq('sales_order_id', infoRequest.sales_order_id);

      if (updateError) {
        console.error(
          '[API complete-info submit] linkme_details update error:',
          updateError
        );
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour des détails' },
          { status: 500 }
        );
      }
    }

    // Update organisation SIRET if provided
    if (organisationSiret) {
      // Get customer_id from sales_order
      const { data: order } = await supabase
        .from('sales_orders')
        .select('customer_id')
        .eq('id', infoRequest.sales_order_id)
        .single();

      if (order?.customer_id) {
        const { error: orgError } = await supabase
          .from('organisations')
          .update({ siret: organisationSiret })
          .eq('id', order.customer_id);

        if (orgError) {
          console.error(
            '[API complete-info submit] organisation update error:',
            orgError
          );
          // Non-blocking: SIRET update failure doesn't block form submission
        }
      }
    }

    // Mark this request as completed
    const { error: completeError } = await supabase
      .from('linkme_info_requests')
      .update({
        completed_at: new Date().toISOString(),
        completed_by_email: submitterEmail,
        submitted_data: fields,
      })
      .eq('id', infoRequest.id);

    if (completeError) {
      console.error(
        '[API complete-info submit] complete error:',
        completeError
      );
    }

    // Cancel other pending requests for same order (first responder wins)
    const { error: cancelError } = await supabase
      .from('linkme_info_requests')
      .update({
        cancelled_at: new Date().toISOString(),
        cancelled_reason: 'completed_by_other',
      })
      .eq('sales_order_id', infoRequest.sales_order_id)
      .neq('id', infoRequest.id)
      .is('completed_at', null)
      .is('cancelled_at', null);

    if (cancelError) {
      console.error(
        '[API complete-info submit] cancel others error:',
        cancelError
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API complete-info submit] error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
