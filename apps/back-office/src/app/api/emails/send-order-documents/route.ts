/**
 * API Route: POST /api/emails/send-order-documents
 * Sends order documents (quotes/invoices) by email with pre-generated PDF attachments via Resend.
 * PDFs are fetched client-side (from Qonto proxy) and sent as base64.
 * Follows the same pattern as /api/emails/send-consultation.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { z } from 'zod';

import type { Database } from '@verone/types';

import { getLogoAttachments } from '../_shared/email-logo';
import { buildEmailHtml } from '../_shared/email-template';

// ── Clients ──────────────────────────────────────────────────────────

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Validation ───────────────────────────────────────────────────────

const SendOrderDocumentsSchema = z.object({
  salesOrderId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  sentBy: z.string().uuid().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        contentBase64: z.string(),
        type: z.enum(['quote', 'invoice']),
        documentId: z.string().uuid().optional(),
      })
    )
    .default([]),
});

// ── Route ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = SendOrderDocumentsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { salesOrderId, to, subject, message, sentBy, attachments } =
      parsed.data;
    const supabase = getAdminClient();

    // Fetch order with org info
    const { data: order, error: orderErr } = await supabase
      .from('sales_orders')
      .select(
        `
        id, order_number, linkme_display_number, total_ht, total_ttc, status,
        organisations!sales_orders_customer_id_fkey(trade_name, legal_name)
      `
      )
      .eq('id', salesOrderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Build customer name
    const org = (order as Record<string, unknown>).organisations as {
      trade_name: string | null;
      legal_name: string;
    } | null;
    const customerName = org?.trade_name ?? org?.legal_name ?? 'Client';

    const displayNumber = (order as Record<string, unknown>)
      .linkme_display_number as string | null;
    const orderRef = displayNumber ?? order.order_number;

    // Build attachments metadata for logging
    const attachmentsMeta = attachments.map(a => ({
      type: a.type,
      document_id: a.documentId,
      filename: a.filename,
    }));

    // Build email HTML
    const emailHtml = buildEmailHtml({
      title: subject,
      recipientName: customerName,
      accentColor: 'teal',
      bodyHtml: `
        <div style="margin-bottom: 20px; white-space: pre-line;">${escapeHtml(message)}</div>
        ${attachments.length > 0 ? '<p style="color: #6b7280; font-size: 13px;">Les documents sont joints a cet email.</p>' : ''}
      `,
      footerNote: `Commande ${orderRef}`,
    });

    // Send via Resend
    const resendClient = getResendClient();
    const { data: emailData, error: emailError } =
      await resendClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
        to: [to],
        subject,
        html: emailHtml,
        attachments: [
          ...getLogoAttachments(),
          ...attachments.map(a => ({
            filename: a.filename,
            content: a.contentBase64,
          })),
        ],
      });

    if (emailError) {
      // Log failed attempt
      await supabase.from('order_emails').insert({
        sales_order_id: salesOrderId,
        recipient_email: to,
        subject,
        message_body: message,
        attachments: JSON.stringify(attachmentsMeta),
        sent_by: sentBy ?? null,
        status: 'failed',
        error_message: emailError.message,
      });

      console.error('[send-order-documents] Resend error:', emailError);
      return NextResponse.json(
        { success: false, error: emailError.message },
        { status: 500 }
      );
    }

    // Log successful send
    await supabase.from('order_emails').insert({
      sales_order_id: salesOrderId,
      recipient_email: to,
      subject,
      message_body: message,
      attachments: JSON.stringify(attachmentsMeta),
      sent_by: sentBy ?? null,
      resend_email_id: emailData?.id ?? null,
      status: 'sent',
    });

    // Log event in sales_order_events for timeline (non-blocking)
    try {
      await supabase.from('sales_order_events').insert({
        sales_order_id: salesOrderId,
        event_type: 'email_documents_sent',
        metadata: {
          recipient_email: to,
          attachments: attachmentsMeta,
          resend_id: emailData?.id,
        },
        created_by: sentBy ?? null,
      });
    } catch (logError) {
      console.error(
        '[send-order-documents] Failed to log timeline event:',
        logError
      );
    }

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: `Email sent to ${to}`,
    });
  } catch (error) {
    console.error('[send-order-documents] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
