'use server';

/**
 * Server Actions pour le rapprochement bancaire
 *
 * Workflow:
 * 1. Récupère la commande (sales_order) et la transaction (bank_transaction)
 * 2. Crée une facture (financial_document) liée à la commande
 * 3. Appelle record_payment() pour enregistrer le paiement
 * 4. La propagation vers sales_orders est automatique via trigger
 */

import { createServerClient } from '@verone/utils/supabase/server';

// =====================================================================
// TYPES
// =====================================================================

interface MatchResult {
  success: boolean;
  documentId?: string;
  paymentId?: string;
  error?: string;
}

interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  total_ht: number;
  total_ttc: number;
  tax_rate: number;
  created_at: string;
  shipped_at: string | null;
}

interface BankTransaction {
  id: string;
  transaction_id: string;
  amount: number;
  settled_at: string | null;
  emitted_at: string;
  reference: string | null;
  raw_data: Record<string, unknown>;
}

// =====================================================================
// HELPER: Générer numéro de facture
// =====================================================================

async function generateInvoiceNumber(
  supabase: Awaited<ReturnType<typeof createServerClient>>
): Promise<string> {
  const year = new Date().getFullYear();

  // Compter les factures de l'année
  const { count } = await supabase
    .from('financial_documents')
    .select('*', { count: 'exact', head: true })
    .eq('document_type', 'customer_invoice')
    .gte('created_at', `${year}-01-01`)
    .lt('created_at', `${year + 1}-01-01`);

  const nextNumber = (count || 0) + 1;
  return `INV-${year}-${String(nextNumber).padStart(5, '0')}`;
}

// =====================================================================
// HELPER: Extraire attachment_id depuis raw_data
// =====================================================================

function extractFirstAttachmentId(rawData: unknown): string | null {
  if (!rawData || typeof rawData !== 'object') return null;
  const data = rawData as Record<string, unknown>;

  // Qonto stocke les attachments comme un tableau d'objets avec id
  if (Array.isArray(data.attachments) && data.attachments.length > 0) {
    const first = data.attachments[0];
    if (typeof first === 'object' && first !== null && 'id' in first) {
      return String((first as Record<string, unknown>).id);
    }
  }

  // Ou comme attachment_ids directement
  if (Array.isArray(data.attachment_ids) && data.attachment_ids.length > 0) {
    return String(data.attachment_ids[0]);
  }

  return null;
}

// =====================================================================
// ACTION: Rapprocher une transaction à une commande
// =====================================================================

export async function matchTransactionToOrder(
  bankTransactionId: string,
  salesOrderId: string
): Promise<MatchResult> {
  try {
    const supabase = await createServerClient();

    // 1. Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    // 2. Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select(
        'id, order_number, customer_id, total_ht, total_ttc, tax_rate, created_at, shipped_at'
      )
      .eq('id', salesOrderId)
      .single();

    if (orderError || !order) {
      return {
        success: false,
        error: `Commande non trouvée: ${orderError?.message}`,
      };
    }

    // 3. Récupérer la transaction
    const { data: transaction, error: txError } = await supabase
      .from('bank_transactions')
      .select(
        'id, transaction_id, amount, settled_at, emitted_at, reference, raw_data'
      )
      .eq('id', bankTransactionId)
      .single();

    if (txError || !transaction) {
      return {
        success: false,
        error: `Transaction non trouvée: ${txError?.message}`,
      };
    }

    // 4. Vérifier que la commande n'a pas déjà une facture
    const { data: existingDoc } = await supabase
      .from('financial_documents')
      .select('id')
      .eq('sales_order_id', salesOrderId)
      .maybeSingle();

    if (existingDoc) {
      return {
        success: false,
        error: 'Cette commande a déjà une facture associée',
      };
    }

    // 5. Vérifier que la transaction n'est pas déjà matchée
    const { data: txCheck } = await supabase
      .from('bank_transactions')
      .select('matching_status, matched_document_id')
      .eq('id', bankTransactionId)
      .single();

    if (txCheck?.matching_status !== 'unmatched') {
      return { success: false, error: 'Cette transaction est déjà rapprochée' };
    }

    // 6. Générer le numéro de facture
    const invoiceNumber = await generateInvoiceNumber(supabase);

    // 7. Extraire l'attachment ID si disponible
    const attachmentId = extractFirstAttachmentId(transaction.raw_data);

    // 8. Créer la facture (financial_document)
    const typedOrder = order as SalesOrder;
    const typedTx = transaction as BankTransaction;

    const { data: document, error: docError } = await supabase
      .from('financial_documents')
      .insert({
        document_type: 'customer_invoice',
        document_direction: 'inbound',
        document_number: invoiceNumber,
        partner_id: typedOrder.customer_id,
        partner_type: 'customer',
        document_date: (typedOrder.shipped_at || typedOrder.created_at).split(
          'T'
        )[0],
        total_ht: typedOrder.total_ht,
        total_ttc: typedOrder.total_ttc,
        tva_amount: typedOrder.total_ttc - typedOrder.total_ht,
        sales_order_id: salesOrderId,
        created_by: user.id,
        notes: attachmentId
          ? `Qonto attachment: ${attachmentId}`
          : 'Créée via rapprochement bancaire',
        status: 'sent',
        amount_paid: 0, // Sera mis à jour par record_payment
      })
      .select('id')
      .single();

    if (docError || !document) {
      return {
        success: false,
        error: `Erreur création facture: ${docError?.message}`,
      };
    }

    // 9. Appeler record_payment() via RPC
    const paymentDate = (typedTx.settled_at || typedTx.emitted_at).split(
      'T'
    )[0];
    const paymentAmount = Math.abs(typedTx.amount);

    const { data: paymentResult, error: paymentError } = await supabase.rpc(
      'record_payment',
      {
        p_document_id: document.id,
        p_amount_paid: paymentAmount,
        p_payment_date: paymentDate,
        p_payment_method: 'bank_transfer',
        p_transaction_reference: typedTx.reference || typedTx.transaction_id,
        p_bank_transaction_id: bankTransactionId,
        p_notes: `Rapprochement automatique - Transaction Qonto ${typedTx.transaction_id}`,
      }
    );

    if (paymentError) {
      // Rollback: supprimer la facture créée
      await supabase.from('financial_documents').delete().eq('id', document.id);
      return {
        success: false,
        error: `Erreur enregistrement paiement: ${paymentError.message}`,
      };
    }

    // 10. Succès
    const paymentId = paymentResult?.id;
    console.warn('[Bank Matching] Match completed:', {
      orderId: salesOrderId,
      orderNumber: typedOrder.order_number,
      transactionId: bankTransactionId,
      documentId: document.id,
      invoiceNumber,
      paymentId,
      amount: paymentAmount,
    });

    return {
      success: true,
      documentId: document.id,
      paymentId: paymentId ? String(paymentId) : undefined,
    };
  } catch (error) {
    console.error('[Bank Matching] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// =====================================================================
// ACTION: Multi-match - Rapprocher une transaction à plusieurs commandes
// =====================================================================

interface MultiMatchOrder {
  orderId: string;
  amount?: number; // Montant à allouer (optionnel, défaut = total_ttc)
}

interface MultiMatchResult {
  success: boolean;
  matchedOrders: number;
  createdDocuments: string[];
  errors: string[];
}

export async function matchTransactionToMultipleOrders(
  bankTransactionId: string,
  orders: MultiMatchOrder[]
): Promise<MultiMatchResult> {
  const result: MultiMatchResult = {
    success: false,
    matchedOrders: 0,
    createdDocuments: [],
    errors: [],
  };

  try {
    const supabase = await createServerClient();

    // 1. Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      result.errors.push('Non authentifié');
      return result;
    }

    // 2. Récupérer la transaction
    const { data: transaction, error: txError } = await supabase
      .from('bank_transactions')
      .select(
        'id, transaction_id, amount, settled_at, emitted_at, reference, raw_data, matching_status'
      )
      .eq('id', bankTransactionId)
      .single();

    if (txError || !transaction) {
      result.errors.push(`Transaction non trouvée: ${txError?.message}`);
      return result;
    }

    if (transaction.matching_status !== 'unmatched') {
      result.errors.push('Cette transaction est déjà rapprochée');
      return result;
    }

    const _txAmount = Math.abs(transaction.amount);

    // 3. Traiter chaque commande
    for (const orderMatch of orders) {
      try {
        // Récupérer la commande
        const { data: order, error: orderError } = await supabase
          .from('sales_orders')
          .select(
            'id, order_number, customer_id, total_ht, total_ttc, tax_rate, created_at, shipped_at'
          )
          .eq('id', orderMatch.orderId)
          .single();

        if (orderError || !order) {
          result.errors.push(`Commande ${orderMatch.orderId} non trouvée`);
          continue;
        }

        // Vérifier pas de facture existante
        const { data: existingDoc } = await supabase
          .from('financial_documents')
          .select('id')
          .eq('sales_order_id', orderMatch.orderId)
          .maybeSingle();

        if (existingDoc) {
          result.errors.push(
            `Commande ${order.order_number} a déjà une facture`
          );
          continue;
        }

        // Montant à allouer (défaut = total_ttc de la commande)
        const matchedAmount = orderMatch.amount ?? order.total_ttc;

        // Créer l'entrée dans bank_transaction_matches
        // Note: Cast nécessaire car la migration n'est pas encore dans les types générés
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: matchError } = await (supabase as any)
          .from('bank_transaction_matches')
          .insert({
            bank_transaction_id: bankTransactionId,
            sales_order_id: orderMatch.orderId,
            matched_amount: matchedAmount,
            matched_by: user.id,
          });

        if (matchError) {
          result.errors.push(
            `Erreur match ${order.order_number}: ${matchError.message}`
          );
          continue;
        }

        // Générer numéro de facture
        const invoiceNumber = await generateInvoiceNumber(supabase);

        // Extraire attachment ID
        const attachmentId = extractFirstAttachmentId(transaction.raw_data);

        // Créer la facture
        const typedOrder = order as SalesOrder;
        const { data: document, error: docError } = await supabase
          .from('financial_documents')
          .insert({
            document_type: 'customer_invoice',
            document_direction: 'inbound',
            document_number: invoiceNumber,
            partner_id: typedOrder.customer_id,
            partner_type: 'customer',
            document_date: (
              typedOrder.shipped_at || typedOrder.created_at
            ).split('T')[0],
            total_ht: typedOrder.total_ht,
            total_ttc: typedOrder.total_ttc,
            tva_amount: typedOrder.total_ttc - typedOrder.total_ht,
            sales_order_id: orderMatch.orderId,
            created_by: user.id,
            notes: attachmentId
              ? `Qonto attachment: ${attachmentId}`
              : 'Créée via rapprochement multi-match',
            status: 'sent',
            amount_paid: 0,
          })
          .select('id')
          .single();

        if (docError || !document) {
          result.errors.push(
            `Erreur facture ${order.order_number}: ${docError?.message}`
          );
          continue;
        }

        result.createdDocuments.push(document.id);

        // Enregistrer le paiement
        const paymentDate = (
          transaction.settled_at || transaction.emitted_at
        ).split('T')[0];

        const { error: paymentError } = await supabase.rpc('record_payment', {
          p_document_id: document.id,
          p_amount_paid: matchedAmount,
          p_payment_date: paymentDate,
          p_payment_method: 'bank_transfer',
          p_transaction_reference:
            transaction.reference || transaction.transaction_id,
          p_bank_transaction_id: bankTransactionId,
          p_notes: `Multi-match - Transaction Qonto ${transaction.transaction_id}`,
        });

        if (paymentError) {
          result.errors.push(
            `Erreur paiement ${order.order_number}: ${paymentError.message}`
          );
          continue;
        }

        result.matchedOrders++;
      } catch (err) {
        result.errors.push(
          `Erreur ${orderMatch.orderId}: ${err instanceof Error ? err.message : 'Inconnue'}`
        );
      }
    }

    // Le trigger sur bank_transaction_matches met à jour automatiquement
    // le matching_status de la transaction

    result.success = result.matchedOrders > 0;

    console.warn('[Bank Multi-Match] Completed:', {
      transactionId: bankTransactionId,
      matchedOrders: result.matchedOrders,
      createdDocuments: result.createdDocuments.length,
      errors: result.errors.length,
    });

    return result;
  } catch (error) {
    console.error('[Bank Multi-Match] Error:', error);
    result.errors.push(
      error instanceof Error ? error.message : 'Erreur inconnue'
    );
    return result;
  }
}

// =====================================================================
// ACTION: Ignorer une transaction
// =====================================================================

export async function ignoreTransaction(
  bankTransactionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    const { error } = await supabase
      .from('bank_transactions')
      .update({
        matching_status: 'ignored',
        match_reason: reason || 'Ignoré manuellement',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bankTransactionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
