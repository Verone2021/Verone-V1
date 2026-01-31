/**
 * API Route: POST /api/qonto/attachments/upload
 *
 * Upload une facture PDF vers Qonto et l'attache à une transaction.
 *
 * Body (FormData):
 * - file: File (PDF, JPEG, PNG)
 * - transactionId: string (ID transaction Qonto)
 * - documentId?: string (ID financial_documents pour tracking)
 *
 * Response:
 * - { success: true, attachmentId: string }
 */

import crypto from 'crypto';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import type { Json as _Json } from '@verone/types/supabase';
import { createServerClient } from '@verone/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Types acceptés par Qonto
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Parser le FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const transactionId = formData.get('transactionId') as string | null;
    const documentId = formData.get('documentId') as string | null;

    // 3. Validations
    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID transaction requis' },
        { status: 400 }
      );
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Type de fichier non supporté: ${file.type}. Acceptés: PDF, JPEG, PNG`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10MB)' },
        { status: 400 }
      );
    }

    // 4. Vérifier que la transaction existe et récupérer raw_data pour mise à jour ultérieure
    const { data: txData, error: txError } = await supabase
      .from('bank_transactions')
      .select('id, raw_data')
      .eq('transaction_id', transactionId)
      .single();

    if (txError || !txData) {
      return NextResponse.json(
        { error: 'Transaction non trouvée dans la base de données' },
        { status: 404 }
      );
    }

    // L'API Qonto attend le UUID "id" (pas "transaction_id")
    // Voir documentation: POST /v2/transactions/{id}/attachments où {id} = UUID
    // Le UUID est stocké dans raw_data.id lors de la sync
    const rawDataForUUID = txData.raw_data as {
      id?: string;
      transaction_id?: string;
    } | null;
    const qontoUUID = rawDataForUUID?.id;

    if (!qontoUUID) {
      console.error('[Qonto Upload] UUID manquant dans raw_data:', {
        transactionId,
        rawDataKeys: rawDataForUUID ? Object.keys(rawDataForUUID) : 'null',
      });
      return NextResponse.json(
        {
          error:
            'UUID Qonto manquant - la transaction doit être resynchronisée',
        },
        { status: 500 }
      );
    }

    // 5. Upload vers Qonto avec le UUID (pas transaction_id)
    const qontoClient = new QontoClient();
    const idempotencyKey: string = crypto.randomUUID();

    const attachment = await qontoClient.uploadAttachmentToTransaction(
      qontoUUID,
      file,
      file.name || 'facture.pdf',
      idempotencyKey
    );

    // 6. Mettre à jour financial_documents avec les nouvelles colonnes
    if (documentId) {
      await supabase
        .from('financial_documents')
        .update({
          upload_status: 'uploaded',
          qonto_attachment_id: attachment.id,
          uploaded_at: new Date().toISOString(),
          uploaded_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);
    }

    // 7. Mettre à jour UNIQUEMENT attachment_ids (source de vérité unique)
    // Note: has_attachment est une colonne GENERATED qui se recalcule automatiquement
    const txDataWithIds = txData as { attachment_ids?: string[] };
    const existingIds = txDataWithIds.attachment_ids ?? [];

    await supabase
      .from('bank_transactions')
      .update({
        attachment_ids: [...existingIds, attachment.id],
      })
      .eq('transaction_id', transactionId);

    return NextResponse.json({
      success: true,
      attachmentId: attachment.id,
      message: 'Facture uploadée avec succès vers Qonto',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';

    // Gérer les erreurs spécifiques Qonto
    if (message.includes('AUTH_ERROR') || message.includes('401')) {
      return NextResponse.json(
        { error: 'Credentials Qonto invalides' },
        { status: 401 }
      );
    }

    if (message.includes('NOT_FOUND') || message.includes('404')) {
      return NextResponse.json(
        { error: 'Transaction non trouvée sur Qonto' },
        { status: 404 }
      );
    }

    if (message.includes('VALIDATION_ERROR')) {
      return NextResponse.json(
        { error: 'Fichier rejeté par Qonto (format ou taille invalide)' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
