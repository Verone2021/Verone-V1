/**
 * API Route: /api/qonto/attachments/[id]
 *
 * GET: Récupère l'URL temporaire d'un attachment Qonto (valide 30 min)
 *      et redirige vers cette URL pour afficher/télécharger le PDF.
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

    // 3. Créer le client Qonto et récupérer l'URL temporaire
    const qontoClient = new QontoClient();
    const attachmentUrl = await qontoClient.getAttachmentUrl(attachmentId);

    if (!attachmentUrl) {
      return NextResponse.json(
        { error: 'Attachment non trouvé' },
        { status: 404 }
      );
    }

    // 4. Proxy le contenu au lieu de redirect (évite problèmes CORS)
    // On télécharge le fichier côté serveur et on le renvoie au client
    const fileResponse = await fetch(attachmentUrl);

    if (!fileResponse.ok) {
      console.error(
        `[Qonto Attachment] Failed to fetch from Qonto: ${fileResponse.status}`
      );
      return NextResponse.json(
        { error: `Erreur Qonto: ${fileResponse.status}` },
        { status: fileResponse.status }
      );
    }

    const blob = await fileResponse.blob();
    const contentType =
      fileResponse.headers.get('Content-Type') ?? 'application/pdf';

    // Retourner le fichier avec les bons headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="qonto-${attachmentId}.pdf"`,
        'Cache-Control': 'private, max-age=1800', // Cache 30 min (durée URL Qonto)
      },
    });
  } catch (error) {
    console.error('[API] Qonto attachment error:', error);

    const message = error instanceof Error ? error.message : 'Erreur inconnue';

    // Gérer les erreurs spécifiques Qonto
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
