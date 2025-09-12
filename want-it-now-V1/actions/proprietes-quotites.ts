'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// =============================================
// SCHEMAS DE VALIDATION
// =============================================
const quotiteSchema = z.object({
  propriete_id: z.string().uuid(),
  proprietaire_id: z.string().uuid(),
  pourcentage: z.number().min(0.01).max(100),
  date_acquisition: z.string().optional(),
  frais_acquisition: z.number().optional(),
  notes: z.string().optional(),
  ordre: z.number().optional()
  // Note: prix_acquisition maintenant calculé dynamiquement
})

// =============================================
// TYPES
// =============================================
export type QuotiteWithProprietaire = {
  id: string
  propriete_id: string
  proprietaire_id: string
  pourcentage: number
  date_acquisition?: string
  prix_acquisition_calcule?: number  // Calculé dynamiquement
  frais_acquisition?: number
  notes?: string
  ordre: number
  proprietaire: {
    id: string
    nom: string
    prenom?: string
    type: 'physique' | 'morale'
    email?: string
  }
}

export type QuotitesStats = {
  propriete_id: string
  propriete_nom: string
  nombre_proprietaires: number
  total_pourcentage: number
  pourcentage_disponible: number
  statut_quotites: 'complet' | 'partiel' | 'vide' | 'erreur'
  proprietaires_details: Array<{
    proprietaire_id: string
    proprietaire_nom: string
    proprietaire_prenom?: string
    proprietaire_type: string
    pourcentage: number
    date_acquisition?: string
  }>
}

// =============================================
// ACTIONS SERVEUR
// =============================================

/**
 * Récupérer toutes les quotités d'une propriété
 */
export async function getProprietairesByPropriete(proprieteId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('propriete_proprietaires_detail_v')
      .select('*')
      .eq('propriete_id', proprieteId)
      .order('ordre')
      .order('pourcentage', { ascending: false })

    if (error) throw error
    
    return { 
      success: true, 
      data: data as QuotiteWithProprietaire[] 
    }
  } catch (error) {
    console.error('Error fetching propriete proprietaires:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des propriétaires'
    }
  }
}

/**
 * Ajouter un propriétaire à une propriété avec sa quotité
 */
export async function addProprietaireToPropriete(data: z.infer<typeof quotiteSchema>) {
  const supabase = await createClient()
  
  try {
    // Valider les données
    const validatedData = quotiteSchema.parse(data)
    
    // Vérifier le total des quotités avant d'ajouter
    const { data: stats, error: statsError } = await supabase
      .from('propriete_quotites_stats_v')
      .select('total_pourcentage, pourcentage_disponible')
      .eq('propriete_id', validatedData.propriete_id)
      .single()
    
    if (statsError && statsError.code !== 'PGRST116') throw statsError
    
    const currentTotal = stats?.total_pourcentage || 0
    const newTotal = currentTotal + validatedData.pourcentage
    
    if (newTotal > 100) {
      return {
        success: false,
        error: `Le total des quotités dépasserait 100% (actuellement ${currentTotal}%, ajout de ${validatedData.pourcentage}%)`
      }
    }
    
    // Ajouter la quotité (sans prix_acquisition - maintenant dynamique)
    const { data: newQuotite, error } = await supabase
      .from('propriete_proprietaires')
      .insert({
        propriete_id: validatedData.propriete_id,
        proprietaire_id: validatedData.proprietaire_id,
        pourcentage: validatedData.pourcentage,
        date_acquisition: validatedData.date_acquisition,
        frais_acquisition: validatedData.frais_acquisition,
        notes: validatedData.notes,
        ordre: validatedData.ordre || 0
      })
      .select(`
        *,
        proprietaire:proprietaires(
          id,
          nom,
          prenom,
          type,
          email
        )
      `)
      .single()
    
    if (error) {
      // Gérer l'erreur de contrainte unique
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Ce propriétaire est déjà associé à cette propriété'
        }
      }
      throw error
    }
    
    revalidatePath(`/proprietes/${validatedData.propriete_id}`)
    
    return {
      success: true,
      data: newQuotite as QuotiteWithProprietaire
    }
  } catch (error) {
    console.error('Error adding proprietaire to propriete:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du propriétaire'
    }
  }
}

/**
 * Mettre à jour une quotité
 */
export async function updateProprietaireQuotite(
  quotiteId: string,
  data: Partial<z.infer<typeof quotiteSchema>>
) {
  const supabase = await createClient()
  
  try {
    // Récupérer la quotité actuelle
    const { data: currentQuotite, error: fetchError } = await supabase
      .from('propriete_proprietaires')
      .select('propriete_id, pourcentage')
      .eq('id', quotiteId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Si le pourcentage change, vérifier le nouveau total
    if (data.pourcentage && data.pourcentage !== currentQuotite.pourcentage) {
      const { data: stats, error: statsError } = await supabase
        .from('propriete_quotites_stats_v')
        .select('total_pourcentage')
        .eq('propriete_id', currentQuotite.propriete_id)
        .single()
      
      if (statsError && statsError.code !== 'PGRST116') throw statsError
      
      const currentTotal = stats?.total_pourcentage || 0
      const newTotal = currentTotal - currentQuotite.pourcentage + data.pourcentage
      
      if (newTotal > 100) {
        return {
          success: false,
          error: `Le total des quotités dépasserait 100% (nouveau total: ${newTotal}%)`
        }
      }
    }
    
    // Mettre à jour la quotité (sans prix_acquisition - maintenant dynamique)
    const { data: updatedQuotite, error } = await supabase
      .from('propriete_proprietaires')
      .update({
        pourcentage: data.pourcentage,
        date_acquisition: data.date_acquisition,
        frais_acquisition: data.frais_acquisition,
        notes: data.notes,
        ordre: data.ordre
      })
      .eq('id', quotiteId)
      .select(`
        *,
        proprietaire:proprietaires(
          id,
          nom,
          prenom,
          type,
          email
        )
      `)
      .single()
    
    if (error) throw error
    
    revalidatePath(`/proprietes/${currentQuotite.propriete_id}`)
    
    return {
      success: true,
      data: updatedQuotite as QuotiteWithProprietaire
    }
  } catch (error) {
    console.error('Error updating quotite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la quotité'
    }
  }
}

/**
 * Supprimer une quotité
 */
export async function removeProprietaireFromPropriete(quotiteId: string) {
  const supabase = await createClient()
  
  try {
    // Récupérer la propriété concernée pour revalidation
    const { data: quotite, error: fetchError } = await supabase
      .from('propriete_proprietaires')
      .select('propriete_id')
      .eq('id', quotiteId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Supprimer la quotité
    const { error } = await supabase
      .from('propriete_proprietaires')
      .delete()
      .eq('id', quotiteId)
    
    if (error) throw error
    
    revalidatePath(`/proprietes/${quotite.propriete_id}`)
    
    return {
      success: true,
      message: 'Propriétaire retiré avec succès'
    }
  } catch (error) {
    console.error('Error removing proprietaire from propriete:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression du propriétaire'
    }
  }
}

/**
 * Récupérer les statistiques des quotités pour une propriété
 */
export async function getQuotitesStats(proprieteId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('propriete_quotites_stats_v')
      .select('*')
      .eq('propriete_id', proprieteId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return {
      success: true,
      data: data as QuotitesStats | null
    }
  } catch (error) {
    console.error('Error fetching quotites stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques'
    }
  }
}

/**
 * Récupérer une quotité spécifique avec détails du propriétaire
 */
export async function getQuotiteById(quotiteId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('propriete_proprietaires')
      .select(`
        *,
        proprietaire:proprietaires(
          id,
          nom,
          prenom,
          type,
          email,
          telephone,
          adresse,
          forme_juridique,
          numero_identification,
          capital_social,
          iban,
          created_at
        )
      `)
      .eq('id', quotiteId)
      .single()

    if (error) throw error
    
    return { 
      success: true, 
      data: data as QuotiteWithProprietaire 
    }
  } catch (error) {
    console.error('Error fetching quotite by id:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération de la quotité'
    }
  }
}

/**
 * Rechercher des propriétaires disponibles pour les ajouter
 */
export async function searchAvailableProprietaires(
  proprieteId: string,
  search: string
) {
  const supabase = await createClient()
  
  console.log('🔍 [SEARCH] Starting search for:', { proprieteId, search })
  
  // Vérifier l'utilisateur authentifié
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('🔍 [SEARCH] Auth user:', user ? { id: user.id, email: user.email } : 'No user', authError)
  
  try {
    // Récupérer d'abord les propriétaires déjà associés
    const { data: existingIds, error: existingError } = await supabase
      .from('propriete_proprietaires')
      .select('proprietaire_id')
      .eq('propriete_id', proprieteId)
    
    console.log('🔍 [SEARCH] Existing IDs:', existingIds, existingError)
    
    if (existingError) throw existingError
    
    const excludeIds = existingIds?.map(item => item.proprietaire_id) || []
    
    // Rechercher les propriétaires disponibles
    let query = supabase
      .from('proprietaires')
      .select('id, nom, prenom, type, email')
      .eq('is_active', true)
      .order('nom')
      .limit(10)
    
    // Exclure les propriétaires déjà associés
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }
    
    // Appliquer la recherche
    if (search) {
      query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    console.log('🔍 [SEARCH] Executing query with excludeIds:', excludeIds)
    
    const { data, error } = await query
    
    console.log('🔍 [SEARCH] Query result:', { data, error })
    
    if (error) throw error
    
    return {
      success: true,
      data: data || []
    }
  } catch (error) {
    console.error('Error searching available proprietaires:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la recherche de propriétaires'
    }
  }
}

/**
 * Réorganiser l'ordre des quotités
 */
export async function reorderQuotites(proprieteId: string, quotiteIds: string[]) {
  const supabase = await createClient()
  
  try {
    // Mettre à jour l'ordre de chaque quotité
    const updates = quotiteIds.map((id, index) => ({
      id,
      ordre: index
    }))
    
    // Effectuer les mises à jour en parallèle
    const promises = updates.map(({ id, ordre }) =>
      supabase
        .from('propriete_proprietaires')
        .update({ ordre })
        .eq('id', id)
        .eq('propriete_id', proprieteId) // Sécurité supplémentaire
    )
    
    const results = await Promise.all(promises)
    
    // Vérifier s'il y a des erreurs
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      throw errors[0].error
    }
    
    revalidatePath(`/proprietes/${proprieteId}`)
    
    return {
      success: true,
      message: 'Ordre mis à jour avec succès'
    }
  } catch (error) {
    console.error('Error reordering quotites:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la réorganisation'
    }
  }
}