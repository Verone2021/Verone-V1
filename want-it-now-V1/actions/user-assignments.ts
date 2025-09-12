'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  assignOrganisationsSchema,
  removeAssignmentSchema,
  USER_ASSIGNMENT_ERRORS,
  type AssignOrganisationsInput,
  type RemoveAssignmentInput,
  type UserAssignment,
  type AssignmentStats
} from '@/lib/validations/user-assignments'

// Admin client avec service role pour contourner RLS
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ACCESS_TOKEN!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Type pour les résultats d'actions
type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Obtenir l'utilisateur actuel avec vérification super admin
 */
async function getCurrentSuperAdmin(): Promise<{ id: string } | null> {
  try {
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return null

    // Vérifier que l'utilisateur est super admin
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .limit(1)

    if (!userRoles || userRoles.length === 0) {
      return null
    }

    return { id: user.id }
  } catch (error) {
    console.error('Error getting current super admin:', error)
    return null
  }
}

/**
 * Récupérer les assignations actuelles d'un utilisateur
 */
export async function getUserAssignments(userId: string): Promise<ActionResult<UserAssignment[]>> {
  try {
    // Vérification des permissions
    const currentUser = await getCurrentSuperAdmin()
    if (!currentUser) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.UNAUTHORIZED }
    }

    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select(`
        user_id,
        organisation_id,
        role,
        created_at,
        updated_at,
        created_by,
        utilisateurs!fk_user_roles_user_id(id, nom, prenom, email),
        organisations!user_roles_organisation_id_fkey(id, nom, pays, is_active)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user assignments:', error)
      return { success: false, error: 'Erreur lors de la récupération des assignations' }
    }

    const assignments: UserAssignment[] = (data || []).map((item: any) => ({
      user_id: item.user_id,
      organisation_id: item.organisation_id,
      role: item.role,
      created_at: item.created_at,
      updated_at: item.updated_at,
      created_by: item.created_by,
      user: item.utilisateurs,
      organisation: item.organisations
    }))

    return { success: true, data: assignments }
  } catch (error) {
    console.error('Unexpected error in getUserAssignments:', error)
    return { success: false, error: 'Erreur inattendue lors de la récupération' }
  }
}

/**
 * Assigner des organisations à un utilisateur administrateur
 */
export async function assignOrganisationsToUser(
  input: AssignOrganisationsInput
): Promise<ActionResult<UserAssignment[]>> {
  try {
    console.log('🔄 Assignation organisations:', input)

    // Validation du schéma
    const validatedData = assignOrganisationsSchema.parse(input)
    
    // Vérification des permissions
    const currentUser = await getCurrentSuperAdmin()
    if (!currentUser) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.UNAUTHORIZED }
    }

    // Vérifier que l'utilisateur existe et est administrateur
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, role')
      .eq('id', validatedData.userId)
      .single()

    if (userError || !targetUser) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.USER_NOT_FOUND }
    }

    // Vérifier que l'utilisateur a le rôle admin (legacy ou nouveau système)
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', validatedData.userId)

    const hasAdminRole = targetUser.role === 'admin' || 
      userRoles?.some(role => role.role === 'admin')
    
    const isSuperAdmin = userRoles?.some(role => role.role === 'super_admin')

    if (isSuperAdmin) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.CANNOT_ASSIGN_SUPER_ADMIN }
    }

    if (!hasAdminRole) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.INVALID_ROLE }
    }

    // Vérifier que toutes les organisations existent et sont actives
    const { data: organisations, error: orgsError } = await supabaseAdmin
      .from('organisations')
      .select('id, nom, is_active')
      .in('id', validatedData.organisationIds)

    if (orgsError || !organisations || organisations.length !== validatedData.organisationIds.length) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.ORGANISATION_NOT_FOUND }
    }

    const inactiveOrgs = organisations.filter(org => !org.is_active)
    if (inactiveOrgs.length > 0) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.ORGANISATION_INACTIVE }
    }

    // Obtenir les assignations existantes pour éviter les doublons
    const { data: existingAssignments } = await supabaseAdmin
      .from('user_roles')
      .select('organisation_id')
      .eq('user_id', validatedData.userId)
      .eq('role', 'admin')

    const existingOrgIds = new Set(existingAssignments?.map(a => a.organisation_id) || [])
    
    // Filtrer les nouvelles assignations (pas de doublons)
    const newOrganisationIds = validatedData.organisationIds.filter(
      orgId => !existingOrgIds.has(orgId)
    )

    if (newOrganisationIds.length === 0) {
      return { success: false, error: 'Toutes les organisations sont déjà assignées à cet utilisateur' }
    }

    // Créer les nouvelles assignations
    const newAssignments = newOrganisationIds.map(orgId => ({
      user_id: validatedData.userId,
      organisation_id: orgId,
      role: 'admin',
      created_by: currentUser.id
    }))

    const { error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert(newAssignments)

    if (insertError) {
      console.error('Error creating assignments:', insertError)
      return { success: false, error: 'Erreur lors de la création des assignations' }
    }

    console.log(`✅ ${newAssignments.length} assignations créées`)

    // Revalider les pages concernées
    revalidatePath('/super-admin/utilisateurs')
    revalidatePath(`/super-admin/utilisateurs/${validatedData.userId}/assign`)
    revalidatePath('/utilisateurs')

    // Retourner les nouvelles assignations
    const assignmentsResult = await getUserAssignments(validatedData.userId)
    return assignmentsResult

  } catch (error) {
    console.error('💥 Erreur assignOrganisationsToUser:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erreur inattendue lors de l\'assignation' }
  }
}

/**
 * Supprimer une assignation organisation-utilisateur
 */
export async function removeAssignmentFromUser(
  input: RemoveAssignmentInput
): Promise<ActionResult> {
  try {
    console.log('🗑️ Suppression assignation:', input)

    // Validation du schéma
    const validatedData = removeAssignmentSchema.parse(input)
    
    // Vérification des permissions
    const currentUser = await getCurrentSuperAdmin()
    if (!currentUser) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.UNAUTHORIZED }
    }

    // Vérifier que l'assignation existe
    const { data: assignment, error: findError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, organisation_id, role')
      .eq('user_id', validatedData.userId)
      .eq('organisation_id', validatedData.organisationId)
      .eq('role', 'admin')
      .single()

    if (findError || !assignment) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.ASSIGNMENT_NOT_FOUND }
    }

    // Supprimer l'assignation
    const { error: deleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', validatedData.userId)
      .eq('organisation_id', validatedData.organisationId)
      .eq('role', 'admin')

    if (deleteError) {
      console.error('Error removing assignment:', deleteError)
      return { success: false, error: 'Erreur lors de la suppression de l\'assignation' }
    }

    console.log('✅ Assignation supprimée')

    // Revalider les pages concernées
    revalidatePath('/super-admin/utilisateurs')
    revalidatePath(`/super-admin/utilisateurs/${validatedData.userId}/assign`)
    revalidatePath('/utilisateurs')

    return { success: true }

  } catch (error) {
    console.error('💥 Erreur removeAssignmentFromUser:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erreur inattendue lors de la suppression' }
  }
}

/**
 * Obtenir les statistiques des assignations
 */
export async function getAssignmentStats(): Promise<ActionResult<AssignmentStats>> {
  try {
    // Vérification des permissions
    const currentUser = await getCurrentSuperAdmin()
    if (!currentUser) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.UNAUTHORIZED }
    }

    // Requêtes parallèles pour les statistiques
    const [
      { count: totalUsers },
      { count: totalOrganisations },
      { count: totalAssignments }
    ] = await Promise.all([
      supabaseAdmin
        .from('utilisateurs')
        .select('*', { count: 'exact', head: true }),
      
      supabaseAdmin
        .from('organisations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      
      supabaseAdmin
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')
    ])

    const stats: AssignmentStats = {
      total_users: totalUsers || 0,
      total_organisations: totalOrganisations || 0,
      total_assignments: totalAssignments || 0,
      users_with_multiple_orgs: 0, // Simplified for now
      organisations_with_admins: 0 // Simplified for now
    }

    return { success: true, data: stats }

  } catch (error) {
    console.error('💥 Erreur getAssignmentStats:', error)
    return { success: false, error: 'Erreur lors de la récupération des statistiques' }
  }
}

/**
 * Actions formulaire pour l'interface
 */

export async function assignOrganisationsAction(input: AssignOrganisationsInput) {
  const result = await assignOrganisationsToUser(input)
  
  if (!result.success) {
    throw new Error(result.error)
  }
  
  return result
}

export async function removeAssignmentAction(input: RemoveAssignmentInput) {
  const result = await removeAssignmentFromUser(input)
  
  if (!result.success) {
    throw new Error(result.error)
  }
  
  return result
}

/**
 * Assigner un utilisateur à une organisation (fonction simplifiée pour l'interface admin)
 */
export async function assignUserToOrganisation(input: {
  userId: string
  organisationId: string
  role: 'admin' | 'proprietaire'
}): Promise<ActionResult> {
  try {
    console.log('🔄 Assignation utilisateur-organisation:', input)

    // Vérification des permissions
    const currentUser = await getCurrentSuperAdmin()
    if (!currentUser) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.UNAUTHORIZED }
    }

    // Vérifier que l'utilisateur existe
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, role')
      .eq('id', input.userId)
      .single()

    if (userError || !targetUser) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.USER_NOT_FOUND }
    }

    // Vérifier que l'organisation existe et est active
    const { data: organisation, error: orgError } = await supabaseAdmin
      .from('organisations')
      .select('id, nom, is_active')
      .eq('id', input.organisationId)
      .single()

    if (orgError || !organisation) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.ORGANISATION_NOT_FOUND }
    }

    if (!organisation.is_active) {
      return { success: false, error: USER_ASSIGNMENT_ERRORS.ORGANISATION_INACTIVE }
    }

    // Vérifier si l'assignation existe déjà
    const { data: existingAssignment } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', input.userId)
      .eq('organisation_id', input.organisationId)
      .eq('role', input.role)
      .single()

    if (existingAssignment) {
      console.log('⚠️ Assignation existe déjà, mise à jour si nécessaire')
      return { success: true, data: 'Assignation déjà existante' }
    }

    // ✅ CORRECTION : Créer l'assignation (première assignation pour cet utilisateur)
    console.log('➕ Création nouvelle assignation user_roles')
    const { error: insertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: input.userId,
        organisation_id: input.organisationId,
        role: input.role,
        created_by: currentUser.id
      })

    if (insertError) {
      console.error('Error creating assignment:', insertError)
      return { success: false, error: 'Erreur lors de la création de l\'assignation' }
    }

    console.log('✅ Assignation créée avec succès')

    // Revalider les pages concernées
    revalidatePath('/admin/utilisateurs')
    revalidatePath(`/admin/utilisateurs/${input.userId}`)

    return { success: true }

  } catch (error) {
    console.error('💥 Erreur assignUserToOrganisation:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erreur inattendue lors de l\'assignation' }
  }
}