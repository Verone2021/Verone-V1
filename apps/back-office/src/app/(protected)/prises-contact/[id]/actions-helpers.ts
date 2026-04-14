/**
 * Helpers partagés pour les Server Actions de prises-contact
 */

'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@verone/utils/supabase/server';

import type { Database } from '@verone/types';

type FormSubmissionUpdate =
  Database['public']['Tables']['form_submissions']['Update'];
type FormSubmissionMessageInsert =
  Database['public']['Tables']['form_submission_messages']['Insert'];

// ============================================================================
// Shared helpers
// ============================================================================

/**
 * Ajoute un message système à une soumission
 */
export async function addSystemMessage(
  submissionId: string,
  messageBody: string
): Promise<void> {
  const supabase = createClient();
  const messageData: FormSubmissionMessageInsert = {
    form_submission_id: submissionId,
    author_type: 'system',
    message_type: 'system',
    message_body: messageBody,
    created_at: new Date().toISOString(),
  };
  await supabase.from('form_submission_messages').insert(messageData);
}

/**
 * Applique une conversion à une soumission et la ferme
 */
export async function applyConversion(
  submissionId: string,
  convertedToType: FormSubmissionUpdate['converted_to_type'],
  convertedToId: string,
  systemMessage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const updateData: FormSubmissionUpdate = {
      converted_to_type: convertedToType,
      converted_to_id: convertedToId,
      converted_at: new Date().toISOString(),
      status: 'closed',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (updateError) throw updateError;

    await addSystemMessage(submissionId, systemMessage);

    revalidatePath(`/prises-contact/${submissionId}`);
    revalidatePath('/prises-contact');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Fetche les données de soumission (pour les conversions)
 */
export async function fetchSubmissionData(submissionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('form_submissions')
    .select(
      'id, first_name, last_name, email, phone, status, form_type, message, subject, metadata, created_at'
    )
    .eq('id', submissionId)
    .single();

  if (error) throw error;
  return data;
}
