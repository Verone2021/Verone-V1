/**
 * Server Actions: Conversions de formulaires
 * Convertit une soumission de formulaire vers une entité métier
 */

'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@verone/utils/supabase/server';

import type { Database } from '@verone/types';

/**
 * Type helpers for form_submissions table
 */
type FormSubmissionUpdate =
  Database['public']['Tables']['form_submissions']['Update'];

/**
 * Type helpers for form_submission_messages table
 */
type FormSubmissionMessageInsert =
  Database['public']['Tables']['form_submission_messages']['Insert'];

/**
 * Type for form_submissions row
 */
type FormSubmissionRow =
  Database['public']['Tables']['form_submissions']['Row'];

/**
 * Marquer une soumission comme résolue
 */
export async function markAsResolved(submissionId: string) {
  try {
    const supabase = createClient();

    const updateData: FormSubmissionUpdate = {
      status: 'resolved',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (error) throw error;

    // Add system message
    const messageData: FormSubmissionMessageInsert = {
      form_submission_id: submissionId,
      author_type: 'system',
      message_type: 'system',
      message_body: 'Soumission marquée comme résolue',
      created_at: new Date().toISOString(),
    };

    await supabase.from('form_submission_messages').insert(messageData);

    revalidatePath(`/prises-contact/${submissionId}`);
    revalidatePath('/prises-contact');

    return { success: true };
  } catch (error) {
    console.error('Error marking as resolved:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Marquer une soumission comme fermée
 */
export async function markAsClosed(
  submissionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const updateData: FormSubmissionUpdate = {
      status: 'closed',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (error) throw error;

    // Add system message
    const message = reason
      ? `Soumission fermée: ${reason}`
      : 'Soumission fermée';

    const messageData: FormSubmissionMessageInsert = {
      form_submission_id: submissionId,
      author_type: 'system',
      message_type: 'system',
      message_body: message,
      created_at: new Date().toISOString(),
    };

    await supabase.from('form_submission_messages').insert(messageData);

    revalidatePath(`/prises-contact/${submissionId}`);
    revalidatePath('/prises-contact');

    return { success: true };
  } catch (error) {
    console.error('Error marking as closed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Convertir vers une commande (sales_order)
 * Note: Placeholder - nécessite intégration complète avec le système de commandes
 */
export async function convertToOrder(
  submissionId: string,
  _orderData: {
    customer_id?: string;
    notes?: string;
  }
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Fetch submission data
    const { data: _submission, error: fetchError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError) throw fetchError;

    // TODO: Create actual sales_order
    // For now, just mark as converted and add a placeholder
    const placeholderOrderId = `ORDER-PLACEHOLDER-${Date.now()}`;

    // Update submission with conversion data
    const updateData: FormSubmissionUpdate = {
      converted_to_type: 'order',
      converted_to_id: placeholderOrderId,
      converted_at: new Date().toISOString(),
      status: 'closed',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // Add system message
    const messageData: FormSubmissionMessageInsert = {
      form_submission_id: submissionId,
      author_type: 'system',
      message_type: 'system',
      message_body: `Converti en commande ${placeholderOrderId}`,
      created_at: new Date().toISOString(),
    };

    await supabase.from('form_submission_messages').insert(messageData);

    revalidatePath(`/prises-contact/${submissionId}`);
    revalidatePath('/prises-contact');

    return {
      success: true,
      orderId: placeholderOrderId,
    };
  } catch (error) {
    console.error('Error converting to order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Convertir vers une consultation
 * Note: Placeholder - nécessite intégration avec le système de consultations
 */
export async function convertToConsultation(
  submissionId: string,
  consultationData: {
    scheduled_date?: string;
    notes?: string;
  }
): Promise<{ success: boolean; consultationId?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Fetch submission data
    const { data: _submission, error: fetchError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError) throw fetchError;

    // TODO: Create actual consultation record
    const placeholderConsultationId = `CONSULT-PLACEHOLDER-${Date.now()}`;

    // Update submission with conversion data
    const updateData: FormSubmissionUpdate = {
      converted_to_type: 'consultation',
      converted_to_id: placeholderConsultationId,
      converted_at: new Date().toISOString(),
      status: 'closed',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // Add system message
    const message = consultationData.scheduled_date
      ? `Converti en consultation ${placeholderConsultationId} - Programmée le ${consultationData.scheduled_date}`
      : `Converti en consultation ${placeholderConsultationId}`;

    const messageData: FormSubmissionMessageInsert = {
      form_submission_id: submissionId,
      author_type: 'system',
      message_type: 'system',
      message_body: message,
      created_at: new Date().toISOString(),
    };

    await supabase.from('form_submission_messages').insert(messageData);

    revalidatePath(`/prises-contact/${submissionId}`);
    revalidatePath('/prises-contact');

    return {
      success: true,
      consultationId: placeholderConsultationId,
    };
  } catch (error) {
    console.error('Error converting to consultation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Convertir vers un sourcing produit
 * Note: Placeholder - nécessite intégration avec le système de sourcing
 */
export async function convertToSourcing(
  submissionId: string,
  sourcingData: {
    client_type: 'organisation' | 'enseigne';
    client_id: string;
    notes?: string;
  }
): Promise<{ success: boolean; productId?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Fetch submission data
    const { data: _submission, error: fetchError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError) throw fetchError;

    // TODO: Create actual product with assigned client
    const placeholderProductId = `PRODUCT-SOURCING-${Date.now()}`;

    // Update submission with conversion data
    const updateData: FormSubmissionUpdate = {
      converted_to_type: 'sourcing',
      converted_to_id: placeholderProductId,
      converted_at: new Date().toISOString(),
      status: 'closed',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // Add system message
    const messageData: FormSubmissionMessageInsert = {
      form_submission_id: submissionId,
      author_type: 'system',
      message_type: 'system',
      message_body: `Converti en sourcing produit ${placeholderProductId} pour ${sourcingData.client_type} ${sourcingData.client_id}`,
      created_at: new Date().toISOString(),
    };

    await supabase.from('form_submission_messages').insert(messageData);

    revalidatePath(`/prises-contact/${submissionId}`);
    revalidatePath('/prises-contact');

    return {
      success: true,
      productId: placeholderProductId,
    };
  } catch (error) {
    console.error('Error converting to sourcing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Convertir vers un contact CRM
 * Note: Placeholder - nécessite intégration avec le système CRM
 */
export async function convertToContact(
  submissionId: string
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Fetch submission data
    const { data: submission, error: fetchError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError) throw fetchError;

    // TODO: Create actual contact in CRM
    const placeholderContactId = `CONTACT-${Date.now()}`;

    // Update submission with conversion data
    const updateData: FormSubmissionUpdate = {
      converted_to_type: 'contact',
      converted_to_id: placeholderContactId,
      converted_at: new Date().toISOString(),
      status: 'closed',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // Type guard for submission data
    const submissionRow = submission as FormSubmissionRow | null;
    const firstName = submissionRow?.first_name ?? 'Unknown';
    const lastName = submissionRow?.last_name ?? '';
    const email = submissionRow?.email ?? '';

    // Add system message
    const messageData: FormSubmissionMessageInsert = {
      form_submission_id: submissionId,
      author_type: 'system',
      message_type: 'system',
      message_body: `Contact CRM créé: ${placeholderContactId} - ${firstName} ${lastName} (${email})`,
      created_at: new Date().toISOString(),
    };

    await supabase.from('form_submission_messages').insert(messageData);

    revalidatePath(`/prises-contact/${submissionId}`);
    revalidatePath('/prises-contact');

    return {
      success: true,
      contactId: placeholderContactId,
    };
  } catch (error) {
    console.error('Error converting to contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Convertir vers un lead
 * Note: Placeholder - nécessite intégration avec le système de leads
 */
export async function convertToLead(
  submissionId: string,
  leadData: {
    source?: string;
    score?: number;
    notes?: string;
  }
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Fetch submission data
    const { data: _submission, error: fetchError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError) throw fetchError;

    // TODO: Create actual lead record
    const placeholderLeadId = `LEAD-${Date.now()}`;

    // Update submission with conversion data
    const updateData: FormSubmissionUpdate = {
      converted_to_type: 'lead',
      converted_to_id: placeholderLeadId,
      converted_at: new Date().toISOString(),
      status: 'closed',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // Add system message
    const message = leadData.score
      ? `Lead créé: ${placeholderLeadId} - Score: ${leadData.score}/100`
      : `Lead créé: ${placeholderLeadId}`;

    const messageData: FormSubmissionMessageInsert = {
      form_submission_id: submissionId,
      author_type: 'system',
      message_type: 'system',
      message_body: message,
      created_at: new Date().toISOString(),
    };

    await supabase.from('form_submission_messages').insert(messageData);

    revalidatePath(`/prises-contact/${submissionId}`);
    revalidatePath('/prises-contact');

    return {
      success: true,
      leadId: placeholderLeadId,
    };
  } catch (error) {
    console.error('Error converting to lead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Ajouter une réponse/message à une soumission
 */
export async function addMessage(
  submissionId: string,
  content: string,
  messageType: 'internal' | 'customer' = 'internal'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Add message
    const messageData: FormSubmissionMessageInsert = {
      form_submission_id: submissionId,
      author_type: messageType === 'customer' ? 'customer' : 'staff',
      message_type: messageType,
      message_body: content,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('form_submission_messages')
      .insert(messageData);

    if (error) throw error;

    // Update submission updated_at
    const updateData: FormSubmissionUpdate = {
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('form_submissions')
      .update(updateData)
      .eq('id', submissionId);

    revalidatePath(`/prises-contact/${submissionId}`);

    return { success: true };
  } catch (error) {
    console.error('Error adding message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
