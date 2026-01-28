/**
 * API Route: POST /api/contact/send
 * Envoyer un email de contact depuis le formulaire public LinkMe
 *
 * Utilise Resend pour l'envoi d'emails
 *
 * @module api/contact/send
 * @since 2026-01-23
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';
import { z } from 'zod';

// Schema de validation
const contactSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  company: z.string().optional(),
  subject: z.string().min(1, 'Sujet requis'),
  message: z.string().min(10, 'Message trop court'),
});

// Initialiser Resend (uniquement si API key configurée)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Email de destination pour les contacts LinkMe
const CONTACT_EMAIL = process.env.LINKME_CONTACT_EMAIL ?? 'contact@verone.io';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@verone.io';

/**
 * Générer le contenu HTML de l'email
 */
function generateEmailHtml(data: z.infer<typeof contactSchema>): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau contact LinkMe</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #5DBEBB 0%, #7E84C0 100%); padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Nouveau contact LinkMe</h1>
  </div>

  <div style="background-color: #f8f9fa; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 30%;">Nom</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="mailto:${data.email}" style="color: #5DBEBB;">${data.email}</a>
        </td>
      </tr>
      ${
        data.company
          ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Entreprise</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${data.company}</td>
      </tr>`
          : ''
      }
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Sujet</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${data.subject}</td>
      </tr>
    </table>
  </div>

  <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h3 style="color: #183559; margin-top: 0;">Message</h3>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; white-space: pre-wrap;">
${data.message}
    </div>
  </div>

  <div style="margin-top: 20px; padding: 15px; text-align: center; font-size: 12px; color: #999;">
    <p>Email envoyé depuis le formulaire de contact LinkMe</p>
    <p>Date: ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>
  </div>
</body>
</html>
`;
}

export async function POST(request: NextRequest) {
  try {
    // Parser et valider le body
    const body = (await request.json()) as unknown;
    const validationResult = contactSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Vérifier si Resend est configuré
    if (!resend) {
      console.warn('Resend non configuré - email non envoyé');
      // En dev, on simule un succès
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ success: true, simulated: true });
      }
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    // Envoyer l'email
    const { error } = await resend.emails.send({
      from: `LinkMe Contact <${FROM_EMAIL}>`,
      to: [CONTACT_EMAIL],
      replyTo: data.email,
      subject: `[LinkMe Contact] ${data.subject} - ${data.name}`,
      html: generateEmailHtml(data),
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
