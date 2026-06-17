/**
 * API Route: POST /api/emails/contact-admin-notification
 *
 * Notifie l'équipe Vérone par email à chaque message reçu via le formulaire de
 * contact public (`/contact`). Complète l'email de confirmation envoyé au
 * visiteur : ici c'est Roméo qui est prévenu, avec replyTo = email du visiteur
 * pour répondre en un clic.
 *
 * Calqué sur `api/emails/admin-order-notification/route.ts`. Non bloquant pour le
 * formulaire (appelé en fire-and-forget depuis `/api/contact`).
 *
 * @module api/emails/contact-admin-notification
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { buildVeroneEmailHtml } from '@/emails/verone-email-template';
import { getLogoAttachments } from '../_shared/email-logo';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Contact Admin Notification] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface ContactAdminNotificationRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Libellés lisibles des catégories du formulaire (voir contact/page.tsx). */
const SUBJECT_LABELS: Record<string, string> = {
  product: 'Question sur un produit',
  order: 'Commande ou devis',
  return: 'Retour ou problème',
  other: 'Autre',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactAdminNotificationRequest;

    if (!body.email || !body.name || !body.message) {
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

    const notificationEmail =
      process.env.CONTACT_NOTIFICATION_EMAIL ?? 'contact@veronecollections.fr';
    const subjectLabel = SUBJECT_LABELS[body.subject] ?? body.subject;

    const emailHtml = buildVeroneEmailHtml({
      title: 'Nouveau message de contact',
      recipientName: 'Équipe Vérone',
      accentColor: 'black',
      bodyHtml: `
        <p style="font-size: 15px; color: #374151; margin: 0 0 16px 0;">
          Un nouveau message vient d'arriver via le formulaire de contact du site.
        </p>

        <div style="background-color: #fafafa; padding: 16px; margin: 0 0 20px 0; border-left: 3px solid #1a1a1a;">
          <table style="width: 100%;">
            <tr>
              <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Sujet</td>
              <td style="font-size: 14px; color: #1a1a1a; text-align: right; font-weight: 600; padding: 4px 0;">${escapeHtml(subjectLabel)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Nom</td>
              <td style="font-size: 14px; color: #1a1a1a; text-align: right; padding: 4px 0;">${escapeHtml(body.name)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #6b7280; padding: 4px 0;">Email</td>
              <td style="font-size: 14px; color: #1a1a1a; text-align: right; padding: 4px 0;">${escapeHtml(body.email)}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px 0;"><strong>Message :</strong></p>
        <div style="background-color: #f8f9fa; padding: 15px; font-size: 14px; color: #374151; white-space: pre-wrap;">${escapeHtml(body.message)}</div>
      `,
    });

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Vérone <noreply@verone.fr>',
      to: notificationEmail,
      subject: `[Contact] ${subjectLabel} — ${body.name}`,
      html: emailHtml,
      replyTo: body.email,
      attachments: getLogoAttachments(),
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API Contact Admin Notification] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
