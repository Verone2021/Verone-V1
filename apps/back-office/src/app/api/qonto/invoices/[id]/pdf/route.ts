/**
 * API Route: GET /api/qonto/invoices/[id]/pdf
 * Télécharge le PDF de la facture
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

/**
 * Store-on-read: Upload le PDF vers Supabase Storage et met à jour les métadonnées.
 * Non-bloquant: si l'upload échoue, on log mais on ne fait pas échouer la requête.
 */
async function storeLocalPdf(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  documentId: string,
  pdfBuffer: ArrayBuffer,
  storagePath: string,
  metadata: {
    qonto_pdf_url?: string;
    qonto_attachment_id?: string;
    qonto_public_url?: string;
  }
): Promise<void> {
  try {
    // Upload vers Supabase Storage (bucket 'justificatifs')
    const { error: uploadError } = await supabase.storage
      .from('justificatifs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error(
        '[API Invoice PDF] Store-on-read upload failed:',
        uploadError
      );
      return;
    }

    // Mettre à jour financial_documents avec le chemin local + métadonnées Qonto
    const updateData: Record<string, unknown> = {
      local_pdf_path: storagePath,
      pdf_stored_at: new Date().toISOString(),
    };

    // Enrichir les métadonnées Qonto manquantes
    if (metadata.qonto_pdf_url) {
      updateData.qonto_pdf_url = metadata.qonto_pdf_url;
    }
    if (metadata.qonto_attachment_id) {
      updateData.qonto_attachment_id = metadata.qonto_attachment_id;
    }
    if (metadata.qonto_public_url) {
      updateData.qonto_public_url = metadata.qonto_public_url;
    }

    const { error: updateError } = await supabase
      .from('financial_documents')
      .update(updateData)
      .eq('id', documentId);

    if (updateError) {
      console.error(
        '[API Invoice PDF] Store-on-read DB update failed:',
        updateError
      );
      return;
    }

    console.warn(`[API Invoice PDF] Store-on-read success: ${storagePath}`);
  } catch (error) {
    console.error('[API Invoice PDF] Store-on-read error:', error);
  }
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
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );

    let localPdfPath: string | null = null;
    let documentId: string | null = null;
    let documentNumber: string | null = null;
    let documentType: string | null = null;
    let documentDate: string | null = null;
    let qontoInvoiceId: string | null = null;

    if (isUUID) {
      // ID local → chercher dans financial_documents par clé primaire
      const { data: doc } = await supabase
        .from('financial_documents')
        .select(
          'id, document_number, document_type, document_date, qonto_invoice_id, local_pdf_path'
        )
        .eq('id', id)
        .single();

      if (doc) {
        documentId = doc.id;
        documentNumber = doc.document_number;
        documentType = doc.document_type;
        documentDate = doc.document_date ?? null;
        qontoInvoiceId = doc.qonto_invoice_id;
        localPdfPath = doc.local_pdf_path ?? null;
      } else {
        // Fallback: lookup par qonto_invoice_id
        // Le bouton "Voir PDF" passe le qonto_invoice_id (UUID Qonto),
        // pas l'id local du document
        const { data: docByQonto } = await supabase
          .from('financial_documents')
          .select(
            'id, document_number, document_type, document_date, qonto_invoice_id, local_pdf_path'
          )
          .eq('qonto_invoice_id', id)
          .single();

        if (docByQonto) {
          documentId = docByQonto.id;
          documentNumber = docByQonto.document_number;
          documentType = docByQonto.document_type;
          documentDate = docByQonto.document_date ?? null;
          qontoInvoiceId = docByQonto.qonto_invoice_id;
          localPdfPath = docByQonto.local_pdf_path ?? null;
        }
      }
    }

    // Si PDF local disponible, le servir depuis Supabase Storage
    if (localPdfPath) {
      console.warn(
        '[API Invoice PDF] Serving from local storage:',
        localPdfPath
      );

      const { data: pdfData, error: downloadError } = await supabase.storage
        .from('justificatifs')
        .download(localPdfPath);

      if (!downloadError && pdfData) {
        const pdfBuffer = await pdfData.arrayBuffer();

        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="facture-${documentNumber ?? id}.pdf"`,
            'Content-Length': String(pdfBuffer.byteLength),
            'X-PDF-Source': 'local',
          },
        });
      } else {
        console.warn(
          '[API Invoice PDF] Local storage download failed:',
          downloadError
        );
        // Continue vers Qonto fallback
      }
    }

    // ========================================
    // ÉTAPE 1.5: Fallback uploaded_file_url (supplier invoices without Qonto)
    // ========================================
    if (isUUID && documentId) {
      const { data: docFull } = await supabase
        .from('financial_documents')
        .select('uploaded_file_url, document_type')
        .eq('id', documentId)
        .single();

      if (docFull?.uploaded_file_url) {
        try {
          const uploadedResponse = await fetch(docFull.uploaded_file_url);
          if (uploadedResponse.ok) {
            const uploadedBuffer = await uploadedResponse.arrayBuffer();
            if (uploadedBuffer.byteLength > 0) {
              return new NextResponse(uploadedBuffer, {
                headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition': `inline; filename="${documentNumber ?? id}.pdf"`,
                  'Content-Length': String(uploadedBuffer.byteLength),
                  'X-PDF-Source': 'uploaded',
                },
              });
            }
          }
        } catch (uploadError) {
          console.warn(
            '[API Invoice PDF] uploaded_file_url fetch failed:',
            uploadError
          );
          // Continue to Qonto fallback
        }
      }
    }

    // ========================================
    // ÉTAPE 2: Fallback vers Qonto
    // ========================================
    const client = getQontoClient();

    // Utiliser qonto_invoice_id si disponible, sinon utiliser l'ID passé en paramètre
    const qontoId = qontoInvoiceId ?? id;

    // Récupérer la facture pour obtenir le pdf_url
    const invoice = await client.getClientInvoiceById(qontoId);

    console.warn('[API Invoice PDF] Fetching from Qonto:', {
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
      console.warn(
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
      console.error('[API Invoice PDF] No PDF URL found for invoice:', qontoId);
      return NextResponse.json(
        {
          success: false,
          error:
            'PDF non disponible. La facture doit être finalisée pour générer un PDF.',
        },
        { status: 404 }
      );
    }

    console.warn('[API Invoice PDF] Fetching PDF from Qonto...');

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

    console.warn('[API Invoice PDF] PDF buffer size:', pdfBuffer.byteLength);

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

    // ========================================
    // ÉTAPE 3: Store-on-read (non-bloquant)
    // ========================================
    if (documentId && isUUID) {
      // Construire le chemin de stockage : {type}/{year}/{document_number}.pdf
      const typeFolder =
        documentType === 'supplier_invoice' ? 'supplier' : 'customer';
      const year = documentDate
        ? new Date(documentDate).getFullYear()
        : new Date().getFullYear();
      const fileName = `${documentNumber ?? id}.pdf`;
      const storagePath = `${typeFolder}/${year}/${fileName}`;

      // Store-on-read en arrière-plan (non-bloquant pour la réponse)
      void storeLocalPdf(supabase, documentId, pdfBuffer, storagePath, {
        qonto_pdf_url: invoice.pdf_url,
        qonto_attachment_id: invoice.attachment_id,
        qonto_public_url: invoice.public_url,
      }).catch((error: unknown) => {
        console.error(
          '[API Invoice PDF] Store-on-read background error:',
          error
        );
      });
    }

    // Retourner le PDF avec les bons headers pour VISUALISATION (inline)
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="facture-${invoice.invoice_number ?? id}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
        'X-PDF-Source': 'qonto',
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
