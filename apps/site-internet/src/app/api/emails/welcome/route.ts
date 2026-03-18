import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { buildVeroneEmailHtml } from '@/emails/verone-email-template';
import { getLogoAttachments } from '../_shared/email-logo';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Welcome Email] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface WelcomeEmailRequest {
  email: string;
  firstName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WelcomeEmailRequest;

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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr';

    const emailHtml = buildVeroneEmailHtml({
      title: 'Bienvenue chez V\u00e9rone',
      recipientName: body.firstName,
      accentColor: 'black',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Nous sommes ravis de vous accueillir. Votre compte a &eacute;t&eacute; cr&eacute;&eacute; avec succ&egrave;s.
        </p>
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          D&eacute;couvrez notre s&eacute;lection de mobilier et d&eacute;coration d'int&eacute;rieur haut de gamme,
          s&eacute;lectionn&eacute;e avec soin aupr&egrave;s des meilleurs artisans.
        </p>
        <p style="font-size: 15px; color: #374151; margin: 0 0 8px 0;">
          <strong>Votre compte vous permet de :</strong>
        </p>
        <ul style="font-size: 14px; color: #4b5563; padding-left: 20px; margin: 0 0 16px 0;">
          <li style="margin-bottom: 6px;">Sauvegarder vos produits favoris</li>
          <li style="margin-bottom: 6px;">Suivre vos commandes en temps r&eacute;el</li>
          <li style="margin-bottom: 6px;">B&eacute;n&eacute;ficier d'offres exclusives</li>
        </ul>
      `,
      ctaUrl: `${siteUrl}/catalogue`,
      ctaLabel: 'D\u00e9couvrir le catalogue',
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'V\u00e9rone <noreply@verone.fr>',
      to: body.email,
      subject: 'Bienvenue chez V\u00e9rone',
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'contact@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API Welcome Email] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
