/**
 * API Route: POST /api/financial-documents/[id]/unarchive
 * Désarchive une facture (deleted_at = NULL)
 *
 * RÈGLES MÉTIER:
 * - Restaure une facture archivée en mettant deleted_at à NULL
 * - Vérifie que la facture est bien archivée (deleted_at IS NOT NULL)
 * - Log audit avec user_id + timestamp
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

/**
 * POST /api/financial-documents/[id]/unarchive
 * Désarchive une facture (deleted_at = NULL)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Vérifier l'authentification
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
        },
        { status: 401 }
      );
    }

    // 2. Récupérer la facture depuis financial_documents (ARCHIVED ONLY)
    // Note: l'id passé en paramètre est le qonto_invoice_id, pas l'id UUID de financial_documents
    const { data: document, error: fetchError } = await supabase
      .from('financial_documents')
      .select(
        'id, document_number, status, workflow_status, qonto_invoice_id, deleted_at'
      )
      .eq('qonto_invoice_id', id)
      .not('deleted_at', 'is', null) // Only archived documents
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document not found or not archived',
          details: fetchError?.message,
        },
        { status: 404 }
      );
    }

    // 3. Désarchiver (set deleted_at to NULL)
    const { error: unarchiveError } = await supabase
      .from('financial_documents')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', document.id);

    if (unarchiveError) {
      throw new Error(
        `Failed to unarchive document: ${unarchiveError.message}`
      );
    }

    // 4. Log de l'action (audit trail)
    console.warn(
      `[API Financial Documents Unarchive] User ${user.id} unarchived document ${document.id} (${document.document_number})`
    );

    return NextResponse.json({
      success: true,
      message: 'Document unarchived successfully',
      documentId: document.id,
      documentNumber: document.document_number,
      unarchivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API Financial Documents Unarchive] POST error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
