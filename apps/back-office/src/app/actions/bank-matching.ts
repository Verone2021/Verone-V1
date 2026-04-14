'use server';

import { createServerClient } from '@verone/utils/supabase/server';

import type {
  MatchResult,
  SalesOrder,
  BankTransaction,
} from './bank-matching-helpers';
import {
  generateInvoiceNumber,
  extractFirstAttachmentId,
} from './bank-matching-helpers';

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
        document_date: (typedOrder.shipped_at ?? typedOrder.created_at).split(
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

    // 9. Update financial_document with payment info (record_payment RPC dropped)
    const paymentAmount = Math.abs(typedTx.amount);

    const { error: paymentError } = await supabase
      .from('financial_documents')
      .update({
        amount_paid: paymentAmount,
        payment_status: 'paid',
        status: 'paid',
      })
      .eq('id', document.id);

    if (paymentError) {
      await supabase.from('financial_documents').delete().eq('id', document.id);
      return {
        success: false,
        error: `Erreur enregistrement paiement: ${paymentError.message}`,
      };
    }

    // 10. Succes
    const paymentId = document.id;
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
        const { error: matchError } = await supabase
          .from('bank_transaction_matches' as never)
          .insert({
            bank_transaction_id: bankTransactionId,
            sales_order_id: orderMatch.orderId,
            matched_amount: matchedAmount,
            matched_by: user.id,
          } as never);

        if (matchError) {
          const errorMessage =
            matchError instanceof Error
              ? matchError.message
              : String(matchError);
          result.errors.push(
            `Erreur match ${order.order_number}: ${errorMessage}`
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
              typedOrder.shipped_at ?? typedOrder.created_at
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

        const { error: paymentError } = await supabase
          .from('financial_documents')
          .update({
            amount_paid: matchedAmount,
            payment_status: 'paid',
            status: 'paid',
          })
          .eq('id', document.id);

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

export { ignoreTransaction } from './bank-matching-ignore';
