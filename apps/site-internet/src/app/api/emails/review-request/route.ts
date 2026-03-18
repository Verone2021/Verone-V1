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

interface ReviewRequestPayload {
  email: string;
  customerName: string;
  orderId: string;
  productName?: string;
  productSlug?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReviewRequestPayload;

    if (!body.email || !body.orderId) {
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
    const reviewUrl = body.productSlug
      ? `${siteUrl}/produit/${body.productSlug}#reviews`
      : `${siteUrl}/compte`;

    const emailHtml = buildVeroneEmailHtml({
      title: 'Votre avis nous int\u00e9resse',
      recipientName: body.customerName,
      accentColor: 'gold',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Vous avez r&eacute;cemment re&ccedil;u votre commande. Comment s'est pass&eacute;e votre exp&eacute;rience ?
        </p>
        ${body.productName ? `<p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">Que pensez-vous de <strong>${body.productName}</strong> ?</p>` : ''}
        <p style="font-size: 14px; color: #6b7280; margin: 0 0 16px 0;">
          Votre avis aide les autres clients &agrave; faire leur choix et nous permet d'am&eacute;liorer nos services.
        </p>
      `,
      ctaUrl: reviewUrl,
      ctaLabel: 'Laisser un avis',
      footerNote: 'Cela ne prend que 2 minutes.',
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'V\u00e9rone <noreply@verone.fr>',
      to: body.email,
      subject: 'Votre avis compte pour nous',
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'contact@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({ success: true, emailId: result.data?.id });
  } catch (error) {
    console.error('[API Review Request] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
