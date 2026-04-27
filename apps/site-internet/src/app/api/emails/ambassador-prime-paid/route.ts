/**
 * Email envoyé à l'ambassadeur quand ses primes ont été payées.
 *
 * ADR-021 D12 — email confirmation de paiement prime.
 *
 * Triggered (non-blocking) par POST /api/ambassadors/[id]/mark-paid
 * après mise à jour des attributions en DB.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';
import { z } from 'zod';

import { buildVeroneEmailHtml } from '@/emails/verone-email-template';
import { getLogoAttachments } from '../_shared/email-logo';

const RequestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  totalAmount: z.number().positive(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentReference: z.string().min(1),
  paidCount: z.number().int().positive(),
});

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Ambassador Prime Paid] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDateFr(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      email,
      firstName,
      totalAmount,
      paymentDate,
      paymentReference,
      paidCount,
    } = parsed.data;

    const resendClient = getResendClient();
    if (!resendClient) {
      return NextResponse.json({
        success: true,
        emailDisabled: true,
        message: 'Email notifications are currently disabled',
      });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veronecollections.fr';
    const dateFormatted = formatDateFr(paymentDate);

    const emailHtml = buildVeroneEmailHtml({
      title: 'Votre prime a été versée',
      recipientName: firstName,
      accentColor: 'green',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Bonne nouvelle ! Nous avons procédé au virement de ${paidCount === 1 ? 'votre prime' : `vos ${paidCount} primes`} accumulée${paidCount > 1 ? 's' : ''}.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tbody>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Montant versé</td>
              <td style="padding: 8px 0; font-size: 14px; color: #059669; text-align: right; font-weight: 700;">${formatEur(totalAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Date du virement</td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827; text-align: right;">${dateFormatted}</td>
            </tr>
            <tr style="border-top: 1px solid #e5e7eb;">
              <td style="padding: 12px 0; font-size: 13px; color: #6b7280;">Référence virement</td>
              <td style="padding: 12px 0; font-size: 13px; color: #374151; text-align: right; font-family: monospace;">${paymentReference}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 14px; color: #374151; margin: 16px 0;">
          Le virement apparaîtra sur votre compte bancaire sous quelques jours ouvrés selon votre établissement.
        </p>
        <p style="font-size: 14px; color: #374151; margin: 0 0 8px 0;">
          Merci pour votre engagement en tant qu'ambassadeur Vérone. Continuez à partager nos créations avec votre communauté !
        </p>
        <p style="font-size: 13px; color: #9ca3af; margin: 16px 0 0 0;">
          Pour toute question, contactez-nous à <a href="mailto:contact@veronecollections.fr" style="color: #374151;">contact@veronecollections.fr</a>.
        </p>
      `,
      ctaUrl: `${siteUrl}/ambassadeur`,
      ctaLabel: 'Voir mon dashboard ambassadeur',
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Vérone <noreply@verone.fr>',
      to: email,
      subject: `Votre prime de ${formatEur(totalAmount)} a été versée — Vérone Ambassadeurs`,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'contact@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API Ambassador Prime Paid] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
