/**
 * API Route: GET /api/qonto/quotes/[id]/pdf
 * Télécharge le PDF d'un devis depuis Qonto
 *
 * Utilise pdf_url en priorité (comme les factures),
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

    // Récupérer le devis
    const quote = await client.getClientQuoteById(id);

    // DEBUG: Logger les champs disponibles pour le PDF
    console.warn('[API Qonto Quote PDF] Quote data:', {
      id: quote.id,
      quote_number: quote.quote_number,
      status: quote.status,
      pdf_url: quote.pdf_url,
      public_url: quote.public_url,
      attachment_id: quote.attachment_id,
    });

    // Déterminer l'URL du PDF (priorité: pdf_url > attachment_id)
    let pdfUrl: string | undefined = quote.pdf_url;

    // Si pas de pdf_url, essayer avec attachment_id
    if (!pdfUrl && quote.attachment_id) {
      console.warn(
        '[API Qonto Quote PDF] No pdf_url, trying attachment_id:',
        quote.attachment_id
      );
      try {
        const attachment = await client.getAttachment(quote.attachment_id);
        console.warn('[API Qonto Quote PDF] Attachment response:', attachment);
        pdfUrl = attachment.url;
      } catch (attachmentError) {
        console.error(
          '[API Qonto Quote PDF] Attachment fetch failed:',
          attachmentError
        );
      }
    }

    // Si toujours pas d'URL, erreur
    if (!pdfUrl) {
      console.error('[API Qonto Quote PDF] No PDF URL found for quote:', id);
      return NextResponse.json(
        {
          success: false,
          error:
            'PDF non disponible. Le devis doit être finalisé pour générer un PDF.',
        },
        { status: 404 }
      );
    }

    console.warn('[API Qonto Quote PDF] Fetching PDF from:', pdfUrl);

    // Télécharger le PDF depuis l'URL
    const pdfResponse = await fetch(pdfUrl);

    console.warn(
      '[API Qonto Quote PDF] PDF response status:',
      pdfResponse.status
    );

    if (!pdfResponse.ok) {
      console.error(
        '[API Qonto Quote PDF] Failed to fetch PDF:',
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
      '[API Qonto Quote PDF] PDF buffer size:',
      pdfBuffer.byteLength
    );

    // Vérifier que le PDF n'est pas vide
    if (pdfBuffer.byteLength === 0) {
      console.error('[API Qonto Quote PDF] PDF buffer is empty!');
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
        'Content-Disposition': `inline; filename="devis-${quote.quote_number ?? quote.id}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error('[API Qonto Quote PDF] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
