/**
 * API Route: POST /api/emails/send-invoice
 * Envoie une facture par email via Resend
 *
 * Télécharge le PDF depuis Qonto et l'attache à l'email
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import { Resend } from 'resend';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') || 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

/**
 * POST /api/emails/send-invoice
 *
 * Body:
 * - invoiceId: string (Qonto invoice ID)
 * - to: string | string[] (email addresses)
 * - subject?: string (optional, default generated)
 * - message?: string (optional custom message)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, to, subject, message } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'invoiceId is required' },
        { status: 400 }
      );
    }

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'to (email address) is required' },
        { status: 400 }
      );
    }

    // Récupérer la facture depuis Qonto
    const qontoClient = getQontoClient();
    const invoice = await qontoClient.getClientInvoiceById(invoiceId);

    if (!invoice.pdf_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'PDF not available. Invoice may not be finalized.',
        },
        { status: 400 }
      );
    }

    // Télécharger le PDF
    const pdfResponse = await fetch(invoice.pdf_url);
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to download PDF from Qonto' },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // Préparer le contenu de l'email
    const emailSubject =
      subject || `Facture ${invoice.invoice_number} - Verone`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">
      Votre facture ${invoice.invoice_number}
    </h1>

    ${
      message
        ? `<p style="margin-bottom: 20px;">${message}</p>`
        : `
    <p style="margin-bottom: 20px;">
      Bonjour,
    </p>
    <p style="margin-bottom: 20px;">
      Veuillez trouver ci-joint votre facture n°${invoice.invoice_number}.
    </p>
    `
    }

    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Numéro de facture</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">${invoice.invoice_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date d'émission</td>
          <td style="padding: 8px 0; text-align: right;">${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date d'échéance</td>
          <td style="padding: 8px 0; text-align: right;">${new Date(invoice.payment_deadline).toLocaleDateString('fr-FR')}</td>
        </tr>
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666; font-size: 18px;">Montant TTC</td>
          <td style="padding: 12px 0; text-align: right; font-size: 20px; font-weight: bold; color: #1a1a1a;">
            ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: invoice.currency }).format(invoice.total_amount)}
          </td>
        </tr>
      </table>
    </div>

    <p style="color: #666; font-size: 14px;">
      La facture est jointe à cet email au format PDF.
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center;">
      Verone - Décoration et mobilier d'intérieur haut de gamme
    </p>
  </div>
</body>
</html>
    `;

    // Envoyer l'email via Resend
    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'factures@verone.fr',
      to: Array.isArray(to) ? to : [to],
      subject: emailSubject,
      html: emailHtml,
      attachments: [
        {
          filename: `facture-${invoice.invoice_number}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (error) {
      console.error('[API Email Send Invoice] Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: `Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`,
    });
  } catch (error) {
    console.error('[API Email Send Invoice] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
