/**
 * API Route: POST /api/qonto/invoices/backfill-pdfs
 *
 * Télécharge et stocke localement tous les PDFs manquants depuis Qonto.
 * Pour chaque financial_document avec qonto_invoice_id mais sans local_pdf_path,
 * récupère le PDF depuis Qonto et l'uploade vers Supabase Storage.
 *
 * Usage: appel one-shot pour rattraper les factures existantes.
 */

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

interface BackfillResult {
  document_id: string;
  document_number: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  storage_path?: string;
}

export async function POST() {
  try {
    const supabase = await createServerClient();

    // Vérifier authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Récupérer toutes les factures avec qonto_invoice_id mais sans PDF local
    const { data: documents, error: fetchError } = await supabase
      .from('financial_documents')
      .select('id, document_number, document_type, qonto_invoice_id')
      .not('qonto_invoice_id', 'is', null)
      .is('local_pdf_path', null)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('[Backfill PDFs] Failed to fetch documents:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No documents need backfilling',
        results: { success: 0, failed: 0, skipped: 0, total: 0 },
        details: [],
      });
    }

    console.warn(
      `[Backfill PDFs] Starting backfill for ${documents.length} documents`
    );

    const client = getQontoClient();
    const results: BackfillResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Traiter séquentiellement pour éviter rate limiting Qonto
    for (const doc of documents) {
      const result: BackfillResult = {
        document_id: doc.id,
        document_number: doc.document_number,
        status: 'failed',
      };

      try {
        if (!doc.qonto_invoice_id) {
          result.status = 'skipped';
          result.error = 'No qonto_invoice_id';
          skippedCount++;
          results.push(result);
          continue;
        }

        // 1. Récupérer la facture Qonto pour obtenir le pdf_url
        const invoice = await client.getClientInvoiceById(doc.qonto_invoice_id);

        // Déterminer l'URL du PDF
        let pdfUrl: string | undefined = invoice.pdf_url;

        if (!pdfUrl && invoice.attachment_id) {
          try {
            const attachment = await client.getAttachment(
              invoice.attachment_id
            );
            pdfUrl = attachment.url;
          } catch {
            // Attachment fetch failed, continue without
          }
        }

        if (!pdfUrl) {
          result.status = 'skipped';
          result.error = 'No PDF URL available (invoice may not be finalized)';
          skippedCount++;
          results.push(result);
          continue;
        }

        // 2. Télécharger le PDF
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
          result.error = `PDF download failed: ${pdfResponse.status}`;
          failedCount++;
          results.push(result);
          continue;
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        if (pdfBuffer.byteLength === 0) {
          result.error = 'PDF is empty';
          failedCount++;
          results.push(result);
          continue;
        }

        // 3. Upload vers Supabase Storage
        const typeFolder =
          doc.document_type === 'supplier_invoice' ? 'supplier' : 'customer';
        const year = new Date().getFullYear();
        const fileName = `${doc.document_number}.pdf`;
        const storagePath = `${typeFolder}/${year}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('justificatifs')
          .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          result.error = `Storage upload failed: ${uploadError.message}`;
          failedCount++;
          results.push(result);
          continue;
        }

        // 4. Mettre à jour financial_documents
        const updateData: Record<string, unknown> = {
          local_pdf_path: storagePath,
          pdf_stored_at: new Date().toISOString(),
        };

        // Enrichir les métadonnées Qonto
        if (invoice.pdf_url) updateData.qonto_pdf_url = invoice.pdf_url;
        if (invoice.attachment_id)
          updateData.qonto_attachment_id = invoice.attachment_id;
        if (invoice.public_url)
          updateData.qonto_public_url = invoice.public_url;

        const { error: updateError } = await supabase
          .from('financial_documents')
          .update(updateData)
          .eq('id', doc.id);

        if (updateError) {
          result.error = `DB update failed: ${updateError.message}`;
          failedCount++;
          results.push(result);
          continue;
        }

        result.status = 'success';
        result.storage_path = storagePath;
        successCount++;

        console.warn(
          `[Backfill PDFs] ✓ ${doc.document_number} → ${storagePath}`
        );
      } catch (error) {
        result.error = error instanceof Error ? error.message : 'Unknown error';
        failedCount++;
      }

      results.push(result);
    }

    console.warn(
      `[Backfill PDFs] Complete: ${successCount} success, ${failedCount} failed, ${skippedCount} skipped`
    );

    return NextResponse.json({
      success: true,
      message: `Backfill complete: ${successCount} stored, ${failedCount} failed, ${skippedCount} skipped`,
      results: {
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
        total: documents.length,
      },
      details: results,
    });
  } catch (error) {
    console.error('[Backfill PDFs] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
