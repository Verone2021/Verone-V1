/**
 * API Route: POST /api/emails/send-document
 * Sends financial documents (quotes, invoices, proforma, credit notes) by email via Resend.
 * Same pattern as /api/emails/send-consultation.
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

const SendDocumentSchema = z.object({
  documentType: z.enum(['quote', 'invoice', 'proforma', 'credit_note']),
  documentId: z.string().min(1),
  documentNumber: z.string().optional(),
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  sentBy: z.string().uuid().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        contentBase64: z.string(),
        type: z.string(),
      })
    )
    .default([]),
});

// ── Helpers ──────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const DOC_TYPE_LABELS: Record<string, string> = {
  quote: 'Devis',
  invoice: 'Facture',
  proforma: 'Facture proforma',
  credit_note: 'Avoir',
};

// ── Route ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = SendDocumentSchema.safeParse(body);

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

    const {
      documentType,
      documentId,
      documentNumber,
      to,
      subject,
      message,
      sentBy,
      attachments,
    } = parsed.data;

    const docLabel = DOC_TYPE_LABELS[documentType] ?? 'Document';

    // Build email HTML
    const emailHtml = buildEmailHtml({
      title: subject,
      recipientName: '',
      accentColor: 'teal',
      bodyHtml: `
        <div style="margin-bottom: 20px; white-space: pre-line;">${escapeHtml(message)}</div>
        ${attachments.length > 0 ? `<p style="color: #6b7280; font-size: 13px;">${docLabel} joint a cet email au format PDF.</p>` : ''}
      `,
      footerNote: documentNumber ? `${docLabel} ${documentNumber}` : undefined,
    });

    // Send via Resend
    const resendClient = getResendClient();
    const { data: emailData, error: emailError } =
      await resendClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'factures@verone.fr',
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
      console.error('[send-document] Resend error:', emailError);

      // Log failure
      const supabase = getAdminClient();
      await supabase.from('document_emails').insert({
        document_type: documentType,
        document_id: documentId,
        document_number: documentNumber ?? null,
        recipient_email: to,
        subject,
        message_body: message,
        attachments: attachments.map(a => ({
          filename: a.filename,
          type: a.type,
        })),
        sent_by: sentBy ?? null,
        status: 'failed',
        error_message: emailError.message,
      });

      return NextResponse.json(
        { success: false, error: emailError.message },
        { status: 500 }
      );
    }

    // Log success
    const supabase = getAdminClient();
    await supabase.from('document_emails').insert({
      document_type: documentType,
      document_id: documentId,
      document_number: documentNumber ?? null,
      recipient_email: to,
      subject,
      message_body: message,
      attachments: attachments.map(a => ({
        filename: a.filename,
        type: a.type,
      })),
      sent_by: sentBy ?? null,
      resend_email_id: emailData?.id ?? null,
      status: 'sent',
    });

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: `Email sent to ${to}`,
    });
  } catch (error) {
    console.error('[send-document] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
