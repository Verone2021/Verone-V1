'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { 
  createUserRoleSchema, 
  updateUserRoleSchema,
  createUserAssignmentSchema,
  updateUserAssignmentSchema,
  createUserWithRolesSchema,
  updateUserWithRolesSchema 
} from '@/lib/validations/user-roles'
import { 
  UserRole, 
  UserOrganisationAssignment,
  UserWithRoles,
  CreateUserRoleData,
  CreateUserAssignmentData 
} from '@/types/user-roles'

// ============================================================================
// GESTION DES RÔLES UTILISATEUR
// ============================================================================

export async function createUserRole(data: z.infer<typeof createUserRoleSchema>) {
  try {
    const supabase = await createClient()
    const validated = createUserRoleSchema.parse(data)

    // Vérifier les permissions (super_admin ou admin de l'organisation)
    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user.user) {
      return { success: false, error: 'Non autorisé' }
    }

    // Vérifier si l'utilisateur courant a les droits
    const { data: currentUserRoles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.user.id)

    const isSuperAdmin = currentUserRoles?.some(role => role.role === 'super_admin')
    const isAdminOfOrg = currentUserRoles?.some(role => 
      role.role === 'admin' && role.organisation_id === validated.organisation_id
    )

    if (!isSuperAdmin && !isAdminOfOrg) {
      return { success: false, error: 'Permissions insuffisantes' }
    }

    // Insérer le nouveau rôle
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .insert({
        ...validated,
        created_by: user.user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Cet utilisateur a déjà ce rôle dans cette organisation' }
      }
      throw error
    }

    return { success: true, data: userRole }
  } catch (error) {
    console.error('Erreur création user_role:', error)
    return { success: false, error: 'Erreur lors de la création du rôle' }
  }
}

export async function updateUserRole(id: string, data: z.infer<typeof updateUserRoleSchema>) {
  try {
    const supabase = await createClient()
    const validated = updateUserRoleSchema.parse(data)

    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user.user) {
      return { success: false, error: 'Non autorisé' }
    }

    const { data: userRole, error } = await supabase
      .from('user_roles')
      .update({
        ...validated,
        updated_by: user.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Rôle non trouvé' }
      }
      throw error
    }

    return { success: true, data: userRole }
  } catch (error) {
    console.error('Erreur mise à jour user_role:', error)
    return { success: false, error: 'Erreur lors de la mise à jour du rôle' }
  }
}

export async function deleteUserRole(id: string) {
  try {
    const supabase = await createClient()

    // Vérifier que ce n'est pas le dernier super admin
    const { data: roleToDelete } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', id)
      .single()

    if (roleToDelete?.role === 'super_admin') {
      const { data: superAdmins } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'super_admin')

      if (superAdmins && superAdmins.length <= 1) {
        return { success: false, error: 'Impossible de supprimer le dernier super administrateur' }
      }
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Erreur suppression user_role:', error)
    return { success: false, error: 'Erreur lors de la suppression du rôle' }
  }
}

export async function getUserRoles(userId?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('user_roles')
      .select(`
        *,
        organisation:organisations(id, nom, pays)
      `)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: roles, error } = await query

    if (error) throw error

    return { success: true, data: roles || [] }
  } catch (error) {
    console.error('Erreur récupération user_roles:', error)
    return { success: false, error: 'Erreur lors de la récupération des rôles' }
  }
}

// ============================================================================
// GESTION DES ASSIGNATIONS MÉTIER
// ============================================================================

export async function createUserAssignment(data: z.infer<typeof createUserAssignmentSchema>) {
  try {
    const supabase = await createClient()
    const validated = createUserAssignmentSchema.parse(data)

    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user.user) {
      return { success: false, error: 'Non autorisé' }
    }

    const { data: assignment, error } = await supabase
      .from('user_organisation_assignments')
      .insert({
        ...validated,
        created_by: user.user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Cet utilisateur a déjà cette assignation dans cette organisation' }
      }
      throw error
    }

    return { success: true, data: assignment }
  } catch (error) {
    console.error('Erreur création user_assignment:', error)
    return { success: false, error: 'Erreur lors de la création de l\'assignation' }
  }
}

export async function updateUserAssignment(id: string, data: z.infer<typeof updateUserAssignmentSchema>) {
  try {
    const supabase = await createClient()
    const validated = updateUserAssignmentSchema.parse(data)

    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user.user) {
      return { success: false, error: 'Non autorisé' }
    }

    const { data: assignment, error } = await supabase
      .from('user_organisation_assignments')
      .update({
        ...validated,
        updated_by: user.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Assignation non trouvée' }
      }
      throw error
    }

    return { success: true, data: assignment }
  } catch (error) {
    console.error('Erreur mise à jour user_assignment:', error)
    return { success: false, error: 'Erreur lors de la mise à jour de l\'assignation' }
  }
}

export async function deleteUserAssignment(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('user_organisation_assignments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Erreur suppression user_assignment:', error)
    return { success: false, error: 'Erreur lors de la suppression de l\'assignation' }
  }
}

export async function getUserAssignments(userId?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('user_organisation_assignments')
      .select(`
        *,
        organisation:organisations(id, nom, pays)
      `)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: assignments, error } = await query

    if (error) throw error

    return { success: true, data: assignments || [] }
  } catch (error) {
    console.error('Erreur récupération user_assignments:', error)
    return { success: false, error: 'Erreur lors de la récupération des assignations' }
  }
}

// ============================================================================
// GESTION COMPLÈTE UTILISATEUR AVEC RÔLES
// ============================================================================

export async function createUserWithRoles(data: z.infer<typeof createUserWithRolesSchema>) {
  try {
    const supabase = await createClient()
    const validated = createUserWithRolesSchema.parse(data)

    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user.user) {
      return { success: false, error: 'Non autorisé' }
    }

    // Transaction pour créer utilisateur + rôles + assignations
    const { data: result, error } = await supabase.rpc('create_user_with_roles', {
      user_data: {
        nom: validated.nom,
        prenom: validated.prenom,
        email: validated.email,
        telephone: validated.telephone
      },
      role_data: {
        role: validated.role,
        organisations: validated.organisations || [],
        reservations: validated.reservations || []
      },
      created_by: user.user.id
    })

    if (error) throw error

    return { success: true, data: result }
  } catch (error) {
    console.error('Erreur création utilisateur avec rôles:', error)
    return { success: false, error: 'Erreur lors de la création de l\'utilisateur' }
  }
}

export async function getUserWithRoles(userId: string): Promise<{ success: boolean; data?: UserWithRoles; error?: string }> {
  try {
    const supabase = await createClient()

    // Récupérer les données utilisateur
    const { data: userData, error: userError } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // Récupérer les rôles avec organisations
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        organisation_id,
        role,
        organisation:organisations(nom)
      `)
      .eq('user_id', userId)

    if (rolesError) throw rolesError

    // Récupérer les assignations métier
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_organisation_assignments')
      .select(`
        organisation_id,
        relationship_type,
        metadata,
        organisation:organisations(nom)
      `)
      .eq('user_id', userId)

    if (assignmentsError) throw assignmentsError

    const userWithRoles: UserWithRoles = {
      ...userData,
      roles: roles?.map(r => ({
        organisation_id: r.organisation_id,
        organisation_nom: (r.organisation as any)?.nom || '',
        role: r.role
      })) || [],
      business_assignments: assignments?.map(a => ({
        organisation_id: a.organisation_id,
        organisation_nom: (a.organisation as any)?.nom || '',
        relationship_type: a.relationship_type,
        metadata: a.metadata
      })) || []
    }

    return { success: true, data: userWithRoles }
  } catch (error) {
    console.error('Erreur récupération utilisateur avec rôles:', error)
    return { success: false, error: 'Erreur lors de la récupération de l\'utilisateur' }
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

export async function checkUserPermissions(organisationId: string, requiredRole?: string) {
  try {
    const supabase = await createClient()
    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError || !user.user) {
      return { success: false, isSuperAdmin: false, hasPermission: false }
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.user.id)

    if (!roles) {
      return { success: true, isSuperAdmin: false, hasPermission: false }
    }

    const isSuperAdmin = roles.some(role => role.role === 'super_admin')
    const hasPermission = isSuperAdmin || roles.some(role => 
      role.organisation_id === organisationId && 
      (!requiredRole || role.role === requiredRole)
    )

    return { 
      success: true, 
      isSuperAdmin, 
      hasPermission,
      userRoles: roles
    }
  } catch (error) {
    console.error('Erreur vérification permissions:', error)
    return { success: false, isSuperAdmin: false, hasPermission: false }
  }
}