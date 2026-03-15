/**
 * API Route: POST /api/emails/order-confirmation
 * Send confirmation email to affiliate after order creation
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[API Order Confirmation] RESEND_API_KEY not configured - emails disabled'
    );
    return null;
  }
  return new Resend(apiKey);
}

interface OrderConfirmationRequest {
  orderNumber: string;
  requesterName: string;
  requesterEmail: string;
  restaurantName: string;
  selectionName: string;
  itemsCount: number;
  totalHT: number;
  totalTTC: number;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderConfirmationRequest;

    const {
      orderNumber,
      requesterName,
      requesterEmail,
      restaurantName,
      selectionName,
      itemsCount,
      totalHT,
      totalTTC,
    } = body;

    // Validation
    if (!orderNumber || !requesterName || !requesterEmail || !restaurantName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resendClient = getResendClient();

    // If Resend is not configured, return early with success (emails disabled)
    if (!resendClient) {
      return NextResponse.json({
        success: true,
        emailDisabled: true,
        message: 'Email notifications are currently disabled',
      });
    }

    const subject = `Confirmation de votre commande ${orderNumber}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; margin: 20px auto; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5;">

    <!-- Header -->
    <div style="padding: 30px 40px; border-bottom: 1px solid #f0f0f0;">
      <img src="https://www.verone.fr/logo-verone.png" alt="Verone" style="height: 32px; display: block;" />
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <h1 style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 24px 0;">
        Confirmation de votre commande
      </h1>

      <p style="margin: 0 0 16px 0; color: #333;">
        Bonjour ${requesterName},
      </p>

      <p style="margin: 0 0 28px 0; color: #333;">
        Nous avons bien recu votre commande <strong>${orderNumber}</strong>.
      </p>

      <!-- Order summary table -->
      <table style="width: 100%; border-collapse: collapse; margin: 0 0 28px 0; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 12px 0; color: #666;">Restaurant</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 500; color: #1a1a1a;">${restaurantName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 12px 0; color: #666;">Selection</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 500; color: #1a1a1a;">${selectionName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 12px 0; color: #666;">Articles</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 500; color: #1a1a1a;">${itemsCount}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 12px 0; color: #666;">Total HT</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 500; color: #1a1a1a;">${formatPrice(totalHT)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #666; font-weight: 600;">Total TTC</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #1a1a1a; font-size: 16px;">${formatPrice(totalTTC)}</td>
        </tr>
      </table>

      <!-- Transport notice -->
      <div style="background-color: #f8f9fa; border-left: 3px solid #6b7280; padding: 16px 20px; margin: 0 0 24px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 14px; color: #4b5563;">
          Un devis detaille incluant les frais de transport vous sera adresse prochainement.
        </p>
      </div>

      <!-- Next steps -->
      <p style="margin: 0 0 8px 0; color: #333;">
        Notre equipe va etudier votre commande et vous recontactera sous 48h.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0;">
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #1a1a1a; font-weight: 600;">
        Verone
      </p>
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">
        Decoration et mobilier d&apos;interieur
      </p>
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">
        229 rue Saint-Honore, 75001 Paris
      </p>
      <p style="margin: 0 0 12px 0; font-size: 12px;">
        <a href="mailto:commandes@verone.fr" style="color: #6b7280; text-decoration: none;">commandes@verone.fr</a>
      </p>
      <p style="margin: 0; font-size: 11px; color: #9ca3af;">
        Cet email est un accuse de reception. Il ne constitue pas un devis ni une facture.
      </p>
    </div>

  </div>
</body>
</html>
    `;

    // Send email
    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'contact@verone.fr',
      to: requesterEmail,
      subject: subject,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'commandes@verone.fr',
    });

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error('[API Order Confirmation] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
