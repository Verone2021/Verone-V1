/**
 * API Route: POST /api/emails/linkme-step4-confirmed
 * Envoie un email de confirmation quand l'Étape 4 est complétée
 * Notifie l'admin et le demandeur
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

interface Step4ConfirmedEmailRequest {
  orderNumber: string;
  requesterEmail: string;
  requesterName: string;
  organisationName: string | null;
  receptionContactName: string | null;
  receptionContactEmail: string | null;
  confirmedDeliveryDate: string | null;
  notifyAdmin?: boolean;
  adminEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: Step4ConfirmedEmailRequest = await request.json();

    const {
      orderNumber,
      requesterEmail,
      requesterName,
      organisationName,
      receptionContactName,
      receptionContactEmail,
      confirmedDeliveryDate,
      notifyAdmin = true,
      adminEmail = process.env.VERONE_ADMIN_EMAIL || 'admin@verone.fr',
    } = body;

    if (!orderNumber || !requesterEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resendClient = getResendClient();
    const emails: Promise<any>[] = [];

    // Format date
    const formattedDate = confirmedDeliveryDate
      ? new Date(confirmedDeliveryDate).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Non spécifiée';

    // 1. Email au demandeur
    const requesterEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ecfdf5; padding: 30px; border-radius: 8px; border-left: 4px solid #10b981;">
    <h1 style="color: #065f46; font-size: 22px; margin: 0 0 20px 0;">
      ✓ Livraison confirmée
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour ${requesterName},
    </p>

    <p style="margin-bottom: 20px;">
      Les informations de livraison pour votre commande <strong>${orderNumber}</strong>${organisationName ? ` (${organisationName})` : ''} ont été confirmées.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">Détails de la livraison</h3>
      ${
        receptionContactName
          ? `<p style="margin: 5px 0;"><strong>Contact réception:</strong> ${receptionContactName}</p>`
          : ''
      }
      ${
        receptionContactEmail
          ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${receptionContactEmail}</p>`
          : ''
      }
      <p style="margin: 5px 0;"><strong>Date de livraison:</strong> ${formattedDate}</p>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      Nous vous contacterons prochainement pour organiser la livraison.
    </p>

    <hr style="border: none; border-top: 1px solid #a7f3d0; margin: 30px 0;">

    <p style="color: #065f46; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d'intérieur
    </p>
  </div>
</body>
</html>
    `;

    emails.push(
      resendClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'commandes@verone.fr',
        to: requesterEmail,
        subject: `Commande ${orderNumber} - Livraison confirmée`,
        html: requesterEmailHtml,
        replyTo: process.env.RESEND_REPLY_TO || 'commandes@verone.fr',
      })
    );

    // 2. Notification admin (optionnel)
    if (notifyAdmin && adminEmail) {
      const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
    <h2 style="color: #0369a1; margin: 0 0 15px 0;">
      [LinkMe] Étape 4 complétée
    </h2>
    <p><strong>Commande:</strong> ${orderNumber}</p>
    ${organisationName ? `<p><strong>Client:</strong> ${organisationName}</p>` : ''}
    <p><strong>Contact réception:</strong> ${receptionContactName || 'Non spécifié'}</p>
    <p><strong>Date confirmée:</strong> ${formattedDate}</p>
    <hr style="border: none; border-top: 1px solid #bae6fd; margin: 15px 0;">
    <p style="font-size: 12px; color: #666;">
      La commande est prête pour planification de la livraison.
    </p>
  </div>
</body>
</html>
      `;

      emails.push(
        resendClient.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'commandes@verone.fr',
          to: adminEmail,
          subject: `[LinkMe] Étape 4 complétée - ${orderNumber}`,
          html: adminEmailHtml,
        })
      );
    }

    // Envoyer tous les emails
    const results = await Promise.allSettled(emails);

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('[API Step4 Confirmed] Some emails failed:', failures);
    }

    console.warn(
      `[API Step4 Confirmed] Sent for order ${orderNumber} - ${results.length} emails`
    );

    return NextResponse.json({
      success: true,
      emailsSent: results.filter(r => r.status === 'fulfilled').length,
    });
  } catch (error) {
    console.error('[API Step4 Confirmed] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
