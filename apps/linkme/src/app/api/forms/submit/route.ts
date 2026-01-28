/**
 * API Route: POST /api/forms/submit
 * Submit a form (contact, selection inquiry, etc.)
 * Inserts into form_submissions table and sends confirmation email
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase-server';

interface FormSubmissionRequest {
  formType: string; // 'selection_inquiry', 'product_inquiry', etc.
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  subject?: string;
  message: string;
  source: string; // 'linkme', 'website', etc.
  metadata?: Record<string, unknown>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FormSubmissionRequest;

    // Validation
    if (
      !body.formType ||
      !body.firstName ||
      !body.lastName ||
      !body.email ||
      !body.message ||
      !body.source
    ) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Verify form type exists
    const supabase = await createServerClient();
    const { data: formType, error: formTypeError } = (await supabase
      .from('form_types')
      .select('code, label, enabled')
      .eq('code', body.formType)
      .single()) as {
      data: { code: string; label: string; enabled: boolean } | null;
      error: Error | null;
    };

    if (formTypeError || !formType) {
      return NextResponse.json(
        { success: false, error: 'Type de formulaire invalide' },
        { status: 400 }
      );
    }

    if (!formType.enabled) {
      return NextResponse.json(
        { success: false, error: 'Ce formulaire est actuellement désactivé' },
        { status: 403 }
      );
    }

    // Insert form submission
    const { data: submission, error: insertError } = (await supabase
      .from('form_submissions')
      .insert({
        form_type: body.formType,
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone ?? null,
        company_name: body.company ?? null,
        role: body.role ?? null,
        subject: body.subject ?? null,
        message: body.message,
        source: body.source,
        metadata: body.metadata ?? null,
        priority: body.priority ?? 'medium',
        status: 'new',
      })
      .select('id, form_type, created_at')
      .single()) as {
      data: { id: string; form_type: string; created_at: string } | null;
      error: Error | null;
    };

    if (insertError || !submission) {
      console.error('[API Forms Submit] Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'enregistrement" },
        { status: 500 }
      );
    }

    // Send confirmation email to customer
    try {
      const confirmationResponse = await fetch(
        `${request.nextUrl.origin}/api/emails/form-confirmation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: submission.id,
            formType: body.formType,
            formTypeLabel: formType.label,
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
          }),
        }
      );

      if (!confirmationResponse.ok) {
        console.warn(
          '[API Forms Submit] Confirmation email failed, but submission saved'
        );
      }
    } catch (emailError) {
      console.error('[API Forms Submit] Email error:', emailError);
      // Don't fail the request if email fails
    }

    // Submission created successfully
    // (logging removed per ESLint no-console rule)

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Votre message a été envoyé avec succès',
    });
  } catch (error) {
    console.error('[API Forms Submit] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
