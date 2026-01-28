/**
 * API Route: POST /api/emails/notify-enseigne-order
 * Envoie une notification email quand une commande Enseigne est soumise
 *
 * Destinataires: équipe back-office Vérone
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

// Destinataires des notifications (à configurer via env var)
function getNotificationRecipients(): string[] {
  const recipients = process.env.LINKME_NOTIFICATION_EMAILS;
  if (recipients) {
    return recipients.split(',').map(e => e.trim());
  }
  // Fallback: email par défaut
  return ['backoffice@verone.fr'];
}

interface NotifyEnseigneOrderRequest {
  orderNumber: string;
  orderId: string;
  requesterName: string;
  requesterEmail: string;
  requesterType: 'responsable_enseigne' | 'architecte' | 'franchisee';
  organisationName: string | null;
  isNewRestaurant: boolean;
  totalTtc: number;
  source: 'client' | 'affiliate'; // client = via sélection publique, affiliate = via back-office affilié
  affiliateName?: string;
  selectionName?: string;
}

/**
 * POST /api/emails/notify-enseigne-order
 *
 * Body: NotifyEnseigneOrderRequest
 */
export async function POST(request: NextRequest) {
  try {
    const body: NotifyEnseigneOrderRequest = await request.json();

    const {
      orderNumber,
      orderId,
      requesterName,
      requesterEmail,
      requesterType,
      organisationName,
      isNewRestaurant,
      totalTtc,
      source,
      affiliateName,
      selectionName,
    } = body;

    if (!orderNumber || !orderId) {
      return NextResponse.json(
        { success: false, error: 'orderNumber and orderId are required' },
        { status: 400 }
      );
    }

    const recipients = getNotificationRecipients();

    // Labels
    const requesterTypeLabels: Record<string, string> = {
      responsable_enseigne: 'Responsable Enseigne',
      architecte: 'Architecte',
      franchisee: 'Franchisé',
    };

    const sourceLabel =
      source === 'client'
        ? 'Client (via sélection publique)'
        : 'Affilié (via back-office)';

    const emailSubject = `[LinkMe] Nouvelle commande Enseigne ${orderNumber}`;

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
      Nouvelle commande Enseigne
    </h1>

    <p style="margin-bottom: 20px; color: #78350f;">
      Une nouvelle commande B2B a été soumise via <strong>${sourceLabel}</strong>.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">N° Commande</td>
          <td style="padding: 10px 0; text-align: right; font-weight: bold; border-bottom: 1px solid #eee;">
            ${orderNumber}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Demandeur</td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">
            ${requesterName}<br>
            <span style="color: #888; font-size: 13px;">${requesterTypeLabels[requesterType] || requesterType}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Email demandeur</td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">
            <a href="mailto:${requesterEmail}" style="color: #2563eb;">${requesterEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Restaurant</td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">
            ${organisationName || '<em style="color: #888;">Non défini</em>'}
            ${isNewRestaurant ? '<br><span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Nouveau restaurant</span>' : ''}
          </td>
        </tr>
        ${
          affiliateName
            ? `
        <tr>
          <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Affilié</td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">${affiliateName}</td>
        </tr>
        `
            : ''
        }
        ${
          selectionName
            ? `
        <tr>
          <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Sélection</td>
          <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">${selectionName}</td>
        </tr>
        `
            : ''
        }
        <tr>
          <td style="padding: 12px 0; color: #666; font-size: 16px;">Montant TTC</td>
          <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #059669;">
            ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalTtc)}
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.verone.fr'}/canaux-vente/linkme/commandes/${orderId}"
         style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Voir la commande
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #fcd34d; margin: 30px 0;">

    <p style="color: #92400e; font-size: 13px; text-align: center; margin: 0;">
      Cette commande est en attente de validation dans le back-office.
    </p>
  </div>
</body>
</html>
    `;

    // Envoyer l'email via Resend
    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@verone.fr',
      to: recipients,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('[API Notify Enseigne Order] Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.warn(
      `[API Notify Enseigne Order] Email sent for order ${orderNumber} to ${recipients.join(', ')}`
    );

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      recipients,
    });
  } catch (error) {
    console.error('[API Notify Enseigne Order] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
