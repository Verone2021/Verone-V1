/**
 * API Route: POST /api/emails/form-notification
 * Send notification email to admin team about new form submission
 * Note: In-app notifications are handled by the database trigger
 * This route is for email notifications (optional, can be called manually)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Resend } from 'resend';

import { createServerClient } from '@/lib/supabase-server';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

interface FormNotificationRequest {
  submissionId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FormNotificationRequest = await request.json();

    const { submissionId } = body;

    // Validation
    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Missing submission ID' },
        { status: 400 }
      );
    }

    // Fetch submission details from database
    const supabase = await createServerClient();
    const { data: submission, error: fetchError } = await supabase
      .from('form_submissions')
      .select(
        `
        id,
        form_type,
        first_name,
        last_name,
        email,
        phone,
        company_name,
        role,
        subject,
        message,
        source,
        priority,
        status,
        created_at
      `
      )
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Fetch form type label
    const { data: formType } = await supabase
      .from('form_types')
      .select('label, icon')
      .eq('code', submission.form_type)
      .single();

    // Fetch notification emails from app_settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'notification_emails')
      .single();

    const notificationEmails = settings?.setting_value?.form_submissions || [
      'veronebyromeo@gmail.com',
    ];

    // Format submission date
    const submissionDate = new Date(submission.created_at).toLocaleString(
      'fr-FR',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );

    // Priority badge color
    const priorityColors: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      urgent: { bg: '#fee2e2', text: '#991b1b', label: '🔴 URGENT' },
      high: { bg: '#fed7aa', text: '#9a3412', label: '🟠 Haute' },
      medium: { bg: '#fef3c7', text: '#92400e', label: '🟡 Moyenne' },
      low: { bg: '#dbeafe', text: '#1e40af', label: '🔵 Basse' },
    };

    const priorityStyle =
      priorityColors[submission.priority] || priorityColors.medium;

    // Build notification email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; font-size: 24px; margin: 0;">
      ${formType?.icon || '📝'} Nouvelle ${formType?.label || 'demande'}
    </h1>
  </div>

  <!-- Content -->
  <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

    <!-- Priority Badge -->
    <div style="margin-bottom: 25px;">
      <span style="display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background-color: ${priorityStyle.bg}; color: ${priorityStyle.text};">
        ${priorityStyle.label}
      </span>
    </div>

    <!-- Customer Info -->
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        👤 Informations client
      </h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 500; width: 140px;">Nom complet</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 600;">${submission.first_name} ${submission.last_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email</td>
          <td style="padding: 8px 0;">
            <a href="mailto:${submission.email}" style="color: #3b82f6; text-decoration: none;">${submission.email}</a>
          </td>
        </tr>
        ${
          submission.phone
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Téléphone</td>
          <td style="padding: 8px 0;">
            <a href="tel:${submission.phone}" style="color: #3b82f6; text-decoration: none;">${submission.phone}</a>
          </td>
        </tr>
        `
            : ''
        }
        ${
          submission.company_name
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Entreprise</td>
          <td style="padding: 8px 0; color: #111827;">${submission.company_name}</td>
        </tr>
        `
            : ''
        }
        ${
          submission.role
            ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Fonction</td>
          <td style="padding: 8px 0; color: #111827;">${submission.role}</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    <!-- Message -->
    <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <h2 style="color: #92400e; font-size: 16px; margin: 0 0 12px 0;">
        ${submission.subject ? `📨 ${submission.subject}` : '💬 Message'}
      </h2>
      <p style="color: #78350f; margin: 0; white-space: pre-wrap; line-height: 1.8;">
        ${submission.message}
      </p>
    </div>

    <!-- Metadata -->
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
      <table style="width: 100%; font-size: 13px; color: #6b7280;">
        <tr>
          <td style="padding: 5px 0;"><strong>Source:</strong> ${submission.source}</td>
          <td style="padding: 5px 0; text-align: right;"><strong>Statut:</strong> ${getStatusBadge(submission.status)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;" colspan="2"><strong>Date:</strong> ${submissionDate}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;" colspan="2">
            <strong>ID:</strong> <code style="background-color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${submission.id}</code>
          </td>
        </tr>
      </table>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_BACK_OFFICE_URL || 'http://localhost:3000'}/prises-contact?id=${submission.id}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
        📋 Voir dans le back-office →
      </a>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 30px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">
      Notification automatique - Système de gestion des formulaires Vérone
    </p>
  </div>

</body>
</html>
    `;

    // Send email to notification list
    const resendClient = getResendClient();

    const results = await Promise.allSettled(
      notificationEmails.map((email: string) =>
        resendClient.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'notifications@verone.fr',
          to: email,
          subject: `[${priorityStyle.label}] ${formType?.label || 'Nouvelle demande'} - ${submission.first_name} ${submission.last_name}`,
          html: emailHtml,
          replyTo: submission.email,
        })
      )
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('[API Form Notification] Some emails failed:', failures);
    }

    console.log(
      `[API Form Notification] Sent for submission ${submissionId} - ${results.length} emails`
    );

    return NextResponse.json({
      success: true,
      emailsSent: results.filter(r => r.status === 'fulfilled').length,
    });
  } catch (error) {
    console.error('[API Form Notification] error:', error);
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
 * Get HTML badge for status
 */
function getStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    new: '<span style="color: #059669; font-weight: 600;">🆕 Nouveau</span>',
    in_progress:
      '<span style="color: #2563eb; font-weight: 600;">⏳ En cours</span>',
    waiting:
      '<span style="color: #d97706; font-weight: 600;">⏸️ En attente</span>',
    resolved:
      '<span style="color: #16a34a; font-weight: 600;">✅ Résolu</span>',
    closed: '<span style="color: #6b7280; font-weight: 600;">🔒 Fermé</span>',
    spam: '<span style="color: #dc2626; font-weight: 600;">🚫 Spam</span>',
  };
  return badges[status] || status;
}
