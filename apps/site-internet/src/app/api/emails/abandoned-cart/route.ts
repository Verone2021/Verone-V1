import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { buildVeroneEmailHtml } from '@/emails/verone-email-template';
import { getLogoAttachments } from '../_shared/email-logo';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Abandoned Cart] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface AbandonedCartRequest {
  email: string;
  firstName: string;
  cartItemsCount: number;
  cartTotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AbandonedCartRequest;

    if (!body.email || !body.firstName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resendClient = getResendClient();
    if (!resendClient) {
      return NextResponse.json({
        success: true,
        emailDisabled: true,
        message: 'Email notifications are currently disabled',
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr';

    const emailHtml = buildVeroneEmailHtml({
      title: 'Votre panier vous attend',
      recipientName: body.firstName,
      accentColor: 'gold',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Vous avez laiss&eacute; <strong>${body.cartItemsCount} article${body.cartItemsCount > 1 ? 's' : ''}</strong> dans votre panier.
        </p>
        <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">
          Ces pi&egrave;ces s&eacute;lectionn&eacute;es avec soin sont toujours disponibles.
          Finalisez votre commande avant qu'elles ne soient plus en stock.
        </p>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; margin: 0 0 8px 0;">
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0;">Total de votre panier</p>
          <p style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0;">${body.cartTotal.toFixed(2)} &euro;</p>
          ${body.cartTotal >= 500 ? '<p style="font-size: 12px; color: #16a34a; margin: 4px 0 0 0;">Livraison offerte</p>' : ''}
        </div>
      `,
      ctaUrl: `${siteUrl}/panier`,
      ctaLabel: 'Reprendre mon panier',
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'V\u00e9rone <noreply@verone.fr>',
      to: body.email,
      subject: 'Votre panier vous attend',
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'contact@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API Abandoned Cart] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
