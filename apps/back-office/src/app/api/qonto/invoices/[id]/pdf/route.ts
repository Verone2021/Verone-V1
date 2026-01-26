/**
 * API Route: GET /api/qonto/invoices/[id]/pdf
 * Télécharge le PDF de la facture
 *
 * Priorité:
 * 1. Supabase Storage local (si disponible)
 * 2. Qonto pdf_url
 * 3. Qonto attachment_id (fallback)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createServerClient } from '@verone/utils/supabase/server';

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

    // ========================================
    // ÉTAPE 1: Vérifier si PDF stocké localement
    // ========================================
    const supabase = await createServerClient();

    // Vérifier si c'est un UUID (document local) ou un ID Qonto
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let localPdfPath: string | null = null;
    let documentNumber: string | null = null;
    let qontoInvoiceId: string | null = null;

    if (isUUID) {
      // ID local → chercher dans financial_documents
      // Note: local_pdf_path ajouté par migration 20260122_005
      const { data: doc } = await supabase
        .from('financial_documents')
        .select('document_number, qonto_invoice_id')
        .eq('id', id)
        .single();

      if (doc) {
        // Cast explicite pour les colonnes ajoutées par migration
        const docWithLocalPdf = doc as typeof doc & { local_pdf_path?: string | null };
        localPdfPath = docWithLocalPdf.local_pdf_path ?? null;
        documentNumber = doc.document_number;
        qontoInvoiceId = doc.qonto_invoice_id;
      }
    }

    // Si PDF local disponible, le servir depuis Supabase Storage
    if (localPdfPath) {
      console.log('[API Invoice PDF] Serving from local storage:', localPdfPath);

      const { data: pdfData, error: downloadError } = await supabase.storage
        .from('invoices')
        .download(localPdfPath);

      if (!downloadError && pdfData) {
        const pdfBuffer = await pdfData.arrayBuffer();

        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="facture-${documentNumber ?? id}.pdf"`,
            'Content-Length': String(pdfBuffer.byteLength),
            'X-PDF-Source': 'local', // Header indiquant la source
          },
        });
      } else {
        console.warn('[API Invoice PDF] Local storage download failed:', downloadError);
        // Continue vers Qonto fallback
      }
    }

    // ========================================
    // ÉTAPE 2: Fallback vers Qonto
    // ========================================
    const client = getQontoClient();

    // Utiliser qonto_invoice_id si disponible, sinon utiliser l'ID passé en paramètre
    const qontoId = qontoInvoiceId || id;

    // Récupérer la facture pour obtenir le pdf_url
    const invoice = await client.getClientInvoiceById(qontoId);

    // DEBUG: Logger les champs disponibles pour le PDF
    console.log('[API Invoice PDF] Fetching from Qonto:', {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      status: invoice.status,
      pdf_url: invoice.pdf_url ? 'present' : 'missing',
      attachment_id: invoice.attachment_id,
    });

    // Déterminer l'URL du PDF (priorité: pdf_url > attachment_id)
    let pdfUrl: string | undefined = invoice.pdf_url;

    // Si pas de pdf_url, essayer avec attachment_id
    if (!pdfUrl && invoice.attachment_id) {
      console.log(
        '[API Invoice PDF] No pdf_url, trying attachment_id:',
        invoice.attachment_id
      );
      try {
        const attachment = await client.getAttachment(invoice.attachment_id);
        pdfUrl = attachment.url;
      } catch (attachmentError) {
        console.error(
          '[API Invoice PDF] Attachment fetch failed:',
          attachmentError
        );
      }
    }

    // Si toujours pas d'URL, erreur
    if (!pdfUrl) {
      console.error(
        '[API Invoice PDF] No PDF URL found for invoice:',
        qontoId
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

    console.log('[API Invoice PDF] Fetching PDF from Qonto...');

    // Télécharger le PDF depuis Qonto
    const pdfResponse = await fetch(pdfUrl);

    if (!pdfResponse.ok) {
      console.error(
        '[API Invoice PDF] Failed to fetch PDF:',
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
      '[API Invoice PDF] PDF buffer size:',
      pdfBuffer.byteLength
    );

    // Vérifier que le PDF n'est pas vide
    if (pdfBuffer.byteLength === 0) {
      console.error('[API Invoice PDF] PDF buffer is empty!');
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
        'X-PDF-Source': 'qonto', // Header indiquant la source
      },
    });
  } catch (error) {
    console.error('[API Invoice PDF] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
