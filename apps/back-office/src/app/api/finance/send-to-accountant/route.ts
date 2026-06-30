/**
 * API Route: POST /api/finance/send-to-accountant
 *
 * Prépare (dry-run par défaut) ou envoie au cabinet comptable (Welyb)
 * les pièces justificatives des transactions bancaires, via Resend.
 *
 * GARDE-FOU STRICT : un envoi RÉEL n'a lieu QUE si :
 *   1. `confirmSend === true` dans le body ET
 *   2. `ACCOUNTANT_SEND_ENABLED === 'true'` dans l'environnement
 *
 * Sans ces deux conditions, la route retourne UNIQUEMENT le plan d'envoi
 * (dry-run), sans appeler Resend ni écrire en base.
 *
 * Body :
 *   {
 *     scope: 'achats' | 'ventes',
 *     year: number,
 *     transactionIds?: string[],   // filtrage optionnel
 *     confirmSend?: boolean        // FAUX par défaut
 *   }
 *
 * Destinataires (ENV obligatoire) :
 *   WELYB_ACHATS_EMAIL   → achats
 *   WELYB_VENTES_EMAIL   → ventes
 *   ACCOUNTANT_FROM_EMAIL → expéditeur (ex: noreply-compta@veronecollections.fr)
 *
 * [BO-COMPTA-001]
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';
import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Constantes ────────────────────────────────────────────────────────────────

/** Nombre maximum de pièces par email (OCR Welyb fonctionne mieux en petits lots) */
const BATCH_SIZE = 35;

// ── Validation ────────────────────────────────────────────────────────────────

const SendToAccountantSchema = z.object({
  scope: z.enum(['achats', 'ventes']),
  year: z.number().int().min(2020).max(2100),
  transactionIds: z.array(z.string().uuid()).max(500).optional(),
  confirmSend: z.boolean().optional().default(false),
});

// ── Types locaux ──────────────────────────────────────────────────────────────

interface TransactionWithPdf {
  id: string;
  transaction_id: string;
  local_pdf_path: string;
  settled_at: string | null;
  label: string;
  amount: number;
  side: 'credit' | 'debit';
}

interface BatchPlan {
  index: number;
  recipient: string;
  from: string;
  subject: string;
  attachmentCount: number;
  transactionIds: string[];
}

interface DryRunResponse {
  dryRun: true;
  batches: BatchPlan[];
  totalPieces: number;
  scope: string;
  year: number;
  /** true si ACCOUNTANT_SEND_ENABLED='true' côté serveur (l'UI peut proposer l'envoi réel) */
  sendAllowed: boolean;
}

interface SendResult {
  dryRun: false;
  batchesSent: number;
  piecesSent: number;
  piecesAlreadyTransferred: number;
  errors: Array<{ batchIndex: number; reason: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY manquant dans les variables d'environnement"
    );
  }
  return new Resend(apiKey);
}

// Adresses de collecte Welyb (cabinet Audamex), branchées en dur car stables.
// Surchargeables par variable d'environnement si elles changent un jour.
// Aucun envoi n'a lieu tant que ACCOUNTANT_SEND_ENABLED !== 'true' (garde-fou).
const WELYB_RECIPIENTS = {
  achats: 'compta+verone@welyb.com',
  ventes: 'ventes+verone@welyb.fr',
} as const;

function getRecipient(scope: 'achats' | 'ventes'): string {
  const envKey =
    scope === 'achats' ? 'WELYB_ACHATS_EMAIL' : 'WELYB_VENTES_EMAIL';
  return process.env[envKey] ?? WELYB_RECIPIENTS[scope];
}

function getFromEmail(): string {
  return (
    process.env.ACCOUNTANT_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    'noreply-compta@veronecollections.fr'
  );
}

/**
 * Construit le sujet d'un lot selon la convention Welyb.
 * Texte brut — Welyb est sensible aux entêtes riches.
 */
function buildSubject(
  scope: 'achats' | 'ventes',
  year: number,
  batchIndex: number,
  totalBatches: number
): string {
  const scopeLabel = scope === 'achats' ? 'Achats' : 'Ventes';
  return `Verone - Pieces ${scopeLabel} ${year} (lot ${batchIndex}/${totalBatches})`;
}

/**
 * Construit le corps texte brut de l'email.
 * INTENTIONNELLEMENT sobre : Welyb fait de l'OCR sur les pièces jointes,
 * logos et HTML riches sont confondus avec des pièces.
 */
function buildEmailText(
  scope: 'achats' | 'ventes',
  year: number,
  batchIndex: number,
  totalBatches: number,
  attachmentCount: number
): string {
  return [
    `Verone Collections — Pieces justificatives ${scope === 'achats' ? 'Achats' : 'Ventes'} ${year}`,
    '',
    `Lot ${batchIndex} sur ${totalBatches} — ${attachmentCount} piece(s) jointe(s)`,
    '',
    'Chaque piece est jointe individuellement en PDF.',
    'Ce message est envoye automatiquement depuis le back-office Verone.',
  ].join('\n');
}

/**
 * Divise un tableau en lots de taille `size`.
 */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
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

    // 2. Parse + validation Zod
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Body JSON invalide' },
        { status: 400 }
      );
    }

    const parsed = SendToAccountantSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { scope, year, transactionIds, confirmSend } = parsed.data;

    // 3. GARDE-FOU : vérifier si envoi réel autorisé
    //    Les deux conditions DOIVENT être réunies pour sortir du dry-run.
    const sendEnabled =
      process.env.ACCOUNTANT_SEND_ENABLED === 'true' && confirmSend === true;

    // 4. Récupérer les transactions éligibles :
    //    - pièce locale présente (local_pdf_path IS NOT NULL)
    //    - non encore transférées (transferred_to_accountant_at IS NULL)
    //    - côté correspondant au scope (debit=achats, credit=ventes)
    const sideFilter = scope === 'achats' ? 'debit' : 'credit';

    let query = supabase
      .from('bank_transactions')
      .select(
        'id, transaction_id, local_pdf_path, settled_at, label, amount, side'
      )
      .eq('side', sideFilter)
      .not('local_pdf_path', 'is', null)
      // transferred_to_accountant_at : colonne ajoutée par migration 20260618101000
      // mais absente des types générés (@verone/types non encore régénérés).
      // .filter() accepte une colonne arbitraire en string sans vérification TS.
      .filter('transferred_to_accountant_at', 'is', null)
      .gte('settled_at', `${year}-01-01`)
      // Borne haute exclusive au 1er janvier suivant : capte tout le 31/12 (heures
      // de la journée incluses), que `.lte('${year}-12-31')` (= minuit) excluait.
      .lt('settled_at', `${year + 1}-01-01`)
      .order('settled_at', { ascending: true })
      .limit(500);

    if (transactionIds && transactionIds.length > 0) {
      query = query.in('id', transactionIds);
    }

    const { data: rows, error: queryErr } = await query;

    if (queryErr) {
      console.error('[send-to-accountant] Query error:', queryErr.message);
      return NextResponse.json(
        { error: `Erreur requête: ${queryErr.message}` },
        { status: 500 }
      );
    }

    // Filtrer les lignes sans local_pdf_path (le .not() suffit mais TypeScript
    // ne le sait pas car local_pdf_path est nullable dans les types générés).
    // On mappe vers TransactionWithPdf pour avoir local_pdf_path: string (non-null).
    const eligibleTx: TransactionWithPdf[] = (rows ?? [])
      .filter(
        r => typeof r.local_pdf_path === 'string' && r.local_pdf_path.length > 0
      )
      .map(r => ({
        id: r.id,
        transaction_id: r.transaction_id,
        local_pdf_path: r.local_pdf_path as string, // garanti non-null par le .filter() ci-dessus
        settled_at: r.settled_at,
        label: r.label,
        amount: r.amount,
        side: r.side,
      }));

    if (eligibleTx.length === 0) {
      return NextResponse.json({
        dryRun: !sendEnabled,
        batches: [],
        totalPieces: 0,
        scope,
        year,
        sendAllowed: process.env.ACCOUNTANT_SEND_ENABLED === 'true',
        message: 'Aucune pièce éligible à envoyer',
      });
    }

    // 5. Vérifier la configuration destinataire (fail-fast avant tout travail)
    let recipient: string;
    let fromEmail: string;
    try {
      recipient = getRecipient(scope);
      fromEmail = getFromEmail();
    } catch (configErr) {
      const msg =
        configErr instanceof Error ? configErr.message : String(configErr);
      return NextResponse.json(
        { error: `Configuration manquante: ${msg}` },
        { status: 500 }
      );
    }

    // 6. Construire les lots
    const batches = chunk(eligibleTx, BATCH_SIZE);
    const totalBatches = batches.length;

    // ── MODE DRY-RUN (défaut) ────────────────────────────────────────────────
    if (!sendEnabled) {
      const plan: BatchPlan[] = batches.map((batch, i) => ({
        index: i + 1,
        recipient,
        from: fromEmail,
        subject: buildSubject(scope, year, i + 1, totalBatches),
        attachmentCount: batch.length,
        transactionIds: batch.map(tx => tx.id),
      }));

      const response: DryRunResponse = {
        dryRun: true,
        batches: plan,
        totalPieces: eligibleTx.length,
        scope,
        year,
        sendAllowed: process.env.ACCOUNTANT_SEND_ENABLED === 'true',
      };
      return NextResponse.json(response);
    }

    // ── MODE ENVOI RÉEL ──────────────────────────────────────────────────────
    // Atteint UNIQUEMENT si confirmSend=true ET ACCOUNTANT_SEND_ENABLED='true'

    const resend = getResendClient();
    let batchesSent = 0;
    let piecesSent = 0;
    const sendErrors: Array<{ batchIndex: number; reason: string }> = [];

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      if (!batch) continue;

      const batchNumber = batchIdx + 1;
      const subject = buildSubject(scope, year, batchNumber, totalBatches);
      const text = buildEmailText(
        scope,
        year,
        batchNumber,
        totalBatches,
        batch.length
      );

      // Télécharger les PDFs depuis Supabase Storage pour les joindre
      const attachments: Array<{ filename: string; content: string }> = [];
      const sentTxIds: string[] = [];

      for (const tx of batch) {
        const { data: pdfBlob, error: dlErr } = await supabase.storage
          .from('justificatifs')
          .download(tx.local_pdf_path);

        if (dlErr || !pdfBlob) {
          console.error(
            `[send-to-accountant] PDF download failed for tx ${tx.id}:`,
            dlErr?.message
          );
          // On skip ce PDF mais on continue le lot
          continue;
        }

        const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
        // Nommage PDF : date-label.pdf (caractères safe)
        const dateStr = tx.settled_at
          ? tx.settled_at.slice(0, 10)
          : 'date-inconnue';
        const safeLabel = tx.label
          .replace(/[^a-zA-Z0-9\-_]/g, '_')
          .slice(0, 50);
        const filename = `${dateStr}_${safeLabel}_${tx.transaction_id.slice(0, 8)}.pdf`;

        attachments.push({
          filename,
          content: pdfBuffer.toString('base64'),
        });
        sentTxIds.push(tx.id);
      }

      if (attachments.length === 0) {
        sendErrors.push({
          batchIndex: batchNumber,
          reason: 'Aucun PDF téléchargeable dans ce lot',
        });
        continue;
      }

      // Envoi Resend
      const { data: emailData, error: emailErr } = await resend.emails.send({
        from: fromEmail,
        to: [recipient],
        subject,
        text,
        // Intentionnellement pas de `html` : Welyb OCR sensible aux templates HTML riches
        attachments,
      });

      if (emailErr) {
        console.error(
          `[send-to-accountant] Resend error batch ${batchNumber}:`,
          emailErr
        );
        sendErrors.push({
          batchIndex: batchNumber,
          reason: emailErr.message,
        });
        continue;
      }

      // Mise à jour DB : INSERT document_emails + UPDATE transferred_to_accountant_*
      // pour chaque transaction du lot envoyé avec succès

      // INSERT dans document_emails (tracking historique)
      // La table document_emails ne différencie pas encore les emails "compta"
      // des emails "client" — on utilise document_type='bank_transaction_batch'
      // et document_id=id du 1er tx du lot pour le référencement.
      const firstTxId = sentTxIds[0];
      if (firstTxId) {
        const { error: emailLogErr } = await supabase
          .from('document_emails')
          .insert({
            document_type: 'bank_transaction_batch',
            document_id: firstTxId,
            recipient_email: recipient,
            subject,
            message_body: text,
            attachments: sentTxIds.map(id => ({ transaction_id: id })),
            sent_by: user.id,
            resend_email_id: emailData?.id ?? null,
            status: 'sent',
          });

        if (emailLogErr) {
          console.error(
            '[send-to-accountant] document_emails insert error:',
            emailLogErr.message
          );
          // Non-bloquant : l'email est parti, on continue
        }
      }

      // UPDATE transferred_to_accountant_at/_by pour chaque tx du lot.
      // Ces colonnes existent en DB (migration 20260618101000) mais les types
      // @verone/types ne sont pas encore régénérés. On utilise l'API REST PostgREST
      // directement (syntax ?id=in.(uuid,...)) pour éviter tout cast non-safe côté TS.
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      let transferUpdateErr: { message: string } | null = null;

      if (supabaseUrl && supabaseServiceKey && sentTxIds.length > 0) {
        const idsValue = sentTxIds.join(',');
        const patchResp = await fetch(
          `${supabaseUrl}/rest/v1/bank_transactions?id=in.(${idsValue})`,
          {
            method: 'PATCH',
            headers: {
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              transferred_to_accountant_at: new Date().toISOString(),
              transferred_to_accountant_by: user.id,
            }),
          }
        );
        if (!patchResp.ok) {
          const errText = await patchResp.text();
          transferUpdateErr = { message: errText };
        }
      } else if (!supabaseUrl || !supabaseServiceKey) {
        transferUpdateErr = {
          message:
            'NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant',
        };
      }

      if (transferUpdateErr) {
        console.error(
          '[send-to-accountant] transferred_to_accountant update error:',
          transferUpdateErr.message
        );
        sendErrors.push({
          batchIndex: batchNumber,
          reason: `Email envoyé mais marquage DB échoué: ${transferUpdateErr.message}`,
        });
        // Non-bloquant sur le comptage des lots envoyés
      }

      batchesSent++;
      piecesSent += sentTxIds.length;
    }

    const result: SendResult = {
      dryRun: false,
      batchesSent,
      piecesSent,
      piecesAlreadyTransferred: 0, // déjà filtrées à l'étape 4
      errors: sendErrors,
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[send-to-accountant] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
