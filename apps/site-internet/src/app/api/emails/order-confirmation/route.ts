import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { buildVeroneEmailHtml } from '@/emails/verone-email-template';
import { getLogoAttachments } from '../_shared/email-logo';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Order Confirmation] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface OrderItem {
  name: string;
  quantity: number;
  price_ttc: number;
}

interface OrderConfirmationRequest {
  email: string;
  customerName: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderConfirmationRequest;

    if (!body.email || !body.orderId || !body.items) {
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
    const formatPrice = (price: number) => `${price.toFixed(2)} \u20ac`;

    const itemsHtml = body.items
      .map(
        item => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">
            ${item.name}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center;">
            x${item.quantity}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1a1a1a; text-align: right; font-weight: 600;">
            ${formatPrice(item.price_ttc * item.quantity)}
          </td>
        </tr>`
      )
      .join('');

    const emailHtml = buildVeroneEmailHtml({
      title: 'Confirmation de commande',
      recipientName: body.customerName,
      accentColor: 'green',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 20px 0;">
          Votre commande <strong>#${body.orderId.slice(0, 8).toUpperCase()}</strong> a bien &eacute;t&eacute; enregistr&eacute;e et votre paiement confirm&eacute;.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px 0;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #1a1a1a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Produit</th>
              <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #1a1a1a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Qt&eacute;</th>
              <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #1a1a1a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 2px solid #1a1a1a; padding-top: 12px; margin: 0 0 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="font-size: 14px; color: #6b7280; padding: 4px 0;">Sous-total</td>
              <td style="font-size: 14px; color: #1a1a1a; text-align: right; padding: 4px 0;">${formatPrice(body.subtotal)}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #6b7280; padding: 4px 0;">Livraison</td>
              <td style="font-size: 14px; color: #1a1a1a; text-align: right; padding: 4px 0;">${body.shipping === 0 ? 'Offerte' : formatPrice(body.shipping)}</td>
            </tr>
            <tr>
              <td style="font-size: 16px; font-weight: 700; color: #1a1a1a; padding: 8px 0 0 0;">Total TTC</td>
              <td style="font-size: 16px; font-weight: 700; color: #1a1a1a; text-align: right; padding: 8px 0 0 0;">${formatPrice(body.total)}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; margin: 0 0 8px 0;">
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0; font-weight: 600;">Adresse de livraison</p>
          <p style="font-size: 14px; color: #374151; margin: 0;">${body.shippingAddress}</p>
        </div>
      `,
      ctaUrl: `${siteUrl}/compte`,
      ctaLabel: 'Suivre ma commande',
      footerNote:
        'Vous recevrez un email lorsque votre commande sera exp\u00e9di\u00e9e.',
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'V\u00e9rone <noreply@verone.fr>',
      to: body.email,
      subject: `Commande #${body.orderId.slice(0, 8).toUpperCase()} confirm\u00e9e`,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'contact@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API Order Confirmation] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
