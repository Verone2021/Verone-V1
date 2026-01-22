/**
 * API Route: POST /api/qonto/invoices/[id]/finalize-workflow
 *
 * Finalise une facture du statut "draft_validated" vers "finalized"
 * Appelle Qonto /finalize et met à jour le workflow local
 * PDF devient disponible après cette étape
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createServerClient } from '@verone/utils/supabase/server';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

interface FinalizeWorkflowResponse {
  success: boolean;
  invoice?: {
    id: string;
    workflow_status: string;
    finalized_at: string | null;
    finalized_by: string | null;
    qonto_pdf_url: string | null;
    qonto_public_url: string | null;
    status: string;
  };
  qonto_invoice?: any;
  message?: string;
  error?: string;
}

/**
 * POST /api/qonto/invoices/[id]/finalize-workflow
 * Finalise workflow draft_validated → finalized + appel Qonto /finalize
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<FinalizeWorkflowResponse>> {
  try {
    const { id: invoiceId } = await params;
    const supabase = await createServerClient();

    // 1. Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated',
        },
        { status: 401 }
      );
    }

    // 2. Récupérer facture actuelle
    const { data: invoice, error: fetchError } = await supabase
      .from('financial_documents')
      .select('id, workflow_status, qonto_invoice_id')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      console.error('[Finalize workflow] Invoice not found:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    // 3. Vérifier statut actuel
    if (invoice.workflow_status !== 'draft_validated') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot finalize invoice with status ${invoice.workflow_status}. Must be draft_validated.`,
        },
        { status: 400 }
      );
    }

    if (!invoice.qonto_invoice_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not synced to Qonto (missing qonto_invoice_id)',
        },
        { status: 400 }
      );
    }

    // 4. Appeler Qonto /finalize
    const qontoClient = getQontoClient();
    let finalizedInvoice;

    try {
      finalizedInvoice = await qontoClient.finalizeClientInvoice(
        invoice.qonto_invoice_id
      );
    } catch (qontoError) {
      console.error('[Finalize workflow] Qonto finalize failed:', qontoError);
      return NextResponse.json(
        {
          success: false,
          error: qontoError instanceof Error
            ? `Qonto error: ${qontoError.message}`
            : 'Failed to finalize invoice in Qonto',
        },
        { status: 500 }
      );
    }

    // 5. Mettre à jour DB avec données Qonto
    const { data: updated, error: updateError } = await supabase
      .from('financial_documents')
      .update({
        workflow_status: 'finalized',
        finalized_at: new Date().toISOString(),
        finalized_by: user.id,
        qonto_pdf_url: finalizedInvoice.pdf_url || null,
        qonto_public_url: finalizedInvoice.public_url || null,
        status: 'sent', // Mapping Qonto "unpaid" → "sent" en local
        qonto_sync_status: 'synced',
      })
      .eq('id', invoiceId)
      .select('id, workflow_status, finalized_at, finalized_by, qonto_pdf_url, qonto_public_url, status')
      .single();

    if (updateError) {
      console.error('[Finalize workflow] Update failed:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log(`[Finalize workflow] Invoice ${invoiceId} finalized by user ${user.id}`);

    return NextResponse.json({
      success: true,
      invoice: updated,
      qonto_invoice: finalizedInvoice,
      message: 'Invoice finalized successfully. PDF is now available.',
    });

  } catch (error) {
    console.error('[Finalize workflow] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
