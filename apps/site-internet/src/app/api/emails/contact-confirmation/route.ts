import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { buildVeroneEmailHtml } from '@/emails/verone-email-template';
import { getLogoAttachments } from '../_shared/email-logo';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Contact Confirmation] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface ContactConfirmationRequest {
  email: string;
  firstName: string;
  subject: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactConfirmationRequest;

    if (!body.email || !body.firstName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resendClient = getResendClient();
    if (!resendClient) {
      return NextResponse.json({
        success: true,
        emailDisabled: true,
        message: 'Email notifications are currently disabled',
      });
    }

    const emailHtml = buildVeroneEmailHtml({
      title: 'Message bien re\u00e7u',
      recipientName: body.firstName,
      accentColor: 'black',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Nous avons bien re&ccedil;u votre message concernant : <strong>${body.subject}</strong>
        </p>
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Notre &eacute;quipe vous r&eacute;pondra dans les meilleurs d&eacute;lais, g&eacute;n&eacute;ralement sous 24 &agrave; 48 heures ouvr&eacute;es.
        </p>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">
          Pour toute urgence, vous pouvez nous joindre directement &agrave; <a href="mailto:contact@veronecollections.fr" style="color: #1a1a1a;">contact@veronecollections.fr</a>
        </p>
      `,
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'V\u00e9rone <noreply@verone.fr>',
      to: body.email,
      subject: 'Nous avons bien re\u00e7u votre message',
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'contact@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API Contact Confirmation] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
