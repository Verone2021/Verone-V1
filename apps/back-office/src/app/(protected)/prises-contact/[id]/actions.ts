/**
 * Server Actions: Conversions de formulaires
 * Convertit une soumission de formulaire vers une entite metier
 */

'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@verone/utils/supabase/server';

import type { Database } from '@verone/types';

import {
  addSystemMessage,
  applyConversion,
  fetchSubmissionData,
} from './actions-helpers';

type FormSubmissionUpdate =
  Database['public']['Tables']['form_submissions']['Update'];
type FormSubmissionMessageInsert =
  Database['public']['Tables']['form_submission_messages']['Insert'];
type FormSubmissionRow =
  Database['public']['Tables']['form_submissions']['Row'];

/**
 * Marquer une soumission comme resolue
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

    await addSystemMessage(submissionId, 'Soumission marquee comme resolue');

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
 * Marquer une soumission comme fermee
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

    const message = reason
      ? `Soumission fermee: ${reason}`
      : 'Soumission fermee';
    await addSystemMessage(submissionId, message);

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
 */
export async function convertToOrder(
  submissionId: string,
  _orderData: { customer_id?: string; notes?: string }
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    await fetchSubmissionData(submissionId);
    const placeholderOrderId = `ORDER-PLACEHOLDER-${Date.now()}`;
    const result = await applyConversion(
      submissionId,
      'order',
      placeholderOrderId,
      `Converti en commande ${placeholderOrderId}`
    );
    if (!result.success) return result;
    return { success: true, orderId: placeholderOrderId };
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
 */
export async function convertToConsultation(
  submissionId: string,
  consultationData: { scheduled_date?: string; notes?: string }
): Promise<{ success: boolean; consultationId?: string; error?: string }> {
  try {
    await fetchSubmissionData(submissionId);
    const placeholderConsultationId = `CONSULT-PLACEHOLDER-${Date.now()}`;
    const message = consultationData.scheduled_date
      ? `Converti en consultation ${placeholderConsultationId} - Programmee le ${consultationData.scheduled_date}`
      : `Converti en consultation ${placeholderConsultationId}`;
    const result = await applyConversion(
      submissionId,
      'consultation',
      placeholderConsultationId,
      message
    );
    if (!result.success) return result;
    return { success: true, consultationId: placeholderConsultationId };
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
    await fetchSubmissionData(submissionId);
    const placeholderProductId = `PRODUCT-SOURCING-${Date.now()}`;
    const result = await applyConversion(
      submissionId,
      'sourcing',
      placeholderProductId,
      `Converti en sourcing produit ${placeholderProductId} pour ${sourcingData.client_type} ${sourcingData.client_id}`
    );
    if (!result.success) return result;
    return { success: true, productId: placeholderProductId };
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
 */
export async function convertToContact(
  submissionId: string
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    const submission = await fetchSubmissionData(submissionId);
    const placeholderContactId = `CONTACT-${Date.now()}`;
    const submissionRow = submission as FormSubmissionRow | null;
    const firstName = submissionRow?.first_name ?? 'Unknown';
    const lastName = submissionRow?.last_name ?? '';
    const email = submissionRow?.email ?? '';
    const result = await applyConversion(
      submissionId,
      'contact',
      placeholderContactId,
      `Contact CRM cree: ${placeholderContactId} - ${firstName} ${lastName} (${email})`
    );
    if (!result.success) return result;
    return { success: true, contactId: placeholderContactId };
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
 */
export async function convertToLead(
  submissionId: string,
  leadData: { source?: string; score?: number; notes?: string }
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    await fetchSubmissionData(submissionId);
    const placeholderLeadId = `LEAD-${Date.now()}`;
    const message = leadData.score
      ? `Lead cree: ${placeholderLeadId} - Score: ${leadData.score}/100`
      : `Lead cree: ${placeholderLeadId}`;
    const result = await applyConversion(
      submissionId,
      'lead',
      placeholderLeadId,
      message
    );
    if (!result.success) return result;
    return { success: true, leadId: placeholderLeadId };
  } catch (error) {
    console.error('Error converting to lead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Ajouter une reponse/message a une soumission
 */
export async function addMessage(
  submissionId: string,
  content: string,
  messageType: 'internal' | 'customer' = 'internal'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

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
