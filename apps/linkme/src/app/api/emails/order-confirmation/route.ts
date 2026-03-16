/**
 * API Route: POST /api/emails/order-confirmation
 * Send confirmation email to affiliate after order creation
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

import type { Database } from '@verone/types';

import { getLogoAttachments } from '../_shared/email-logo';
import { buildEmailHtml } from '../_shared/email-template';

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
  salesOrderId?: string;
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

    const bodyHtml = `
        <p style="margin: 0 0 16px 0;">
          Nous avons bien re&ccedil;u votre commande <strong>${orderNumber}</strong>.
        </p>

        <!-- Order summary table -->
        <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid ${/* teal hr */ '#99d5d1'};">
            <td style="padding: 10px 0; color: #4b5563;">Restaurant</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 500; color: #1f2937;">${restaurantName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #99d5d1;">
            <td style="padding: 10px 0; color: #4b5563;">Articles</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 500; color: #1f2937;">${itemsCount}</td>
          </tr>
          <tr style="border-bottom: 1px solid #99d5d1;">
            <td style="padding: 10px 0; color: #4b5563;">Total HT</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 500; color: #1f2937;">${formatPrice(totalHT)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #4b5563; font-weight: 600;">Total TTC</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1f2937; font-size: 16px;">${formatPrice(totalTTC)}</td>
          </tr>
        </table>

        <div style="background-color: #ccfbf1; padding: 16px; border-radius: 6px; margin: 0 0 16px 0; border: 1px solid #99d5d1;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #0f766e;">
            Votre commande va &ecirc;tre analys&eacute;e par notre &eacute;quipe et approuv&eacute;e dans un d&eacute;lai de 48h.
          </p>
          <p style="margin: 0; font-size: 14px; color: #0f766e;">
            Un devis vous sera envoy&eacute; avec les informations de livraison.
          </p>
        </div>`;

    const emailHtml = buildEmailHtml({
      title: 'Confirmation de votre commande',
      recipientName: requesterName,
      accentColor: 'teal',
      bodyHtml,
    });

    // Send email
    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
      to: requesterEmail,
      subject,
      html: emailHtml,
      replyTo: process.env.RESEND_REPLY_TO ?? 'romeo@veronecollections.fr',
      attachments: getLogoAttachments(),
    });

    // Log event in sales_order_events (non-blocking)
    if (body.salesOrderId) {
      try {
        const supabase = createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabase.from('sales_order_events').insert({
          sales_order_id: body.salesOrderId,
          event_type: 'email_confirmation_sent',
          metadata: {
            recipient_email: requesterEmail,
            resend_id: result.data?.id,
          },
        });
      } catch (logError) {
        console.error(
          '[API Order Confirmation] Failed to log event:',
          logError
        );
      }
    }

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
