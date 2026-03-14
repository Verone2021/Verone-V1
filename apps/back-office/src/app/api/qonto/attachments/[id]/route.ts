/**
 * API Route: /api/qonto/attachments/[id]
 *
 * GET: Serves a Qonto attachment PDF with store-on-read pattern.
 *      Priority: 1) Local Supabase Storage  2) Qonto proxy + store locally
 *      Optional query param: ?transactionId={uuid} to skip DB lookup
 *
 * DELETE: Supprime un attachment d'une transaction
 *         Requiert: transactionId (query param) - ID de la transaction dans notre DB
 *
 * Usage:
 * - GET: window.open('/api/qonto/attachments/{attachmentId}', '_blank')
 * - DELETE: fetch('/api/qonto/attachments/{attachmentId}?transactionId={txId}', { method: 'DELETE' })
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createServerClient } from '@verone/utils/supabase/server';

/**
 * Store-on-read: Upload attachment PDF to Supabase Storage and update bank_transactions.
 * Non-blocking: errors are logged but don't fail the request.
 */
async function storeAttachmentLocally(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  transactionId: string,
  attachmentId: string,
  pdfBuffer: ArrayBuffer,
  settledAt: string | null
): Promise<void> {
  try {
    const year = settledAt
      ? new Date(settledAt).getFullYear()
      : new Date().getFullYear();
    const storagePath = `justificatifs/${year}/${attachmentId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('justificatifs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Attachment Store] Upload failed:', uploadError);
      return;
    }

    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({
        local_pdf_path: storagePath,
        pdf_stored_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('[Attachment Store] DB update failed:', updateError);
      return;
    }

    console.warn(
      `[Attachment Store] Success: ${storagePath} for tx ${transactionId}`
    );
  } catch (error) {
    console.error('[Attachment Store] Error:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Récupérer l'ID de l'attachment
    const { id: attachmentId } = await params;

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'ID attachment requis' },
        { status: 400 }
      );
    }

    // 3. Check if we have this attachment stored locally
    const { searchParams } = new URL(request.url);
    const transactionIdParam = searchParams.get('transactionId');

    let transactionId: string | null = transactionIdParam;
    let localPdfPath: string | null = null;
    let settledAt: string | null = null;

    // Look up the bank_transaction that owns this attachment
    const { data: transaction } = await supabase
      .from('bank_transactions')
      .select('id, local_pdf_path, settled_at')
      .contains('attachment_ids', [attachmentId])
      .single();

    if (transaction) {
      transactionId = transaction.id;
      localPdfPath = transaction.local_pdf_path ?? null;
      settledAt = transaction.settled_at ?? null;
    }

    // 4. If PDF stored locally, serve from Supabase Storage
    if (localPdfPath) {
      console.warn('[Attachment] Serving from local storage:', localPdfPath);

      const { data: pdfData, error: downloadError } = await supabase.storage
        .from('justificatifs')
        .download(localPdfPath);

      if (!downloadError && pdfData) {
        const pdfBuffer = await pdfData.arrayBuffer();

        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="justificatif-${attachmentId}.pdf"`,
            'Content-Length': String(pdfBuffer.byteLength),
            'X-PDF-Source': 'local',
          },
        });
      }
      // If local download fails, fall through to Qonto
      console.warn(
        '[Attachment] Local storage download failed, falling back to Qonto:',
        downloadError
      );
    }

    // 5. Fetch from Qonto (proxy)
    const qontoClient = new QontoClient();
    const attachmentUrl = await qontoClient.getAttachmentUrl(attachmentId);

    if (!attachmentUrl) {
      return NextResponse.json(
        { error: 'Attachment non trouvé' },
        { status: 404 }
      );
    }

    const fileResponse = await fetch(attachmentUrl);

    if (!fileResponse.ok) {
      console.error(
        `[Attachment] Failed to fetch from Qonto: ${fileResponse.status}`
      );
      return NextResponse.json(
        { error: `Erreur Qonto: ${fileResponse.status}` },
        { status: fileResponse.status }
      );
    }

    const pdfBuffer = await fileResponse.arrayBuffer();
    const contentType =
      fileResponse.headers.get('Content-Type') ?? 'application/pdf';

    // 6. Store-on-read: save locally in background (non-blocking)
    if (transactionId && !localPdfPath && pdfBuffer.byteLength > 0) {
      void storeAttachmentLocally(
        supabase,
        transactionId,
        attachmentId,
        pdfBuffer,
        settledAt
      ).catch((error: unknown) => {
        console.error('[Attachment] Store-on-read error:', error);
      });
    }

    // Return the file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="justificatif-${attachmentId}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
        'X-PDF-Source': 'qonto',
        'Cache-Control': 'private, max-age=1800',
      },
    });
  } catch (error) {
    console.error('[API] Qonto attachment error:', error);

    const message = error instanceof Error ? error.message : 'Erreur inconnue';

    if (message.includes('AUTH_ERROR') || message.includes('401')) {
      return NextResponse.json(
        { error: 'Credentials Qonto invalides' },
        { status: 401 }
      );
    }

    if (message.includes('NOT_FOUND') || message.includes('404')) {
      return NextResponse.json(
        { error: 'Attachment non trouvé sur Qonto' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/qonto/attachments/[id]?transactionId={uuid}
 *
 * Supprime un attachment spécifique d'une transaction Qonto
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Récupérer les paramètres
    const { id: attachmentId } = await params;
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'ID attachment requis' },
        { status: 400 }
      );
    }

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID transaction requis (query param transactionId)' },
        { status: 400 }
      );
    }

    // 3. Récupérer la transaction pour obtenir l'ID Qonto
    const { data: transaction, error: txError } = await supabase
      .from('bank_transactions')
      .select('id, raw_data, attachment_ids')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      console.error('[API] Transaction not found:', txError);
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }

    const qontoTransactionId = (transaction.raw_data as { id?: string })?.id;
    if (!qontoTransactionId) {
      return NextResponse.json(
        { error: 'ID Qonto non trouvé pour cette transaction' },
        { status: 400 }
      );
    }

    // 4. Supprimer l'attachment sur Qonto
    const qontoClient = new QontoClient();
    await qontoClient.removeSingleAttachment(qontoTransactionId, attachmentId);

    // 5. Mettre à jour attachment_ids dans la DB
    const currentIds = (transaction.attachment_ids as string[]) ?? [];
    const newIds = currentIds.filter(id => id !== attachmentId);

    const { error: updateError } = await supabase
      .from('bank_transactions')
      .update({
        attachment_ids: newIds.length > 0 ? newIds : null,
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('[API] Failed to update attachment_ids:', updateError);
      // L'attachment a été supprimé sur Qonto, on log l'erreur mais on retourne succès
    }

    console.warn(
      `[API] Attachment ${attachmentId} deleted from transaction ${transactionId}`
    );

    return NextResponse.json({
      success: true,
      message: 'Attachment supprimé',
      remainingAttachments: newIds,
    });
  } catch (error) {
    console.error('[API] Delete attachment error:', error);

    const message = error instanceof Error ? error.message : 'Erreur inconnue';

    if (message.includes('AUTH_ERROR') || message.includes('401')) {
      return NextResponse.json(
        { error: 'Credentials Qonto invalides' },
        { status: 401 }
      );
    }

    if (message.includes('NOT_FOUND') || message.includes('404')) {
      return NextResponse.json(
        { error: 'Attachment non trouvé sur Qonto' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
