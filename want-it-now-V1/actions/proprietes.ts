'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import {
  createProprieteSchema,
  updateProprieteSchema,
  createUniteSchema,
  updateUniteSchema,
  proprieteQuotiteSchema,
  transformProprieteFormData,
  transformUniteFormData,
  PROPRIETE_ERRORS,
  type Propriete,
  type CreatePropriete,
  type UpdatePropriete,
  type Unite,
  type CreateUnite,
  type UpdateUnite,
  type ProprieteFormData,
  type UniteFormData,
  type ProprieteQuotite,
  type ProprieteProprietaire,
  type ProprietePhoto,
  type ProprieteWithStats,
  type ProprieteListItem,
} from '@/lib/validations/proprietes'

// Initialize Supabase client with service role for server actions
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ACCESS_TOKEN!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Result types for server actions
export type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

// =============================================
// PROPRIÉTÉS CRUD
// =============================================

/**
 * Get all active propriétés with filtering and stats (excludes archived)
 */
export async function getProprietes(filters?: {
  statut?: string
  type?: string
  organisation_id?: string
  search?: string
}): Promise<ActionResult<ProprieteListItem[]>> {
  try {
    let query = supabase
      .from('proprietes_list_v')
      .select('*')
      .neq('statut', 'archive') // Exclude archived properties
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.statut && filters.statut !== 'all') {
      query = query.eq('statut', filters.statut)
    }
    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }
    if (filters?.organisation_id) {
      query = query.eq('organisation_id', filters.organisation_id)
    }
    if (filters?.search) {
      query = query.or(`nom.ilike.%${filters.search}%,reference.ilike.%${filters.search}%,ville.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching proprietes:', error)
      return { success: false, error: 'Erreur lors de la récupération des propriétés' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in getProprietes:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Get archived propriétés for archives page
 */
export async function getProprietesArchives(filters?: {
  type?: string
  organisation_id?: string
  search?: string
}): Promise<ActionResult<ProprieteListItem[]>> {
  try {
    let query = supabase
      .from('proprietes_list_v')
      .select('*')
      .eq('statut', 'archive') // Only archived properties
      .order('updated_at', { ascending: false }) // Most recently archived first

    // Apply filters
    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }
    if (filters?.organisation_id) {
      query = query.eq('organisation_id', filters.organisation_id)
    }
    if (filters?.search) {
      query = query.or(`nom.ilike.%${filters.search}%,reference.ilike.%${filters.search}%,ville.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching archived proprietes:', error)
      return { success: false, error: 'Erreur lors de la récupération des propriétés archivées' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in getProprietesArchives:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Get single propriété with full stats
 */
export async function getProprieteById(id: string): Promise<ActionResult<ProprieteWithStats>> {
  try {
    const { data, error } = await supabase
      .from('proprietes_list_v')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: PROPRIETE_ERRORS.NOT_FOUND }
      }
      console.error('Error fetching propriete:', error)
      return { success: false, error: 'Erreur lors de la récupération de la propriété' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in getProprieteById:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Create new propriété
 */
export async function createPropriete(
  formData: ProprieteFormData
): Promise<ActionResult<Propriete>> {
  try {
    // Récupérer les données d'authentification avec rôles
    const authData = await getServerAuthData()
    
    if (!authData.user) {
      return { success: false, error: 'Utilisateur non authentifié' }
    }

    // Vérifier si l'utilisateur est super admin
    const isSuperAdmin = authData.userRoles.some(role => role.role === 'super_admin')

    // Valider que le pays choisi est autorisé pour cet utilisateur
    if (!isSuperAdmin) {
      // Pour les admins réguliers, vérifier qu'ils ont accès à ce pays
      const userOrganisationIds = authData.userRoles
        .filter(role => role.role === 'admin')
        .map(role => role.organisation_id)

      if (userOrganisationIds.length === 0) {
        return { success: false, error: 'Aucune organisation assignée à votre compte' }
      }

      // Vérifier qu'une organisation active existe pour ce pays et que l'utilisateur y a accès
      const { data: allowedOrg, error: orgError } = await supabase
        .from('organisations')
        .select('id')
        .eq('pays', formData.pays)
        .eq('is_active', true)
        .in('id', userOrganisationIds)
        .single()

      if (orgError || !allowedOrg) {
        return { success: false, error: 'Pays non autorisé pour votre rôle ou aucune organisation active pour ce pays' }
      }
    } else {
      // Pour les super admins, vérifier seulement qu'une organisation existe pour ce pays
      const { data: orgExists, error: orgError } = await supabase
        .from('organisations')
        .select('id')
        .eq('pays', formData.pays)
        .eq('is_active', true)
        .single()

      if (orgError || !orgExists) {
        return { success: false, error: 'Aucune organisation active trouvée pour ce pays' }
      }
    }

    // Transform and validate (sans organisation_id car le trigger l'assignera)
    const transformedData = transformProprieteFormData(formData)
    const validatedData = createProprieteSchema.parse(transformedData)

    // Créer la propriété SANS organisation_id - le trigger l'assignera automatiquement
    const { data, error } = await supabase
      .from('proprietes')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating propriete:', error)
      // Le trigger peut lever des erreurs spécifiques, les transmettre
      if (error.message.includes('Aucune organisation active trouvée')) {
        return { success: false, error: 'Aucune organisation active trouvée pour ce pays' }
      }
      return { success: false, error: 'Erreur lors de la création de la propriété' }
    }

    revalidatePath('/proprietes')
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation error in createPropriete:', error.message)
      return { success: false, error: PROPRIETE_ERRORS.INVALID_DATA }
    }
    console.error('Unexpected error in createPropriete:', error)
    return { success: false, error: 'Erreur inattendue lors de la création' }
  }
}

/**
 * Update existing propriété
 */
export async function updatePropriete(
  id: string,
  formData: ProprieteFormData
): Promise<ActionResult<Propriete>> {
  try {
    // Transform and validate
    const transformedData = transformProprieteFormData(formData)
    const validatedData = updateProprieteSchema.parse(transformedData)

    // Update the propriété
    const { data, error } = await supabase
      .from('proprietes')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: PROPRIETE_ERRORS.NOT_FOUND }
      }
      console.error('Error updating propriete:', error)
      return { success: false, error: 'Erreur lors de la mise à jour de la propriété' }
    }

    revalidatePath('/proprietes')
    revalidatePath(`/proprietes/${id}`)
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation error in updatePropriete:', error.message)
      return { success: false, error: PROPRIETE_ERRORS.INVALID_DATA }
    }
    console.error('Unexpected error in updatePropriete:', error)
    return { success: false, error: 'Erreur inattendue lors de la mise à jour' }
  }
}

/**
 * Delete propriété (hard delete)
 */
export async function deletePropriete(id: string): Promise<ActionResult> {
  try {
    // Check if can delete
    const { data: canDelete, error: checkError } = await supabase
      .rpc('can_delete_propriete', { propriete_id: id })

    if (checkError) {
      console.error('Error checking delete permission:', checkError)
      return { success: false, error: 'Erreur lors de la vérification' }
    }

    if (!canDelete) {
      return { success: false, error: PROPRIETE_ERRORS.CANNOT_DELETE }
    }

    // Delete the propriété (cascade will handle related records)
    const { error } = await supabase
      .from('proprietes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting propriete:', error)
      return { success: false, error: 'Erreur lors de la suppression de la propriété' }
    }

    revalidatePath('/proprietes')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in deletePropriete:', error)
    return { success: false, error: 'Erreur inattendue lors de la suppression' }
  }
}

/**
 * Update propriété status
 */
export async function updateProprieteStatus(
  id: string,
  statut: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from('proprietes')
      .update({ statut })
      .eq('id', id)

    if (error) {
      console.error('Error updating propriete status:', error)
      return { success: false, error: 'Erreur lors de la mise à jour du statut' }
    }

    revalidatePath('/proprietes')
    revalidatePath(`/proprietes/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in updateProprieteStatus:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

// =============================================
// UNITÉS CRUD
// =============================================

/**
 * Get unités for a propriété
 */
export async function getUnitesByPropriete(
  propriete_id: string
): Promise<ActionResult<Unite[]>> {
  try {
    const { data, error } = await supabase
      .from('unites')
      .select('*')
      .eq('propriete_id', propriete_id)
      .order('etage', { ascending: true })
      .order('numero', { ascending: true })

    if (error) {
      console.error('Error fetching unites:', error)
      return { success: false, error: 'Erreur lors de la récupération des unités' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in getUnitesByPropriete:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Create new unité
 */
export async function createUnite(
  formData: UniteFormData
): Promise<ActionResult<Unite>> {
  try {
    // Transform and validate
    const transformedData = transformUniteFormData(formData)
    const validatedData = createUniteSchema.parse(transformedData)

    // Create the unité
    const { data, error } = await supabase
      .from('unites')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating unite:', error)
      return { success: false, error: 'Erreur lors de la création de l\'unité' }
    }

    revalidatePath(`/proprietes/${validatedData.propriete_id}`)
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation error in createUnite:', error.message)
      return { success: false, error: PROPRIETE_ERRORS.INVALID_DATA }
    }
    console.error('Unexpected error in createUnite:', error)
    return { success: false, error: 'Erreur inattendue lors de la création' }
  }
}

/**
 * Update existing unité
 */
export async function updateUnite(
  id: string,
  formData: UniteFormData
): Promise<ActionResult<Unite>> {
  try {
    // Transform and validate
    const transformedData = transformUniteFormData(formData)
    const validatedData = updateUniteSchema.parse(transformedData)

    // Update the unité
    const { data, error } = await supabase
      .from('unites')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating unite:', error)
      return { success: false, error: 'Erreur lors de la mise à jour de l\'unité' }
    }

    revalidatePath(`/proprietes/${data.propriete_id}`)
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation error in updateUnite:', error.message)
      return { success: false, error: PROPRIETE_ERRORS.INVALID_DATA }
    }
    console.error('Unexpected error in updateUnite:', error)
    return { success: false, error: 'Erreur inattendue lors de la mise à jour' }
  }
}

/**
 * Delete unité
 */
export async function deleteUnite(id: string): Promise<ActionResult> {
  try {
    // Get propriete_id before deletion for revalidation
    const { data: unite } = await supabase
      .from('unites')
      .select('propriete_id')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('unites')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting unite:', error)
      return { success: false, error: 'Erreur lors de la suppression de l\'unité' }
    }

    if (unite) {
      revalidatePath(`/proprietes/${unite.propriete_id}`)
    }
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in deleteUnite:', error)
    return { success: false, error: 'Erreur inattendue lors de la suppression' }
  }
}

// =============================================
// QUOTITÉS MANAGEMENT
// =============================================

/**
 * Get propriétaires for a propriété with quotités
 */
export async function getProprieteProprietaires(
  propriete_id: string
): Promise<ActionResult<ProprieteQuotite[]>> {
  try {
    // First check if the view exists and try to use it
    const { data, error } = await supabase
      .from('propriete_proprietaires_detail_v')
      .select('*')
      .eq('propriete_id', propriete_id)
      .order('pourcentage', { ascending: false })

    if (error) {
      // If view doesn't work, fallback to base table with joins
      console.warn('View access failed, using fallback query:', error.message)
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('propriete_proprietaires')
        .select(`
          *,
          proprietaire:proprietaires!inner(
            nom,
            prenom,
            type,
            email,
            telephone
          )
        `)
        .eq('propriete_id', propriete_id)
        .order('pourcentage', { ascending: false })

      if (fallbackError) {
        console.error('Error fetching propriete proprietaires (fallback):', fallbackError)
        return { success: false, error: 'Erreur lors de la récupération des propriétaires' }
      }

      // Transform fallback data to match expected format
      const transformedData = fallbackData?.map(item => ({
        ...item,
        proprietaire_nom: item.proprietaire?.nom || '',
        proprietaire_prenom: item.proprietaire?.prenom || '',
        proprietaire_type: item.proprietaire?.type || 'physique',
        proprietaire_email: item.proprietaire?.email || '',
        proprietaire_telephone: item.proprietaire?.telephone || '',
        proprietaire_nom_complet: item.proprietaire?.type === 'physique' 
          ? `${item.proprietaire?.prenom || ''} ${item.proprietaire?.nom || ''}`.trim()
          : item.proprietaire?.nom || ''
      })) || []

      return { success: true, data: transformedData }
    }

    // Transform the view data to match the expected format
    const transformedViewData = (data || []).map(item => ({
      ...item,
      proprietaire: {
        id: item.proprietaire_id,
        nom: item.proprietaire_nom,
        prenom: item.proprietaire_prenom,
        type: item.proprietaire_type,
        email: item.proprietaire_email,
        telephone: item.proprietaire_telephone
      },
      proprietaire_nom_complet: item.proprietaire_type === 'physique' 
        ? `${item.proprietaire_prenom || ''} ${item.proprietaire_nom || ''}`.trim()
        : item.proprietaire_nom || ''
    }))

    // If no ownership data exists, return empty array (not an error)
    return { success: true, data: transformedViewData }
  } catch (error) {
    console.error('Unexpected error in getProprieteProprietaires:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Add propriétaire to propriété with quotité
 */
export async function addProprieteProprietaire(
  propriete_id: string,
  proprietaire_id: string,
  pourcentage: number,
  date_acquisition?: string,
  prix_acquisition?: number
): Promise<ActionResult> {
  try {
    // Validate quotité
    const validatedData = proprieteQuotiteSchema.parse({
      propriete_id,
      proprietaire_id,
      pourcentage,
      date_acquisition,
      prix_acquisition
    })

    // Check if total would exceed 100%
    const { data: currentTotal } = await supabase
      .rpc('get_propriete_quotites_total', { propriete_id })

    if (currentTotal + pourcentage > 100) {
      return { success: false, error: PROPRIETE_ERRORS.QUOTITE_EXCEEDS }
    }

    // Add the proprietaire
    const { error } = await supabase
      .from('propriete_proprietaires')
      .insert([validatedData])

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: PROPRIETE_ERRORS.PROPRIETAIRE_EXISTS }
      }
      console.error('Error adding proprietaire:', error)
      return { success: false, error: 'Erreur lors de l\'ajout du propriétaire' }
    }

    revalidatePath(`/proprietes/${propriete_id}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation error in addProprieteProprietaire:', error.message)
      return { success: false, error: PROPRIETE_ERRORS.INVALID_DATA }
    }
    console.error('Unexpected error in addProprieteProprietaire:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Update propriétaire quotité
 */
export async function updateProprieteProprietaire(
  id: string,
  pourcentage: number,
  date_acquisition?: string,
  prix_acquisition?: number
): Promise<ActionResult> {
  try {
    // Get current record to check propriete_id
    const { data: current } = await supabase
      .from('propriete_proprietaires')
      .select('propriete_id, proprietaire_id, pourcentage')
      .eq('id', id)
      .single()

    if (!current) {
      return { success: false, error: PROPRIETE_ERRORS.NOT_FOUND }
    }

    // Check if new total would exceed 100%
    const { data: currentTotal } = await supabase
      .rpc('get_propriete_quotites_total', { propriete_id: current.propriete_id })

    const newTotal = currentTotal - current.pourcentage + pourcentage
    if (newTotal > 100) {
      return { success: false, error: PROPRIETE_ERRORS.QUOTITE_EXCEEDS }
    }

    // Update the quotité
    const { error } = await supabase
      .from('propriete_proprietaires')
      .update({
        pourcentage,
        date_acquisition,
        prix_acquisition
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating proprietaire quotite:', error)
      return { success: false, error: 'Erreur lors de la mise à jour de la quotité' }
    }

    revalidatePath(`/proprietes/${current.propriete_id}`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in updateProprieteProprietaire:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Remove propriétaire from propriété
 */
export async function removeProprieteProprietaire(
  proprieteId: string,
  proprietaireId: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from('propriete_proprietaires')
      .delete()
      .eq('propriete_id', proprieteId)
      .eq('proprietaire_id', proprietaireId)

    if (error) {
      console.error('Error removing proprietaire:', error)
      return { success: false, error: 'Erreur lors de la suppression du propriétaire' }
    }

    revalidatePath(`/proprietes/${proprieteId}`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in removeProprieteProprietaire:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

// =============================================
// STATISTICS
// =============================================

/**
 * Get global propriétés statistics
 */
export async function getProprietesStats(): Promise<ActionResult<{
  total_proprietes: number
  proprietes_actives: number
  proprietes_brouillon: number
  valeur_totale: number
  capacite_totale: number
  total_unites: number
}>> {
  try {
    const { data, error } = await supabase
      .from('proprietes_stats_v')
      .select('*')

    if (error) {
      console.error('Error fetching proprietes stats:', error)
      return { success: false, error: 'Erreur lors de la récupération des statistiques' }
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: {
          total_proprietes: 0,
          proprietes_actives: 0,
          proprietes_brouillon: 0,
          valeur_totale: 0,
          capacite_totale: 0,
          total_unites: 0
        }
      }
    }

    // Aggregate data from all organizations
    const aggregated = data.reduce((acc, row) => ({
      total_proprietes: acc.total_proprietes + (row.total_proprietes || 0),
      proprietes_actives: acc.proprietes_actives + (row.proprietes_disponibles || 0) + (row.proprietes_louees || 0),
      proprietes_brouillon: acc.proprietes_brouillon + (row.proprietes_brouillon || 0),
      valeur_totale: acc.valeur_totale + (row.valeur_portefeuille || 0),
      capacite_totale: acc.capacite_totale + 0, // Not available in current view
      total_unites: acc.total_unites + 0 // Not available in current view
    }), {
      total_proprietes: 0,
      proprietes_actives: 0,
      proprietes_brouillon: 0,
      valeur_totale: 0,
      capacite_totale: 0,
      total_unites: 0
    })

    return {
      success: true,
      data: aggregated
    }
  } catch (error) {
    console.error('Unexpected error in getProprietesStats:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Get property stats by ID
 */
export async function getProprieteStats(proprieteId: string): Promise<ActionResult<{
  quotites_count: number
  quotites_total: number
  photos_count: number
  unites_count: number
  unites_louees: number
}>> {
  try {
    const supabase = await createClient()
    
    // Get quotites
    const { data: quotites } = await supabase
      .from('propriete_proprietaires')
      .select('pourcentage')
      .eq('propriete_id', proprieteId)
    
    // Get photos count
    const { count: photosCount } = await supabase
      .from('propriete_photos')
      .select('*', { count: 'exact', head: true })
      .eq('propriete_id', proprieteId)
    
    // Get units if applicable
    const { data: unites } = await supabase
      .from('unites')
      .select('est_louee')
      .eq('propriete_id', proprieteId)
    
    return {
      success: true,
      data: {
        quotites_count: quotites?.length || 0,
        quotites_total: quotites?.reduce((acc, q) => acc + q.pourcentage, 0) || 0,
        photos_count: photosCount || 0,
        unites_count: unites?.length || 0,
        unites_louees: unites?.filter(u => u.est_louee).length || 0
      }
    }
  } catch (error) {
    console.error('Error in getProprieteStats:', error)
    return { success: false, error: 'Erreur lors de la récupération des statistiques' }
  }
}

/**
 * Get property quotites
 */
export async function getProprieteQuotites(proprieteId: string): Promise<ActionResult<{
  quotites: ProprieteProprietaire[]
  total: number
}>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('propriete_proprietaires')
      .select(`
        *,
        proprietaire:proprietaires(*)
      `)
      .eq('propriete_id', proprieteId)
      .order('pourcentage', { ascending: false })
    
    if (error) {
      console.error('Error fetching quotites:', error)
      return { success: false, error: 'Erreur lors de la récupération des quotités' }
    }
    
    const total = data?.reduce((acc, q) => acc + q.pourcentage, 0) || 0
    
    return {
      success: true,
      data: {
        quotites: data || [],
        total
      }
    }
  } catch (error) {
    console.error('Error in getProprieteQuotites:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Calculate automatic quotité prix acquisition based on property total investment
 */
export async function calculateQuotitePrixAcquisition(
  proprieteId: string,
  pourcentage: number
): Promise<ActionResult<number | null>> {
  try {
    const { data, error } = await supabase
      .rpc('get_quotite_prix_acquisition', {
        p_propriete_id: proprieteId,
        p_pourcentage: pourcentage
      })

    if (error) {
      console.error('Error calculating quotite prix:', error)
      return { success: false, error: 'Erreur lors du calcul du prix d\'acquisition' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in calculateQuotitePrixAcquisition:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Get property financial summary for quotités calculation
 */
export async function getPropertyFinancialSummary(
  proprieteId: string
): Promise<ActionResult<{
  prix_achat?: number
  frais_notaire?: number
  frais_annexes?: number
  total_investissement?: number
  has_complete_financial_data: boolean
}>> {
  try {
    const { data, error } = await supabase
      .from('proprietes_financial_summary')
      .select('prix_achat, frais_notaire, frais_annexes, total_investissement')
      .eq('id', proprieteId)
      .single()

    if (error) {
      console.error('Error fetching financial summary:', error)
      return { success: false, error: 'Erreur lors de la récupération du résumé financier' }
    }

    const hasCompleteData = data.prix_achat !== null && data.prix_achat > 0

    return {
      success: true,
      data: {
        ...data,
        has_complete_financial_data: hasCompleteData
      }
    }
  } catch (error) {
    console.error('Error in getPropertyFinancialSummary:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Add quotite to property (wrapper for addProprieteProprietaire)
 */
export async function addQuotiteToProperty(
  proprieteId: string,
  data: {
    proprietaire_id: string
    pourcentage: number
    is_gerant?: boolean
    commentaire?: string
  }
): Promise<ActionResult> {
  // Note: is_gerant and commentaire are not yet implemented in the database
  // For now, we just pass the core fields to the existing function
  return addProprieteProprietaire(
    proprieteId,
    data.proprietaire_id,
    data.pourcentage
  )
}

/**
 * Search proprietaires for quotite assignment
 */
export async function searchProprietaires(search?: string): Promise<ActionResult<Array<{
  id: string
  nom: string
  prenom?: string
  type: 'physique' | 'morale'
  email?: string
  organisation_id: string
}>>> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('proprietaires')
      .select('id, nom, prenom, type, email, organisation_id')
      .eq('is_active', true)
      .eq('is_brouillon', false)
      .order('nom')
      .limit(20)
    
    if (search) {
      query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error searching proprietaires:', error)
      return { success: false, error: 'Erreur lors de la recherche' }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in searchProprietaires:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Get property photos
 */
export async function getProprietePhotos(proprieteId: string): Promise<ActionResult<ProprietePhoto[]>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('propriete_photos')
      .select('*')
      .eq('propriete_id', proprieteId)
      .order('ordre', { ascending: true })
    
    if (error) {
      console.error('Error fetching photos:', error)
      return { success: false, error: 'Erreur lors de la récupération des photos' }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getProprietePhotos:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Get property units
 */
export async function getProprieteUnites(proprieteId: string): Promise<ActionResult<Unite[]>> {
  try {
    // Use service role client for consistent data access
    
    const { data, error } = await supabase
      .from('unites')
      .select('*')
      .eq('propriete_id', proprieteId)
      .order('numero', { ascending: true })
    
    if (error) {
      console.error('Error fetching unites:', error)
      return { success: false, error: 'Erreur lors de la récupération des unités' }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getProprieteUnites:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Archive a property
 */
export async function archivePropriete(proprieteId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('proprietes')
      .update({ statut: 'archive' })
      .eq('id', proprieteId)
    
    if (error) {
      console.error('Error archiving property:', error)
      return { success: false, error: 'Erreur lors de l\'archivage' }
    }
    
    revalidatePath('/proprietes')
    revalidatePath(`/proprietes/${proprieteId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error in archivePropriete:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Duplicate a property
 */
export async function duplicatePropriete(proprieteId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()
    
    // Get original property
    const { data: original, error: fetchError } = await supabase
      .from('proprietes')
      .select('*')
      .eq('id', proprieteId)
      .single()
    
    if (fetchError || !original) {
      return { success: false, error: 'Propriété introuvable' }
    }
    
    // Create duplicate
    const { id, reference, created_at, updated_at, ...propertyData } = original
    const duplicate = {
      ...propertyData,
      nom: `${original.nom} (Copie)`,
      statut: 'brouillon'
    }
    
    const { data, error } = await supabase
      .from('proprietes')
      .insert(duplicate)
      .select()
      .single()
    
    if (error) {
      console.error('Error duplicating property:', error)
      return { success: false, error: 'Erreur lors de la duplication' }
    }
    
    revalidatePath('/proprietes')
    
    return { success: true, data: { id: data.id } }
  } catch (error) {
    console.error('Error in duplicatePropriete:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Change property status
 */
export async function changeProprieteStatut(
  proprieteId: string,
  newStatus: 'brouillon' | 'sourcing' | 'negociation' | 'actif' | 'archive'
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('proprietes')
      .update({ statut: newStatus })
      .eq('id', proprieteId)
    
    if (error) {
      console.error('Error changing status:', error)
      return { success: false, error: 'Erreur lors du changement de statut' }
    }
    
    revalidatePath('/proprietes')
    revalidatePath(`/proprietes/${proprieteId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error in changeProprieteStatut:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Restore archived property (archive -> actif)
 */
export async function restorePropriete(proprieteId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('proprietes')
      .update({ statut: 'actif' })
      .eq('id', proprieteId)
    
    if (error) {
      console.error('Error restoring property:', error)
      return { success: false, error: 'Erreur lors de la restauration de la propriété' }
    }
    
    revalidatePath('/proprietes')
    revalidatePath('/proprietes/archives')
    revalidatePath(`/proprietes/${proprieteId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error in restorePropriete:', error)
    return { success: false, error: 'Erreur inattendue lors de la restauration' }
  }
}

/**
 * Hard delete property (permanent deletion from database)
 */
export async function deleteProprieteHard(
  id: string, 
  forceDelete: boolean = false
): Promise<ActionResult> {
  try {
    // Check if can delete (using existing RPC function)
    const { data: canDelete, error: checkError } = await supabase
      .rpc('can_delete_propriete', { propriete_id: id })

    if (checkError) {
      console.error('Error checking delete permission:', checkError)
      return { success: false, error: 'Erreur lors de la vérification des permissions' }
    }

    if (!canDelete && !forceDelete) {
      return { 
        success: false, 
        error: 'Cette propriété ne peut pas être supprimée car elle a des données associées (unités, réservations, etc.)' 
      }
    }

    // Perform hard delete (cascade will handle related records)
    const { error } = await supabase
      .from('proprietes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error hard deleting propriete:', error)
      if (error.code === '23503') {
        return { 
          success: false, 
          error: 'Impossible de supprimer : des données sont encore liées à cette propriété' 
        }
      }
      return { success: false, error: 'Erreur lors de la suppression définitive' }
    }

    revalidatePath('/proprietes')
    revalidatePath('/proprietes/archives')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in deleteProprieteHard:', error)
    return { success: false, error: 'Erreur inattendue lors de la suppression' }
  }
}

// Export types
export type {
  Propriete,
  Unite,
  ProprieteProprietaire,
  ProprietePhoto,
  ProprieteListItem
} from '@/lib/validations/proprietes'

// =============================================
// FORM ACTIONS (for use with useFormState)
// =============================================

/**
 * Server action for creating propriété with form
 */
export async function createProprieteAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData)
    const result = await createPropriete(data as any)
    
    if (result.success && result.data) {
      redirect(`/proprietes/${result.data.id}`)
    }
    
    return result
  } catch (error) {
    console.error('Error in createProprieteAction:', error)
    return { success: false, error: 'Erreur lors de la création' }
  }
}

/**
 * Server action for updating propriété with form
 */
export async function updateProprieteAction(
  id: string,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const data = Object.fromEntries(formData)
    const result = await updatePropriete(id, data as any)
    
    if (result.success) {
      redirect(`/proprietes/${id}`)
    }
    
    return result
  } catch (error) {
    console.error('Error in updateProprieteAction:', error)
    return { success: false, error: 'Erreur lors de la mise à jour' }
  }
}

/**
 * Server action for deleting propriété
 */
export async function deleteProprieteAction(id: string): Promise<ActionResult> {
  try {
    const result = await deletePropriete(id)
    
    if (result.success) {
      redirect('/proprietes')
    }
    
    return result
  } catch (error) {
    console.error('Error in deleteProprieteAction:', error)
    return { success: false, error: 'Erreur lors de la suppression' }
  }
}