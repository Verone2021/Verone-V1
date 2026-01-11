/**
 * API Route: GET /api/qonto/invoices/[id]/pdf
 * Télécharge le PDF de la facture depuis Qonto
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
) {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Récupérer la facture pour obtenir le pdf_url
    const invoice = await client.getClientInvoiceById(id);

    // DEBUG: Logger les champs disponibles pour le PDF
    console.log('[API Qonto Invoice PDF] Invoice data:', {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      status: invoice.status,
      pdf_url: invoice.pdf_url,
      public_url: invoice.public_url,
      attachment_id: invoice.attachment_id,
    });

    // Déterminer l'URL du PDF (priorité: pdf_url > attachment_id)
    let pdfUrl: string | undefined = invoice.pdf_url;

    // Si pas de pdf_url, essayer avec attachment_id
    if (!pdfUrl && invoice.attachment_id) {
      console.log(
        '[API Qonto Invoice PDF] No pdf_url, trying attachment_id:',
        invoice.attachment_id
      );
      try {
        const attachment = await client.getAttachment(invoice.attachment_id);
        console.log('[API Qonto Invoice PDF] Attachment response:', attachment);
        pdfUrl = attachment.url;
      } catch (attachmentError) {
        console.error(
          '[API Qonto Invoice PDF] Attachment fetch failed:',
          attachmentError
        );
      }
    }

    // Si toujours pas d'URL, erreur
    if (!pdfUrl) {
      console.error(
        '[API Qonto Invoice PDF] No PDF URL found for invoice:',
        id
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'PDF non disponible. La facture doit être finalisée pour générer un PDF.',
        },
        { status: 404 }
      );
    }

    console.log('[API Qonto Invoice PDF] Fetching PDF from:', pdfUrl);

    // Télécharger le PDF depuis Qonto
    const pdfResponse = await fetch(pdfUrl);

    console.log(
      '[API Qonto Invoice PDF] PDF response status:',
      pdfResponse.status
    );

    if (!pdfResponse.ok) {
      console.error(
        '[API Qonto Invoice PDF] Failed to fetch PDF:',
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

    console.log(
      '[API Qonto Invoice PDF] PDF buffer size:',
      pdfBuffer.byteLength
    );

    // Vérifier que le PDF n'est pas vide
    if (pdfBuffer.byteLength === 0) {
      console.error('[API Qonto Invoice PDF] PDF buffer is empty!');
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
        'Content-Disposition': `inline; filename="facture-${invoice.invoice_number ?? id}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error('[API Qonto Invoice PDF] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
