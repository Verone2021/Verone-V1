/**
 * API Route: POST /api/emails/linkme-order-approved
 * Envoie l'email d'approbation avec le lien Étape 4
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

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
    const body: ApprovalEmailRequest = await request.json();

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
      process.env.LINKME_PUBLIC_URL || 'https://linkme.verone.fr';
    const step4Url = `${linkmeUrl}/delivery-info/${step4Token}`;

    const emailSubject = `Votre commande ${orderNumber} a été approuvée - Action requise`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ecfdf5; padding: 30px; border-radius: 8px; border-left: 4px solid #10b981;">
    <h1 style="color: #065f46; font-size: 22px; margin: 0 0 20px 0;">
      Commande approuvée
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour ${ownerName},
    </p>

    <p style="margin-bottom: 20px;">
      Votre commande <strong>${orderNumber}</strong>${organisationName ? ` pour ${organisationName}` : ''} a été approuvée.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #666;">Numéro de commande</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold;">${orderNumber}</td>
        </tr>
        ${
          organisationName
            ? `
        <tr>
          <td style="padding: 10px 0; color: #666;">Restaurant</td>
          <td style="padding: 10px 0; text-align: right;">${organisationName}</td>
        </tr>
        `
            : ''
        }
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666;">Montant TTC</td>
          <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #059669;">
            ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalTtc)}
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e; font-weight: bold;">
        Action requise
      </p>
      <p style="margin: 10px 0 0 0; color: #78350f;">
        Veuillez compléter les informations de livraison en cliquant sur le bouton ci-dessous.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${step4Url}"
         style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Compléter les informations de livraison
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">
      Ce lien est valable 30 jours. Si vous avez des questions, n'hésitez pas à nous contacter.
    </p>

    <hr style="border: none; border-top: 1px solid #a7f3d0; margin: 30px 0;">

    <p style="color: #065f46; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d'intérieur
    </p>
  </div>
</body>
</html>
    `;

    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'commandes@verone.fr',
      to: ownerEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('[API Approval Email] Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(
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
