/**
 * API Route: POST /api/emails/storage-request-approved
 * Sends approval email to affiliate users when their storage request is approved
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
      '[Storage Approval Email] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface StorageApprovalRequest {
  requestId: string;
  productName: string;
  productSku: string;
  quantity: number;
  affiliateName: string;
  recipientEmails: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StorageApprovalRequest;

    const {
      productName,
      productSku,
      quantity,
      affiliateName,
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

    const bodyHtml = `
      <p style="margin: 0 0 20px 0;">
        Votre demande de stockage a &eacute;t&eacute; <strong>approuv&eacute;e</strong> par l&rsquo;&eacute;quipe V&eacute;rone.
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
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Quantit&eacute; approuv&eacute;e</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quantity} unit&eacute;(s)</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f0fdf4; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #22c55e;">
        <p style="margin: 0; font-weight: bold; color: #166534;">Prochaines &eacute;tapes</p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1f2937;">
          <li>Pr&eacute;parez vos produits pour l&rsquo;envoi</li>
          <li>Emballez soigneusement chaque unit&eacute;</li>
          <li>Envoyez &agrave; l&rsquo;adresse de l&rsquo;entrep&ocirc;t V&eacute;rone</li>
        </ul>
      </div>

      <p style="margin: 0; color: #666; font-size: 13px;">
        Retrouvez le d&eacute;tail de vos demandes dans votre espace LinkMe.
      </p>`;

    const emailHtml = buildEmailHtml({
      title: 'Demande de stockage approuv\u00e9e',
      recipientName: affiliateName,
      accentColor: 'green',
      bodyHtml,
      ctaUrl: `${linkmeUrl}/stockage?tab=demandes`,
      ctaLabel: 'Voir mes demandes',
    });

    const results = await Promise.allSettled(
      recipientEmails.map(email =>
        resendClient.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
          to: email,
          subject: `Demande de stockage approuv\u00e9e - ${productName}`,
          html: emailHtml,
          replyTo: process.env.RESEND_REPLY_TO ?? 'commandes@verone.fr',
          attachments: getLogoAttachments(),
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      console.error(
        `[Storage Approval Email] ${failed}/${recipientEmails.length} emails failed`
      );
    }

    console.warn(
      `[Storage Approval Email] Sent ${sent} emails for ${productName} (${productSku})`
    );

    return NextResponse.json({
      success: true,
      emailsSent: sent,
    });
  } catch (error) {
    console.error('[Storage Approval Email] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
