import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { buildVeroneEmailHtml } from '@/emails/verone-email-template';
import { getLogoAttachments } from '../_shared/email-logo';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paid: { label: 'Pay\u00e9e', color: 'green' },
  shipped: { label: 'Exp\u00e9di\u00e9e', color: 'blue' },
  delivered: { label: 'Livr\u00e9e', color: 'green' },
  cancelled: { label: 'Annul\u00e9e', color: 'black' },
  refunded: { label: 'Rembours\u00e9e', color: 'black' },
};

interface OrderStatusUpdateRequest {
  email: string;
  customerName: string;
  orderId: string;
  newStatus: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderStatusUpdateRequest;

    if (!body.email || !body.orderId || !body.newStatus) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resendClient = getResendClient();
    if (!resendClient) {
      return NextResponse.json({ success: true, emailDisabled: true });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr';
    const statusInfo = STATUS_LABELS[body.newStatus] ?? {
      label: body.newStatus,
      color: 'black',
    };

    const messageHtml = body.message
      ? `<p style="font-size: 14px; color: #6b7280; margin: 16px 0 0 0;">${body.message}</p>`
      : '';

    const emailHtml = buildVeroneEmailHtml({
      title: 'Mise \u00e0 jour de votre commande',
      recipientName: body.customerName,
      accentColor: statusInfo.color as 'green' | 'blue' | 'black' | 'gold',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Le statut de votre commande <strong>#${body.orderId.slice(0, 8).toUpperCase()}</strong> a &eacute;t&eacute; mis &agrave; jour.
        </p>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; margin: 0 0 16px 0;">
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0;">Nouveau statut</p>
          <p style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0;">${statusInfo.label}</p>
        </div>
        ${messageHtml}
      `,
      ctaUrl: `${siteUrl}/compte`,
      ctaLabel: 'Voir ma commande',
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'V\u00e9rone <noreply@verone.fr>',
      to: body.email,
      subject: `Commande #${body.orderId.slice(0, 8).toUpperCase()} - ${statusInfo.label}`,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'contact@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({ success: true, emailId: result.data?.id });
  } catch (error) {
    console.error('[API Order Status Update] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
