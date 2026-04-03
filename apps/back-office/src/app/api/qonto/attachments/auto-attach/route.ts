/**
 * API Route: POST /api/qonto/attachments/auto-attach
 *
 * Auto-attache le PDF d'un financial_document comme justificatif
 * d'une transaction bancaire sur Qonto.
 *
 * Appele automatiquement apres un rapprochement dans RapprochementModal.
 *
 * Body (JSON):
 * - transactionId: string (bank_transactions.transaction_id)
 * - documentId: string (financial_documents.id)
 *
 * Flow:
 * 1. Verifie que le document a un PDF (local_pdf_path ou uploaded_file_url)
 * 2. Telecharge le PDF depuis Supabase Storage
 * 3. Upload vers Qonto comme justificatif de la transaction
 * 4. Met a jour les metadonnees
 */

import crypto from 'crypto';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createServerClient } from '@verone/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // 2. Parse body
    const body = (await request.json()) as {
      transactionId?: string;
      documentId?: string;
    };
    const { transactionId, documentId } = body;

    if (!transactionId || !documentId) {
      return NextResponse.json(
        { error: 'transactionId et documentId requis' },
        { status: 400 }
      );
    }

    // 3. Get document PDF path
    const { data: doc, error: docError } = await supabase
      .from('financial_documents')
      .select(
        'id, document_number, local_pdf_path, uploaded_file_url, qonto_pdf_url, qonto_attachment_id'
      )
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: 'Document non trouve' },
        { status: 404 }
      );
    }

    // Priority: local_pdf_path > uploaded_file_url
    const pdfPath = doc.local_pdf_path ?? doc.uploaded_file_url;
    if (!pdfPath) {
      return NextResponse.json(
        { error: 'Aucun PDF disponible pour ce document', skipped: true },
        { status: 200 }
      );
    }

    // 4. Get transaction Qonto UUID
    const { data: txData, error: txError } = await supabase
      .from('bank_transactions')
      .select('id, transaction_id, raw_data, attachment_ids')
      .eq('transaction_id', transactionId)
      .single();

    if (txError || !txData) {
      return NextResponse.json(
        { error: 'Transaction non trouvee' },
        { status: 404 }
      );
    }

    const rawData = txData.raw_data as { id?: string } | null;
    const qontoUUID = rawData?.id;

    if (!qontoUUID) {
      return NextResponse.json(
        { error: 'UUID Qonto manquant dans raw_data' },
        { status: 500 }
      );
    }

    // 5. Check if already attached (avoid duplicates)
    const existingIds =
      (txData as { attachment_ids?: string[] }).attachment_ids ?? [];
    if (
      doc.qonto_attachment_id &&
      existingIds.includes(doc.qonto_attachment_id)
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Justificatif deja attache a cette transaction',
      });
    }

    // 6. Download PDF from Supabase Storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from('justificatifs')
      .download(pdfPath);

    if (downloadError || !pdfData) {
      console.error(
        '[Auto-Attach] PDF download failed:',
        downloadError?.message,
        { pdfPath }
      );
      return NextResponse.json(
        {
          error: `PDF introuvable dans le storage: ${pdfPath}`,
          skipped: true,
        },
        { status: 200 }
      );
    }

    // 7. Upload to Qonto as transaction attachment
    const qontoClient = new QontoClient();
    const idempotencyKey = crypto.randomUUID();
    const filename = doc.document_number
      ? `${doc.document_number}.pdf`
      : 'facture.pdf';

    // Convert Blob to File for the Qonto client
    const file = new File([pdfData], filename, { type: 'application/pdf' });

    const attachment = await qontoClient.uploadAttachmentToTransaction(
      qontoUUID,
      file,
      filename,
      idempotencyKey
    );

    // 8. Update bank_transactions.attachment_ids
    await supabase
      .from('bank_transactions')
      .update({
        attachment_ids: [...existingIds, attachment.id],
      })
      .eq('transaction_id', transactionId);

    // 9. Update financial_documents tracking
    await supabase
      .from('financial_documents')
      .update({
        qonto_attachment_id: attachment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    return NextResponse.json({
      success: true,
      attachmentId: attachment.id,
      documentNumber: doc.document_number,
      message: `${doc.document_number} attache comme justificatif`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[Auto-Attach] Error:', message);

    // Don't fail the reconciliation if attachment fails
    return NextResponse.json(
      { error: message, skipped: true },
      { status: 200 }
    );
  }
}
