/**
 * API Route: POST /api/emails/notify-enseigne-order
 * Sends notification email when an Enseigne order is submitted
 *
 * Recipients: Verone back-office team
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

function getNotificationRecipients(): string[] {
  const recipients = process.env.LINKME_NOTIFICATION_EMAILS;
  if (recipients) {
    return recipients.split(',').map(e => e.trim());
  }
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
  source: 'client' | 'affiliate';
  affiliateName?: string;
  selectionName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as NotifyEnseigneOrderRequest;

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

    const requesterTypeLabels: Record<string, string> = {
      responsable_enseigne: 'Responsable Enseigne',
      architecte: 'Architecte',
      franchisee: 'Franchis\u00e9',
    };

    const sourceLabel =
      source === 'client'
        ? 'Client (via s\u00e9lection publique)'
        : 'Affili\u00e9 (via back-office)';

    const formattedTotal = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(totalTtc);

    const newRestaurantBadge = isNewRestaurant
      ? '<br><span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Nouveau restaurant</span>'
      : '';

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; color: #1e40af;">
        Une nouvelle commande B2B a &eacute;t&eacute; soumise via <strong>${sourceLabel}</strong>.
      </p>

      <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">N&deg; Commande</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; border-bottom: 1px solid #eee;">${orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Demandeur</td>
            <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">
              ${requesterName}<br>
              <span style="color: #888; font-size: 13px;">${requesterTypeLabels[requesterType] ?? requesterType}</span>
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
              ${organisationName ?? '<em style="color: #888;">Non d&eacute;fini</em>'}
              ${newRestaurantBadge}
            </td>
          </tr>
          ${
            affiliateName
              ? `<tr>
            <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Affili&eacute;</td>
            <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">${affiliateName}</td>
          </tr>`
              : ''
          }
          ${
            selectionName
              ? `<tr>
            <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">S&eacute;lection</td>
            <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">${selectionName}</td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding: 12px 0; color: #666; font-size: 16px;">Montant TTC</td>
            <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #059669;">
              ${formattedTotal}
            </td>
          </tr>
        </table>
      </div>

      <p style="margin: 0; font-size: 13px; color: #666; text-align: center;">
        Cette commande est en attente de validation dans le back-office.
      </p>`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.verone.fr';

    const emailHtml = buildEmailHtml({
      title: 'Nouvelle commande Enseigne',
      recipientName: '\u00c9quipe Verone',
      accentColor: 'blue',
      bodyHtml,
      ctaUrl: `${appUrl}/canaux-vente/linkme/commandes/${orderId}`,
      ctaLabel: 'Voir la commande',
    });

    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'notifications@verone.fr',
      to: recipients,
      subject: `[LinkMe] Nouvelle commande Enseigne ${orderNumber}`,
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
