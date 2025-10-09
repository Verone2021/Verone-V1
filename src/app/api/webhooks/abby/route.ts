// =====================================================================
// Route API: POST /api/webhooks/abby
// Date: 2025-10-11
// Description: Webhook handler Abby (idempotency + validation)
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AbbyWebhookEvent } from '@/lib/abby/types';
import { parseAndValidateWebhook } from '@/lib/abby/webhook-validator';

// =====================================================================
// TYPE REQUEST
// =====================================================================

interface WebhookPayload {
  id: string; // Event ID unique pour idempotency
  type: string;
  data: {
    invoice?: {
      id: string;
      invoiceNumber: string;
      status: string;
      [key: string]: unknown;
    };
    payment?: {
      amount: number;
      paymentDate: string;
      paymentMethod?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  createdAt: string;
}

// =====================================================================
// POST /api/webhooks/abby
// =====================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Valider signature webhook (si ABBY_WEBHOOK_SECRET configuré)
    const webhookSecret = process.env.ABBY_WEBHOOK_SECRET;

    if (webhookSecret) {
      const validationResult = await parseAndValidateWebhook<WebhookPayload>(
        request.clone(), // Clone pour permettre re-read body
        webhookSecret
      );

      if (!validationResult.valid) {
        console.warn('Webhook signature validation failed:', validationResult.error);
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }

      // Payload validé
      const { id: eventId, type: eventType, data, createdAt } = validationResult.payload;

      // 2. Validation input
      if (!eventId || !eventType || !data) {
        return NextResponse.json(
          { error: 'Missing required webhook fields' },
          { status: 400 }
        );
      }

      // Continuer avec payload validé...
      return await processWebhook(eventId, eventType, data, createdAt);
    } else {
      // Mode dev: Pas de validation signature (ABBY_WEBHOOK_SECRET non configuré)
      console.warn('ABBY_WEBHOOK_SECRET not configured - skipping signature validation');

      const payload = (await request.json()) as WebhookPayload;
      const { id: eventId, type: eventType, data, createdAt } = payload;

      // 2. Validation input
      if (!eventId || !eventType || !data) {
        return NextResponse.json(
          { error: 'Missing required webhook fields' },
          { status: 400 }
        );
      }

      return await processWebhook(eventId, eventType, data, createdAt);
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/webhooks/abby:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =====================================================================
// PROCESS WEBHOOK (EXTRACTED FOR REUSE)
// =====================================================================

async function processWebhook(
  eventId: string,
  eventType: string,
  data: WebhookPayload['data'],
  createdAt: string
): Promise<NextResponse> {
  try {

    // 1. Créer client Supabase (admin mode pour webhooks)
    const supabase = await createClient();

    // 2. Check idempotency (event déjà traité?)
    const { data: existingEvent } = await supabase
      .from('abby_webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (existingEvent) {
      console.log(`Webhook event ${eventId} already processed (idempotent)`);
      return NextResponse.json(
        { message: 'Event already processed', eventId },
        { status: 200 }
      );
    }

    // 3. Enregistrer événement (idempotency record)
    const { error: insertError } = await supabase
      .from('abby_webhook_events')
      .insert({
        event_id: eventId,
        event_type: eventType,
        event_data: data,
        processed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to insert webhook event:', insertError);
      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 500 }
      );
    }

    // 4. Router événement selon type
    let result: { success: boolean; message?: string; data?: unknown } = {
      success: false,
    };

    switch (eventType) {
      case 'invoice.paid':
        result = await handleInvoicePaid(supabase, data);
        break;

      case 'invoice.sent':
        result = await handleInvoiceSent(supabase, data);
        break;

      case 'invoice.cancelled':
        result = await handleInvoiceCancelled(supabase, data);
        break;

      default:
        console.warn(`Unknown webhook event type: ${eventType}`);
        result = {
          success: true,
          message: `Event type ${eventType} logged but not processed`,
        };
    }

    // 5. Success response
    return NextResponse.json(
      {
        success: result.success,
        message: result.message || 'Webhook processed successfully',
        eventId,
        eventType,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in processWebhook:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =====================================================================
// HANDLER: invoice.paid
// =====================================================================

async function handleInvoicePaid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: WebhookPayload['data']
): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const { invoice, payment } = data;

  if (!invoice || !payment) {
    return {
      success: false,
      message: 'Missing invoice or payment data in webhook',
    };
  }

  // Appeler RPC handle_abby_webhook_invoice_paid()
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'handle_abby_webhook_invoice_paid',
    {
      p_abby_invoice_id: invoice.id,
      p_payment_amount: payment.amount,
      p_payment_date: payment.paymentDate,
      p_payment_method: payment.paymentMethod || null,
    }
  );

  if (rpcError) {
    console.error('RPC handle_abby_webhook_invoice_paid failed:', rpcError);
    return {
      success: false,
      message: `Failed to process payment: ${rpcError.message}`,
    };
  }

  return {
    success: true,
    message: 'Invoice marked as paid',
    data: rpcResult,
  };
}

// =====================================================================
// HANDLER: invoice.sent
// =====================================================================

async function handleInvoiceSent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: WebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const { invoice } = data;

  if (!invoice) {
    return {
      success: false,
      message: 'Missing invoice data in webhook',
    };
  }

  // Mettre à jour statut local (si facture existe)
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'sent',
      updated_at: new Date().toISOString(),
    })
    .eq('abby_invoice_id', invoice.id);

  if (updateError) {
    console.error('Failed to update invoice status to sent:', updateError);
    return {
      success: false,
      message: `Failed to update invoice: ${updateError.message}`,
    };
  }

  return {
    success: true,
    message: 'Invoice marked as sent',
  };
}

// =====================================================================
// HANDLER: invoice.cancelled
// =====================================================================

async function handleInvoiceCancelled(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: WebhookPayload['data']
): Promise<{ success: boolean; message?: string }> {
  const { invoice } = data;

  if (!invoice) {
    return {
      success: false,
      message: 'Missing invoice data in webhook',
    };
  }

  // Mettre à jour statut local
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('abby_invoice_id', invoice.id);

  if (updateError) {
    console.error(
      'Failed to update invoice status to cancelled:',
      updateError
    );
    return {
      success: false,
      message: `Failed to update invoice: ${updateError.message}`,
    };
  }

  return {
    success: true,
    message: 'Invoice marked as cancelled',
  };
}

// =====================================================================
// METADATA ROUTE
// =====================================================================

export const dynamic = 'force-dynamic';
