// =====================================================================
// Qonto Webhook Handler
// Date: 2025-10-11
// Description: Réception webhooks Qonto temps réel + auto-matching
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { QontoWebhookPayload } from '@/lib/qonto/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// =====================================================================
// WEBHOOK SIGNATURE VALIDATION
// =====================================================================

function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    console.warn('⚠️  QONTO_WEBHOOK_SECRET not configured - skipping signature validation');
    return true; // Allow in dev if no secret
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Timing-safe comparison pour éviter timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    return false;
  }
}

// =====================================================================
// WEBHOOK HANDLER
// =====================================================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-qonto-signature') || '';
    const webhookSecret = process.env.QONTO_WEBHOOK_SECRET || '';

    // Validation signature
    if (!validateWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload: QontoWebhookPayload = JSON.parse(rawBody);

    console.log('📥 Qonto webhook received:', {
      event: payload.event_name,
      event_id: payload.event_id,
      organization: payload.organization_slug,
    });

    const supabase = await createClient();

    // Vérifier idempotency (éviter doubles traitements)
    const { data: existingEvent } = await supabase
      .from('bank_transactions')
      .select('id')
      .eq('transaction_id', payload.data.transaction?.transaction_id || payload.event_id)
      .single();

    if (existingEvent) {
      console.log('ℹ️  Event already processed (idempotency)', payload.event_id);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Router vers handler spécifique selon type d'événement
    switch (payload.event_name) {
      case 'transaction.created':
        await handleTransactionCreated(supabase, payload);
        break;

      case 'transaction.updated':
        await handleTransactionUpdated(supabase, payload);
        break;

      case 'transaction.declined':
        await handleTransactionDeclined(supabase, payload);
        break;

      default:
        console.log('ℹ️  Unhandled event type:', payload.event_name);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================================
// EVENT HANDLERS
// =====================================================================

async function handleTransactionCreated(
  supabase: any,
  payload: QontoWebhookPayload
) {
  const transaction = payload.data.transaction;

  if (!transaction) {
    console.warn('⚠️  No transaction data in payload');
    return;
  }

  console.log('🆕 New transaction:', {
    id: transaction.transaction_id,
    amount: transaction.amount,
    side: transaction.side,
    label: transaction.label,
  });

  // Ignorer transactions débit (sorties) pour auto-matching
  if (transaction.side === 'debit') {
    console.log('ℹ️  Debit transaction - skipping auto-match');

    await supabase.from('bank_transactions').insert({
      transaction_id: transaction.transaction_id,
      bank_provider: 'qonto',
      bank_account_id: transaction.bank_account_id || 'unknown',
      amount: Math.abs(transaction.amount),
      currency: transaction.currency,
      side: transaction.side,
      operation_type: transaction.operation_type,
      label: transaction.label,
      note: transaction.note,
      reference: transaction.reference,
      counterparty_name: transaction.counterparty?.name,
      counterparty_iban: transaction.counterparty?.iban,
      settled_at: transaction.settled_at,
      emitted_at: transaction.emitted_at,
      matching_status: 'ignored', // Dépenses ignorées
      raw_data: transaction,
    });

    return;
  }

  // Insérer transaction
  const { data: insertedTransaction, error: insertError } = await supabase
    .from('bank_transactions')
    .insert({
      transaction_id: transaction.transaction_id,
      bank_provider: 'qonto',
      bank_account_id: transaction.bank_account_id || 'unknown',
      amount: transaction.amount,
      currency: transaction.currency,
      side: transaction.side,
      operation_type: transaction.operation_type,
      label: transaction.label,
      note: transaction.note,
      reference: transaction.reference,
      counterparty_name: transaction.counterparty?.name,
      counterparty_iban: transaction.counterparty?.iban,
      settled_at: transaction.settled_at,
      emitted_at: transaction.emitted_at,
      matching_status: 'unmatched',
      raw_data: transaction,
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to insert transaction:', insertError);
    throw insertError;
  }

  // Lancer auto-matching automatique
  console.log('🔄 Starting auto-match for transaction:', transaction.transaction_id);

  const { data: matchResult, error: matchError } = await supabase.rpc(
    'auto_match_bank_transaction',
    {
      p_transaction_id: transaction.transaction_id,
      p_amount: transaction.amount,
      p_label: transaction.label,
      p_settled_at: transaction.settled_at || transaction.emitted_at,
    }
  );

  if (matchError) {
    console.error('❌ Auto-match failed:', matchError);
    return;
  }

  if (matchResult.matched) {
    console.log('✅ Auto-matched successfully:', {
      confidence: matchResult.confidence,
      invoice_number: matchResult.invoice_number,
      match_reason: matchResult.match_reason,
    });
  } else {
    console.log('ℹ️  No match found - manual review required');
  }
}

async function handleTransactionUpdated(
  supabase: any,
  payload: QontoWebhookPayload
) {
  const transaction = payload.data.transaction;

  if (!transaction) {
    console.warn('⚠️  No transaction data in payload');
    return;
  }

  console.log('🔄 Transaction updated:', transaction.transaction_id);

  // Update existing transaction
  const { error } = await supabase
    .from('bank_transactions')
    .update({
      amount: transaction.amount,
      label: transaction.label,
      note: transaction.note,
      settled_at: transaction.settled_at,
      raw_data: transaction,
      updated_at: new Date().toISOString(),
    })
    .eq('transaction_id', transaction.transaction_id);

  if (error) {
    console.error('❌ Failed to update transaction:', error);
    throw error;
  }
}

async function handleTransactionDeclined(
  supabase: any,
  payload: QontoWebhookPayload
) {
  const transaction = payload.data.transaction;

  if (!transaction) {
    console.warn('⚠️  No transaction data in payload');
    return;
  }

  console.log('❌ Transaction declined:', transaction.transaction_id);

  // Marquer comme ignorée
  const { error } = await supabase
    .from('bank_transactions')
    .update({
      matching_status: 'ignored',
      match_reason: 'Transaction declined',
      updated_at: new Date().toISOString(),
    })
    .eq('transaction_id', transaction.transaction_id);

  if (error) {
    console.error('❌ Failed to update declined transaction:', error);
  }
}
