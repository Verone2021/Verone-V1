/**
 * API Route: POST /api/qonto/credit-notes/[id]/finalize
 * Finalise un avoir brouillon
 *
 * ATTENTION: Cette action est IRRÉVERSIBLE
 * Un avoir finalisé ne peut plus être modifié ni supprimé
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getQontoClient } from '@verone/integrations/qonto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{
    success: boolean;
    credit_note?: unknown;
    message?: string;
    error?: string;
  }>
> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Vérifier l'état actuel avant finalisation
    const currentCreditNote = await client.getClientCreditNoteById(id);

    if (currentCreditNote.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: `Credit note is already ${currentCreditNote.status}, cannot finalize`,
        },
        { status: 400 }
      );
    }

    // FINALISATION IRRÉVERSIBLE
    const creditNote = await client.finalizeClientCreditNote(id);

    return NextResponse.json({
      success: true,
      credit_note: creditNote,
      message: 'Credit note finalized successfully (IRREVERSIBLE)',
    });
  } catch (error) {
    console.error('[API Qonto Credit Note Finalize] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
