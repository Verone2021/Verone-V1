/**
 * API Route: POST /api/qonto/attachments/cleanup-duplicates
 *
 * Nettoie les pièces jointes en double pour une transaction.
 * Usage unique pour FREE MOBILE.
 *
 * 1. Télécharge l'attachment à garder
 * 2. Supprime tous les attachments sur Qonto
 * 3. Re-uploade l'attachment unique
 * 4. Met à jour notre base
 */

import crypto from 'crypto';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { createServerClient } from '@verone/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Configuration pour FREE MOBILE
const FREE_MOBILE_CONFIG = {
  dbId: '1049eea2-8b29-4098-bfea-7d9c7edb5ad3',
  qontoUUID: '019b6dfd-e10a-713c-9a9a-b8916cbb334b',
  attachmentToKeep: '019b805a-9822-7ad5-8f25-ee3cf8e1d96d',
};

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const qontoClient = new QontoClient();

    // 2. Télécharger l'attachment à garder
    console.warn(
      "[Cleanup] Étape 1: Téléchargement de l'attachment à garder..."
    );
    const attachmentUrl = await qontoClient.getAttachmentUrl(
      FREE_MOBILE_CONFIG.attachmentToKeep
    );

    const attachmentResponse = await fetch(attachmentUrl);
    if (!attachmentResponse.ok) {
      throw new Error(`Échec téléchargement: ${attachmentResponse.status}`);
    }

    const attachmentBlob = await attachmentResponse.blob();
    const contentType =
      attachmentResponse.headers.get('content-type') ?? 'application/pdf';
    const fileName = 'facture-free-mobile.pdf';

    console.warn(
      `[Cleanup] Téléchargé: ${attachmentBlob.size} bytes, type: ${contentType}`
    );

    // 3. Supprimer TOUS les attachments sur Qonto
    console.warn(
      '[Cleanup] Étape 2: Suppression de tous les attachments sur Qonto...'
    );
    await qontoClient.removeTransactionAttachments(
      FREE_MOBILE_CONFIG.qontoUUID
    );
    console.warn('[Cleanup] Suppression terminée');

    // 4. Re-uploader l'attachment unique
    console.warn("[Cleanup] Étape 3: Re-upload de l'attachment unique...");
    const file = new File([attachmentBlob], fileName, { type: contentType });
    const idempotencyKey = crypto.randomUUID();

    const newAttachment = await qontoClient.uploadAttachmentToTransaction(
      FREE_MOBILE_CONFIG.qontoUUID,
      file,
      fileName,
      idempotencyKey
    );

    console.warn(`[Cleanup] Nouvel attachment ID: ${newAttachment.id}`);

    // 5. Mettre à jour notre base
    console.warn('[Cleanup] Étape 4: Mise à jour de notre base...');
    await supabase
      .from('bank_transactions')
      .update({
        attachment_ids: [newAttachment.id],
      })
      .eq('id', FREE_MOBILE_CONFIG.dbId);

    console.warn('[Cleanup] Base mise à jour');

    return NextResponse.json({
      success: true,
      message: 'Nettoyage terminé avec succès',
      oldAttachmentId: FREE_MOBILE_CONFIG.attachmentToKeep,
      newAttachmentId: newAttachment.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[Cleanup] Erreur:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
