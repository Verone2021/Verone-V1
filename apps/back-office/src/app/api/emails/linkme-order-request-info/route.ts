/**
 * API Route: POST /api/emails/linkme-order-request-info
 * Envoie un email au demandeur pour demander des compléments
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

interface MissingFieldInfo {
  label: string;
  category: string;
}

interface RequestInfoEmailRequest {
  orderNumber: string;
  requesterEmail: string;
  requesterName: string;
  message: string;
  organisationName: string | null;
  /** Liste optionnelle des champs manquants détectés */
  missingFields?: MissingFieldInfo[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestInfoEmailRequest;

    const {
      orderNumber,
      requesterEmail,
      requesterName,
      message,
      organisationName,
      missingFields,
    } = body;

    if (!orderNumber || !requesterEmail || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailSubject = `Commande ${orderNumber} - Informations complémentaires requises`;

    // Générer la section des champs manquants si fournis
    const missingFieldsHtml =
      missingFields && missingFields.length > 0
        ? `
    <div style="background-color: #fff7ed; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #fed7aa;">
      <p style="margin: 0 0 8px 0; color: #9a3412; font-weight: bold; font-size: 14px;">Informations manquantes :</p>
      <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
        ${missingFields.map((f: MissingFieldInfo) => `<li style="margin: 4px 0; font-size: 14px;">${f.label}</li>`).join('')}
      </ul>
    </div>`
        : '';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef3c7; padding: 30px; border-radius: 8px; border-left: 4px solid #f59e0b;">
    <h1 style="color: #92400e; font-size: 22px; margin: 0 0 20px 0;">
      Informations complémentaires requises
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour ${requesterName},
    </p>

    <p style="margin-bottom: 20px;">
      Concernant votre commande <strong>${orderNumber}</strong>${organisationName ? ` pour ${organisationName}` : ''},
      nous avons besoin d'informations complémentaires pour pouvoir la traiter.
    </p>

    ${missingFieldsHtml}

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #f59e0b;">
      <p style="margin: 0; color: #78350f; font-weight: bold;">Message de notre équipe :</p>
      <p style="margin: 10px 0 0 0; color: #1f2937; white-space: pre-wrap;">${message}</p>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      Merci de nous répondre à cet email avec les informations demandées.
    </p>

    <hr style="border: none; border-top: 1px solid #fcd34d; margin: 30px 0;">

    <p style="color: #92400e; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d'intérieur
    </p>
  </div>
</body>
</html>
    `;

    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
      to: requesterEmail,
      subject: emailSubject,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'commandes@verone.fr',
    });

    if (error) {
      console.error('[API Request Info Email] Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.warn(
      `[API Request Info Email] Sent for order ${orderNumber} to ${requesterEmail}`
    );

    return NextResponse.json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    console.error('[API Request Info Email] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
