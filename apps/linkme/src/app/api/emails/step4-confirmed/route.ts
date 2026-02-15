/**
 * API Route: POST /api/emails/step4-confirmed
 * Envoie un email de confirmation quand l'Étape 4 (livraison) est complétée.
 * Notifie le demandeur + l'admin Verone.
 *
 * @since 2026-02-14
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Step4 Confirmed] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface Step4ConfirmedRequest {
  orderNumber: string;
  requesterEmail: string;
  requesterName: string;
  organisationName: string | null;
  receptionContactName: string;
  receptionContactEmail: string;
  receptionContactPhone: string | null;
  desiredDeliveryDate: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Step4ConfirmedRequest;

    const {
      orderNumber,
      requesterEmail,
      requesterName,
      organisationName,
      receptionContactName,
      receptionContactEmail,
      desiredDeliveryDate,
    } = body;

    if (!orderNumber || !requesterEmail || !receptionContactName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resendClient = getResendClient();
    if (!resendClient) {
      // Emails disabled in dev - still return success
      return NextResponse.json({ success: true, emailsSent: 0 });
    }

    const formattedDate = desiredDeliveryDate
      ? new Date(desiredDeliveryDate).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'À confirmer par notre équipe';

    // 1. Email au demandeur (confirmation)
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
      Informations de livraison enregistrées
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour ${requesterName},
    </p>

    <p style="margin-bottom: 20px;">
      Les informations de livraison pour votre commande <strong>${orderNumber}</strong>${organisationName ? ` (${organisationName})` : ''} ont bien été enregistrées.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">Récapitulatif</h3>
      <p style="margin: 5px 0;"><strong>Contact réception :</strong> ${receptionContactName}</p>
      <p style="margin: 5px 0;"><strong>Email :</strong> ${receptionContactEmail}</p>
      <p style="margin: 5px 0;"><strong>Date souhaitée :</strong> ${formattedDate}</p>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      Notre équipe vous contactera prochainement pour confirmer la date et organiser la livraison.
    </p>

    <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #1e40af; font-size: 13px;">
        <strong>Rappel :</strong> Lors de la livraison, vérifiez l'état des marchandises et notez toute réserve sur la lettre de voiture (CMR) avant de signer.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #a7f3d0; margin: 30px 0;">

    <p style="color: #065f46; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d'intérieur
    </p>
  </div>
</body>
</html>
    `;

    // 2. Email admin (notification)
    const adminEmail = process.env.VERONE_ADMIN_EMAIL ?? 'commandes@verone.fr';
    const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
    <h2 style="color: #0369a1; margin: 0 0 15px 0;">[LinkMe] Étape 4 complétée</h2>
    <p><strong>Commande :</strong> ${orderNumber}</p>
    ${organisationName ? `<p><strong>Client :</strong> ${organisationName}</p>` : ''}
    <p><strong>Contact réception :</strong> ${receptionContactName} (${receptionContactEmail})</p>
    <p><strong>Date souhaitée :</strong> ${formattedDate}</p>
    <hr style="border: none; border-top: 1px solid #bae6fd; margin: 15px 0;">
    <p style="font-size: 12px; color: #666;">
      La commande est prête pour planification de la livraison.
    </p>
  </div>
</body>
</html>
    `;

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr';
    const replyTo = process.env.RESEND_REPLY_TO ?? 'commandes@verone.fr';

    const results = await Promise.allSettled([
      resendClient.emails.send({
        from: fromEmail,
        to: requesterEmail,
        subject: `Commande ${orderNumber} - Informations de livraison enregistrées`,
        html: requesterEmailHtml,
        replyTo,
      }),
      resendClient.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `[LinkMe] Étape 4 complétée - ${orderNumber}`,
        html: adminEmailHtml,
      }),
    ]);

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('[API Step4 Confirmed] Some emails failed:', failures);
    }

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
