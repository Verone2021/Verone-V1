'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  createOrganisationSchema,
  updateOrganisationSchema,
  transformOrganisationFormData,
  transformOrganisationEditFormData,
  ORGANISATION_ERRORS,
  type Organisation,
  type CreateOrganisation,
  type UpdateOrganisation,
  type OrganisationFormData,
  type OrganisationEditFormData,
} from '@/lib/validations/organisations'

// Initialize Supabase client with service role for server actions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ACCESS_TOKEN!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Result types for server actions conforming to MCP specification
export type ActionResult<T = any> = {
  ok: boolean        // Conforming to {ok: boolean} format
  data?: T
  error?: string
}

/**
 * Get all organisations (Super Admin only)
 */
export async function getOrganisations(): Promise<ActionResult<Organisation[]>> {
  try {
    // Use server client for authentication (not browser client)
    const { createClient } = await import('@/lib/supabase/server')
    const serverClient = await createClient()
    
    // Get current authenticated user from server context
    const { data: { user }, error: authError } = await serverClient.auth.getUser()
    
    if (authError || !user) {
      return { 
        ok: false, 
        error: 'Utilisateur non authentifié' 
      }
    }

    // Use admin client for efficient querying with proper RLS
    const { createSupabaseAdmin } = await import('@/lib/supabase/admin')
    const adminClient = createSupabaseAdmin()

    // First, check if user is super_admin
    const { data: userRoles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .limit(1)

    if (rolesError) {
      console.error('Error checking super_admin role:', rolesError)
      return { 
        ok: false, 
        error: 'Erreur lors de la vérification des permissions' 
      }
    }

    const isSuperAdmin = userRoles && userRoles.length > 0

    if (isSuperAdmin) {
      // Super admin: get all active organisations
      const { data: organisations, error: orgsError } = await adminClient
        .from('organisations')
        .select('*')
        .eq('is_active', true)
        .order('nom')

      if (orgsError) {
        console.error('Error fetching all organisations:', orgsError)
        return { 
          ok: false, 
          error: 'Erreur lors de la récupération des organisations' 
        }
      }

      return { 
        ok: true, 
        data: organisations || [] 
      }
    } else {
      // Regular user: get organisations they have roles for
      const { data: accessibleOrgs, error: accessError } = await adminClient
        .from('user_roles')
        .select(`
          organisation_id,
          organisations!inner (*)
        `)
        .eq('user_id', user.id)
        .eq('organisations.is_active', true)
        .order('organisations.nom')

      if (accessError) {
        console.error('Error fetching accessible organisations:', accessError)
        return { 
          ok: false, 
          error: 'Erreur lors de la récupération des organisations accessibles' 
        }
      }

      // Transform the joined data to simple organisation objects
      const organisations: Organisation[] = (accessibleOrgs?.map((item: any) => 
        item.organisations
      ) || []) as Organisation[]

      return { 
        ok: true, 
        data: organisations 
      }
    }

  } catch (error) {
    console.error('Unexpected error in getOrganisations:', error)
    return { ok: false, error: 'Erreur inattendue lors du chargement' }
  }
}

/**
 * Get single organisation by ID
 */
export async function getOrganisationById(id: string): Promise<ActionResult<Organisation>> {
  try {
    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { ok: false, error: ORGANISATION_ERRORS.NOT_FOUND }
      }
      console.error('Error fetching organisation:', error)
      return { ok: false, error: 'Erreur lors du chargement de l\'organisation' }
    }

    return { ok: true, data }
  } catch (error) {
    console.error('Unexpected error in getOrganisationById:', error)
    return { ok: false, error: 'Erreur inattendue lors du chargement' }
  }
}

/**
 * Create new organisation (Super Admin only)
 */
export async function createOrganisation(
  formData: OrganisationFormData
): Promise<ActionResult<Organisation>> {
  try {
    // Transform and validate form data
    const transformedData = transformOrganisationFormData(formData)
    const validatedData = createOrganisationSchema.parse(transformedData)

    // Check if organisation already exists for this country
    const { data: existingOrg } = await supabase
      .from('organisations')
      .select('id')
      .eq('pays', validatedData.pays)
      .single()

    if (existingOrg) {
      return { ok: false, error: ORGANISATION_ERRORS.COUNTRY_EXISTS }
    }

    // Create the organisation
    const { data, error } = await supabase
      .from('organisations')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505' && error.message.includes('unique_organisation_par_pays')) {
        return { ok: false, error: ORGANISATION_ERRORS.COUNTRY_EXISTS }
      }
      console.error('Error creating organisation:', error)
      return { ok: false, error: 'Erreur lors de la création de l\'organisation' }
    }

    revalidatePath('/organisations')
    return { ok: true, data }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation error in createOrganisation:', error.message)
      return { ok: false, error: ORGANISATION_ERRORS.INVALID_DATA }
    }
    console.error('Unexpected error in createOrganisation:', error)
    return { ok: false, error: 'Erreur inattendue lors de la création' }
  }
}

/**
 * Update organisation (Super Admin only)
 */
export async function updateOrganisation(
  id: string,
  formData: OrganisationEditFormData
): Promise<ActionResult<Organisation>> {
  try {
    // Transform and validate form data
    const transformedData = transformOrganisationEditFormData(formData)
    const validatedData = updateOrganisationSchema.parse(transformedData)

    // Note: Pays (country) is never modifiable - it's the unique business identifier
    // Modification only affects descriptive fields (nom, description, contact info, etc.)

    // Update the organisation
    const { data, error } = await supabase
      .from('organisations')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { ok: false, error: ORGANISATION_ERRORS.NOT_FOUND }
      }
      // Handle unique constraint violation
      if (error.code === '23505' && error.message.includes('unique_organisation_par_pays')) {
        return { ok: false, error: ORGANISATION_ERRORS.COUNTRY_EXISTS }
      }
      console.error('Error updating organisation:', error)
      return { ok: false, error: 'Erreur lors de la mise à jour de l\'organisation' }
    }

    revalidatePath('/organisations')
    revalidatePath(`/organisations/${id}`)
    return { ok: true, data }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation error in updateOrganisation:', error.message)
      return { ok: false, error: ORGANISATION_ERRORS.INVALID_DATA }
    }
    console.error('Unexpected error in updateOrganisation:', error)
    return { ok: false, error: 'Erreur inattendue lors de la mise à jour' }
  }
}

/**
 * Deactivate organisation (Soft Delete - Super Admin only)
 */
export async function deactivateOrganisation(id: string): Promise<ActionResult> {
  try {
    // Check if organisation exists and is active
    const { data: organisation } = await supabase
      .from('organisations')
      .select('id, nom, is_active')
      .eq('id', id)
      .single()

    if (!organisation) {
      return { ok: false, error: ORGANISATION_ERRORS.NOT_FOUND }
    }

    if (!organisation.is_active) {
      return { ok: false, error: 'Cette organisation est déjà désactivée' }
    }

    // Use the database function for soft delete
    const { data, error } = await supabase
      .rpc('deactivate_organisation', { org_id: id })

    if (error) {
      console.error('Error deactivating organisation:', error)
      return { ok: false, error: error.message || 'Erreur lors de la désactivation de l\'organisation' }
    }

    revalidatePath('/organisations')
    return { 
      ok: true, 
      data: {
        ...data,
        message: `Organisation "${organisation.nom}" désactivée avec succès`
      }
    }
  } catch (error) {
    console.error('Unexpected error in deactivateOrganisation:', error)
    return { ok: false, error: 'Erreur inattendue lors de la désactivation' }
  }
}

/**
 * Get deletion impact (dry-run) for organisation
 */
export async function getDeletionImpact(id: string): Promise<ActionResult> {
  try {
    // Check if organisation exists
    const { data: organisation } = await supabase
      .from('organisations')
      .select('id, nom, is_active')
      .eq('id', id)
      .single()

    if (!organisation) {
      return { ok: false, error: ORGANISATION_ERRORS.NOT_FOUND }
    }

    // Get impact analysis using database function
    const { data, error } = await supabase
      .rpc('get_deletion_impact', { org_id: id })

    if (error) {
      console.error('Error getting deletion impact:', error)
      return { ok: false, error: 'Erreur lors de l\'analyse d\'impact' }
    }

    return { ok: true, data }
  } catch (error) {
    console.error('Unexpected error in getDeletionImpact:', error)
    return { ok: false, error: 'Erreur inattendue lors de l\'analyse' }
  }
}

/**
 * Hard delete organisation (Super Admin only) - Irreversible
 */
export async function deleteOrganisationHard(id: string): Promise<ActionResult> {
  try {
    // Check if organisation exists and is inactive
    const { data: organisation } = await supabase
      .from('organisations')
      .select('id, nom, is_active')
      .eq('id', id)
      .single()

    if (!organisation) {
      return { ok: false, error: ORGANISATION_ERRORS.NOT_FOUND }
    }

    if (organisation.is_active) {
      return { ok: false, error: 'L\'organisation doit être désactivée avant suppression définitive' }
    }

    // Use the transactional database function for hard delete
    const { data, error } = await supabase
      .rpc('org_hard_delete_tx', { p_org_id: id })

    if (error) {
      console.error('Error hard deleting organisation:', error)
      return { ok: false, error: error.message || 'Erreur lors de la suppression définitive' }
    }

    revalidatePath('/organisations')
    return { 
      ok: true, 
      data: {
        ...data,
        message: `Organisation "${organisation.nom}" supprimée définitivement`
      }
    }
  } catch (error) {
    console.error('Unexpected error in deleteOrganisationHard:', error)
    return { ok: false, error: 'Erreur inattendue lors de la suppression définitive' }
  }
}

/**
 * Reactivate organisation (Super Admin only)
 */
export async function reactivateOrganisation(id: string): Promise<ActionResult> {
  try {
    // Check if organisation exists and is inactive
    const { data: organisation } = await supabase
      .from('organisations')
      .select('id, nom, is_active')
      .eq('id', id)
      .single()

    if (!organisation) {
      return { ok: false, error: ORGANISATION_ERRORS.NOT_FOUND }
    }

    if (organisation.is_active) {
      return { ok: false, error: 'Cette organisation est déjà active' }
    }

    // Use the database function for reactivation
    const { data, error } = await supabase
      .rpc('reactivate_organisation', { org_id: id })

    if (error) {
      console.error('Error reactivating organisation:', error)
      return { ok: false, error: error.message || 'Erreur lors de la réactivation' }
    }

    revalidatePath('/organisations')
    return { 
      ok: true, 
      data: {
        ...data,
        message: `Organisation "${organisation.nom}" réactivée avec succès`
      }
    }
  } catch (error) {
    console.error('Unexpected error in reactivateOrganisation:', error)
    return { ok: false, error: 'Erreur inattendue lors de la réactivation' }
  }
}

/**
 * Get organisation statistics (property count, user count, etc.)
 */
export async function getOrganisationStats(id: string): Promise<ActionResult<any>> {
  try {
    // For now, return basic stats (will be enhanced when related entities are implemented)
    const stats = {
      utilisateurs_count: 0,
      reservations_count: 0,
    }

    return { ok: true, data: stats }
  } catch (error) {
    console.error('Unexpected error in getOrganisationStats:', error)
    return { ok: false, error: 'Erreur lors du chargement des statistiques' }
  }
}

/**
 * Form action for creating organisation with redirect
 */
export async function createOrganisationAction(formData: FormData) {
  const data: OrganisationFormData = {
    nom: formData.get('nom') as string,
    pays: formData.get('pays') as string,
    description: formData.get('description') as string || undefined,
    adresse_siege: formData.get('adresse_siege') as string || undefined,
    telephone: formData.get('telephone') as string || undefined,
    email: formData.get('email') as string || undefined,
    site_web: formData.get('site_web') as string || undefined,
  }

  const result = await createOrganisation(data)

  if (!result.ok) {
    throw new Error(result.error)
  }

  redirect(`/organisations/${result.data!.id}`)
}

/**
 * Form action for updating organisation
 */
export async function updateOrganisationAction(id: string, formData: FormData) {
  const data: OrganisationEditFormData = {
    nom: formData.get('nom') as string,
    // Note: pays is excluded in edit mode
    description: formData.get('description') as string || undefined,
    adresse_siege: formData.get('adresse_siege') as string || undefined,
    telephone: formData.get('telephone') as string || undefined,
    email: formData.get('email') as string || undefined,
    site_web: formData.get('site_web') as string || undefined,
  }

  const result = await updateOrganisation(id, data)

  if (!result.ok) {
    throw new Error(result.error)
  }

  redirect(`/organisations/${id}`)
}

/**
 * Form action for deactivating organisation (soft delete)
 */
export async function deactivateOrganisationAction(id: string) {
  const result = await deactivateOrganisation(id)

  if (!result.ok) {
    throw new Error(result.error)
  }

  redirect('/organisations')
}

/**
 * Form action for hard deleting organisation
 */
export async function deleteOrganisationHardAction(id: string) {
  const result = await deleteOrganisationHard(id)

  if (!result.ok) {
    throw new Error(result.error)
  }

  redirect('/organisations')
}

/**
 * Form action for reactivating organisation
 */
export async function reactivateOrganisationAction(id: string) {
  const result = await reactivateOrganisation(id)

  if (!result.ok) {
    throw new Error(result.error)
  }

  redirect('/organisations')
}