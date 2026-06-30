/**
 * Logique partagée de récupération des pièces Qonto → stockage local.
 *
 * Utilisée par :
 *  - la route POST /api/finance/sync-qonto-attachments (client utilisateur)
 *  - le cron GET /api/cron/sync-comptabilite (client admin, sans session)
 *
 * Cible : bank_transactions avec has_attachment=true ET local_pdf_path IS NULL.
 * Idempotent (les pièces déjà locales sont ignorées). Traitement en série.
 *
 * [BO-COMPTA-001]
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { QontoClient } from '@verone/integrations/qonto';
import type { Database } from '@verone/types';

export interface SyncAttachmentsOptions {
  year?: number;
  transactionIds?: string[];
  /** Plafond de transactions traitées par appel (défaut 200). */
  limit?: number;
}

export interface SyncAttachmentError {
  transactionId: string;
  attachmentId: string | null;
  reason: string;
}

export interface SyncAttachmentsResult {
  processed: number;
  downloaded: number;
  failed: number;
  errors: SyncAttachmentError[];
}

interface TransactionRow {
  id: string;
  transaction_id: string;
  attachment_ids: string[] | null;
  settled_at: string | null;
  local_pdf_path: string | null;
}

/**
 * Télécharge une pièce depuis Qonto et la stocke dans le bucket justificatifs,
 * puis met à jour bank_transactions.local_pdf_path + pdf_stored_at.
 */
async function downloadAndStore(
  supabase: SupabaseClient<Database>,
  qonto: QontoClient,
  tx: TransactionRow
): Promise<{ success: boolean; path?: string; error?: string }> {
  const attachmentId = tx.attachment_ids?.[0];
  if (!attachmentId) {
    return { success: false, error: 'Aucun attachment_id disponible' };
  }

  let attachmentUrl: string;
  try {
    attachmentUrl = await qonto.getAttachmentUrl(attachmentId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `getAttachmentUrl: ${msg}` };
  }

  let pdfBuffer: ArrayBuffer;
  try {
    const resp = await fetch(attachmentUrl);
    if (!resp.ok) {
      return {
        success: false,
        error: `Fetch Qonto ${resp.status}: ${resp.statusText}`,
      };
    }
    pdfBuffer = await resp.arrayBuffer();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `fetch PDF: ${msg}` };
  }

  if (pdfBuffer.byteLength === 0) {
    return { success: false, error: 'PDF vide reçu de Qonto' };
  }

  const settledDate = tx.settled_at ? new Date(tx.settled_at) : new Date();
  const year = settledDate.getFullYear();
  const month = String(settledDate.getMonth() + 1).padStart(2, '0');
  const storagePath = `justificatifs/${year}/${month}/${attachmentId}.pdf`;

  const { error: uploadErr } = await supabase.storage
    .from('justificatifs')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadErr) {
    return { success: false, error: `Storage upload: ${uploadErr.message}` };
  }

  const { error: updateErr } = await supabase
    .from('bank_transactions')
    .update({
      local_pdf_path: storagePath,
      pdf_stored_at: new Date().toISOString(),
    })
    .eq('id', tx.id);

  if (updateErr) {
    // PDF stocké mais DB non à jour : le prochain run re-tentera l'UPDATE.
    console.error(
      `[sync-qonto-attachments] DB update failed for tx ${tx.id}:`,
      updateErr.message
    );
    return {
      success: true,
      path: storagePath,
      error: `PDF stocké mais DB update a échoué: ${updateErr.message}`,
    };
  }

  return { success: true, path: storagePath };
}

/**
 * Récupère en local toutes les pièces Qonto manquantes selon les options.
 */
export async function syncQontoAttachments(
  supabase: SupabaseClient<Database>,
  options: SyncAttachmentsOptions = {}
): Promise<SyncAttachmentsResult> {
  const { year, transactionIds, limit = 200 } = options;

  let query = supabase
    .from('bank_transactions')
    .select('id, transaction_id, attachment_ids, settled_at, local_pdf_path')
    .eq('has_attachment', true)
    .is('local_pdf_path', null)
    .limit(limit);

  if (transactionIds && transactionIds.length > 0) {
    query = query.in('id', transactionIds);
  } else if (year !== undefined) {
    query = query
      .gte('settled_at', `${year}-01-01`)
      .lte('settled_at', `${year}-12-31`);
  }

  const { data: rows, error: queryErr } = await query;

  if (queryErr) {
    throw new Error(`Erreur requête bank_transactions: ${queryErr.message}`);
  }

  const transactions = (rows ?? []) as TransactionRow[];
  const result: SyncAttachmentsResult = {
    processed: transactions.length,
    downloaded: 0,
    failed: 0,
    errors: [],
  };

  if (transactions.length === 0) return result;

  const qonto = new QontoClient();

  for (const tx of transactions) {
    const attachmentId = tx.attachment_ids?.[0] ?? null;
    const res = await downloadAndStore(supabase, qonto, tx);

    if (res.success) {
      result.downloaded++;
      if (res.error) {
        result.errors.push({
          transactionId: tx.id,
          attachmentId,
          reason: res.error,
        });
      }
    } else {
      result.failed++;
      result.errors.push({
        transactionId: tx.id,
        attachmentId,
        reason: res.error ?? 'Erreur inconnue',
      });
      console.error(`[sync-qonto-attachments] Failed tx ${tx.id}:`, res.error);
    }
  }

  return result;
}
