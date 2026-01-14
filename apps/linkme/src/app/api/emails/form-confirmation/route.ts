/**
 * API Route: POST /api/emails/form-confirmation
 * Send confirmation email to customer who submitted a form
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Form Confirmation] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface FormConfirmationRequest {
  submissionId: string;
  formType: string;
  formTypeLabel: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FormConfirmationRequest = await request.json();

    const {
      submissionId,
      formType,
      formTypeLabel,
      firstName,
      lastName,
      email,
    } = body;

    // Validation
    if (!submissionId || !formType || !formTypeLabel || !firstName || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resendClient = getResendClient();

    // If Resend is not configured, return early with success (emails disabled)
    if (!resendClient) {
      console.log(
        `[API Form Confirmation] Skipping email to ${email} - Resend not configured`
      );
      return NextResponse.json({
        success: true,
        emailDisabled: true,
        message: 'Email notifications are currently disabled',
      });
    }

    // Build confirmation email based on form type
    const subject = `Confirmation de votre ${formTypeLabel.toLowerCase()}`;
    const customerName = `${firstName} ${lastName}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f0fdf4; padding: 30px; border-radius: 8px; border-left: 4px solid #10b981;">
    <h1 style="color: #065f46; font-size: 24px; margin: 0 0 20px 0;">
      ✓ Message bien reçu
    </h1>

    <p style="margin-bottom: 20px;">
      Bonjour ${customerName},
    </p>

    <p style="margin-bottom: 20px;">
      Nous avons bien reçu votre <strong>${formTypeLabel.toLowerCase()}</strong> et vous en remercions.
    </p>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #d1fae5;">
      <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">Que se passe-t-il maintenant ?</h3>
      <p style="margin: 5px 0; color: #374151;">
        ${getNextStepsMessage(formType)}
      </p>
    </div>

    <p style="margin-bottom: 20px; color: #666;">
      Référence : <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${submissionId.substring(0, 8).toUpperCase()}</code>
    </p>

    <hr style="border: none; border-top: 1px solid #a7f3d0; margin: 30px 0;">

    <p style="color: #065f46; font-size: 14px; margin-bottom: 10px;">
      <strong>Vérone</strong><br>
      Décoration et mobilier d'intérieur haut de gamme
    </p>

    <p style="color: #6b7280; font-size: 12px;">
      Pour toute question : <a href="mailto:veronebyromeo@gmail.com" style="color: #059669; text-decoration: none;">veronebyromeo@gmail.com</a>
    </p>
  </div>
</body>
</html>
    `;

    // Send email
    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'contact@verone.fr',
      to: email,
      subject: subject,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO || 'veronebyromeo@gmail.com',
    });

    console.log(
      `[API Form Confirmation] Email sent to ${email} for submission ${submissionId}`
    );

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API Form Confirmation] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get next steps message based on form type
 */
function getNextStepsMessage(formType: string): string {
  switch (formType) {
    case 'selection_inquiry':
      return 'Notre équipe LinkMe va traiter votre demande et vous contacter sous 24h pour discuter de votre sélection.';

    case 'product_inquiry':
      return 'Un expert produit va examiner votre demande et vous répondre sous 48h avec toutes les informations nécessaires.';

    case 'consultation_request':
      return 'Notre équipe va étudier votre projet et vous proposer un créneau de consultation dans les 24h.';

    case 'account_request':
      return 'Votre demande de compte est en cours de traitement. Nous vous contacterons sous 48h pour finaliser votre inscription.';

    case 'sav_request':
      return 'Votre demande SAV a été enregistrée avec priorité. Notre service client vous contactera sous 4h.';

    case 'technical_support':
      return 'Notre support technique va analyser votre demande et vous apporter une réponse sous 24h.';

    case 'general_inquiry':
    default:
      return 'Notre équipe va examiner votre message et vous répondre dans les meilleurs délais (généralement sous 72h).';
  }
}
