/**
 * API Route: POST /api/emails/linkme-info-request
 * Creates a linkme_info_requests record and sends email with secure form link
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

import type { Database, Json } from '@verone/types';

import { getLogoAttachments } from '../_shared/email-logo';
import { buildEmailHtml } from '../_shared/email-template';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface RequestedFieldInfo {
  key: string;
  label: string;
  category: string;
  inputType: string;
}

interface InfoRequestEmailBody {
  salesOrderId: string;
  orderNumber: string;
  recipientEmail: string;
  recipientName: string;
  recipientType: 'requester' | 'owner' | 'manual';
  organisationName: string | null;
  totalTtc: number;
  requestedFields: RequestedFieldInfo[];
  customMessage?: string;
  sentBy: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  responsable: 'Responsable',
  billing: 'Facturation',
  delivery: 'Livraison',
  organisation: 'Entreprise',
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InfoRequestEmailBody;

    const {
      salesOrderId,
      orderNumber,
      recipientEmail,
      recipientName,
      recipientType,
      organisationName,
      totalTtc,
      requestedFields,
      customMessage,
      sentBy,
    } = body;

    if (
      !salesOrderId ||
      !orderNumber ||
      !recipientEmail ||
      !requestedFields?.length ||
      !sentBy
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Defensive: ensure sales_order_linkme_details exists before creating info request.
    // Orders created from back-office should already have a record (via use-linkme-orders),
    // but we guard against edge cases (e.g., migration lag or direct DB inserts).
    const { data: existingDetails } = await supabase
      .from('sales_order_linkme_details')
      .select('id')
      .eq('sales_order_id', salesOrderId)
      .maybeSingle();

    if (!existingDetails) {
      const { error: detailsInsertError } = await supabase
        .from('sales_order_linkme_details')
        .insert({
          sales_order_id: salesOrderId,
          requester_type: 'manual_entry',
          requester_name: '',
          requester_email: '',
          is_new_restaurant: false,
          delivery_terms_accepted: false,
        });
      if (detailsInsertError) {
        console.error(
          '[API Info Request Email] Could not create sales_order_linkme_details:',
          detailsInsertError
        );
        // Non-fatal: continue to create the info request
      }
    }

    // Split emails for manual mode (comma-separated)
    const emailList =
      recipientType === 'manual'
        ? recipientEmail
            .split(',')
            .map(e => e.trim())
            .filter(e => e.length > 0)
        : [recipientEmail];

    // Build shared email HTML parts
    const linkmeUrl =
      process.env.LINKME_PUBLIC_URL ?? 'https://linkme-blue.vercel.app';

    const fieldsByCategory: Record<string, RequestedFieldInfo[]> = {};
    for (const field of requestedFields) {
      const cat = field.category;
      if (!fieldsByCategory[cat]) fieldsByCategory[cat] = [];
      fieldsByCategory[cat].push(field);
    }

    const fieldsHtml = Object.entries(fieldsByCategory)
      .map(([category, fields]) => {
        const catLabel = CATEGORY_LABELS[category] ?? category;
        const fieldsList = fields
          .map(
            f => `<li style="margin: 4px 0; font-size: 14px;">${f.label}</li>`
          )
          .join('');
        return `
          <div style="margin-bottom: 12px;">
            <p style="margin: 0 0 4px 0; color: #0f766e; font-weight: bold; font-size: 13px;">${catLabel}</p>
            <ul style="margin: 0; padding-left: 20px; color: #1f2937;">${fieldsList}</ul>
          </div>`;
      })
      .join('');

    // Custom message removed — redundant with the structured fields list above

    const formattedTotal = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(totalTtc);

    const resendClient = getResendClient();
    const results: Array<{
      email: string;
      token: string;
      infoRequestId: string;
    }> = [];

    // Create one info request + send one email per recipient
    for (const email of emailList) {
      const { data: infoRequest, error: insertError } = await supabase
        .from('linkme_info_requests')
        .insert({
          sales_order_id: salesOrderId,
          requested_fields: requestedFields as unknown as Json,
          custom_message: customMessage ?? null,
          recipient_email: email,
          recipient_name: recipientName,
          recipient_type: recipientType,
          sent_by: sentBy,
        })
        .select('id, token')
        .single();

      if (insertError || !infoRequest) {
        console.error(
          `[API Info Request Email] Insert error for ${email}:`,
          insertError
        );
        continue;
      }

      const formUrl = `${linkmeUrl}/complete-info/${infoRequest.token}`;

      const bodyHtml = `
        <p style="margin: 0 0 16px 0;">
          Concernant votre commande <strong>${orderNumber}</strong>${organisationName ? ` pour <strong>${organisationName}</strong>` : ''}
          d&rsquo;un montant de <strong>${formattedTotal}</strong>,
          nous avons besoin d&rsquo;informations compl&eacute;mentaires pour pouvoir la traiter.
        </p>

        <div style="background-color: #f0fdfa; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #99d5d1;">
          <p style="margin: 0 0 8px 0; color: #0f766e; font-weight: bold; font-size: 14px;">Informations requises :</p>
          ${fieldsHtml}
        </div>`;

      const emailHtml = buildEmailHtml({
        title: 'Informations compl\u00e9mentaires requises',
        recipientName: recipientName || 'Madame, Monsieur',
        accentColor: 'teal',
        bodyHtml,
        ctaUrl: formUrl,
        ctaLabel: 'Compl\u00e9ter les informations',
        footerNote: 'Ce lien est valable 30 jours.',
      });

      const { error: emailError } = await resendClient.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'commandes@verone.fr',
        to: email,
        subject: `Commande ${orderNumber} - Informations compl\u00e9mentaires requises`,
        html: emailHtml,
        replyTo: process.env.RESEND_REPLY_TO ?? 'romeo@veronecollections.fr',
        attachments: getLogoAttachments(),
      });

      if (emailError) {
        console.error(
          `[API Info Request Email] Resend error for ${email}:`,
          emailError
        );
        continue;
      }

      console.warn(
        `[API Info Request Email] Sent for order ${orderNumber} to ${email} (token: ${infoRequest.token})`
      );

      // Log event in sales_order_events (non-blocking)
      try {
        await supabase.from('sales_order_events').insert({
          sales_order_id: salesOrderId,
          event_type: 'email_info_request_sent',
          metadata: { recipient_email: email, info_request_id: infoRequest.id },
          created_by: sentBy,
        });
      } catch (logError) {
        console.error(
          '[API Info Request Email] Failed to log event:',
          logError
        );
      }

      results.push({
        email,
        token: infoRequest.token,
        infoRequestId: infoRequest.id,
      });
    }

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to send any info request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      total: emailList.length,
      token: results[0].token,
      infoRequestId: results[0].infoRequestId,
    });
  } catch (error) {
    console.error('[API Info Request Email] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
