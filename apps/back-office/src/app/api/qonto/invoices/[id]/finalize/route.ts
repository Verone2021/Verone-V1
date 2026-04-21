/**
 * API Route: POST /api/qonto/invoices/[id]/finalize
 * Finalise une facture draft dans Qonto et met à jour le record local
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import {
  createAdminClient,
  createServerClient,
} from '@verone/utils/supabase/server';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getQontoClient();

    const invoice = await client.finalizeClientInvoice(id);

    // Update the local financial_documents record:
    // - document_number changes from PROFORMA-xxx to F-2026-xxx
    // - status changes from draft to sent
    // - local_pdf_path cleared to force re-fetch of finalized PDF
    const supabase = createAdminClient();
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({
        document_number: invoice.invoice_number,
        status: 'sent' as const,
        local_pdf_path: null,
        pdf_stored_at: null,
        finalized_at: new Date().toISOString(),
        qonto_pdf_url: invoice.pdf_url ?? null,
        qonto_public_url: invoice.public_url ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('qonto_invoice_id', id);

    if (updateError) {
      console.error(
        '[API Qonto Invoice Finalize] DB update failed:',
        updateError
      );
      // Don't fail the request — Qonto finalization succeeded
    }

    // Auth check before cascade — skip silently if unauthenticated
    const supabaseAuth = await createServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      console.error(
        '[API Qonto Invoice Finalize] Cascade skipped: no authenticated user'
      );
      return NextResponse.json({
        success: true,
        invoice,
        message: 'Invoice finalized successfully',
        validatedOrder: null,
      });
    }

    const userId = user.id;

    // Auto-validate linked sales_order if still in draft
    // Finaliser une facture = la commande doit être au minimum validée
    let validatedOrder: { id: string; number: string } | null = null;

    const { data: linkedDoc } = await supabase
      .from('financial_documents')
      .select('sales_order_id')
      .eq('qonto_invoice_id', id)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (linkedDoc?.sales_order_id) {
      const { data: linkedOrder } = await supabase
        .from('sales_orders')
        .select('id, status')
        .eq('id', linkedDoc.sales_order_id)
        .single();

      if (linkedOrder?.status === 'draft') {
        const { data: updated, error: validateError } = await supabase
          .from('sales_orders')
          .update({
            status: 'validated',
            confirmed_at: new Date().toISOString(),
            confirmed_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', linkedOrder.id)
          .eq('status', 'draft') // guard atomique contre race condition
          .select('id, order_number')
          .maybeSingle();

        if (validateError) {
          console.error(
            '[API Qonto Invoice Finalize] Auto-validate order failed:',
            validateError
          );
        } else if (updated) {
          validatedOrder = { id: updated.id, number: updated.order_number };
          console.warn(
            `[API Qonto Invoice Finalize] Auto-validated order ${updated.id} (${updated.order_number}) (was draft)`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Invoice finalized successfully',
      validatedOrder,
    });
  } catch (error) {
    console.error('[API Qonto Invoice Finalize] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
