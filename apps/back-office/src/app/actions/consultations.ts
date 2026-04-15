'use server';

import { revalidatePath } from 'next/cache';

import type { Database } from '@verone/types';
import { createAdminClient } from '@verone/utils/supabase/server';

type ClientConsultationRow =
  Database['public']['Tables']['client_consultations']['Row'];

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
  notes_internes?: string;
  /** Images uploadées (max 5) — insertion dans consultation_images */
  images?: Array<{
    publicUrl: string;
    storagePath: string;
    fileName: string;
    fileSize: number;
  }>;
}

interface CreateConsultationResult {
  success: boolean;
  data?: ClientConsultationRow;
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
function buildConsultationInsertData(
  data: CreateConsultationData,
  userId: string
) {
  return {
    enseigne_id: data.enseigne_id ?? null,
    organisation_id: data.organisation_id ?? null,
    client_email: data.client_email,
    client_phone: data.client_phone,
    descriptif: data.descriptif,
    image_url: data.image_url,
    tarif_maximum: data.tarif_maximum,
    priority_level: data.priority_level ?? 2,
    source_channel: data.source_channel ?? 'website',
    estimated_response_date: data.estimated_response_date,
    notes_internes: data.notes_internes ?? null,
    status: 'en_attente' as const,
    created_by: userId,
  };
}

async function insertConsultationImages(
  supabase: ReturnType<typeof createAdminClient>,
  consultationId: string,
  images: NonNullable<CreateConsultationData['images']>,
  userId: string
) {
  const imageRows = images.map((img, index) => ({
    consultation_id: consultationId,
    storage_path: img.storagePath,
    public_url: img.publicUrl,
    display_order: index,
    is_primary: index === 0,
    file_size: img.fileSize,
    format: img.fileName.split('.').pop()?.toLowerCase() ?? null,
    created_by: userId,
  }));
  const { error } = await supabase
    .from('consultation_images')
    .insert(imageRows);
  if (error) {
    console.error('⚠️ [Server Action] Erreur INSERT images:', error);
  } else {
    console.warn(`✅ [Server Action] ${imageRows.length} image(s) associée(s)`);
  }
}

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

    console.warn(
      `🔍 [Server Action ADMIN] Tentative création consultation pour ${clientLabel} par user ${userId}`
    );

    // Stocker l'utilisateur courant en session PostgreSQL pour les triggers
    await supabase.rpc('set_current_user_id', { user_id: userId });

    const dataToInsert = buildConsultationInsertData(consultationData, userId);
    console.warn(`🔧 [Server Action] Données à insérer:`, dataToInsert);

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

    console.warn(
      `✅ [Server Action] Consultation créée avec succès: ${newConsultation.id}`
    );

    if (consultationData.images && consultationData.images.length > 0) {
      await insertConsultationImages(
        supabase,
        newConsultation.id,
        consultationData.images,
        userId
      );
    }

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
