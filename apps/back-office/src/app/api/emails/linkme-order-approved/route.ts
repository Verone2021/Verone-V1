/**
 * API Route: POST /api/emails/linkme-order-approved
 * Sends approval email with Step 4 link
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { buildEmailHtml } from '../_shared/email-template';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

interface ApprovalEmailRequest {
  orderNumber: string;
  ownerEmail: string;
  ownerName: string;
  step4Token: string;
  organisationName: string | null;
  totalTtc: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ApprovalEmailRequest;

    const {
      orderNumber,
      ownerEmail,
      ownerName,
      step4Token,
      organisationName,
      totalTtc,
    } = body;

    if (!orderNumber || !ownerEmail || !step4Token) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const linkmeUrl =
      process.env.LINKME_PUBLIC_URL ?? 'https://linkme.verone.fr';
    const step4Url = `${linkmeUrl}/delivery-info/${step4Token}`;

    const formattedTotal = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(totalTtc);

    const bodyHtml = `
      <p style="margin: 0 0 20px 0;">
        Votre commande <strong>${orderNumber}</strong>${organisationName ? ` pour <strong>${organisationName}</strong>` : ''} a &eacute;t&eacute; approuv&eacute;e.
      </p>

      <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #666;">Num&eacute;ro de commande</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold;">${orderNumber}</td>
          </tr>
          ${
            organisationName
              ? `<tr>
            <td style="padding: 10px 0; color: #666;">Restaurant</td>
            <td style="padding: 10px 0; text-align: right;">${organisationName}</td>
          </tr>`
              : ''
          }
          <tr style="border-top: 1px solid #eee;">
            <td style="padding: 12px 0; color: #666;">Montant TTC</td>
            <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #059669;">
              ${formattedTotal}
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e; font-weight: bold;">Action requise</p>
        <p style="margin: 10px 0 0 0; color: #78350f;">
          Veuillez compl&eacute;ter les informations de livraison en cliquant sur le bouton ci-dessous.
        </p>
      </div>`;

    const emailHtml = buildEmailHtml({
      title: 'Commande approuv\u00e9e',
      recipientName: ownerName,
      accentColor: 'green',
      bodyHtml,
      ctaUrl: step4Url,
      ctaLabel: 'Compl\u00e9ter les informations de livraison',
      footerNote: 'Ce lien est valable 30 jours.',
    });

    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
      to: ownerEmail,
      subject: `Votre commande ${orderNumber} a \u00e9t\u00e9 approuv\u00e9e - Action requise`,
      html: emailHtml,
    });

    if (error) {
      console.error('[API Approval Email] Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.warn(
      `[API Approval Email] Sent for order ${orderNumber} to ${ownerEmail}`
    );

    return NextResponse.json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    console.error('[API Approval Email] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
