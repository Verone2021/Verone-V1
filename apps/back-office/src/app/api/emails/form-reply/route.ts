/**
 * API Route: POST /api/emails/form-reply
 * Envoyer une réponse par email à un client qui a soumis un formulaire
 *
 * Utilise Resend pour l'envoi d'emails
 *
 * @module api/emails/form-reply
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

interface FormReplyRequest {
  submissionId: string;
  replyMessage: string;
  recipientEmail: string;
  recipientName: string;
  formType: string;
}

// Initialiser Resend (uniquement si API key configurée)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@verone.com';

/**
 * Générer le contenu HTML de l'email
 */
function generateEmailHtml(
  recipientName: string,
  formType: string,
  replyMessage: string,
  submissionId: string
): string {
  // Map des labels de types de formulaires
  const formTypeLabels: Record<string, string> = {
    selection_inquiry: 'Contact Sélection',
    account_request: 'Demande de Compte',
    sav_request: 'SAV/Réclamation',
    product_inquiry: 'Question Produit',
    consultation_request: 'Demande de Consultation',
    technical_support: 'Support Technique',
    general_inquiry: 'Demande Générale',
  };

  const formTypeLabel = formTypeLabels[formType] || formType;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réponse à votre demande</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Bonjour ${recipientName},</h2>
    <p style="font-size: 14px; color: #666;">
      Nous avons bien reçu votre demande concernant <strong>${formTypeLabel}</strong>.
    </p>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
    <div style="white-space: pre-wrap; font-size: 15px; line-height: 1.8;">
${replyMessage}
    </div>
  </div>

  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 30px;">
    <p style="font-size: 14px; color: #666; margin: 0;">
      Cordialement,<br>
      <strong>L'équipe Vérone</strong>
    </p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #999; text-align: center;">
    <p>Référence de votre demande : <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${submissionId.substring(0, 8)}</code></p>
    <p>Cet email a été envoyé depuis le Back-Office Vérone.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Générer le contenu texte de l'email (fallback)
 */
function generateEmailText(
  recipientName: string,
  formType: string,
  replyMessage: string,
  submissionId: string
): string {
  const formTypeLabels: Record<string, string> = {
    selection_inquiry: 'Contact Sélection',
    account_request: 'Demande de Compte',
    sav_request: 'SAV/Réclamation',
    product_inquiry: 'Question Produit',
    consultation_request: 'Demande de Consultation',
    technical_support: 'Support Technique',
    general_inquiry: 'Demande Générale',
  };

  const formTypeLabel = formTypeLabels[formType] || formType;

  return `
Bonjour ${recipientName},

Nous avons bien reçu votre demande concernant ${formTypeLabel}.

${replyMessage}

Cordialement,
L'équipe Vérone

---
Référence: ${submissionId.substring(0, 8)}
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: FormReplyRequest = await request.json();

    // Validation
    if (
      !body.submissionId ||
      !body.replyMessage ||
      !body.recipientEmail ||
      !body.recipientName
    ) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.recipientEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Vérifier que Resend est configuré
    if (!resend) {
      console.warn(
        '[API Form Reply] Resend not configured (RESEND_API_KEY missing)'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Service email non configuré',
        },
        { status: 503 }
      );
    }

    // Générer le contenu de l'email
    const htmlContent = generateEmailHtml(
      body.recipientName,
      body.formType,
      body.replyMessage,
      body.submissionId
    );

    const textContent = generateEmailText(
      body.recipientName,
      body.formType,
      body.replyMessage,
      body.submissionId
    );

    // Envoyer l'email via Resend
    const { data, error: resendError } = await resend.emails.send({
      from: `Vérone Back-Office <${FROM_EMAIL}>`,
      to: [body.recipientEmail],
      subject: `Réponse à votre demande - Vérone`,
      html: htmlContent,
      text: textContent,
      tags: [
        {
          name: 'category',
          value: 'form-reply',
        },
        {
          name: 'form_type',
          value: body.formType,
        },
      ],
    });

    if (resendError) {
      console.error('[API Form Reply] Resend error:', resendError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de l'envoi de l'email",
        },
        { status: 500 }
      );
    }

    console.warn(
      `[API Form Reply] Email sent successfully to ${body.recipientEmail} (ID: ${data?.id})`
    );

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: 'Email envoyé avec succès',
    });
  } catch (error) {
    console.error('[API Form Reply] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
