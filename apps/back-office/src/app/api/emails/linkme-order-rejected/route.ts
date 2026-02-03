/**
 * API Route: POST /api/emails/linkme-order-rejected
 * Envoie un email au demandeur pour notifier le refus
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

interface RejectionEmailRequest {
  orderNumber: string;
  requesterEmail: string;
  requesterName: string;
  reason: string;
  organisationName: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: RejectionEmailRequest = await request.json();

    const {
      orderNumber,
      requesterEmail,
      requesterName,
      reason,
      organisationName,
    } = body;

    if (!orderNumber || !requesterEmail || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailSubject = `Commande ${orderNumber} - Non validée`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef2f2; padding: 30px; border-radius: 8px; border-left: 4px solid #ef4444;">
    <h1 style="color: #991b1b; font-size: 22px; margin: 0 0 20px 0;">
      Commande non validée
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour ${requesterName},
    </p>

    <p style="margin-bottom: 20px;">
      Nous avons le regret de vous informer que votre commande <strong>${orderNumber}</strong>${organisationName ? ` pour ${organisationName}` : ''} n'a pas pu être validée.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #ef4444;">
      <p style="margin: 0; color: #991b1b; font-weight: bold;">Motif :</p>
      <p style="margin: 10px 0 0 0; color: #1f2937; white-space: pre-wrap;">${reason}</p>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      Si vous avez des questions ou souhaitez discuter de cette décision, n'hésitez pas à nous contacter.
    </p>

    <hr style="border: none; border-top: 1px solid #fecaca; margin: 30px 0;">

    <p style="color: #991b1b; font-size: 12px; text-align: center;">
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
      console.error('[API Rejection Email] Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.warn(
      `[API Rejection Email] Sent for order ${orderNumber} to ${requesterEmail}`
    );

    return NextResponse.json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    console.error('[API Rejection Email] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
