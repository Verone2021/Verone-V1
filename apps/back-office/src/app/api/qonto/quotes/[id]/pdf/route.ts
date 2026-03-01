/**
 * API Route: GET /api/qonto/quotes/[id]/pdf
 * Télécharge le PDF d'un devis depuis Qonto
 *
 * Priorité:
 * 1. Supabase Storage local (si disponible)
 * 2. Qonto pdf_url
 * 3. Qonto attachment_id (fallback)
 *
 * Store-on-read: Si le PDF est récupéré depuis Qonto,
 * il est automatiquement stocké localement pour les accès futurs.
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const client = getQontoClient();

    // Récupérer le devis depuis Qonto (nécessaire pour le quote_number)
    const quote = await client.getClientQuoteById(id);

    console.warn('[API Qonto Quote PDF] Quote data:', {
      id: quote.id,
      quote_number: quote.quote_number,
      status: quote.status,
      pdf_url: quote.pdf_url,
      public_url: quote.public_url,
      attachment_id: quote.attachment_id,
    });

    // Construire le chemin de stockage basé sur le quote_number
    const year = new Date().getFullYear();
    const quoteNumber = quote.quote_number ?? quote.id;
    const storagePath = `quotes/${year}/${quoteNumber}.pdf`;

    // ========================================
    // ÉTAPE 1: Vérifier si PDF stocké localement
    // ========================================
    const { data: localPdf, error: downloadError } = await supabase.storage
      .from('invoices')
      .download(storagePath);

    if (!downloadError && localPdf) {
      console.warn(
        '[API Qonto Quote PDF] Serving from local storage:',
        storagePath
      );
      const pdfBuffer = await localPdf.arrayBuffer();

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="devis-${quoteNumber}.pdf"`,
          'Content-Length': String(pdfBuffer.byteLength),
          'X-PDF-Source': 'local',
        },
      });
    }

    // ========================================
    // ÉTAPE 2: Fallback vers Qonto
    // ========================================

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

    console.warn('[API Qonto Quote PDF] Fetching PDF from Qonto...');

    // Télécharger le PDF depuis l'URL
    const pdfResponse = await fetch(pdfUrl);

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

    // ========================================
    // ÉTAPE 3: Store-on-read (non-bloquant)
    // ========================================
    void (async () => {
      try {
        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.error(
            '[API Qonto Quote PDF] Store-on-read upload failed:',
            uploadError
          );
        } else {
          console.warn(
            `[API Qonto Quote PDF] Store-on-read success: ${storagePath}`
          );
        }
      } catch (error) {
        console.error('[API Qonto Quote PDF] Store-on-read error:', error);
      }
    })().catch((error: unknown) => {
      console.error(
        '[API Qonto Quote PDF] Store-on-read background error:',
        error
      );
    });

    // Retourner le PDF avec les bons headers pour VISUALISATION (inline)
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="devis-${quoteNumber}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
        'X-PDF-Source': 'qonto',
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
