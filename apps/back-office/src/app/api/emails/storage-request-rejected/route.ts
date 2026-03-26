/**
 * API Route: POST /api/emails/storage-request-rejected
 * Sends rejection email to affiliate users when their storage request is rejected
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { getLogoAttachments } from '../_shared/email-logo';
import { buildEmailHtml } from '../_shared/email-template';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[Storage Rejection Email] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface StorageRejectionRequest {
  requestId: string;
  productName: string;
  productSku: string;
  quantity: number;
  affiliateName: string;
  reason: string;
  recipientEmails: string[];
}

function buildStorageRejectionBodyHtml(params: {
  productName: string;
  productSku: string;
  quantity: number;
  reason: string;
}): string {
  const { productName, productSku, quantity, reason } = params;
  return `
      <p style="margin: 0 0 20px 0;">
        Nous avons le regret de vous informer que votre demande de stockage n&rsquo;a pas pu &ecirc;tre valid&eacute;e.
      </p>

      <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Produit</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">R&eacute;f&eacute;rence</td>
            <td style="padding: 8px 0; font-family: monospace; text-align: right;">${productSku}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Quantit&eacute; demand&eacute;e</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quantity} unit&eacute;(s)</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #ef4444;">
        <p style="margin: 0; color: #991b1b; font-weight: bold;">Motif :</p>
        <p style="margin: 10px 0 0 0; color: #1f2937; white-space: pre-wrap;">${reason || 'Non sp&eacute;cifi&eacute;'}</p>
      </div>

      <p style="margin: 0; color: #666;">
        Vous pouvez modifier et soumettre une nouvelle demande depuis votre espace LinkMe.
      </p>`;
}

async function sendRejectionEmails(
  resendClient: Resend,
  recipientEmails: string[],
  productName: string,
  productSku: string,
  emailHtml: string
) {
  const results = await Promise.allSettled(
    recipientEmails.map(email =>
      resendClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
        to: email,
        subject: `Demande de stockage non validée - ${productName}`,
        html: emailHtml,
        replyTo: process.env.RESEND_REPLY_TO ?? 'romeo@veronecollections.fr',
        attachments: getLogoAttachments(),
      })
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  if (failed > 0) {
    console.error(
      `[Storage Rejection Email] ${failed}/${recipientEmails.length} emails failed`
    );
  }

  console.warn(
    `[Storage Rejection Email] Sent ${sent} emails for ${productName} (${productSku})`
  );

  return { sent };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StorageRejectionRequest;
    const {
      productName,
      productSku,
      quantity,
      affiliateName,
      reason,
      recipientEmails,
    } = body;

    if (!productName || !recipientEmails?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resendClient = getResendClient();
    if (!resendClient) {
      return NextResponse.json({
        success: true,
        emailsSent: 0,
        message: 'Resend not configured',
      });
    }

    const linkmeUrl =
      process.env.LINKME_PUBLIC_URL ?? 'https://linkme.verone.fr';
    const emailHtml = buildEmailHtml({
      title: 'Demande de stockage non validée',
      recipientName: affiliateName,
      accentColor: 'red',
      bodyHtml: buildStorageRejectionBodyHtml({
        productName,
        productSku,
        quantity,
        reason,
      }),
      ctaUrl: `${linkmeUrl}/stockage?tab=demandes`,
      ctaLabel: 'Voir mes demandes',
    });

    const { sent } = await sendRejectionEmails(
      resendClient,
      recipientEmails,
      productName,
      productSku,
      emailHtml
    );

    return NextResponse.json({ success: true, emailsSent: sent });
  } catch (error) {
    console.error('[Storage Rejection Email] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
