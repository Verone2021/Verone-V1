/**
 * API Route: POST /api/qonto/invoices/[id]/validate-to-draft
 *
 * Valide une facture du statut "synchronized" vers "draft_validated"
 * Première étape du workflow de validation avant finalisation Qonto
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

interface ValidateToDraftResponse {
  success: boolean;
  invoice?: {
    id: string;
    workflow_status: string;
    validated_to_draft_at: string | null;
    validated_by: string | null;
  };
  message?: string;
  error?: string;
}

/**
 * POST /api/qonto/invoices/[id]/validate-to-draft
 * Valide une facture synchronized → draft_validated
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ValidateToDraftResponse>> {
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
      console.error('[Validate to draft] Invoice not found:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    // 3. Vérifier statut actuel
    if (invoice.workflow_status !== 'synchronized') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot validate invoice with status ${invoice.workflow_status}. Must be synchronized.`,
        },
        { status: 400 }
      );
    }

    // 4. Mettre à jour workflow_status
    const { data: updated, error: updateError } = await supabase
      .from('financial_documents')
      .update({
        workflow_status: 'draft_validated',
        validated_to_draft_at: new Date().toISOString(),
        validated_by: user.id,
      })
      .eq('id', invoiceId)
      .select('id, workflow_status, validated_to_draft_at, validated_by')
      .single();

    if (updateError) {
      console.error('[Validate to draft] Update failed:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log(`[Validate to draft] Invoice ${invoiceId} validated to draft by user ${user.id}`);

    return NextResponse.json({
      success: true,
      invoice: updated,
      message: 'Invoice validated to draft successfully',
    });

  } catch (error) {
    console.error('[Validate to draft] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
