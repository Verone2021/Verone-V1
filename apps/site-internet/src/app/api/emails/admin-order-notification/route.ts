import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { buildVeroneEmailHtml } from '@/emails/verone-email-template';
import { getLogoAttachments } from '../_shared/email-logo';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Admin Order Notification] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface AdminOrderNotificationRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  itemCount: number;
  shippingAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AdminOrderNotificationRequest;

    if (!body.orderId || !body.customerEmail) {
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

    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL ?? 'commandes@veronecollections.fr';
    const formatPrice = (price: number) => `${price.toFixed(2)} \u20ac`;

    const emailHtml = buildVeroneEmailHtml({
      title: 'Nouvelle commande re\u00e7ue',
      recipientName: '\u00c9quipe V\u00e9rone',
      accentColor: 'green',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Une nouvelle commande vient d'&ecirc;tre pass&eacute;e sur le site.
        </p>

        <div style="background-color: #f0fdf4; padding: 16px; margin: 0 0 20px 0; border-left: 3px solid #16a34a;">
          <table style="width: 100%;">
            <tr>
              <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Commande</td>
              <td style="font-size: 14px; color: #1a1a1a; text-align: right; font-weight: 600; padding: 4px 0;">#${body.orderId.slice(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Client</td>
              <td style="font-size: 14px; color: #1a1a1a; text-align: right; padding: 4px 0;">${body.customerName}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Email</td>
              <td style="font-size: 14px; color: #1a1a1a; text-align: right; padding: 4px 0;">${body.customerEmail}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Articles</td>
              <td style="font-size: 14px; color: #1a1a1a; text-align: right; padding: 4px 0;">${body.itemCount}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #6b7280; padding: 8px 0 0 0; border-top: 1px solid #d1fae5;">Total</td>
              <td style="font-size: 18px; color: #14532d; text-align: right; font-weight: 700; padding: 8px 0 0 0; border-top: 1px solid #d1fae5;">${formatPrice(body.total)}</td>
            </tr>
          </table>
        </div>

        ${body.shippingAddress ? `<p style="font-size: 13px; color: #6b7280; margin: 0;"><strong>Livraison :</strong> ${body.shippingAddress}</p>` : ''}
      `,
      ctaUrl: `${process.env.NEXT_PUBLIC_BACK_OFFICE_URL ?? 'https://bo.verone.fr'}/canaux-vente/site-internet`,
      ctaLabel: 'Voir la commande',
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'V\u00e9rone <noreply@verone.fr>',
      to: adminEmail,
      subject: `Nouvelle commande #${body.orderId.slice(0, 8).toUpperCase()} - ${formatPrice(body.total)}`,
      html: emailHtml,
      replyTo: body.customerEmail,
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API Admin Order Notification] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
