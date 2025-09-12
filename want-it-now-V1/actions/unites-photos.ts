'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// =============================================
// SCHEMAS DE VALIDATION
// =============================================
const unitePhotoSchema = z.object({
  unite_id: z.string().uuid(),
  storage_path: z.string().min(1),
  titre: z.string().optional(),
  description: z.string().optional(),
  categorie: z.string().optional(),
  ordre: z.number().min(0).default(0),
  est_couverture: z.boolean().default(false)
})

// =============================================
// TYPES
// =============================================
export type UnitePhoto = {
  id: string
  unite_id: string
  storage_path: string
  url?: string
  titre?: string
  description?: string
  categorie?: string
  ordre: number
  est_couverture: boolean
  taille_bytes?: number
  mime_type?: string
  largeur?: number
  hauteur?: number
  created_at: string
  created_by?: string
}

// =============================================
// ACTIONS SERVEUR
// =============================================

/**
 * Récupérer toutes les photos d'une unité
 */
export async function getPhotosByUnite(uniteId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('unite_photos')
      .select('*')
      .eq('unite_id', uniteId)
      .order('ordre', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return {
      success: true,
      data: data as UnitePhoto[]
    }
  } catch (error) {
    console.error('Error fetching unite photos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des photos'
    }
  }
}

/**
 * Ajouter une photo à une unité
 */
export async function addUnitePhoto(data: z.infer<typeof unitePhotoSchema>) {
  const supabase = await createClient()
  
  try {
    // Valider les données
    const validatedData = unitePhotoSchema.parse(data)
    
    // Si c'est défini comme photo de couverture, retirer les autres photos de couverture
    if (validatedData.est_couverture) {
      await supabase
        .from('unite_photos')
        .update({ est_couverture: false })
        .eq('unite_id', validatedData.unite_id)
    }
    
    // Ajouter la nouvelle photo
    const { data: newPhoto, error } = await supabase
      .from('unite_photos')
      .insert(validatedData)
      .select()
      .single()
    
    if (error) throw error
    
    // Récupérer les infos de l'unité pour la revalidation
    const { data: unite } = await supabase
      .from('unites')
      .select('propriete_id')
      .eq('id', validatedData.unite_id)
      .single()
    
    if (unite) {
      revalidatePath(`/proprietes/${unite.propriete_id}`)
      revalidatePath(`/proprietes/${unite.propriete_id}/unites/${validatedData.unite_id}`)
    }
    
    return {
      success: true,
      data: newPhoto as UnitePhoto
    }
  } catch (error) {
    console.error('Error adding unite photo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la photo'
    }
  }
}

/**
 * Mettre à jour une photo d'unité
 */
export async function updateUnitePhoto(
  photoId: string,
  data: Partial<z.infer<typeof unitePhotoSchema>>
) {
  const supabase = await createClient()
  
  try {
    // Récupérer la photo actuelle
    const { data: currentPhoto, error: fetchError } = await supabase
      .from('unite_photos')
      .select('*, unites(propriete_id)')
      .eq('id', photoId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Si on définit comme photo de couverture, retirer les autres
    if (data.est_couverture) {
      await supabase
        .from('unite_photos')
        .update({ est_couverture: false })
        .eq('unite_id', currentPhoto.unite_id)
    }
    
    // Mettre à jour la photo
    const { data: updatedPhoto, error } = await supabase
      .from('unite_photos')
      .update(data)
      .eq('id', photoId)
      .select()
      .single()
    
    if (error) throw error
    
    // Revalidation
    const proprieteId = (currentPhoto as any).unites?.propriete_id
    if (proprieteId) {
      revalidatePath(`/proprietes/${proprieteId}`)
      revalidatePath(`/proprietes/${proprieteId}/unites/${currentPhoto.unite_id}`)
    }
    
    return {
      success: true,
      data: updatedPhoto as UnitePhoto
    }
  } catch (error) {
    console.error('Error updating unite photo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la photo'
    }
  }
}

/**
 * Supprimer une photo d'unité
 */
export async function deleteUnitePhoto(photoId: string) {
  const supabase = await createClient()
  
  try {
    // Récupérer les infos de la photo avant suppression
    const { data: photo, error: fetchError } = await supabase
      .from('unite_photos')
      .select('*, unites(propriete_id)')
      .eq('id', photoId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Supprimer la photo
    const { error } = await supabase
      .from('unite_photos')
      .delete()
      .eq('id', photoId)
    
    if (error) throw error
    
    // Revalidation
    const proprieteId = (photo as any).unites?.propriete_id
    if (proprieteId) {
      revalidatePath(`/proprietes/${proprieteId}`)
      revalidatePath(`/proprietes/${proprieteId}/unites/${photo.unite_id}`)
    }
    
    return {
      success: true,
      message: 'Photo supprimée avec succès'
    }
  } catch (error) {
    console.error('Error deleting unite photo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la photo'
    }
  }
}

/**
 * Définir une photo comme couverture d'unité
 */
export async function setCoverUnitePhoto(photoId: string) {
  const supabase = await createClient()
  
  try {
    // Récupérer les infos de la photo
    const { data: photo, error: fetchError } = await supabase
      .from('unite_photos')
      .select('*, unites(propriete_id)')
      .eq('id', photoId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Retirer le statut de couverture des autres photos de cette unité
    await supabase
      .from('unite_photos')
      .update({ est_couverture: false })
      .eq('unite_id', photo.unite_id)
    
    // Définir cette photo comme couverture
    const { data: updatedPhoto, error } = await supabase
      .from('unite_photos')
      .update({ est_couverture: true })
      .eq('id', photoId)
      .select()
      .single()
    
    if (error) throw error
    
    // Revalidation
    const proprieteId = (photo as any).unites?.propriete_id
    if (proprieteId) {
      revalidatePath(`/proprietes/${proprieteId}`)
      revalidatePath(`/proprietes/${proprieteId}/unites/${photo.unite_id}`)
    }
    
    return {
      success: true,
      data: updatedPhoto as UnitePhoto,
      message: 'Photo définie comme couverture'
    }
  } catch (error) {
    console.error('Error setting cover photo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la définition de la photo de couverture'
    }
  }
}

/**
 * Réorganiser l'ordre des photos d'une unité
 */
export async function reorderUnitePhotos(uniteId: string, photoIds: string[]) {
  const supabase = await createClient()
  
  try {
    // Mettre à jour l'ordre des photos
    const updates = photoIds.map((photoId, index) => 
      supabase
        .from('unite_photos')
        .update({ ordre: index })
        .eq('id', photoId)
        .eq('unite_id', uniteId)
    )
    
    await Promise.all(updates)
    
    // Récupérer les infos de l'unité pour la revalidation
    const { data: unite } = await supabase
      .from('unites')
      .select('propriete_id')
      .eq('id', uniteId)
      .single()
    
    if (unite) {
      revalidatePath(`/proprietes/${unite.propriete_id}`)
      revalidatePath(`/proprietes/${unite.propriete_id}/unites/${uniteId}`)
    }
    
    return {
      success: true,
      message: 'Ordre des photos mis à jour'
    }
  } catch (error) {
    console.error('Error reordering photos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la réorganisation des photos'
    }
  }
}

/**
 * Obtenir la photo de couverture d'une unité
 */
export async function getCoverPhotoByUnite(uniteId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('unite_photos')
      .select('*')
      .eq('unite_id', uniteId)
      .eq('est_couverture', true)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = No rows found
    
    return {
      success: true,
      data: data as UnitePhoto | null
    }
  } catch (error) {
    console.error('Error fetching cover photo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération de la photo de couverture'
    }
  }
}

/**
 * Obtenir les statistiques photos d'une unité
 */
export async function getUnitePhotosStats(uniteId: string) {
  const supabase = await createClient()
  
  try {
    const { data: photos, error } = await supabase
      .from('unite_photos')
      .select('id, est_couverture, taille_bytes')
      .eq('unite_id', uniteId)
    
    if (error) throw error
    
    const stats = {
      total: photos?.length || 0,
      has_cover: photos?.some(p => p.est_couverture) || false,
      total_size: photos?.reduce((sum, p) => sum + (p.taille_bytes || 0), 0) || 0
    }
    
    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('Error fetching photos stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques'
    }
  }
}