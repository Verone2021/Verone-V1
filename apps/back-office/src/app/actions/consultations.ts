'use server';

import { revalidatePath } from 'next/cache';

import { createAdminClient } from '@verone/utils/supabase/server';

interface CreateConsultationData {
  enseigne_id?: string;
  organisation_id?: string;
  client_email: string;
  client_phone?: string;
  descriptif: string;
  image_url?: string;
  tarif_maximum?: number;
  priority_level?: number;
  source_channel?: 'website' | 'email' | 'phone' | 'other';
  estimated_response_date?: string;
}

interface CreateConsultationResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Server Action pour créer une consultation
 * Utilisé pour contourner les problèmes RLS 403 lors de la création
 *
 * @param consultationData - Les données de la consultation à créer
 * @param userId - L'ID de l'utilisateur qui effectue l'action
 * @returns Résultat de l'opération avec success/error/data
 */
export async function createConsultation(
  consultationData: CreateConsultationData,
  userId: string
): Promise<CreateConsultationResult> {
  try {
    // Validation: au moins enseigne_id ou organisation_id requis
    if (!consultationData.enseigne_id && !consultationData.organisation_id) {
      return {
        success: false,
        error: 'Une enseigne ou une organisation est requise',
      };
    }

    // Créer le client Supabase ADMIN (bypasse RLS policies)
    const supabase = createAdminClient();

    const clientLabel = consultationData.enseigne_id
      ? `enseigne ${consultationData.enseigne_id}`
      : `organisation ${consultationData.organisation_id}`;

    console.log(
      `🔍 [Server Action ADMIN] Tentative création consultation pour ${clientLabel} par user ${userId}`
    );

    // Stocker l'utilisateur courant en session PostgreSQL pour les triggers
    await supabase.rpc('set_current_user_id', { user_id: userId });

    // Préparer les données avec valeurs par défaut
    const dataToInsert = {
      enseigne_id: consultationData.enseigne_id || null,
      organisation_id: consultationData.organisation_id || null,
      client_email: consultationData.client_email,
      client_phone: consultationData.client_phone,
      descriptif: consultationData.descriptif,
      image_url: consultationData.image_url,
      tarif_maximum: consultationData.tarif_maximum,
      priority_level: consultationData.priority_level || 2,
      source_channel: consultationData.source_channel || 'website',
      estimated_response_date: consultationData.estimated_response_date,
      status: 'en_attente' as const,
      created_by: userId,
    };

    console.log(`🔧 [Server Action] Données à insérer:`, dataToInsert);

    // Insérer la consultation
    const { data: newConsultation, error: insertError } = await supabase
      .from('client_consultations')
      .insert([dataToInsert])
      .select()
      .single();

    if (insertError) {
      console.error('❌ [Server Action] Erreur INSERT:', insertError);
      return {
        success: false,
        error: insertError.message,
      };
    }

    // Vérifier si l'INSERT a retourné des données
    if (!newConsultation) {
      console.error("❌ [Server Action] INSERT n'a retourné AUCUNE donnée");
      return {
        success: false,
        error: 'Insertion bloquée (RLS policy)',
      };
    }

    console.log(
      `✅ [Server Action] Consultation créée avec succès: ${newConsultation.id}`
    );

    // Revalider le cache Next.js pour la page des consultations
    revalidatePath('/consultations');

    return {
      success: true,
      data: newConsultation,
    };
  } catch (err) {
    console.error('❌ [Server Action] Exception createConsultation:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    };
  }
}
