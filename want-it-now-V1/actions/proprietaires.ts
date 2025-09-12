'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { 
  createProprietaireSchema,
  createProprietaireDraftSchema,
  updateProprietaireSchema,
  createAssocieSchema,
  updateAssocieSchema,
  transformProprietaireFormData,
  transformAssocieFormData,
  preprocessFormData,
  PROPRIETAIRE_ERRORS,
  type CreateProprietaire,
  type CreateProprietaireDraft,
  type UpdateProprietaire,
  type CreateAssocie,
  type UpdateAssocie,
  type Proprietaire,
  type ProprietaireWithStats,
  type Associe
} from '@/lib/validations/proprietaires'

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

export async function getProprietairesArchives(): Promise<ProprietaireWithStats[]> {
  const supabase = await createSupabaseServerClient()
  
  try {
    await checkProprietairePermissions(supabase, 'read')
    
    // Utiliser directement la table proprietaires car la vue filtre WHERE is_active = true
    console.log('🔍 [DEBUG] Fetching archived proprietaires from table directly...')
    const { data: proprietaires, error } = await supabase
      .from('proprietaires')
      .select('*')
      .eq('is_active', false)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching archived proprietaires:', error)
      throw new Error('Impossible de récupérer les propriétaires archivés')
    }

    console.log('✅ [DEBUG] Found archived proprietaires:', proprietaires?.length || 0)
    
    // Transformer les données pour ajouter les champs calculés comme dans la vue
    const proprietairesWithStats: ProprietaireWithStats[] = (proprietaires || []).map(p => ({
      ...p,
      nom_complet: p.type === 'physique' 
        ? `${p.prenom || ''} ${p.nom}`.trim()
        : p.nom,
      nombre_associes: p.type === 'morale' ? null : null, // TODO: calculer si nécessaire
      capital_completion_percent: null, // TODO: calculer si nécessaire  
      statut: p.is_brouillon ? 'brouillon' : 'complet'
    }))

    console.log('📋 [DEBUG] Returning proprietaires with stats:', proprietairesWithStats.length)
    return proprietairesWithStats
  } catch (error) {
    console.error('Error in getProprietairesArchives:', error)
    throw error
  }
}

// ==============================================================================
// TYPES
// ==============================================================================

export type ActionResult<T = any> = {
  ok: boolean        // Conforming to {ok: boolean} format like organisations
  data?: T
  error?: string
}

async function createSupabaseServerClient() {
  return createClient()
}

// Vérifier les permissions pour les opérations sur les propriétaires
// Les propriétaires sont des entités indépendantes, non liées aux organisations
async function checkProprietairePermissions(supabase: any, action: 'read' | 'write' | 'delete') {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Utilisateur non authentifié')
  }

  // Pour les propriétaires (entités indépendantes), tout utilisateur authentifié peut :
  // - Lire les propriétaires
  // - Créer/modifier des propriétaires
  // Seuls les super_admin peuvent supprimer
  
  switch (action) {
    case 'read':
      return true  // Tout utilisateur authentifié peut consulter les propriétaires
    case 'write':
      return true  // Tout utilisateur authentifié peut créer/modifier des propriétaires
    case 'delete':
      // Seuls les super_admin peuvent supprimer
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
      const roles = userRoles?.map(r => r.role) || []
      return roles.includes('super_admin')
    default:
      return false
  }
}

// ==============================================================================
// PROPRIETAIRES CRUD OPERATIONS
// ==============================================================================

/**
 * Récupérer tous les propriétaires accessibles
 */
export async function getProprietaires(filters: {
  search?: string
  typeFilter?: 'physique' | 'morale' | 'all'
  hideBrouillons?: boolean
  hideInactive?: boolean
  onlyBrouillons?: boolean
} = {}): Promise<ProprietaireWithStats[]> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'read')
    if (!hasPermission) {
      console.error('Permission denied for getProprietaires')
      return [] // Return empty array instead of throwing
    }

    // Destructurer les filtres avec des valeurs par défaut
    const {
      search = '',
      typeFilter = 'all',
      hideBrouillons = false,
      hideInactive = false,
      onlyBrouillons = false
    } = filters

    // Utiliser la vue enrichie proprietaires_with_stats_v pour de meilleures performances
    // et des données enrichies (nom_complet, nombre_associés, etc.)
    let query = supabase
      .from('proprietaires_with_stats_v')
      .select('*')
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (hideInactive) {
      query = query.eq('is_active', true)
    }
    
    if (hideBrouillons) {
      query = query.eq('is_brouillon', false)
    }
    
    if (onlyBrouillons) {
      query = query.eq('is_brouillon', true)
    }
    
    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('type', typeFilter)
    }
    
    if (search && search.length > 0) {
      query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des propriétaires (vue):', error)
      
      // Fallback vers la table directe si la vue échoue
      console.log('Tentative avec table directe...')
      let fallbackQuery = supabase
        .from('proprietaires')
        .select('*')
        .order('created_at', { ascending: false })
        
      // Appliquer les mêmes filtres au fallback
      if (hideInactive) {
        fallbackQuery = fallbackQuery.eq('is_active', true)
      }
      
      if (hideBrouillons) {
        fallbackQuery = fallbackQuery.eq('is_brouillon', false)
      }
      
      if (onlyBrouillons) {
        fallbackQuery = fallbackQuery.eq('is_brouillon', true)
      }
      
      if (typeFilter && typeFilter !== 'all') {
        fallbackQuery = fallbackQuery.eq('type', typeFilter)
      }
      
      if (search && search.length > 0) {
        fallbackQuery = fallbackQuery.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,email.ilike.%${search}%`)
      }
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery
        
      if (fallbackError) {
        console.error('Erreur fallback proprietaires:', fallbackError)
        return []
      }
      
      return fallbackData || []
    }

    return data || []
  } catch (error) {
    console.error('Erreur getProprietaires:', error)
    // Always return an array to prevent undefined errors
    return []
  }
}

/**
 * Récupérer un propriétaire par ID avec détails
 */
export async function getProprietaireById(id: string): Promise<ProprietaireWithStats | null> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'read')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Utiliser directement la table proprietaires
    const { data, error } = await supabase
      .from('proprietaires')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Propriétaire non trouvé
      }
      console.error('Erreur lors de la récupération du propriétaire:', error)
      throw new Error('Erreur lors de la récupération du propriétaire')
    }

    return data
  } catch (error) {
    console.error('Erreur getProprietaireById:', error)
    throw error
  }
}

/**
 * Rechercher des propriétaires par nom/prénom
 */
export async function searchProprietaires(query: string): Promise<any[]> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'read')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Recherche simple sur la table proprietaires directement
    const { data, error } = await supabase
      .from('proprietaires')
      .select('*')
      .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Erreur lors de la recherche de propriétaires:', error)
      throw new Error('Erreur lors de la recherche')
    }

    return data || []
  } catch (error) {
    console.error('Erreur searchProprietaires:', error)
    throw error
  }
}

// ==============================================================================
// PAGINATION OPTIMISÉE
// ==============================================================================

export async function getProprietairesPaginated(options: {
  page?: number
  pageSize?: number
  typeFilter?: 'physique' | 'morale' | null
  hideBrouillons?: boolean
  hideInactive?: boolean
} = {}): Promise<{
  data: any[]
  totalCount: number
  currentPage: number
  totalPages: number
}> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'read')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    const {
      page = 1,
      pageSize = 20,
      typeFilter = null,
      hideBrouillons = false,
      hideInactive = false
    } = options

    // Utiliser la fonction de pagination optimisée
    const { data, error } = await supabase.rpc('get_proprietaires_paginated', {
      page_number: page,
      page_size: pageSize,
      type_filter: typeFilter,
      hide_brouillons: hideBrouillons,
      hide_inactive: hideInactive
    })

    if (error) {
      console.error('Erreur lors de la pagination des propriétaires:', error)
      throw new Error('Erreur lors de la récupération paginée')
    }

    if (!data || data.length === 0) {
      return {
        data: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0
      }
    }

    const totalCount = data[0]?.total_count || 0
    const totalPages = Math.ceil(totalCount / pageSize)

    // Nettoyer les données (supprimer total_count de chaque élément)
    const cleanData = data.map(({ total_count, ...item }) => item)

    return {
      data: cleanData,
      totalCount,
      currentPage: page,
      totalPages
    }
  } catch (error) {
    console.error('Erreur getProprietairesPaginated:', error)
    throw error
  }
}

/**
 * Créer un nouveau propriétaire
 */
export async function createProprietaire(formData: CreateProprietaire) {
  console.log('🚀 [DEBUG] DEBUT createProprietaire - fonction appelée !')
  console.log('📋 [DEBUG] FormData reçu:', JSON.stringify(formData, null, 2))
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'write')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Préserver le statut brouillon de la formData originale
    const isBrouillon = formData.is_brouillon || false
    console.log('📝 [DEBUG] Mode brouillon détecté:', isBrouillon)

    // Preprocesser les données du formulaire
    console.log('🔍 [DEBUG] Avant preprocessing...')
    const preprocessedData = preprocessFormData(formData)
    console.log('📋 [DEBUG] FormData après preprocessing:', JSON.stringify(preprocessedData, null, 2))
    
    // Valider les données avec schéma approprié selon mode brouillon
    console.log('🔍 [DEBUG] Avant validation Zod...')
    const schemaToUse = isBrouillon ? createProprietaireDraftSchema : createProprietaireSchema
    console.log('📝 [DEBUG] Schéma utilisé:', isBrouillon ? 'DRAFT (brouillon)' : 'COMPLET (normal)')
    const validatedData = schemaToUse.parse(preprocessedData)
    
    // Séparer les données des associés
    const { associes, ...proprietaireData } = validatedData.type === 'morale' 
      ? validatedData as any 
      : { associes: [], ...validatedData }
    
    const transformedData = transformProprietaireFormData(proprietaireData)

    // Obtenir l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser()

    // Pour les brouillons physiques, ajouter des valeurs minimales pour satisfaire les contraintes DB
    let insertData = {
      ...transformedData,
      // Convertir les chaînes vides en null pour les dates et champs optionnels
      date_naissance: transformedData.date_naissance === '' ? null : transformedData.date_naissance,
      lieu_naissance: transformedData.lieu_naissance === '' ? null : transformedData.lieu_naissance,
      email: transformedData.email === '' ? null : transformedData.email,
      telephone: transformedData.telephone === '' ? null : transformedData.telephone,
      adresse: transformedData.adresse === '' ? null : transformedData.adresse,
      code_postal: transformedData.code_postal === '' ? null : transformedData.code_postal,
      ville: transformedData.ville === '' ? null : transformedData.ville,
      iban: transformedData.iban === '' ? null : transformedData.iban,
      account_holder_name: transformedData.account_holder_name === '' ? null : transformedData.account_holder_name,
      bank_name: transformedData.bank_name === '' ? null : transformedData.bank_name,
      swift_bic: transformedData.swift_bic === '' ? null : transformedData.swift_bic,
      is_brouillon: isBrouillon, // Ajouter explicitement le statut brouillon
      created_by: user?.id,
      updated_by: user?.id,
    }

    // HACK TEMPORAIRE: Pour les brouillons personne physique, ajouter des valeurs minimales 
    // pour satisfaire les contraintes DB en attendant la migration
    if (isBrouillon && transformedData.type === 'physique') {
      console.log('🔧 [DEBUG] HACK: Condition détectée - brouillon physique')
      console.log('🔧 [DEBUG] HACK: Valeurs avant:', {
        date_naissance: insertData.date_naissance,
        lieu_naissance: insertData.lieu_naissance,
        nationalite: insertData.nationalite
      })
      
      insertData = {
        ...insertData,
        date_naissance: insertData.date_naissance || '1990-01-01', // Date par défaut
        lieu_naissance: insertData.lieu_naissance || 'TBD', // "To Be Determined"
        nationalite: insertData.nationalite || 'TBD', // "To Be Determined"
      }
      
      console.log('🔧 [DEBUG] HACK: Valeurs après:', {
        date_naissance: insertData.date_naissance,
        lieu_naissance: insertData.lieu_naissance,
        nationalite: insertData.nationalite
      })
      console.log('🔧 [DEBUG] HACK: Ajout valeurs minimales pour contrainte DB physique')
    }

    console.log('💾 [DEBUG] Données proprietaire à insérer:', JSON.stringify(insertData, null, 2))

    // Insérer le propriétaire
    const { data: proprietaire, error } = await supabase
      .from('proprietaires')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('❌ [DEBUG] Erreur lors de la création du propriétaire:', error)
      throw new Error('Erreur lors de la création du propriétaire')
    }

    console.log('✅ [DEBUG] Propriétaire créé:', proprietaire.id, 'is_brouillon:', proprietaire.is_brouillon)

    // Si personne morale avec associés, les créer
    if (validatedData.type === 'morale' && associes && associes.length > 0) {
      console.log(`👥 [DEBUG] Création de ${associes.length} associés...`)
      
      for (const associe of associes) {
        console.log('👤 [DEBUG] Création associé:', associe.nom)
        
        const associeData = {
          proprietaire_id: proprietaire.id,
          nom: associe.nom,
          prenom: associe.prenom || null,
          date_naissance: associe.date_naissance || null,
          parts_nombre: associe.parts_nombre,
          parts_pourcentage: associe.parts_pourcentage,
          is_active: true,
          created_by: user?.id,
          updated_by: user?.id,
        }

        const { error: associeError } = await supabase
          .from('associes')
          .insert(associeData)

        if (associeError) {
          console.error('❌ [DEBUG] Erreur création associé:', associeError)
          // Ne pas interrompre - continuer avec les autres associés
        } else {
          console.log('✅ [DEBUG] Associé créé:', associe.nom)
        }
      }
    }

    // Revalider les caches
    revalidatePath('/proprietaires')
    revalidatePath('/proprietaires/new')
    revalidatePath('/proprietaires/brouillons')

    return { success: true, data: proprietaire }
  } catch (error) {
    console.error('❌ [DEBUG] Erreur createProprietaire:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Erreur lors de la création du propriétaire' }
  }
}

/**
 * Mettre à jour un propriétaire
 */
export async function updateProprietaire(id: string, formData: Partial<CreateProprietaire>) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'write')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Valider les données
    const validatedData = updateProprietaireSchema.parse({ id, ...formData })
    const { id: _, ...updateData } = validatedData
    const transformedData = transformProprietaireFormData(updateData as CreateProprietaire)

    // Obtenir l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser()

    // Mettre à jour le propriétaire
    const { data, error } = await supabase
      .from('proprietaires')
      .update({
        ...transformedData,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du propriétaire:', error)
      
      if (error.code === 'PGRST116') {
        throw new Error(PROPRIETAIRE_ERRORS.NOT_FOUND)
      }
      
      throw new Error('Erreur lors de la mise à jour du propriétaire')
    }

    // Revalider les caches
    revalidatePath('/proprietaires')
    revalidatePath(`/proprietaires/${id}`)
    revalidatePath(`/proprietaires/${id}/edit`)

    return { success: true, data }
  } catch (error) {
    console.error('Erreur updateProprietaire:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Erreur lors de la mise à jour du propriétaire' }
  }
}

/**
 * Désactiver un propriétaire (Soft Delete)
 */
export async function deactivateProprietaire(id: string): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'write')
    if (!hasPermission) {
      return { ok: false, error: PROPRIETAIRE_ERRORS.UNAUTHORIZED }
    }

    // Check if proprietaire exists and is active
    const { data: proprietaire } = await supabase
      .from('proprietaires')
      .select('id, nom, prenom, type, is_active')
      .eq('id', id)
      .single()

    if (!proprietaire) {
      return { ok: false, error: PROPRIETAIRE_ERRORS.NOT_FOUND }
    }

    if (!proprietaire.is_active) {
      return { ok: false, error: 'Ce propriétaire est déjà désactivé' }
    }

    // Get current user for audit
    const { data: { user } } = await supabase.auth.getUser()

    // Direct database update for soft delete (instead of RPC call)
    const { error } = await supabase
      .from('proprietaires')
      .update({ 
        is_active: false,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error deactivating proprietaire:', error)
      return { ok: false, error: error.message || 'Erreur lors de la désactivation du propriétaire' }
    }

    // Revalidate multiple paths to ensure cache is cleared
    revalidatePath('/proprietaires', 'page')
    revalidatePath('/proprietaires/archives', 'page')
    revalidatePath('/proprietaires', 'layout')
    revalidatePath('/', 'layout')
    return { 
      ok: true, 
      data: {
        proprietaire_id: id,
        proprietaire_nom: `${proprietaire.nom}${proprietaire.prenom ? ' ' + proprietaire.prenom : ''}`,
        archived_at: new Date().toISOString(),
        message: `Propriétaire "${proprietaire.nom}${proprietaire.prenom ? ' ' + proprietaire.prenom : ''}" désactivé avec succès`
      }
    }
  } catch (error) {
    console.error('Unexpected error in deactivateProprietaire:', error)
    return { ok: false, error: 'Erreur inattendue lors de la désactivation' }
  }
}

/**
 * Réactiver un propriétaire
 */
export async function reactivateProprietaire(id: string): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'write')
    if (!hasPermission) {
      return { ok: false, error: PROPRIETAIRE_ERRORS.UNAUTHORIZED }
    }

    // Check if proprietaire exists and is inactive
    const { data: proprietaire } = await supabase
      .from('proprietaires')
      .select('id, nom, prenom, type, is_active')
      .eq('id', id)
      .single()

    if (!proprietaire) {
      return { ok: false, error: PROPRIETAIRE_ERRORS.NOT_FOUND }
    }

    if (proprietaire.is_active) {
      return { ok: false, error: 'Ce propriétaire est déjà actif' }
    }

    // Use database function for reactivation (similar to organisations)
    const { data, error } = await supabase
      .rpc('reactivate_proprietaire', { prop_id: id })

    if (error) {
      console.error('Error reactivating proprietaire:', error)
      return { ok: false, error: error.message || 'Erreur lors de la réactivation du propriétaire' }
    }

    // Revalidate multiple paths to ensure cache is cleared
    revalidatePath('/proprietaires', 'page')
    revalidatePath('/proprietaires', 'layout')
    revalidatePath('/', 'layout')
    return { 
      ok: true, 
      data: {
        ...data,
        message: `Propriétaire "${proprietaire.nom}${proprietaire.prenom ? ' ' + proprietaire.prenom : ''}" réactivé avec succès`
      }
    }
  } catch (error) {
    console.error('Unexpected error in reactivateProprietaire:', error)
    return { ok: false, error: 'Erreur inattendue lors de la réactivation' }
  }
}

/**
 * Obtenir l'impact de suppression d'un propriétaire
 */
export async function getDeletionImpact(id: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'read')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Utiliser la nouvelle fonction RPC pour analyser l'impact complet
    const { data: impactData, error: rpcError } = await supabase
      .rpc('get_proprietaire_deletion_impact', { prop_id: id })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error('Erreur lors de l\'analyse d\'impact de suppression')
    }

    if (!impactData) {
      throw new Error(PROPRIETAIRE_ERRORS.NOT_FOUND)
    }

    // Vérifier s'il y a une erreur dans la réponse RPC
    if (impactData.error) {
      throw new Error(impactData.error)
    }

    // Transformer les données pour notre interface
    const impact = {
      can_delete: impactData.can_delete,
      proprietaire: impactData.proprietaire,
      blocking_reason: !impactData.can_delete ? 
        `Ce propriétaire ne peut pas être supprimé car il possède ${impactData.impacts.nb_proprietes} propriété(s) et ${impactData.impacts.nb_associes} associé(s)` : 
        null,
      impact: {
        properties_count: impactData.impacts.nb_proprietes || 0,
        associates_count: impactData.impacts.nb_associes || 0,
        contracts_count: impactData.impacts.nb_contrats || 0,
        properties: impactData.proprietes || [],
        associates: impactData.associes || [],
        contracts: impactData.contrats || []
      }
    }

    return { success: true, data: impact }
  } catch (error) {
    console.error('Erreur getDeletionImpact:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Erreur lors de l\'analyse d\'impact' }
  }
}

/**
 * Supprimer définitivement un propriétaire (Hard Delete)
 */
export async function deleteProprietaireHard(id: string, forceDelete = false) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions (nécessite permission admin pour hard delete)
    const hasPermission = await checkProprietairePermissions(supabase, 'delete')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Utiliser la fonction RPC spécialisée pour suppression définitive depuis archives
    const { data: result, error: rpcError } = await supabase
      .rpc('delete_archived_proprietaire_permanently', { 
        prop_id: id
      })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error('Erreur lors de la suppression du propriétaire')
    }

    if (!result) {
      throw new Error('Aucune réponse de la fonction de suppression')
    }

    // La fonction RPC retourne déjà un objet avec success/error
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Erreur inconnue lors de la suppression',
        message: result.message,
        impactAnalysis: result.impact_analysis
      }
    }

    // Succès
    return {
      success: true,
      message: result.message,
      deletionType: result.deletion_type // 'soft_delete' ou 'hard_delete'
    }

  } catch (error) {
    console.error('Erreur deleteProprietaireHard:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Erreur lors de la suppression définitive' }
  }
}

/**
 * Vérifier si un propriétaire peut être supprimé
 */
export async function canDeleteProprietaire(id: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'read')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Utiliser la fonction RPC
    const { data: canDelete, error: rpcError } = await supabase
      .rpc('can_delete_proprietaire', { prop_id: id })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error('Erreur lors de la vérification des droits de suppression')
    }

    return { success: true, data: { can_delete: canDelete || false } }
  } catch (error) {
    console.error('Erreur canDeleteProprietaire:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Erreur lors de la vérification' }
  }
}

/**
 * Marquer un propriétaire comme brouillon/complet
 */
export async function toggleProprietaireBrouillon(id: string, isBrouillon: boolean) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'write')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Obtenir l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser()

    // Mettre à jour le statut brouillon
    const { data, error } = await supabase
      .from('proprietaires')
      .update({
        is_brouillon: isBrouillon,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors du changement de statut brouillon:', error)
      
      if (error.code === 'PGRST116') {
        throw new Error(PROPRIETAIRE_ERRORS.NOT_FOUND)
      }
      
      throw new Error('Erreur lors du changement de statut')
    }

    // Revalider les caches
    revalidatePath('/proprietaires')
    revalidatePath(`/proprietaires/${id}`)

    return { success: true, data }
  } catch (error) {
    console.error('Erreur toggleProprietaireBrouillon:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Erreur lors du changement de statut' }
  }
}

/**
 * Mettre à jour le statut d'un propriétaire (archive/active)
 */
export async function updateProprietaireStatus(
  id: string,
  statut: 'active' | 'archive'
): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'write')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Obtenir l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('proprietaires')
      .update({ 
        is_active: statut === 'active',
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating proprietaire status:', error)
      return { ok: false, error: 'Erreur lors de la mise à jour du statut' }
    }

    revalidatePath('/proprietaires')
    revalidatePath(`/proprietaires/${id}`)
    return { ok: true }
  } catch (error) {
    console.error('Unexpected error in updateProprietaireStatus:', error)
    return { ok: false, error: 'Erreur inattendue' }
  }
}

// ==============================================================================
// ASSOCIES CRUD OPERATIONS
// ==============================================================================

/**
 * Récupérer les associés d'un propriétaire
 */
export async function getAssocies(proprietaireId: string): Promise<Associe[]> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'read')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    const { data, error } = await supabase
      .from('associes')
      .select('*')
      .eq('proprietaire_id', proprietaireId)
      .eq('is_active', true)
      .order('ordre_affichage')

    if (error) {
      console.error('Erreur lors de la récupération des associés:', error)
      throw new Error('Erreur lors de la récupération des associés')
    }

    return data || []
  } catch (error) {
    console.error('Erreur getAssocies:', error)
    throw error
  }
}

/**
 * Créer un nouveau associé
 */
export async function createAssocie(proprietaireId: string, formData: CreateAssocie) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'write')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Valider les données
    const validatedData = createAssocieSchema.parse(formData)
    const transformedData = transformAssocieFormData(validatedData)

    // Obtenir l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser()

    // Préparer les données pour insertion
    const insertData = {
      ...transformedData,
      proprietaire_id: proprietaireId,
      created_by: user?.id,
      updated_by: user?.id,
    }

    // Insérer l'associé (le trigger validera les quotités)
    const { data, error } = await supabase
      .from('associes')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création de l\'associé:', error)
      
      // Extraire les erreurs de validation des quotités
      if (error.message.includes('dépasse le capital social')) {
        throw new Error(PROPRIETAIRE_ERRORS.CAPITAL_EXCEEDED)
      }
      
      throw new Error('Erreur lors de la création de l\'associé')
    }

    // Revalider les caches
    revalidatePath('/proprietaires')
    revalidatePath(`/proprietaires/${proprietaireId}`)

    return { success: true, data }
  } catch (error) {
    console.error('Erreur createAssocie:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Erreur lors de la création de l\'associé' }
  }
}

/**
 * Mettre à jour un associé
 */
export async function updateAssocie(id: string, formData: Partial<CreateAssocie>) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'write')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Valider les données
    const validatedData = updateAssocieSchema.partial().parse({ id, ...formData })
    const { id: _, proprietaire_id, ...updateData } = validatedData
    const transformedData = transformAssocieFormData(updateData as CreateAssocie)

    // Obtenir l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser()

    // Mettre à jour l'associé (le trigger validera les quotités)
    const { data, error } = await supabase
      .from('associes')
      .update({
        ...transformedData,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'associé:', error)
      
      if (error.code === 'PGRST116') {
        throw new Error(PROPRIETAIRE_ERRORS.ASSOCIE_NOT_FOUND)
      }
      
      // Extraire les erreurs de validation des quotités
      if (error.message.includes('dépasse le capital social')) {
        throw new Error(PROPRIETAIRE_ERRORS.CAPITAL_EXCEEDED)
      }
      
      throw new Error('Erreur lors de la mise à jour de l\'associé')
    }

    // Revalider les caches
    revalidatePath('/proprietaires')
    revalidatePath(`/proprietaires/${data.proprietaire_id}`)

    return { success: true, data }
  } catch (error) {
    console.error('Erreur updateAssocie:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Erreur lors de la mise à jour de l\'associé' }
  }
}

/**
 * Supprimer un associé
 */
export async function deleteAssocie(id: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'write')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Récupérer l'associé pour obtenir le proprietaire_id
    const { data: associe, error: getError } = await supabase
      .from('associes')
      .select('proprietaire_id')
      .eq('id', id)
      .single()

    if (getError) {
      if (getError.code === 'PGRST116') {
        throw new Error(PROPRIETAIRE_ERRORS.ASSOCIE_NOT_FOUND)
      }
      throw new Error('Erreur lors de la récupération de l\'associé')
    }

    // Supprimer l'associé
    const { error } = await supabase
      .from('associes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression de l\'associé:', error)
      throw new Error('Erreur lors de la suppression de l\'associé')
    }

    // Revalider les caches
    revalidatePath('/proprietaires')
    revalidatePath(`/proprietaires/${associe.proprietaire_id}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur deleteAssocie:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Erreur lors de la suppression de l\'associé' }
  }
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Obtenir les statistiques du capital d'un propriétaire morale
 */
export async function getCapitalStats(proprietaireId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Vérifier les permissions
    const hasPermission = await checkProprietairePermissions(supabase, 'read')
    if (!hasPermission) {
      throw new Error(PROPRIETAIRE_ERRORS.UNAUTHORIZED)
    }

    // Utiliser la fonction helper de la base de données
    const { data: completionPercent, error } = await supabase
      .rpc('get_capital_completion_percent', { prop_id: proprietaireId })

    if (error) {
      console.error('Erreur lors du calcul des statistiques:', error)
      throw new Error('Erreur lors du calcul des statistiques')
    }

    return { success: true, completionPercent }
  } catch (error) {
    console.error('Erreur getCapitalStats:', error)
    
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Erreur lors du calcul des statistiques' }
  }
}

/**
 * Redirection vers la liste des propriétaires
 */
export async function redirectToProprietaires() {
  redirect('/proprietaires')
}

/**
 * Redirection vers le détail d'un propriétaire
 */
export async function redirectToProprietaireDetail(id: string) {
  redirect(`/proprietaires/${id}`)
}