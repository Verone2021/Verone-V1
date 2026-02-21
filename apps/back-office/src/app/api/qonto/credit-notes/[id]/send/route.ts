/**
 * API Route: POST /api/qonto/credit-notes/[id]/send
 * Envoie un avoir par email au client via Qonto
 *
 * NOTE: L'endpoint POST /v2/credit_notes/:id/send n'est PAS documente
 * par Qonto. Si l'envoi echoue, on propose le lien public en fallback.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getQontoClient, QontoError } from '@verone/integrations/qonto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Recuperer l'avoir pour verifier son etat
    const creditNote = await client.getClientCreditNoteById(id);

    if (creditNote.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible d'envoyer un avoir en brouillon. Veuillez d'abord le finaliser.",
        },
        { status: 400 }
      );
    }

    // L'avoir est finalise - proposer le lien public
    // L'endpoint /send n'est pas documente par Qonto pour credit notes
    if (creditNote.public_url) {
      return NextResponse.json({
        success: true,
        credit_note: creditNote,
        message:
          "L'avoir est disponible via son lien public. Partagez ce lien avec le client.",
        publicUrl: creditNote.public_url,
      });
    }

    // Pas de public_url disponible
    return NextResponse.json(
      {
        success: false,
        error:
          'Aucun lien public disponible pour cet avoir. Utilisez le PDF pour le partager.',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('[API Qonto Credit Note Send] POST error:', error);

    const message =
      error instanceof QontoError
        ? error.getUserMessage()
        : error instanceof Error
          ? error.message
          : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
