'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { z } from 'zod'
import type {
  Contrat,
  ContratAvecRelations,
  ProprietaireAvecQuotite,
  CreateContratRequest,
  UpdateContratRequest,
  ContratFilters,
  ContratQueryOptions,
  ContratStatistics,
  DisponibiliteCheck,
  ContratResponse,
  ContratsListResponse
} from '@/types/contrats'
import { 
  getOrganizationDisplayName, 
  getOrganizationDisplayInfo,
  getCountryFlag 
} from '@/lib/utils/organization-helpers'

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
  errors?: Array<{ field: string; message: string }>
}

// Validation schemas for contracts
const createContratSchema = z.object({
  organisation_id: z.string().uuid('ID d\'organisation invalide'),
  propriete_id: z.string().uuid().optional().nullable(),
  unite_id: z.string().uuid().optional().nullable(),
  type_contrat: z.enum(['fixe', 'variable'], {
    errorMap: () => ({ message: 'Type de contrat invalide (fixe ou variable)' })
  }),
  date_emission: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Date d\'émission invalide'
  }).optional(),
  date_debut: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Date de début invalide'
  }),
  date_fin: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Date de fin invalide'
  }),
  meuble: z.boolean().default(false),
  autorisation_sous_location: z.boolean().default(true),
  besoin_renovation: z.boolean().default(false),
  deduction_futurs_loyers: z.number().min(0).optional().nullable(),
  duree_imposee_mois: z.number().int().min(1).max(120).optional().nullable(),
  commission_pourcentage: z.number().min(0).max(100).default(10.00),
  usage_proprietaire_jours_max: z.number().int().min(0).max(365).default(60)
}).superRefine((data, ctx) => {
  // Validation exclusive: propriété OU unité
  if (!data.propriete_id && !data.unite_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Un contrat doit être lié soit à une propriété soit à une unité',
      path: ['target_selection']
    })
  }
  
  if (data.propriete_id && data.unite_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Un contrat ne peut pas être lié à la fois à une propriété et à une unité',
      path: ['target_selection']
    })
  }
  
  // Validation dates cohérentes
  const dateEmission = data.date_emission ? new Date(data.date_emission) : new Date()
  const dateDebut = new Date(data.date_debut)
  const dateFin = new Date(data.date_fin)
  
  if (dateEmission > dateDebut) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La date d\'émission ne peut pas être postérieure à la date de début',
      path: ['date_emission']
    })
  }
  
  if (dateDebut >= dateFin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La date de début doit être antérieure à la date de fin',
      path: ['date_debut']
    })
  }
  
  // Validation rénovation
  if (data.besoin_renovation && !data.duree_imposee_mois) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La durée imposée est obligatoire si des rénovations sont nécessaires',
      path: ['duree_imposee_mois']
    })
  }
})

const updateContratSchema = createContratSchema.partial().extend({
  id: z.string().uuid('ID de contrat invalide')
})

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Créer un nouveau contrat
 */
export async function createContrat(data: CreateContratRequest): Promise<ActionResult<Contrat>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Validation des données
    const validatedData = createContratSchema.parse(data)
    
    // Vérification de la disponibilité
    const disponibilite = await checkPropertyAvailability({
      propriete_id: validatedData.propriete_id,
      unite_id: validatedData.unite_id,
      date_debut: validatedData.date_debut,
      date_fin: validatedData.date_fin
    })
    
    if (!disponibilite.disponible) {
      return { 
        success: false, 
        error: 'La propriété ou unité n\'est pas disponible pour cette période',
        data: disponibilite.conflits
      }
    }

    // Création du contrat
    const { data: contrat, error } = await supabase
      .from('contrats')
      .insert({
        ...validatedData,
        date_emission: validatedData.date_emission || new Date().toISOString().split('T')[0],
        created_by: authData.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création contrat:', error)
      return { success: false, error: 'Erreur lors de la création du contrat' }
    }

    // Revalidation pour actualiser les listes
    revalidatePath('/contrats')
    revalidatePath(`/contrats/${contrat.id}`)

    return { success: true, data: contrat }

  } catch (error) {
    console.error('Erreur createContrat:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Données invalides',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }

    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Récupérer un contrat par ID avec données des propriétaires
 */
export async function getContratById(id: string): Promise<ActionResult<ContratAvecRelations>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    // 1. Récupérer le contrat de base
    const { data: contrat, error } = await supabase
      .from('contrats_with_org_v')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur récupération contrat:', error)
      return { success: false, error: 'Contrat non trouvé' }
    }

    // 2. Récupérer les propriétaires avec quotités si le contrat a une propriété
    let proprietaires_data: ProprietaireAvecQuotite[] = []
    let quotites_total = 0
    let quotites_valid = false

    if (contrat.propriete_id) {
      const { data: proprietaires, error: propError } = await supabase
        .from('property_ownership')
        .select(`
          quotite_numerateur,
          quotite_denominateur,
          date_debut,
          date_fin,
          is_active,
          proprietaires:proprietaire_id (
            id,
            nom,
            prenom,
            type,
            email,
            telephone,
            adresse,
            forme_juridique,
            numero_identification
          )
        `)
        .eq('propriete_id', contrat.propriete_id)
        .eq('is_active', true)
        .is('date_fin', null) // Quotités actives seulement

      if (!propError && proprietaires) {
        proprietaires_data = proprietaires
          .filter(p => p.proprietaires) // Filtrer les relations nulles
          .map(p => {
            const proprietaire = p.proprietaires as any
            const pourcentage = (p.quotite_numerateur / p.quotite_denominateur) * 100
            quotites_total += pourcentage

            return {
              id: proprietaire.id,
              nom: proprietaire.nom,
              prenom: proprietaire.prenom,
              type: proprietaire.type,
              email: proprietaire.email,
              telephone: proprietaire.telephone,
              adresse: proprietaire.adresse,
              forme_juridique: proprietaire.forme_juridique,
              numero_identification: proprietaire.numero_identification,
              quotite_numerateur: p.quotite_numerateur,
              quotite_denominateur: p.quotite_denominateur,
              pourcentage: Math.round(pourcentage * 100) / 100, // Arrondi à 2 décimales
              date_debut: p.date_debut,
              date_fin: p.date_fin,
              is_active: p.is_active
            }
          })

        // Validation des quotités (tolérance de 0.01% pour les erreurs d'arrondi)
        quotites_valid = Math.abs(quotites_total - 100) <= 0.01
      }
    }

    // 3. Enrichir les données d'organisation
    const organisation_display_name = contrat.organisation_pays 
      ? getOrganizationDisplayName(contrat.organisation_pays)
      : contrat.organisation_nom || 'Organisation inconnue'

    const organisation_country_flag = contrat.organisation_pays 
      ? getCountryFlag(contrat.organisation_pays)
      : '🌍'

    // 4. Construire le résultat enrichi
    const contratEnrichi: ContratAvecRelations = {
      ...contrat,
      proprietaires_data,
      quotites_total: Math.round(quotites_total * 100) / 100,
      quotites_valid,
      organisation_display_name,
      organisation_country_flag
    }

    return { success: true, data: contratEnrichi }

  } catch (error) {
    console.error('Erreur getContratById:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Récupérer la liste des contrats avec filtres
 */
export async function getContrats(
  filters: ContratFilters = {},
  options: ContratQueryOptions = {}
): Promise<ContratsListResponse> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    let query = supabase.from('contrats_with_org_v').select('*', { count: 'exact' })

    // Application des filtres
    if (filters.organisation_id) {
      query = query.eq('organisation_id', filters.organisation_id)
    }
    
    if (filters.propriete_id) {
      query = query.eq('propriete_id', filters.propriete_id)
    }
    
    if (filters.unite_id) {
      query = query.eq('unite_id', filters.unite_id)
    }
    
    if (filters.type_contrat) {
      query = query.eq('type_contrat', filters.type_contrat)
    }
    
    if (filters.meuble !== undefined) {
      query = query.eq('meuble', filters.meuble)
    }
    
    if (filters.date_debut_min) {
      query = query.gte('date_debut', filters.date_debut_min)
    }
    
    if (filters.date_debut_max) {
      query = query.lte('date_debut', filters.date_debut_max)
    }
    
    if (filters.date_fin_min) {
      query = query.gte('date_fin', filters.date_fin_min)
    }
    
    if (filters.date_fin_max) {
      query = query.lte('date_fin', filters.date_fin_max)
    }
    
    // Recherche textuelle
    if (filters.search) {
      query = query.or(`propriete_nom.ilike.%${filters.search}%,unite_nom.ilike.%${filters.search}%,organisation_nom.ilike.%${filters.search}%`)
    }
    
    // Filtre par statut calculé
    if (filters.statut_contrat) {
      const now = new Date().toISOString().split('T')[0]
      switch (filters.statut_contrat) {
        case 'a_venir':
          query = query.gt('date_debut', now)
          break
        case 'en_cours':
          query = query.lte('date_debut', now).gte('date_fin', now)
          break
        case 'termine':
          query = query.lt('date_fin', now)
          break
      }
    }

    // Tri
    const orderBy = options.orderBy || 'created_at'
    const orderDirection = options.orderDirection || 'desc'
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    // Pagination
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data: contrats, error, count } = await query

    if (error) {
      console.error('Erreur récupération contrats:', error)
      return { success: false, error: 'Erreur lors de la récupération des contrats' }
    }

    return { 
      success: true, 
      data: contrats || [], 
      total: count || 0 
    }

  } catch (error) {
    console.error('Erreur getContrats:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Mettre à jour un contrat
 */
export async function updateContrat(data: UpdateContratRequest): Promise<ActionResult<Contrat>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Validation des données
    const validatedData = updateContratSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Si les dates changent, vérifier la disponibilité
    if (updateData.date_debut || updateData.date_fin || updateData.propriete_id || updateData.unite_id) {
      // Récupération du contrat actuel pour les valeurs par défaut
      const { data: currentContrat } = await supabase
        .from('contrats')
        .select('*')
        .eq('id', id)
        .single()

      if (currentContrat) {
        const disponibilite = await checkPropertyAvailability({
          propriete_id: updateData.propriete_id ?? currentContrat.propriete_id,
          unite_id: updateData.unite_id ?? currentContrat.unite_id,
          date_debut: updateData.date_debut ?? currentContrat.date_debut,
          date_fin: updateData.date_fin ?? currentContrat.date_fin,
          exclude_contract_id: id
        })
        
        if (!disponibilite.disponible) {
          return { 
            success: false, 
            error: 'La propriété ou unité n\'est pas disponible pour cette période',
            data: disponibilite.conflits
          }
        }
      }
    }

    // Mise à jour du contrat
    const { data: contrat, error } = await supabase
      .from('contrats')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour contrat:', error)
      return { success: false, error: 'Erreur lors de la mise à jour du contrat' }
    }

    // Revalidation
    revalidatePath('/contrats')
    revalidatePath(`/contrats/${id}`)

    return { success: true, data: contrat }

  } catch (error) {
    console.error('Erreur updateContrat:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Données invalides',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }

    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Supprimer un contrat
 */
export async function deleteContrat(id: string): Promise<ActionResult<void>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { error } = await supabase
      .from('contrats')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur suppression contrat:', error)
      return { success: false, error: 'Erreur lors de la suppression du contrat' }
    }

    // Revalidation
    revalidatePath('/contrats')

    return { success: true }

  } catch (error) {
    console.error('Erreur deleteContrat:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vérifier la disponibilité d'une propriété ou unité
 */
export async function checkPropertyAvailability(params: {
  propriete_id?: string | null
  unite_id?: string | null
  date_debut: string
  date_fin: string
  exclude_contract_id?: string
}): Promise<DisponibiliteCheck> {
  try {
    const { data, error } = await supabase.rpc('check_property_availability', {
      p_propriete_id: params.propriete_id,
      p_unite_id: params.unite_id,
      p_date_debut: params.date_debut,
      p_date_fin: params.date_fin,
      p_exclude_contract_id: params.exclude_contract_id
    })

    if (error) {
      console.error('Erreur vérification disponibilité:', error)
      return { disponible: false }
    }

    // Si disponible (true), pas de conflits
    if (data) {
      return { disponible: true }
    }

    // Si non disponible, récupérer les conflits
    let conflitsQuery = supabase
      .from('contrats')
      .select('id, type_contrat, date_debut, date_fin')

    if (params.propriete_id) {
      conflitsQuery = conflitsQuery.eq('propriete_id', params.propriete_id)
    } else if (params.unite_id) {
      conflitsQuery = conflitsQuery.eq('unite_id', params.unite_id)
    }

    conflitsQuery = conflitsQuery
      .lte('date_debut', params.date_fin)
      .gte('date_fin', params.date_debut)

    if (params.exclude_contract_id) {
      conflitsQuery = conflitsQuery.neq('id', params.exclude_contract_id)
    }

    const { data: conflits } = await conflitsQuery

    return {
      disponible: false,
      conflits: conflits?.map(c => ({
        contrat_id: c.id,
        date_debut: c.date_debut,
        date_fin: c.date_fin,
        type_contrat: c.type_contrat
      })) || []
    }

  } catch (error) {
    console.error('Erreur checkPropertyAvailability:', error)
    return { disponible: false }
  }
}

/**
 * Calculer les statistiques des contrats
 */
export async function getContratStatistics(organisation_id?: string): Promise<ActionResult<ContratStatistics>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    let query = supabase.from('contrats_with_org_v').select('*')
    
    if (organisation_id) {
      query = query.eq('organisation_id', organisation_id)
    }

    const { data: contrats, error } = await query

    if (error) {
      console.error('Erreur statistiques contrats:', error)
      return { success: false, error: 'Erreur lors du calcul des statistiques' }
    }

    const now = new Date()
    const nowStr = now.toISOString().split('T')[0]

    const stats = {
      total_contrats: contrats?.length || 0,
      contrats_actifs: contrats?.filter(c => c.date_debut <= nowStr && c.date_fin >= nowStr).length || 0,
      contrats_termines: contrats?.filter(c => c.date_fin < nowStr).length || 0,
      contrats_a_venir: contrats?.filter(c => c.date_debut > nowStr).length || 0,
      revenus_estimes_mois: 0, // À calculer avec les tarifs réels
      taux_occupation: 0
    }

    // Calcul du taux d'occupation (approximatif)
    if (stats.total_contrats > 0) {
      stats.taux_occupation = Math.round((stats.contrats_actifs / stats.total_contrats) * 100)
    }

    return { success: true, data: stats }

  } catch (error) {
    console.error('Erreur getContratStatistics:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Récupérer les options de sélection pour les propriétés/unités
 */
export async function getPropertyUnitOptions(organisation_id: string) {
  try {
    // Récupération des propriétés
    const { data: proprietes, error: propError } = await supabase
      .from('proprietes')
      .select('id, nom, adresse_ligne1, ville')
      .eq('organisation_id', organisation_id)
      .eq('statut', 'commercialisable')

    // Récupération des unités
    const { data: unites, error: uniteError } = await supabase
      .from('unites')
      .select('id, nom, numero, propriete:proprietes(nom)')
      .in('propriete_id', (proprietes || []).map(p => p.id))
      .eq('statut', 'disponible')

    if (propError || uniteError) {
      console.error('Erreur récupération options:', { propError, uniteError })
      return { success: false, error: 'Erreur lors de la récupération des options' }
    }

    const proprieteOptions = (proprietes || []).map(p => ({
      value: p.id,
      label: p.nom,
      description: `${p.adresse_ligne1}, ${p.ville}`,
      type: 'propriete' as const
    }))

    const uniteOptions = (unites || []).map(u => ({
      value: u.id,
      label: `${u.nom || `Unité ${u.numero}`}`,
      description: `${u.propriete?.nom} - Unité ${u.numero}`,
      type: 'unite' as const
    }))

    return {
      success: true,
      data: {
        proprietes: proprieteOptions,
        unites: uniteOptions
      }
    }

  } catch (error) {
    console.error('Erreur getPropertyUnitOptions:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Récupérer les propriétés pour sélection dans les formulaires
 */
export async function getProprietesForSelection(): Promise<ActionResult<Array<{
  id: string
  nom: string
  adresse_complete: string
  type: string
  superficie_m2?: number
  nb_pieces?: number
  nb_chambres?: number
  nb_sdb?: number
  etage?: number
  annee_construction?: number
  a_unites: boolean
  unites_count?: number
}>>> {
  try {
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { data: proprietes, error } = await supabase
      .from('proprietes_list_v')
      .select(`
        id, nom, adresse, ville, pays, statut, type,
        surface_m2, nombre_pieces, nb_chambres, nb_sdb,
        etage, annee_construction, a_unites, unites_count
      `)
      .in('statut', ['disponible', 'louee', 'achetee']) // Fixed: Use correct enum values
      .order('nom')

    if (error) {
      console.error('Erreur récupération propriétés:', error)
      return { success: false, error: 'Erreur lors de la récupération des propriétés' }
    }

    const formattedProprietes = (proprietes || []).map(p => ({
      id: p.id,
      nom: p.nom,
      adresse_complete: `${p.adresse || ''}, ${p.ville || ''}, ${p.pays || ''}`.replace(/^, |, $|, , /g, '').trim(),
      type: p.type,
      superficie_m2: p.surface_m2,
      nb_pieces: p.nombre_pieces,
      nb_chambres: p.nb_chambres,
      nb_sdb: p.nb_sdb,
      etage: p.etage,
      annee_construction: p.annee_construction,
      a_unites: p.a_unites,
      unites_count: p.unites_count
    }))

    return { success: true, data: formattedProprietes }
  } catch (error) {
    console.error('Erreur récupération propriétés:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Récupérer les unités d'une propriété donnée
 */
export async function getUnitesForProperty(propriete_id: string): Promise<ActionResult<Array<{
  id: string
  nom: string
  numero: string
  description: string
  type: string
  superficie_m2?: number
  nb_pieces?: number
}>>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Validation du paramètre
    if (!propriete_id) {
      return { success: false, error: 'ID propriété requis' }
    }

    // Récupération des unités de la propriété
    const { data: unites, error } = await supabase
      .from('unites')
      .select(`
        id,
        nom,
        numero,
        statut,
        surface_m2,
        nombre_pieces,
        type,
        description,
        propriete:proprietes(nom)
      `)
      .eq('propriete_id', propriete_id)
      .in('statut', ['disponible', 'louee']) // Unités pouvant avoir des contrats
      .order('numero')

    if (error) {
      console.error('Erreur récupération unités:', error)
      return { success: false, error: 'Erreur lors de la récupération des unités' }
    }

    const uniteOptions = (unites || []).map(u => ({
      id: u.id,
      nom: u.nom || `Unité ${u.numero}`,
      numero: u.numero,
      description: u.description || `${u.nom || `Unité ${u.numero}`} - ${u.surface_m2 ? `${u.surface_m2}m²` : ''} - ${u.nombre_pieces ? `${u.nombre_pieces} pièces` : ''}`.trim(),
      type: u.type,
      superficie_m2: u.surface_m2,
      nb_pieces: u.nombre_pieces
    }))

    return { success: true, data: uniteOptions }

  } catch (error) {
    console.error('Erreur getUnitesForProperty:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Sauvegarder un brouillon de contrat
 */
export async function saveDraft(
  data: Partial<CreateContratRequest>,
  draftId?: string
): Promise<ActionResult<{ draftId: string }>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Données du brouillon avec métadonnées
    const draftData = {
      user_id: authData.user.id,
      contrat_data: data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_draft: true
    }

    let result
    if (draftId) {
      // Mise à jour brouillon existant
      const { data: updated, error } = await supabase
        .from('contrats_brouillons')
        .update({
          contrat_data: data,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)
        .eq('user_id', authData.user.id) // Sécurité: seul le propriétaire peut modifier
        .select('id')
        .single()

      if (error) {
        console.error('Erreur mise à jour brouillon:', error)
        return { success: false, error: 'Erreur lors de la sauvegarde du brouillon' }
      }
      result = updated
    } else {
      // Création nouveau brouillon
      const { data: created, error } = await supabase
        .from('contrats_brouillons')
        .insert(draftData)
        .select('id')
        .single()

      if (error) {
        console.error('Erreur création brouillon:', error)
        return { success: false, error: 'Erreur lors de la création du brouillon' }
      }
      result = created
    }

    return { 
      success: true, 
      data: { draftId: result.id }
    }

  } catch (error) {
    console.error('Erreur saveDraft:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Charger un brouillon de contrat
 */
export async function loadDraft(draftId: string): Promise<ActionResult<Partial<CreateContratRequest>>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Validation du paramètre
    if (!draftId) {
      return { success: false, error: 'ID brouillon requis' }
    }

    // Récupération du brouillon
    const { data: draft, error } = await supabase
      .from('contrats_brouillons')
      .select('contrat_data')
      .eq('id', draftId)
      .eq('user_id', authData.user.id) // Sécurité: seul le propriétaire peut lire
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Brouillon non trouvé' }
      }
      console.error('Erreur récupération brouillon:', error)
      return { success: false, error: 'Erreur lors de la récupération du brouillon' }
    }

    return { 
      success: true, 
      data: draft.contrat_data as Partial<CreateContratRequest>
    }

  } catch (error) {
    console.error('Erreur loadDraft:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Lister les brouillons de l'utilisateur
 */
export async function getUserDrafts(): Promise<ActionResult<Array<{
  id: string
  created_at: string
  updated_at: string
  contrat_data: Partial<CreateContratRequest>
}>>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Récupération des brouillons
    const { data: drafts, error } = await supabase
      .from('contrats_brouillons')
      .select('id, created_at, updated_at, contrat_data')
      .eq('user_id', authData.user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération brouillons:', error)
      return { success: false, error: 'Erreur lors de la récupération des brouillons' }
    }

    return { success: true, data: drafts || [] }

  } catch (error) {
    console.error('Erreur getUserDrafts:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Supprimer un brouillon
 */
export async function deleteDraft(draftId: string): Promise<ActionResult<void>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Validation du paramètre
    if (!draftId) {
      return { success: false, error: 'ID brouillon requis' }
    }

    // Suppression du brouillon
    const { error } = await supabase
      .from('contrats_brouillons')
      .delete()
      .eq('id', draftId)
      .eq('user_id', authData.user.id) // Sécurité: seul le propriétaire peut supprimer

    if (error) {
      console.error('Erreur suppression brouillon:', error)
      return { success: false, error: 'Erreur lors de la suppression du brouillon' }
    }

    return { success: true }

  } catch (error) {
    console.error('Erreur deleteDraft:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

/**
 * Détecter l'organisation demandeur basée sur le pays de la propriété
 * Business Rule: Si propriété PT -> Want It Now Portugal, si propriété FR -> Want It Now France
 */
export async function detectOrganisationFromProperty(propertyId: string): Promise<ActionResult<{organisation_id: string, organisation_nom: string}>> {
  try {
    // Vérification authentication
    const authData = await getServerAuthData()
    if (!authData.user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Validation du paramètre
    if (!propertyId) {
      return { success: false, error: 'ID propriété requis' }
    }

    // Récupérer la propriété et son pays
    const { data: property, error: propertyError } = await supabase
      .from('proprietes')
      .select('id, nom, pays, organisation_id')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      console.error('Erreur récupération propriété:', propertyError)
      return { success: false, error: 'Propriété non trouvée' }
    }

    // Récupérer l'organisation Want It Now pour ce pays
    const { data: organisation, error: orgError } = await supabase
      .from('organisations')
      .select('id, nom, pays')
      .eq('pays', property.pays)
      .ilike('nom', 'Want%It%Now%') // Recherche flexible pour "Want It Now"
      .single()

    if (orgError || !organisation) {
      console.error('Erreur récupération organisation:', orgError)
      return { 
        success: false, 
        error: `Organisation Want It Now non trouvée pour le pays ${property.pays}` 
      }
    }

    return {
      success: true,
      data: {
        organisation_id: organisation.id,
        organisation_nom: organisation.nom
      }
    }

  } catch (error) {
    console.error('Erreur detectOrganisationFromProperty:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}
