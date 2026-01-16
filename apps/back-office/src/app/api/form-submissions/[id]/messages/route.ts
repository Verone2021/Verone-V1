/**
 * API Route: POST /api/form-submissions/[id]/messages
 * Ajouter un message à un formulaire de contact
 *
 * Fonctionnalités:
 * - Ajouter note interne (visible uniquement admins)
 * - Envoyer réponse par email (via Resend)
 * - Mettre à jour first_reply_at si première réponse
 *
 * @module api/form-submissions/[id]/messages
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@verone/utils/supabase/server';

interface AddMessageRequest {
  message: string;
  isInternal: boolean;
  sendEmail: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: submissionId } = await params;
    const body: AddMessageRequest = await request.json();

    // Validation
    if (!body.message || !body.message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le message ne peut pas être vide' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Vérifier que le formulaire existe
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: submission, error: submissionError } = await (supabase as any)
      .from('form_submissions')
      .select('id, first_name, last_name, email, form_type, first_reply_at')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { success: false, error: 'Formulaire introuvable' },
        { status: 404 }
      );
    }

    let emailId: string | null = null;

    // Si sendEmail = true et pas une note interne, envoyer l'email
    if (body.sendEmail && !body.isInternal) {
      try {
        const emailResponse = await fetch(
          `${request.nextUrl.origin}/api/emails/form-reply`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              submissionId,
              replyMessage: body.message.trim(),
              recipientEmail: submission.email,
              recipientName: `${submission.first_name} ${submission.last_name}`,
              formType: submission.form_type,
            }),
          }
        );

        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          emailId = emailData.emailId || null;
        } else {
          console.warn(
            '[API Messages] Email sending failed, but message will be saved'
          );
        }
      } catch (emailError) {
        console.error('[API Messages] Error sending email:', emailError);
        // Continue même si l'email échoue
      }
    }

    // Insérer le message dans form_submission_messages
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data: newMessage, error: insertError } = await (supabase as any)
      .from('form_submission_messages')
      .insert({
        submission_id: submissionId,
        message: body.message.trim(),
        is_internal: body.isInternal,
        sent_via: body.sendEmail && !body.isInternal ? 'email' : 'internal',
        email_id: emailId,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[API Messages] Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'enregistrement du message" },
        { status: 500 }
      );
    }

    // Si c'est la première réponse (non interne), mettre à jour first_reply_at
    if (!body.isInternal && !submission.first_reply_at) {
      await (supabase as any)
        .from('form_submissions')
        .update({ first_reply_at: new Date().toISOString() })
        .eq('id', submissionId);
    }

    return NextResponse.json({
      success: true,
      messageId: newMessage.id,
      emailSent: !!emailId,
      message: body.isInternal
        ? 'Note interne ajoutée avec succès'
        : emailId
          ? 'Message envoyé par email avec succès'
          : 'Message enregistré (email non envoyé)',
    });
  } catch (error) {
    console.error('[API Messages] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
