/**
 * Logique d'upsert des transactions Qonto en base de données
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { QontoTransaction } from '@verone/integrations/qonto';

import type { TransactionDbData } from './qonto-sync-types';

/**
 * Construit les données de transaction pour la DB
 */
function buildTransactionData(
  tx: QontoTransaction,
  bankAccountId: string
): TransactionDbData {
  let vat_breakdown: TransactionDbData['vat_breakdown'] = null;
  if (tx.vat_details?.items && tx.vat_details.items.length > 0) {
    vat_breakdown = tx.vat_details.items.map((item, idx) => ({
      description: `Ligne ${idx + 1}`,
      amount_ht: 0,
      tva_rate: item.rate,
      tva_amount: item.amount_cents / 100,
    }));
  }

  const hasQontoVat =
    tx.vat_rate !== undefined && tx.vat_rate !== null && tx.vat_rate !== -1;

  return {
    transaction_id: tx.transaction_id,
    bank_provider: 'qonto',
    bank_account_id: bankAccountId,
    amount: tx.amount,
    currency: tx.currency,
    side: tx.side,
    operation_type: tx.operation_type,
    label: tx.label,
    note: tx.note,
    reference: tx.reference,
    counterparty_name: tx.counterparty?.name,
    counterparty_iban: tx.counterparty?.iban,
    emitted_at: tx.emitted_at,
    settled_at: tx.settled_at ?? undefined,
    raw_data: tx as unknown as Record<string, unknown>,
    attachment_ids: tx.attachment_ids ?? null,
    updated_at: new Date().toISOString(),
    vat_rate: hasQontoVat ? tx.vat_rate : null,
    vat_source: hasQontoVat ? 'qonto_ocr' : null,
    vat_breakdown: hasQontoVat ? null : vat_breakdown,
  };
}

/**
 * Insert ou update une transaction Qonto en base de données
 */
export async function upsertQontoTransaction(
  supabase: SupabaseClient,
  tx: QontoTransaction,
  bankAccountId: string
): Promise<'created' | 'updated' | 'skipped'> {
  const { data: existing } = await supabase
    .from('bank_transactions')
    .select('id, updated_at')
    .eq('transaction_id', tx.transaction_id)
    .single();

  const transactionData = buildTransactionData(tx, bankAccountId);

  if (existing) {
    const existingDate = new Date(existing.updated_at as string);
    const txUpdatedAt =
      (tx.updated_at as string | undefined) ?? tx.emitted_at ?? '';
    const txDate = new Date(txUpdatedAt);

    if (txDate <= existingDate) {
      return 'skipped';
    }

    const { error } = await supabase
      .from('bank_transactions')
      .update(transactionData as never)
      .eq('id', existing.id);

    if (error) throw error;
    return 'updated';
  } else {
    const { error } = await supabase
      .from('bank_transactions')
      .insert(transactionData as never);

    if (error) throw error;
    return 'created';
  }
}
