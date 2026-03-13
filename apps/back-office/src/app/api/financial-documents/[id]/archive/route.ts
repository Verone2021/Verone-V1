/**
 * API Route: POST /api/financial-documents/[id]/archive
 * Archive une facture validée (soft delete via deleted_at)
 *
 * RÈGLES MÉTIER:
 * - Seules les factures finalisées peuvent être archivées (status !== 'draft')
 * - Les brouillons doivent être supprimés, pas archivés
 * - Les factures annulées (cancelled) restent visibles avec badge, pas d'archivage
 * - Implémentation: Soft delete via deleted_at
 * - Traçabilité: Log audit avec user_id + timestamp
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@verone/utils/supabase/server';

/**
 * POST /api/financial-documents/[id]/archive
 * Archive une facture validée (soft delete via deleted_at)
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

    // 2. Récupérer la facture depuis financial_documents
    // Note: l'id passé en paramètre est le qonto_invoice_id, pas l'id UUID de financial_documents
    const { data: document, error: fetchError } = await supabase
      .from('financial_documents')
      .select('id, document_number, status, qonto_invoice_id, deleted_at')
      .eq('qonto_invoice_id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document not found or already archived',
          details: fetchError?.message,
        },
        { status: 404 }
      );
    }

    // 3. Vérifier que la facture n'est pas un brouillon (seules les factures finalisées peuvent être archivées)
    if (document.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot archive a draft document. Only finalized invoices can be archived.`,
          hint: 'Use DELETE for draft invoices',
        },
        { status: 400 }
      );
    }

    // 4. Archiver (soft delete)
    const { error: archiveError } = await supabase
      .from('financial_documents')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', document.id);

    if (archiveError) {
      throw new Error(`Failed to archive document: ${archiveError.message}`);
    }

    // 5. Log de l'action (audit trail)
    console.warn(
      `[API Financial Documents Archive] User ${user.id} archived document ${document.id} (${document.document_number}) with status=${document.status}`
    );

    return NextResponse.json({
      success: true,
      message: 'Document archived successfully',
      documentId: document.id,
      documentNumber: document.document_number,
      archivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API Financial Documents Archive] POST error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
