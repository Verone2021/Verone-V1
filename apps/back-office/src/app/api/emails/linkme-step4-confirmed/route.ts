/**
 * API Route: POST /api/emails/linkme-step4-confirmed
 * Sends confirmation email when Step 4 is completed
 * Notifies admin and requester
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

import type { Database } from '@verone/types';

import { getLogoAttachments } from '../_shared/email-logo';
import { buildEmailHtml } from '../_shared/email-template';

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

interface Step4ConfirmedEmailRequest {
  salesOrderId?: string;
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

function buildStep4RequesterBodyHtml(params: {
  orderNumber: string;
  organisationName: string | null;
  detailLines: string[];
}): string {
  const { orderNumber, organisationName, detailLines } = params;
  return `
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
}

function buildStep4AdminBodyHtml(params: {
  orderNumber: string;
  organisationName: string | null;
  receptionContactName: string | null;
  formattedDate: string;
}): string {
  const { orderNumber, organisationName, receptionContactName, formattedDate } =
    params;
  const clientLine = organisationName
    ? `<p style="margin: 0 0 10px 0;"><strong>Client :</strong> ${organisationName}</p>`
    : '';
  return `
              <p style="margin: 0 0 10px 0;"><strong>Commande :</strong> ${orderNumber}</p>
              ${clientLine}
              <p style="margin: 0 0 10px 0;"><strong>Contact r&eacute;ception :</strong> ${receptionContactName ?? 'Non spécifié'}</p>
              <p style="margin: 0 0 10px 0;"><strong>Date confirm&eacute;e :</strong> ${formattedDate}</p>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: #666;">
                La commande est pr&ecirc;te pour planification de la livraison.
              </p>`;
}

function buildStep4DeliveryLines(params: {
  receptionContactName: string | null;
  receptionContactEmail: string | null;
  formattedDate: string;
}): string[] {
  const lines: string[] = [];
  if (params.receptionContactName) {
    lines.push(
      `<p style="margin: 5px 0;"><strong>Contact r&eacute;ception :</strong> ${params.receptionContactName}</p>`
    );
  }
  if (params.receptionContactEmail) {
    lines.push(
      `<p style="margin: 5px 0;"><strong>Email :</strong> ${params.receptionContactEmail}</p>`
    );
  }
  lines.push(
    `<p style="margin: 5px 0;"><strong>Date de livraison :</strong> ${params.formattedDate}</p>`
  );
  return lines;
}

function formatDeliveryDate(confirmedDeliveryDate: string | null): string {
  if (!confirmedDeliveryDate) return 'Non spécifiée';
  return new Date(confirmedDeliveryDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildStep4EmailPromises(params: {
  resendClient: Resend;
  requesterEmail: string;
  orderNumber: string;
  requesterHtml: string;
  adminHtml: string;
  notifyAdmin: boolean;
  adminEmail: string;
}) {
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr';
  const promises = [
    params.resendClient.emails.send({
      from: fromEmail,
      to: params.requesterEmail,
      subject: `Commande ${params.orderNumber} - Livraison confirmée`,
      html: params.requesterHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'romeo@veronecollections.fr',
      attachments: getLogoAttachments(),
    }),
    ...(params.notifyAdmin && params.adminEmail
      ? [
          params.resendClient.emails.send({
            from: fromEmail,
            to: params.adminEmail,
            subject: `[LinkMe] Étape 4 complétée - ${params.orderNumber}`,
            html: params.adminHtml,
            attachments: getLogoAttachments(),
          }),
        ]
      : []),
  ];
  return promises;
}

async function logStep4Event(
  salesOrderId: string,
  requesterEmail: string
): Promise<void> {
  try {
    const supabase = getAdminClient();
    await supabase.from('sales_order_events').insert({
      sales_order_id: salesOrderId,
      event_type: 'email_step4_confirmed',
      metadata: { recipient_email: requesterEmail },
    });
  } catch (logError) {
    console.error('[API Step4 Confirmed] Failed to log event:', logError);
  }
}

function buildStep4Emails(params: {
  orderNumber: string;
  requesterName: string;
  organisationName: string | null;
  receptionContactName: string | null;
  receptionContactEmail: string | null;
  confirmedDeliveryDate: string | null;
}): { requesterHtml: string; adminHtml: string } {
  const formattedDate = formatDeliveryDate(params.confirmedDeliveryDate);
  const detailLines = buildStep4DeliveryLines({
    receptionContactName: params.receptionContactName,
    receptionContactEmail: params.receptionContactEmail,
    formattedDate,
  });

  const requesterHtml = buildEmailHtml({
    title: 'Livraison confirmée',
    recipientName: params.requesterName,
    accentColor: 'green',
    bodyHtml: buildStep4RequesterBodyHtml({
      orderNumber: params.orderNumber,
      organisationName: params.organisationName,
      detailLines,
    }),
  });

  const adminHtml = buildEmailHtml({
    title: 'Étape 4 complétée',
    recipientName: 'Admin',
    accentColor: 'blue',
    bodyHtml: buildStep4AdminBodyHtml({
      orderNumber: params.orderNumber,
      organisationName: params.organisationName,
      receptionContactName: params.receptionContactName,
      formattedDate,
    }),
  });

  return { requesterHtml, adminHtml };
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

    const { requesterHtml, adminHtml } = buildStep4Emails({
      orderNumber,
      requesterName,
      organisationName,
      receptionContactName,
      receptionContactEmail,
      confirmedDeliveryDate,
    });

    const promises = buildStep4EmailPromises({
      resendClient: getResendClient(),
      requesterEmail,
      orderNumber,
      requesterHtml,
      adminHtml,
      notifyAdmin,
      adminEmail,
    });

    const results = await Promise.allSettled(promises);
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('[API Step4 Confirmed] Some emails failed:', failures);
    }

    console.warn(
      `[API Step4 Confirmed] Sent for order ${orderNumber} - ${results.length} emails`
    );

    if (body.salesOrderId) {
      await logStep4Event(body.salesOrderId, requesterEmail);
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
