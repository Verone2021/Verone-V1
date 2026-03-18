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

interface DeliveryConfirmationRequest {
  email: string;
  customerName: string;
  orderId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DeliveryConfirmationRequest;

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

    const emailHtml = buildVeroneEmailHtml({
      title: 'Commande livr\u00e9e',
      recipientName: body.customerName,
      accentColor: 'green',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Votre commande <strong>#${body.orderId.slice(0, 8).toUpperCase()}</strong> a &eacute;t&eacute; livr&eacute;e avec succ&egrave;s.
        </p>
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Nous esp&eacute;rons que vos nouveaux articles vous apporteront enti&egrave;re satisfaction.
        </p>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">
          Un probl&egrave;me avec votre commande ? Contactez-nous &agrave;
          <a href="mailto:contact@veronecollections.fr" style="color: #1a1a1a;">contact@veronecollections.fr</a>
        </p>
      `,
      ctaUrl: `${siteUrl}/compte`,
      ctaLabel: 'Voir ma commande',
      footerNote: 'Retours gratuits sous 30 jours.',
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'V\u00e9rone <noreply@verone.fr>',
      to: body.email,
      subject: `Commande #${body.orderId.slice(0, 8).toUpperCase()} livr\u00e9e`,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'contact@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({ success: true, emailId: result.data?.id });
  } catch (error) {
    console.error('[API Delivery Confirmation] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
