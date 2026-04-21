/**
 * cascade-cancel-linked-docs.ts
 *
 * Helper serveur : planification et exécution de la cascade de suppression
 * des documents financiers Qonto liés à une commande lors de son annulation.
 *
 * Utilisé par la route POST /api/sales-orders/[id]/cancel (sprint 2).
 *
 * Règles métier (finance.md R6) :
 *   - Facture unpaid / paid / overdue → REFUSE (créer un avoir d'abord)
 *   - Devis accepted → CASCADE_CONFIRM (modal garde-fou)
 *   - Devis draft / pending_approval / finalized / declined / expired → CASCADE_AUTO
 *   - Proforma (customer_invoice draft) → CASCADE_AUTO
 *   - Facture canceled → CASCADE_AUTO (soft-delete local uniquement)
 */

import type {
  QontoClientInvoice,
  QontoClientQuote,
  QontoInvoiceStatus,
  QontoQuoteStatus,
} from '@verone/integrations/qonto';
import { QontoClient, QontoError } from '@verone/integrations/qonto';
import { createAdminClient } from '@verone/utils/supabase/server';

// ============================================================
// TYPES
// ============================================================

export type LinkedDoc = {
  /** financial_documents.id (UUID local) */
  id: string;
  /** financial_documents.qonto_invoice_id (ID devis ou facture Qonto) */
  qontoId: string;
  /** Type de document Qonto */
  documentType: 'customer_quote' | 'customer_invoice';
  /** Numéro lisible pour affichage utilisateur (ex: DEV-001, FAC-003) */
  documentNumber: string | null;
  /** Statut live Qonto récupéré au moment de planCascadeCancel */
  qontoStatus: string;
};

export type CascadeVerdict =
  | { action: 'proceed'; docsToDelete: LinkedDoc[] }
  | { action: 'confirm'; reason: string; docsToDelete: LinkedDoc[] }
  | { action: 'refuse'; reason: string };

/** Classification interne — non exposée */
type DocClassification = 'CASCADE_AUTO' | 'CASCADE_CONFIRM' | 'REFUSE';

// ============================================================
// QONTO CLIENT FACTORY
// Copie exacte du pattern apps/back-office/src/app/api/qonto/quotes/[id]/route.ts:15-22
// ============================================================

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

// ============================================================
// HELPERS DE CLASSIFICATION
// ============================================================

function classifyQuote(status: QontoQuoteStatus): DocClassification {
  switch (status) {
    case 'accepted':
      return 'CASCADE_CONFIRM';
    case 'draft':
    case 'pending_approval':
    case 'finalized':
    case 'declined':
    case 'expired':
      return 'CASCADE_AUTO';
    default: {
      // Exhaustivité : si Qonto ajoute un statut inconnu, on refuse par sécurité
      const _exhaustive: never = status;
      console.error(
        '[cascade-cancel-linked-docs] Statut devis Qonto inconnu:',
        _exhaustive
      );
      return 'REFUSE';
    }
  }
}

function classifyInvoice(status: QontoInvoiceStatus): DocClassification {
  switch (status) {
    case 'cancelled':
      return 'CASCADE_AUTO';
    case 'draft':
      return 'CASCADE_AUTO';
    case 'unpaid':
    case 'paid':
    case 'overdue':
      return 'REFUSE';
    default: {
      const _exhaustive: never = status;
      console.error(
        '[cascade-cancel-linked-docs] Statut facture Qonto inconnu:',
        _exhaustive
      );
      return 'REFUSE';
    }
  }
}

// ============================================================
// TYPE GUARD — row DB financial_documents
// ============================================================

interface FinancialDocRow {
  id: string;
  qonto_invoice_id: string;
  document_type: string;
  document_number: string | null;
}

function isValidDocRow(row: unknown): row is FinancialDocRow {
  if (typeof row !== 'object' || row === null) return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.qonto_invoice_id === 'string' &&
    r.qonto_invoice_id.length > 0 &&
    typeof r.document_type === 'string'
  );
}

// ============================================================
// PLAN CASCADE CANCEL
// ============================================================

/**
 * Interroge la DB et Qonto pour décider si l'annulation de la commande
 * peut se faire (et comment).
 *
 * @param orderId  UUID de la commande (sales_orders.id)
 * @returns        Verdict : proceed / confirm / refuse
 */
export async function planCascadeCancel(
  orderId: string
): Promise<CascadeVerdict> {
  const supabase = createAdminClient();

  // 1. Lire les documents actifs liés à la commande
  const { data: rows, error: dbError } = await supabase
    .from('financial_documents')
    .select('id, qonto_invoice_id, document_type, document_number')
    .eq('sales_order_id', orderId)
    .is('deleted_at', null);

  if (dbError) {
    console.error(
      '[cascade-cancel-linked-docs] Erreur lecture financial_documents:',
      dbError
    );
    throw new Error(
      `Impossible de lire les documents liés à la commande : ${dbError.message}`
    );
  }

  // 2. Aucun document lié → annulation simple
  if (!rows || rows.length === 0) {
    return { action: 'proceed', docsToDelete: [] };
  }

  // 3. Pour chaque doc, récupérer le statut live Qonto et classifier
  const client = getQontoClient();

  const classifiedDocs: Array<{
    doc: LinkedDoc;
    classification: DocClassification;
  }> = [];

  for (const row of rows) {
    if (!isValidDocRow(row)) {
      console.error(
        '[cascade-cancel-linked-docs] Row DB invalide (qonto_invoice_id manquant), ignoré:',
        row
      );
      continue;
    }

    let classification: DocClassification;
    let qontoStatus: string;

    if (row.document_type === 'customer_quote') {
      let quote: QontoClientQuote;
      try {
        quote = await client.getClientQuoteById(row.qonto_invoice_id);
        qontoStatus = quote.status;
        classification = classifyQuote(quote.status);
      } catch (err) {
        if (err instanceof QontoError && err.statusCode === 404) {
          // Devis supprimé côté Qonto — soft-delete local uniquement
          console.error(
            '[cascade-cancel-linked-docs] Devis introuvable côté Qonto (404), classifié CASCADE_AUTO:',
            row.qonto_invoice_id
          );
          qontoStatus = 'not_found';
          classification = 'CASCADE_AUTO';
        } else {
          throw err;
        }
      }
    } else if (row.document_type === 'customer_invoice') {
      let invoice: QontoClientInvoice;
      try {
        invoice = await client.getClientInvoiceById(row.qonto_invoice_id);
        qontoStatus = invoice.status;
        classification = classifyInvoice(invoice.status);
      } catch (err) {
        if (err instanceof QontoError && err.statusCode === 404) {
          console.error(
            '[cascade-cancel-linked-docs] Facture introuvable côté Qonto (404), classifiée CASCADE_AUTO:',
            row.qonto_invoice_id
          );
          qontoStatus = 'not_found';
          classification = 'CASCADE_AUTO';
        } else {
          throw err;
        }
      }
    } else {
      // Type non géré (customer_credit_note, supplier_invoice, etc.) : refus par sécurité
      console.error(
        '[cascade-cancel-linked-docs] document_type non géré, refus:',
        row.document_type
      );
      qontoStatus = 'unknown';
      classification = 'REFUSE';
    }

    const linkedDoc: LinkedDoc = {
      id: row.id,
      qontoId: row.qonto_invoice_id,
      documentType:
        row.document_type === 'customer_quote'
          ? 'customer_quote'
          : 'customer_invoice',
      documentNumber: row.document_number ?? null,
      qontoStatus,
    };

    classifiedDocs.push({ doc: linkedDoc, classification });
  }

  // 4. Calculer le verdict global
  const refused = classifiedDocs.filter(
    ({ classification }) => classification === 'REFUSE'
  );

  if (refused.length > 0) {
    const labels = refused
      .map(({ doc }) => doc.documentNumber ?? doc.qontoId)
      .join(', ');
    return {
      action: 'refuse',
      reason:
        `Impossible d'annuler la commande : ${refused.length > 1 ? 'des factures émises existent' : 'une facture émise existe'} ` +
        `(${labels}). Créez un avoir avant d'annuler.`,
    };
  }

  const docsToDelete = classifiedDocs.map(({ doc }) => doc);

  const needsConfirm = classifiedDocs.some(
    ({ classification }) => classification === 'CASCADE_CONFIRM'
  );

  if (needsConfirm) {
    const confirmedLabels = classifiedDocs
      .filter(({ classification }) => classification === 'CASCADE_CONFIRM')
      .map(({ doc }) => doc.documentNumber ?? doc.qontoId)
      .join(', ');
    return {
      action: 'confirm',
      reason:
        `Le devis ${confirmedLabels} a été accepté par le client. ` +
        `Annuler la commande supprimera définitivement ce devis. Confirmer ?`,
      docsToDelete,
    };
  }

  return { action: 'proceed', docsToDelete };
}

// ============================================================
// EXECUTE CASCADE
// ============================================================

/**
 * Supprime les documents Qonto et pose deleted_at en local.
 *
 * Gestion des erreurs partielles :
 *   - 404 / 410 côté Qonto → log warning + soft-delete local quand même
 *   - Autre erreur Qonto → remontée à l'appelant
 *
 * @param docs  Liste des LinkedDoc à supprimer (issue de planCascadeCancel)
 */
/**
 * Tente de supprimer un document côté Qonto.
 * Retourne null si le document est ignorable (absent, cancelled, non-suppressible).
 * Lève une erreur si l'erreur Qonto est critique.
 */
async function deleteFromQonto(
  doc: LinkedDoc,
  client: QontoClient
): Promise<null> {
  if (doc.qontoStatus === 'not_found' || doc.qontoStatus === 'cancelled') {
    return null;
  }

  try {
    if (doc.documentType === 'customer_quote') {
      // declined/expired : Qonto refuserait le DELETE — on skip
      if (doc.qontoStatus !== 'declined' && doc.qontoStatus !== 'expired') {
        await client.deleteClientQuote(doc.qontoId);
      }
    } else {
      // customer_invoice — seul le statut draft peut être DELETE
      if (doc.qontoStatus === 'draft') {
        await client.deleteClientInvoice(doc.qontoId);
      }
    }
  } catch (err) {
    if (err instanceof QontoError) {
      // 404 = déjà supprimé, 410 = gone — ignorable
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.error(
          `[cascade-cancel-linked-docs] Qonto ${err.statusCode} sur ${doc.qontoId} — doc déjà absent, soft-delete local uniquement`
        );
        return null;
      }
      // Erreur critique : remonter
      console.error(
        `[cascade-cancel-linked-docs] Erreur Qonto critique sur ${doc.qontoId}:`,
        err
      );
      throw err;
    }
    throw err;
  }

  return null;
}

export async function executeCascade(docs: LinkedDoc[]): Promise<void> {
  if (docs.length === 0) return;

  const client = getQontoClient();
  const supabase = createAdminClient();

  // a) Suppression Qonto en parallèle (latence réseau maîtrisée)
  const qontoResults = await Promise.allSettled(
    docs.map(doc => deleteFromQonto(doc, client))
  );

  // b) Soft-delete local séquentiel (traçabilité d'erreur précise)
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const qontoResult = qontoResults[i];

    if (qontoResult.status === 'rejected') {
      // L'erreur Qonto est critique et a déjà été loggée dans deleteFromQonto
      throw qontoResult.reason instanceof Error
        ? qontoResult.reason
        : new Error(
            `Erreur Qonto inattendue pour le document ${doc.documentNumber ?? doc.id}`
          );
    }

    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', doc.id);

    if (updateError) {
      console.error(
        `[cascade-cancel-linked-docs] Erreur soft-delete local pour doc ${doc.id}:`,
        updateError
      );
      throw new Error(
        `Soft-delete échoué pour le document ${doc.documentNumber ?? doc.id} : ${updateError.message}`
      );
    }
  }
}
