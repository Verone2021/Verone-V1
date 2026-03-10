/**
 * API Route: POST /api/emails/send-consultation
 * Sends consultation summary email with pre-generated PDF attachments via Resend.
 * PDFs are generated client-side and sent as base64.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { z } from 'zod';

import type { Database } from '@verone/types';

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

const SendConsultationEmailSchema = z.object({
  consultationId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  sentBy: z.string().uuid().optional(),
  // PDFs sent as base64 from client
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        contentBase64: z.string(),
        type: z.enum(['consultation_pdf', 'quote']),
        quoteId: z.string().uuid().optional(),
      })
    )
    .default([]),
});

// ── Route ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = SendConsultationEmailSchema.safeParse(body);

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

    const { consultationId, to, subject, message, sentBy, attachments } =
      parsed.data;
    const supabase = getAdminClient();

    // Fetch consultation with client info
    const { data: consultation, error: consultErr } = await supabase
      .from('client_consultations')
      .select(
        `
        id, client_email, client_phone, descriptif, status, priority_level,
        tarif_maximum, source_channel, created_at,
        enseigne:enseignes(name),
        organisation:organisations(trade_name, legal_name)
      `
      )
      .eq('id', consultationId)
      .single();

    if (consultErr || !consultation) {
      return NextResponse.json(
        { success: false, error: 'Consultation not found' },
        { status: 404 }
      );
    }

    // Build client name
    const clientName =
      (consultation.enseigne as { name: string } | null)?.name ??
      (
        consultation.organisation as {
          trade_name: string | null;
          legal_name: string;
        } | null
      )?.trade_name ??
      (
        consultation.organisation as {
          trade_name: string | null;
          legal_name: string;
        } | null
      )?.legal_name ??
      'Client';

    // Build attachments metadata for logging
    const attachmentsMeta = attachments.map(a => ({
      type: a.type,
      quote_id: a.quoteId,
      filename: a.filename,
    }));

    // Build email HTML
    const emailHtml = buildEmailHtml({
      title: subject,
      recipientName: clientName,
      accentColor: 'blue',
      bodyHtml: `
        <div style="margin-bottom: 20px; white-space: pre-line;">${escapeHtml(message)}</div>
        ${attachments.length > 0 ? '<p style="color: #6b7280; font-size: 13px;">Les documents sont joints a cet email.</p>' : ''}
      `,
    });

    // Send via Resend — pass base64 directly
    const resendClient = getResendClient();
    const { data: emailData, error: emailError } =
      await resendClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'consultations@verone.fr',
        to: [to],
        subject,
        html: emailHtml,
        attachments: attachments.map(a => ({
          filename: a.filename,
          content: a.contentBase64,
        })),
      });

    if (emailError) {
      // Log failed attempt
      await supabase.from('consultation_emails').insert({
        consultation_id: consultationId,
        recipient_email: to,
        subject,
        message_body: message,
        attachments: JSON.stringify(attachmentsMeta),
        sent_by: sentBy ?? null,
        status: 'failed',
        error_message: emailError.message,
      });

      console.error('[send-consultation] Resend error:', emailError);
      return NextResponse.json(
        { success: false, error: emailError.message },
        { status: 500 }
      );
    }

    // Log successful send
    await supabase.from('consultation_emails').insert({
      consultation_id: consultationId,
      recipient_email: to,
      subject,
      message_body: message,
      attachments: JSON.stringify(attachmentsMeta),
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
    console.error('[send-consultation] error:', error);
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
