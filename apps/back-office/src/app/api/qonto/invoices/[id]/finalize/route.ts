/**
 * API Route: POST /api/qonto/invoices/[id]/finalize
 * Finalise une facture draft dans Qonto et met à jour le record local
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

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Invoice finalized successfully',
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
