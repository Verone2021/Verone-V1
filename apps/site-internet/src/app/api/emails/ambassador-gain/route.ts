/**
 * Email envoyé à l'ambassadeur quand une vente lui est attribuée et payée.
 *
 * ADR-021 D6 : email à chaque gain + opt-out via individual_customers.ambassador_notify_on_gain.
 *
 * Triggered par le webhook Stripe payment_intent.succeeded ou checkout.session.completed
 * quand une ambassador_attributions row vient d'être créée.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { buildVeroneEmailHtml } from '@/emails/verone-email-template';
import { getLogoAttachments } from '../_shared/email-logo';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Ambassador Gain] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface AmbassadorGainEmailRequest {
  email: string;
  firstName: string;
  primeAmount: number;
  orderTotalHt: number;
  commissionRate: number;
  attributionMethod: 'coupon_code' | 'referral_link';
  code?: string;
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AmbassadorGainEmailRequest;

    if (
      !body.email ||
      !body.firstName ||
      typeof body.primeAmount !== 'number'
    ) {
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
    const methodLabel =
      body.attributionMethod === 'coupon_code'
        ? `code <strong>${body.code ?? ''}</strong>`
        : `lien d'affiliation`;

    const emailHtml = buildVeroneEmailHtml({
      title: 'Nouvelle vente attribuée',
      recipientName: body.firstName,
      accentColor: 'black',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Félicitations ! Une nouvelle vente vient de vous être attribuée via votre ${methodLabel}.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tbody>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Montant de la vente (HT)</td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right; font-weight: 600;">${formatEur(body.orderTotalHt)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Votre taux de commission</td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right; font-weight: 600;">${body.commissionRate}%</td>
            </tr>
            <tr style="border-top: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-size: 16px; color: #111827; font-weight: 700;">Votre prime</td>
              <td style="padding: 12px 0; font-size: 18px; color: #059669; text-align: right; font-weight: 700;">${formatEur(body.primeAmount)}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 14px; color: #6b7280; margin: 0 0 16px 0;">
          Votre prime est en attente de validation pendant 30 jours (délai retour client). Une fois validée, elle sera ajoutée à votre solde et payable dès ${formatEur(20)} de cumul.
        </p>
        <p style="font-size: 13px; color: #9ca3af; margin: 16px 0 0 0;">
          Vous pouvez désactiver ces notifications dans vos paramètres ambassadeur.
        </p>
      `,
      ctaUrl: `${siteUrl}/ambassadeur`,
      ctaLabel: 'Voir mon dashboard ambassadeur',
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Vérone <noreply@verone.fr>',
      to: body.email,
      subject: `Nouvelle prime de ${formatEur(body.primeAmount)} - Vérone Ambassadeurs`,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'contact@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API Ambassador Gain] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
