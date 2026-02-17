/**
 * API Route: POST /api/emails/linkme-info-completed
 * Sends notification email to back-office when someone completes the info request form
 *
 * Recipients: Verone back-office team (LINKME_NOTIFICATION_EMAILS)
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

interface InfoCompletedRequest {
  orderNumber: string;
  orderId: string;
  completedByEmail: string;
  organisationName: string | null;
  completedFields: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InfoCompletedRequest;

    const {
      orderNumber,
      orderId,
      completedByEmail,
      organisationName,
      completedFields,
    } = body;

    if (!orderNumber || !orderId || !completedByEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'orderNumber, orderId and completedByEmail are required',
        },
        { status: 400 }
      );
    }

    const recipients = getNotificationRecipients();

    // Build fields list HTML
    const fieldEntries = Object.entries(completedFields);
    const fieldsHtml =
      fieldEntries.length > 0
        ? fieldEntries
            .map(
              ([key, value]) =>
                `<tr>
              <td style="padding: 6px 0; color: #666; border-bottom: 1px solid #eee; font-size: 13px;">${escapeHtml(formatFieldKey(key))}</td>
              <td style="padding: 6px 0; text-align: right; border-bottom: 1px solid #eee; font-size: 13px;">${escapeHtml(value)}</td>
            </tr>`
            )
            .join('')
        : '<tr><td style="padding: 8px 0; color: #888;" colspan="2">Aucun champ renseign&eacute;</td></tr>';

    const bodyHtml = `
      <p style="margin: 0 0 20px 0; color: #065f46;">
        Un formulaire de compl&eacute;ment d&rsquo;informations a &eacute;t&eacute; rempli avec succ&egrave;s.
      </p>

      <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">N&deg; Commande</td>
            <td style="padding: 10px 0; text-align: right; font-weight: bold; border-bottom: 1px solid #eee;">${escapeHtml(orderNumber)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Restaurant</td>
            <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">${organisationName ? escapeHtml(organisationName) : '<em style="color: #888;">Non d&eacute;fini</em>'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Compl&eacute;t&eacute; par</td>
            <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">
              <a href="mailto:${escapeHtml(completedByEmail)}" style="color: #059669;">${escapeHtml(completedByEmail)}</a>
            </td>
          </tr>
        </table>
      </div>

      ${
        fieldEntries.length > 0
          ? `<div style="margin: 20px 0;">
        <p style="font-weight: bold; color: #065f46; margin: 0 0 8px 0;">Champs compl&eacute;t&eacute;s (${fieldEntries.length}) :</p>
        <div style="background-color: #ffffff; padding: 12px 16px; border-radius: 6px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${fieldsHtml}
          </table>
        </div>
      </div>`
          : ''
      }

      <p style="margin: 0; font-size: 13px; color: #666; text-align: center;">
        La commande peut maintenant &ecirc;tre valid&eacute;e dans le back-office.
      </p>`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.verone.fr';

    const emailHtml = buildEmailHtml({
      title: 'Informations compl\u00e9t\u00e9es',
      recipientName: '\u00c9quipe Verone',
      accentColor: 'green',
      bodyHtml,
      ctaUrl: `${appUrl}/canaux-vente/linkme/commandes/${orderId}`,
      ctaLabel: 'Voir la commande',
    });

    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'notifications@verone.fr',
      to: recipients,
      subject: `[LinkMe] Informations compl\u00e9t\u00e9es - ${orderNumber}`,
      html: emailHtml,
    });

    if (error) {
      console.error('[API linkme-info-completed] Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.warn(
      `[API linkme-info-completed] Email sent for order ${orderNumber} to ${recipients.join(', ')}`
    );

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      recipients,
    });
  } catch (error) {
    console.error('[API linkme-info-completed] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/** Escape HTML entities */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert field keys like 'billing_email' to 'Billing email' */
function formatFieldKey(key: string): string {
  const labels: Record<string, string> = {
    requester_name: 'Nom du demandeur',
    requester_email: 'Email du demandeur',
    requester_phone: 'T\u00e9l\u00e9phone du demandeur',
    owner_name: 'Nom du propri\u00e9taire',
    owner_email: 'Email du propri\u00e9taire',
    owner_phone: 'T\u00e9l\u00e9phone du propri\u00e9taire',
    owner_company_legal_name: 'Raison sociale propri\u00e9taire',
    billing_name: 'Contact facturation',
    billing_email: 'Email facturation',
    billing_phone: 'T\u00e9l\u00e9phone facturation',
    delivery_contact_name: 'Contact livraison',
    delivery_contact_email: 'Email livraison',
    delivery_contact_phone: 'T\u00e9l\u00e9phone livraison',
    delivery_address: 'Adresse livraison',
    delivery_postal_code: 'Code postal livraison',
    delivery_city: 'Ville livraison',
    desired_delivery_date: 'Date souhait\u00e9e',
    mall_email: 'Email centre commercial',
    organisation_siret: 'SIRET',
  };
  return labels[key] ?? key.replace(/_/g, ' ');
}
