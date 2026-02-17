/**
 * API Route: POST /api/emails/linkme-step4-confirmed
 * Sends confirmation email when Step 4 is completed
 * Notifies admin and requester
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
    const body = (await request.json()) as Step4ConfirmedEmailRequest;

    const {
      orderNumber,
      requesterEmail,
      requesterName,
      organisationName,
      receptionContactName,
      receptionContactEmail,
      confirmedDeliveryDate,
      notifyAdmin = true,
      adminEmail = process.env.VERONE_ADMIN_EMAIL ?? 'admin@verone.fr',
    } = body;

    if (!orderNumber || !requesterEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resendClient = getResendClient();

    // Format date
    const formattedDate = confirmedDeliveryDate
      ? new Date(confirmedDeliveryDate).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Non sp\u00e9cifi\u00e9e';

    // Build delivery details
    const detailLines: string[] = [];
    if (receptionContactName) {
      detailLines.push(
        `<p style="margin: 5px 0;"><strong>Contact r&eacute;ception :</strong> ${receptionContactName}</p>`
      );
    }
    if (receptionContactEmail) {
      detailLines.push(
        `<p style="margin: 5px 0;"><strong>Email :</strong> ${receptionContactEmail}</p>`
      );
    }
    detailLines.push(
      `<p style="margin: 5px 0;"><strong>Date de livraison :</strong> ${formattedDate}</p>`
    );

    // 1. Email to requester
    const requesterBody = `
      <p style="margin: 0 0 20px 0;">
        Les informations de livraison pour votre commande <strong>${orderNumber}</strong>${organisationName ? ` (${organisationName})` : ''} ont &eacute;t&eacute; confirm&eacute;es.
      </p>

      <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">D&eacute;tails de la livraison</h3>
        ${detailLines.join('\n')}
      </div>

      <p style="margin: 0; color: #666;">
        Nous vous contacterons prochainement pour organiser la livraison.
      </p>`;

    const requesterHtml = buildEmailHtml({
      title: 'Livraison confirm\u00e9e',
      recipientName: requesterName,
      accentColor: 'green',
      bodyHtml: requesterBody,
    });

    // Send requester email
    const requesterResult = resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
      to: requesterEmail,
      subject: `Commande ${orderNumber} - Livraison confirm\u00e9e`,
      html: requesterHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'commandes@verone.fr',
    });

    // 2. Admin notification (optional)
    const adminResult =
      notifyAdmin && adminEmail
        ? resendClient.emails.send({
            from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
            to: adminEmail,
            subject: `[LinkMe] \u00c9tape 4 compl\u00e9t\u00e9e - ${orderNumber}`,
            html: buildEmailHtml({
              title: '\u00c9tape 4 compl\u00e9t\u00e9e',
              recipientName: 'Admin',
              accentColor: 'blue',
              bodyHtml: `
              <p style="margin: 0 0 10px 0;"><strong>Commande :</strong> ${orderNumber}</p>
              ${organisationName ? `<p style="margin: 0 0 10px 0;"><strong>Client :</strong> ${organisationName}</p>` : ''}
              <p style="margin: 0 0 10px 0;"><strong>Contact r&eacute;ception :</strong> ${receptionContactName ?? 'Non sp\u00e9cifi\u00e9'}</p>
              <p style="margin: 0 0 10px 0;"><strong>Date confirm&eacute;e :</strong> ${formattedDate}</p>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: #666;">
                La commande est pr&ecirc;te pour planification de la livraison.
              </p>`,
            }),
          })
        : null;

    // Send all emails
    const promises = [requesterResult, adminResult].filter(Boolean);
    const results = await Promise.allSettled(promises);

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
