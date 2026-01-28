/**
 * API Route: GET /api/qonto/credit-notes/[id]/pdf
 * Télécharge le PDF d'un avoir depuis Qonto
 *
 * Utilise pdf_url en priorité,
 * avec fallback sur attachment_id si nécessaire.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') || 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Récupérer l'avoir pour obtenir l'URL du PDF
    const creditNote = await client.getClientCreditNoteById(id);

    // DEBUG: Logger les champs disponibles pour le PDF
    console.warn('[API Qonto Credit Note PDF] Credit note data:', {
      id: creditNote.id,
      credit_note_number: creditNote.credit_note_number,
      status: creditNote.status,
      pdf_url: creditNote.pdf_url,
      public_url: creditNote.public_url,
      attachment_id: creditNote.attachment_id,
    });

    // Déterminer l'URL du PDF (priorité: pdf_url > attachment_id)
    let pdfUrl: string | undefined = creditNote.pdf_url;

    // Si pas de pdf_url, essayer avec attachment_id
    if (!pdfUrl && creditNote.attachment_id) {
      console.warn(
        '[API Qonto Credit Note PDF] No pdf_url, trying attachment_id:',
        creditNote.attachment_id
      );
      try {
        const attachment = await client.getAttachment(creditNote.attachment_id);
        console.warn(
          '[API Qonto Credit Note PDF] Attachment response:',
          attachment
        );
        pdfUrl = attachment.url;
      } catch (attachmentError) {
        console.error(
          '[API Qonto Credit Note PDF] Attachment fetch failed:',
          attachmentError
        );
      }
    }

    // Si toujours pas d'URL, erreur
    if (!pdfUrl) {
      console.error(
        '[API Qonto Credit Note PDF] No PDF URL found for credit note:',
        id
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "PDF non disponible. L'avoir doit être finalisé pour générer un PDF.",
        },
        { status: 404 }
      );
    }

    console.warn('[API Qonto Credit Note PDF] Fetching PDF from:', pdfUrl);

    // Télécharger le PDF depuis Qonto
    const pdfResponse = await fetch(pdfUrl);

    console.warn(
      '[API Qonto Credit Note PDF] PDF response status:',
      pdfResponse.status
    );

    if (!pdfResponse.ok) {
      console.error(
        '[API Qonto Credit Note PDF] Failed to fetch PDF:',
        pdfResponse.status,
        pdfResponse.statusText
      );
      return NextResponse.json(
        {
          success: false,
          error: `Échec du téléchargement du PDF: ${pdfResponse.status} ${pdfResponse.statusText}`,
        },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    console.warn(
      '[API Qonto Credit Note PDF] PDF buffer size:',
      pdfBuffer.byteLength
    );

    // Vérifier que le PDF n'est pas vide
    if (pdfBuffer.byteLength === 0) {
      console.error('[API Qonto Credit Note PDF] PDF buffer is empty!');
      return NextResponse.json(
        {
          success: false,
          error: 'Le PDF téléchargé est vide',
        },
        { status: 500 }
      );
    }

    // Retourner le PDF avec les bons headers pour VISUALISATION (inline)
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="avoir-${creditNote.credit_note_number ?? creditNote.id}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error('[API Qonto Credit Note PDF] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
