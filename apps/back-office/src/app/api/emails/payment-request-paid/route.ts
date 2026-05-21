/**
 * API Route: POST /api/emails/payment-request-paid
 * Envoie un email de confirmation à l'affilié quand sa demande de paiement
 * est intégralement réglée (statut `paid`).
 *
 * Appelée de façon best-effort depuis useAddPayment (back-office) après que le
 * trigger DB `recompute_payment_request_status` a basculé le statut à `paid`.
 *
 * @since 2026-05-21
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { getLogoAttachments } from '../_shared/email-logo';
import { buildEmailHtml } from '../_shared/email-template';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API PaymentRequestPaid] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface PaymentRequestPaidRequest {
  affiliateName: string;
  affiliateEmail: string;
  requestNumber: string;
  totalAmountTTC: number;
  paymentReference: string;
  paymentDate: string;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PaymentRequestPaidRequest;

    const {
      affiliateName,
      affiliateEmail,
      requestNumber,
      totalAmountTTC,
      paymentReference,
      paymentDate,
    } = body;

    if (
      !affiliateName ||
      !affiliateEmail ||
      !requestNumber ||
      !paymentReference
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

    const formattedDate = paymentDate ? formatDate(paymentDate) : '';

    const bodyHtml = `
      <p style="margin: 0 0 16px 0;">
        Votre demande de versement <strong>${requestNumber}</strong> a &eacute;t&eacute; int&eacute;gralement r&eacute;gl&eacute;e.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px 0; font-size: 14px;">
        <tr style="border-bottom: 1px solid #99d5d1;">
          <td style="padding: 10px 0; color: #4b5563;">Demande</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 500; color: #1f2937;">${requestNumber}</td>
        </tr>
        <tr style="border-bottom: 1px solid #99d5d1;">
          <td style="padding: 10px 0; color: #4b5563;">Montant vers&eacute; TTC</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1f2937; font-size: 16px;">${formatPrice(totalAmountTTC)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #99d5d1;">
          <td style="padding: 10px 0; color: #4b5563;">R&eacute;f&eacute;rence virement</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 500; color: #1f2937;">${paymentReference}</td>
        </tr>
        ${
          formattedDate
            ? `<tr>
          <td style="padding: 10px 0; color: #4b5563;">Date du virement</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 500; color: #1f2937;">${formattedDate}</td>
        </tr>`
            : ''
        }
      </table>

      <div style="background-color: #ccfbf1; padding: 16px; border-radius: 6px; margin: 0 0 16px 0; border: 1px solid #99d5d1;">
        <p style="margin: 0; font-size: 14px; color: #0f766e;">
          Le virement est en cours de traitement et devrait appara&icirc;tre sur votre compte bancaire sous 1 &agrave; 3 jours ouvr&eacute;s, selon votre &eacute;tablissement bancaire.
        </p>
      </div>

      <p style="margin: 0; font-size: 13px; color: #6b7280;">
        Pour toute question concernant ce versement, contactez-nous &agrave;
        <a href="mailto:${process.env.RESEND_REPLY_TO ?? 'contact@linkme.network'}" style="color: #0f766e;">${process.env.RESEND_REPLY_TO ?? 'contact@linkme.network'}</a>
        en indiquant la r&eacute;f&eacute;rence <strong>${requestNumber}</strong>.
      </p>`;

    const emailHtml = buildEmailHtml({
      title: 'Votre versement a &eacute;t&eacute; effectu&eacute;',
      recipientName: affiliateName,
      accentColor: 'teal',
      bodyHtml,
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
      to: affiliateEmail,
      subject: `Versement ${requestNumber} effectué — ${formatPrice(totalAmountTTC)}`,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'romeo@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API PaymentRequestPaid] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
