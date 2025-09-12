'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// =============================================
// SCHEMAS DE VALIDATION
// =============================================
const uniteSchema = z.object({
  propriete_id: z.string().uuid(),
  numero: z.string().optional(),
  nom: z.string().min(1, 'Le nom est requis'),
  type: z.string().optional(),
  description: z.string().optional(),
  
  // Caractéristiques
  surface_m2: z.number().min(0).optional(),
  nombre_pieces: z.number().min(0).optional(),
  nb_chambres: z.number().min(0).optional(),
  nb_sdb: z.number().min(0).optional(),
  capacite_max: z.number().min(1).optional(),
  nb_lits: z.number().min(0).optional(),
  etage: z.number().optional(),
  
  // Tarifs
  loyer: z.number().min(0).optional(),
  charges: z.number().min(0).optional(),
  depot_garantie: z.number().min(0).optional(),
  
  // Statut
  statut: z.enum(['disponible', 'louee', 'renovation', 'indisponible']).default('disponible'),
  est_louee: z.boolean().default(false),
  date_disponibilite: z.string().optional(),
  
  // Équipements et règles
  amenities: z.record(z.string(), z.any()).optional(),
  regles: z.record(z.string(), z.any()).optional()
})

// =============================================
// TYPES
// =============================================
export type UniteStatut = 'disponible' | 'louee' | 'renovation' | 'indisponible'

export type Unite = {
  id: string
  propriete_id: string
  organisation_id?: string
  numero?: string
  nom: string
  type?: string
  description?: string
  surface_m2?: number
  nombre_pieces?: number
  nb_chambres?: number
  nb_sdb?: number
  capacite_max?: number
  nb_lits?: number
  etage?: number
  loyer?: number
  charges?: number
  depot_garantie?: number
  statut: UniteStatut
  est_louee: boolean
  date_disponibilite?: string
  amenities?: any
  regles?: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UniteWithDetails = Unite & {
  propriete?: {
    id: string
    nom: string
    adresse: string
    ville: string
    code_postal: string
  }
  photos_count?: number
  cover_photo_url?: string
  current_locataire?: {
    id: string
    nom: string
    prenom?: string
  }
}

// =============================================
// ACTIONS SERVEUR
// =============================================

/**
 * Récupérer toutes les unités d'une propriété
 */
export async function getUnitesByPropriete(proprieteId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('unites')
      .select(`
        *,
        photos:propriete_photos(count),
        cover_photo:propriete_photos_detail_v(
          storage_path,
          url_thumbnail,
          is_cover
        )
      `)
      .eq('propriete_id', proprieteId)
      .eq('is_active', true)
      .order('numero')
      .order('nom')
    
    if (error) throw error
    
    // Transformer les données avec le compte de photos et l'URL de couverture
    const unitesWithDetails = data?.map(unite => {
      // Trouver la photo de couverture dans les photos disponibles
      const coverPhoto = unite.cover_photo?.find(photo => photo.is_cover) || unite.cover_photo?.[0]
      
      return {
        ...unite,
        photos_count: unite.photos?.[0]?.count || 0,
        cover_photo_url: coverPhoto?.url_thumbnail || null
      }
    })
    
    return {
      success: true,
      data: unitesWithDetails as UniteWithDetails[]
    }
  } catch (error) {
    console.error('Error fetching unites:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des unités'
    }
  }
}

/**
 * Récupérer une unité par son ID
 */
export async function getUniteById(uniteId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('unites')
      .select(`
        *,
        propriete:proprietes(
          id,
          nom,
          adresse,
          ville,
          code_postal
        ),
        photos:propriete_photos(count)
      `)
      .eq('id', uniteId)
      .single()
    
    if (error) throw error
    
    // Ajouter le compte de photos et l'URL de couverture
    const uniteWithDetails = {
      ...data,
      photos_count: data.photos?.[0]?.count || 0
    }
    
    // Récupérer la photo de couverture si elle existe
    const { data: coverPhoto } = await supabase
      .from('propriete_photos')
      .select('url_medium')
      .eq('unite_id', uniteId)
      .eq('is_cover', true)
      .single()
    
    if (coverPhoto) {
      uniteWithDetails.cover_photo_url = coverPhoto.url_medium
    }
    
    return {
      success: true,
      data: uniteWithDetails as UniteWithDetails
    }
  } catch (error) {
    console.error('Error fetching unite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération de l\'unité'
    }
  }
}

/**
 * Créer une nouvelle unité
 */
export async function createUnite(data: z.infer<typeof uniteSchema>) {
  const supabase = await createClient()
  
  try {
    // Préprocesser les données pour gérer les chaînes vides et les valeurs null
    const preprocessedData = {
      ...data,
      date_disponibilite: (!data.date_disponibilite || data.date_disponibilite === '') ? undefined : data.date_disponibilite
    }
    
    // Debug logging pour diagnostiquer le problème
    console.log('🔍 Debug createUnite - Raw data:', JSON.stringify(data, null, 2))
    console.log('🔍 Debug createUnite - Preprocessed data:', JSON.stringify(preprocessedData, null, 2))
    console.log('🔍 Debug createUnite - date_disponibilite type:', typeof preprocessedData.date_disponibilite)
    console.log('🔍 Debug createUnite - date_disponibilite value:', preprocessedData.date_disponibilite)
    
    // Valider les données
    const validatedData = uniteSchema.parse(preprocessedData)
    
    // Récupérer l'organisation_id de la propriété
    const { data: propriete, error: propError } = await supabase
      .from('proprietes')
      .select('organisation_id')
      .eq('id', validatedData.propriete_id)
      .single()
    
    if (propError) throw propError
    
    // Créer l'unité avec conversion des chaînes vides en null pour PostgreSQL
    const { data: newUnite, error } = await supabase
      .from('unites')
      .insert({
        ...validatedData,
        date_disponibilite: validatedData.date_disponibilite === '' ? null : validatedData.date_disponibilite,
        organisation_id: propriete.organisation_id,
        is_active: true
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/proprietes/${validatedData.propriete_id}`)
    
    return {
      success: true,
      data: newUnite as Unite
    }
  } catch (error) {
    console.error('Error creating unite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création de l\'unité'
    }
  }
}

/**
 * Mettre à jour une unité
 */
export async function updateUnite(
  uniteId: string,
  data: Partial<z.infer<typeof uniteSchema>>
) {
  const supabase = await createClient()
  
  try {
    // Récupérer l'unité actuelle pour la revalidation
    const { data: currentUnite, error: fetchError } = await supabase
      .from('unites')
      .select('propriete_id')
      .eq('id', uniteId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Mettre à jour l'unité avec la correspondance correcte des champs
    const { data: updatedUnite, error } = await supabase
      .from('unites')
      .update({
        numero: data.numero,
        nom: data.nom,
        type: data.type,
        description: data.description,
        surface_m2: data.surface_m2,  // Form: surface_m2 → DB: surface_m2 ✓
        nombre_pieces: data.nombre_pieces,
        nb_chambres: data.nb_chambres,  // FIXED: Form uses nb_chambres → DB: nb_chambres ✓
        nb_sdb: data.nb_sdb,  // Form: nb_sdb → DB: nb_sdb ✓
        capacite_max: data.capacite_max,
        nb_lits: data.nb_lits,
        etage: data.etage,
        loyer: data.loyer,
        charges: data.charges,
        depot_garantie: data.depot_garantie,
        statut: data.statut,
        est_louee: data.est_louee,
        date_disponibilite: data.date_disponibilite === '' ? null : data.date_disponibilite,  // Fix: Convert empty string to null for PostgreSQL
        amenities: data.amenities,
        regles: data.regles
      })
      .eq('id', uniteId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/proprietes/${currentUnite.propriete_id}`)
    revalidatePath(`/unites/${uniteId}`)
    
    return {
      success: true,
      data: updatedUnite as Unite
    }
  } catch (error) {
    console.error('Error updating unite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'unité'
    }
  }
}

/**
 * Supprimer une unité (soft delete)
 */
export async function deleteUnite(uniteId: string) {
  const supabase = await createClient()
  
  try {
    // Récupérer l'unité pour la revalidation
    const { data: unite, error: fetchError } = await supabase
      .from('unites')
      .select('propriete_id')
      .eq('id', uniteId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Soft delete : marquer comme inactive
    const { error } = await supabase
      .from('unites')
      .update({ is_active: false })
      .eq('id', uniteId)
    
    if (error) throw error
    
    revalidatePath(`/proprietes/${unite.propriete_id}`)
    
    return {
      success: true,
      message: 'Unité supprimée avec succès'
    }
  } catch (error) {
    console.error('Error deleting unite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'unité'
    }
  }
}

/**
 * Dupliquer une unité
 */
export async function duplicateUnite(uniteId: string, newNom?: string) {
  const supabase = await createClient()
  
  try {
    // Récupérer l'unité à dupliquer
    const { data: originalUnite, error: fetchError } = await supabase
      .from('unites')
      .select('*')
      .eq('id', uniteId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Créer une copie avec un nouveau nom
    const { id, created_at, updated_at, created_by, updated_by, ...uniteData } = originalUnite
    
    const { data: newUnite, error: createError } = await supabase
      .from('unites')
      .insert({
        ...uniteData,
        nom: newNom || `${originalUnite.nom} (copie)`,
        numero: originalUnite.numero ? `${originalUnite.numero}-copie` : null,
        statut: 'disponible',
        est_louee: false
      })
      .select()
      .single()
    
    if (createError) throw createError
    
    revalidatePath(`/proprietes/${originalUnite.propriete_id}`)
    
    return {
      success: true,
      data: newUnite as Unite,
      message: 'Unité dupliquée avec succès'
    }
  } catch (error) {
    console.error('Error duplicating unite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la duplication de l\'unité'
    }
  }
}

/**
 * Mettre à jour le statut de location d'une unité
 */
export async function updateUniteStatutLocation(
  uniteId: string,
  est_louee: boolean,
  date_disponibilite?: string
) {
  const supabase = await createClient()
  
  try {
    const updateData: any = {
      est_louee,
      statut: est_louee ? 'louee' : 'disponible'
    }
    
    if (!est_louee && date_disponibilite) {
      updateData.date_disponibilite = date_disponibilite
    }
    
    const { data, error } = await supabase
      .from('unites')
      .update(updateData)
      .eq('id', uniteId)
      .select()
      .single()
    
    if (error) throw error
    
    // Revalidation
    const { data: unite } = await supabase
      .from('unites')
      .select('propriete_id')
      .eq('id', uniteId)
      .single()
    
    if (unite) {
      revalidatePath(`/proprietes/${unite.propriete_id}`)
      revalidatePath(`/unites/${uniteId}`)
    }
    
    return {
      success: true,
      data: data as Unite,
      message: est_louee ? 'Unité marquée comme louée' : 'Unité marquée comme disponible'
    }
  } catch (error) {
    console.error('Error updating unite statut:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut'
    }
  }
}

/**
 * Récupérer les statistiques des unités d'une propriété
 */
export async function getUnitesStats(proprieteId: string) {
  const supabase = await createClient()
  
  try {
    const { data: unites, error } = await supabase
      .from('unites')
      .select('statut, loyer')
      .eq('propriete_id', proprieteId)
      .eq('is_active', true)
    
    if (error) throw error
    
    const stats = {
      total: unites?.length || 0,
      disponibles: unites?.filter(u => u.statut === 'disponible').length || 0,
      louees: unites?.filter(u => u.statut === 'louee').length || 0,
      renovation: unites?.filter(u => u.statut === 'renovation').length || 0,
      indisponibles: unites?.filter(u => u.statut === 'indisponible').length || 0,
      loyer_total: unites?.reduce((sum, u) => sum + (u.loyer || 0), 0) || 0,
      loyer_moyen: unites?.length ? 
        (unites.reduce((sum, u) => sum + (u.loyer || 0), 0) / unites.length) : 0
    }
    
    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('Error fetching unites stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques'
    }
  }
}

/**
 * Créer plusieurs unités en une fois
 */
export async function createMultipleUnites(
  proprieteId: string,
  count: number,
  template: Partial<z.infer<typeof uniteSchema>>
) {
  const supabase = await createClient()
  
  try {
    // Récupérer l'organisation_id
    const { data: propriete, error: propError } = await supabase
      .from('proprietes')
      .select('organisation_id')
      .eq('id', proprieteId)
      .single()
    
    if (propError) throw propError
    
    // Créer les unités
    const unites: any[] = []
    for (let i = 1; i <= count; i++) {
      unites.push({
        propriete_id: proprieteId,
        organisation_id: propriete.organisation_id,
        numero: template.numero ? `${template.numero}-${i}` : `${i}`,
        nom: template.nom ? `${template.nom} ${i}` : `Unité ${i}`,
        type: template.type,
        surface_m2: template.surface_m2,
        nombre_pieces: template.nombre_pieces,
        nb_chambres: template.nb_chambres,
        nb_sdb: template.nb_sdb,
        capacite_max: template.capacite_max,
        nb_lits: template.nb_lits,
        etage: template.etage,
        loyer: template.loyer,
        charges: template.charges,
        depot_garantie: template.depot_garantie,
        statut: template.statut || 'disponible',
        est_louee: false,
        amenities: template.amenities,
        regles: template.regles,
        is_active: true
      })
    }
    
    const { data, error } = await supabase
      .from('unites')
      .insert(unites)
      .select()
    
    if (error) throw error
    
    revalidatePath(`/proprietes/${proprieteId}`)
    
    return {
      success: true,
      data: data as Unite[],
      message: `${count} unités créées avec succès`
    }
  } catch (error) {
    console.error('Error creating multiple unites:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la création des unités'
    }
  }
}