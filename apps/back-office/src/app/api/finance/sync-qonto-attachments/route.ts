/**
 * API Route: POST /api/finance/sync-qonto-attachments
 *
 * Rapatrie en local les pièces jointes présentes sur Qonto
 * mais pas encore téléchargées (local_pdf_path IS NULL).
 *
 * Idempotent : les transactions déjà en local sont ignorées (skippées).
 * Traitement en série pour ne pas saturer l'API Qonto.
 *
 * Body (JSON, optionnel) :
 *   { year?: number, transactionIds?: string[] }
 *
 * Réponse :
 *   { processed, downloaded, failed, errors }
 *
 * [BO-COMPTA-001]
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { QontoClient } from '@verone/integrations/qonto';
import { createServerClient } from '@verone/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Validation ───────────────────────────────────────────────────────────────

const SyncBodySchema = z.object({
  year: z.number().int().min(2020).max(2100).optional(),
  transactionIds: z.array(z.string().uuid()).max(500).optional(),
});

// ── Types locaux ─────────────────────────────────────────────────────────────

interface TransactionRow {
  id: string;
  transaction_id: string;
  attachment_ids: string[] | null;
  settled_at: string | null;
  local_pdf_path: string | null;
}

interface SyncError {
  transactionId: string;
  attachmentId: string | null;
  reason: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Télécharge une pièce depuis Qonto et la stocke dans le bucket justificatifs.
 * Met à jour bank_transactions.local_pdf_path + pdf_stored_at.
 *
 * Réutilise la même logique que api/qonto/attachments/[id] (store-on-read)
 * mais en mode synchrone (pas fire-and-forget) : ici on veut savoir si ça a
 * réussi pour cumuler les stats.
 */
async function downloadAndStore(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  qontoClient: QontoClient,
  tx: TransactionRow
): Promise<{ success: boolean; path?: string; error?: string }> {
  const attachmentId = tx.attachment_ids?.[0];
  if (!attachmentId) {
    return { success: false, error: 'Aucun attachment_id disponible' };
  }

  // 1. Récupérer l'URL Qonto (valide 30 min)
  let attachmentUrl: string;
  try {
    attachmentUrl = await qontoClient.getAttachmentUrl(attachmentId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `getAttachmentUrl: ${msg}` };
  }

  // 2. Télécharger le PDF
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

  // 3. Calculer le chemin de stockage (convention justificatifs/YYYY/MM/<fichier>.pdf)
  const settledDate = tx.settled_at ? new Date(tx.settled_at) : new Date();
  const year = settledDate.getFullYear();
  const month = String(settledDate.getMonth() + 1).padStart(2, '0');
  const storagePath = `justificatifs/${year}/${month}/${attachmentId}.pdf`;

  // 4. Upload dans le bucket
  const { error: uploadErr } = await supabase.storage
    .from('justificatifs')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadErr) {
    return { success: false, error: `Storage upload: ${uploadErr.message}` };
  }

  // 5. Mise à jour DB
  const { error: updateErr } = await supabase
    .from('bank_transactions')
    .update({
      local_pdf_path: storagePath,
      pdf_stored_at: new Date().toISOString(),
    })
    .eq('id', tx.id);

  if (updateErr) {
    // L'upload a réussi mais la DB n'est pas à jour — on log et on retourne succès
    // partiel (le fichier est bien dans le Storage, le prochain run re-tentera l'UPDATE)
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

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Parse + validation Zod du body
    let body: unknown;
    try {
      const text = await request.text();
      body = text.length > 0 ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: 'Body JSON invalide' },
        { status: 400 }
      );
    }

    const parsed = SyncBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { year, transactionIds } = parsed.data;

    // 3. Construire la requête Supabase
    //    Cible : has_attachment=true ET local_pdf_path IS NULL
    let query = supabase
      .from('bank_transactions')
      .select('id, transaction_id, attachment_ids, settled_at, local_pdf_path')
      .eq('has_attachment', true)
      .is('local_pdf_path', null)
      .limit(200); // plafond de sécurité par appel

    if (transactionIds && transactionIds.length > 0) {
      query = query.in('id', transactionIds);
    } else if (year !== undefined) {
      query = query
        .gte('settled_at', `${year}-01-01`)
        .lte('settled_at', `${year}-12-31`);
    }

    const { data: rows, error: queryErr } = await query;

    if (queryErr) {
      console.error('[sync-qonto-attachments] Query error:', queryErr.message);
      return NextResponse.json(
        { error: `Erreur requête: ${queryErr.message}` },
        { status: 500 }
      );
    }

    const transactions = (rows ?? []) as TransactionRow[];

    if (transactions.length === 0) {
      return NextResponse.json({
        processed: 0,
        downloaded: 0,
        failed: 0,
        errors: [],
        message: 'Aucune pièce à synchroniser',
      });
    }

    // 4. Traitement en série (throttle naturel — pas de saturation API Qonto)
    const qontoClient = new QontoClient();
    let downloaded = 0;
    let failed = 0;
    const errors: SyncError[] = [];

    for (const tx of transactions) {
      const attachmentId = tx.attachment_ids?.[0] ?? null;
      const result = await downloadAndStore(supabase, qontoClient, tx);

      if (result.success) {
        downloaded++;
        if (result.error) {
          // Succès partiel (fichier stocké mais DB update raté)
          errors.push({
            transactionId: tx.id,
            attachmentId,
            reason: result.error,
          });
        }
      } else {
        failed++;
        errors.push({
          transactionId: tx.id,
          attachmentId,
          reason: result.error ?? 'Erreur inconnue',
        });
        console.error(
          `[sync-qonto-attachments] Failed tx ${tx.id}:`,
          result.error
        );
      }
    }

    return NextResponse.json({
      processed: transactions.length,
      downloaded,
      failed,
      errors,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[sync-qonto-attachments] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
