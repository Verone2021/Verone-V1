/**
 * API Route: POST /api/emails/linkme-order-rejected
 * Sends rejection email to requester
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

interface RejectionEmailRequest {
  orderNumber: string;
  requesterEmail: string;
  requesterName: string;
  reason: string;
  organisationName: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RejectionEmailRequest;

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

    const bodyHtml = `
      <p style="margin: 0 0 20px 0;">
        Nous avons le regret de vous informer que votre commande <strong>${orderNumber}</strong>${organisationName ? ` pour <strong>${organisationName}</strong>` : ''} n&rsquo;a pas pu &ecirc;tre valid&eacute;e.
      </p>

      <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #ef4444;">
        <p style="margin: 0; color: #991b1b; font-weight: bold;">Motif :</p>
        <p style="margin: 10px 0 0 0; color: #1f2937; white-space: pre-wrap;">${reason}</p>
      </div>

      <p style="margin: 0; color: #666;">
        Si vous avez des questions ou souhaitez discuter de cette d&eacute;cision, n&rsquo;h&eacute;sitez pas &agrave; nous contacter.
      </p>`;

    const emailHtml = buildEmailHtml({
      title: 'Commande non valid\u00e9e',
      recipientName: requesterName,
      accentColor: 'red',
      bodyHtml,
    });

    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
      to: requesterEmail,
      subject: `Commande ${orderNumber} - Non valid\u00e9e`,
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
