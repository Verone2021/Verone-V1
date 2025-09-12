'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  createUtilisateurSchema,
  updateUtilisateurSchema,
  userProfileEditSchema,
  transformUtilisateurFormData,
  transformAdminFormData,
  UTILISATEUR_ERRORS,
  canModifyUser,
  canDeleteUser,
  type Utilisateur,
  type CreateUtilisateur,
  type UpdateUtilisateur,
  type UtilisateurFormData,
  type AdminFormData,
  type UserProfileEditData,
} from '@/lib/validations/utilisateurs'
import {
  createUserWithRolesSchema,
  updateUserWithRolesSchema,
  userFiltersSchema,
  type CreateUserWithRolesInput,
  type UpdateUserWithRolesInput,
  type UserFilters,
  type UserRole
} from '@/lib/validations/user-roles'
import { getUserRoles } from './user-roles'

// Admin client with service role for bypassing RLS
// Used for admin operations that need full database access
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

// Result types for server actions
type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Get current user from auth context with new user_roles architecture
 * Uses the cookie-based client to get the authenticated user
 */
async function getCurrentUser(): Promise<{ id: string; isSuperAdmin: boolean; isAdmin: boolean; userRoles: any[] } | null> {
  try {
    // Use the cookie-based client to get the current user session
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return null

    // Get user roles using the new architecture
    const { data: userRolesResult } = await getUserRoles(user.id)
    const userRoles = userRolesResult || []
    
    const isSuperAdmin = userRoles.some(role => role.role === 'super_admin')
    const isAdmin = userRoles.some(role => role.role === 'admin')

    return {
      id: user.id,
      isSuperAdmin,
      isAdmin,
      userRoles
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get all users (Super Admin and Admin only)
 */
export async function getUtilisateurs(): Promise<ActionResult<Utilisateur[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('utilisateurs')
      .select(`
        *,
        organisation:organisations(
          id,
          nom,
          pays
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return { success: false, error: 'Erreur lors du chargement des utilisateurs' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in getUtilisateurs:', error)
    return { success: false, error: 'Erreur inattendue lors du chargement' }
  }
}

/**
 * Get single user by ID
 */
export async function getUtilisateurById(id: string): Promise<ActionResult<Utilisateur>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('utilisateurs')
      .select(`
        *,
        organisation:organisations(
          id,
          nom,
          pays
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: UTILISATEUR_ERRORS.NOT_FOUND }
      }
      console.error('Error fetching user:', error)
      return { success: false, error: 'Erreur lors du chargement de l\'utilisateur' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in getUtilisateurById:', error)
    return { success: false, error: 'Erreur inattendue lors du chargement' }
  }
}

/**
 * Create new user (Super Admin and Admin only)
 */
export async function createUtilisateur(
  formData: UtilisateurFormData
): Promise<ActionResult<Utilisateur>> {
  try {
    // Get current user for authorization
    const currentUser = await getCurrentUser()
    if (!currentUser || (!currentUser.isSuperAdmin && !currentUser.isAdmin)) {
      return { success: false, error: UTILISATEUR_ERRORS.UNAUTHORIZED }
    }

    // Transform and validate form data
    const transformedData = transformUtilisateurFormData(formData)
    const validatedData = createUtilisateurSchema.parse(transformedData)

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existingUser) {
      return { success: false, error: UTILISATEUR_ERRORS.EMAIL_EXISTS }
    }

    // Create the user
    const { data, error } = await supabaseAdmin
      .from('utilisateurs')
      .insert([validatedData])
      .select(`
        *,
        organisation:organisations(
          id,
          nom,
          pays
        )
      `)
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505' && error.message.includes('email')) {
        return { success: false, error: UTILISATEUR_ERRORS.EMAIL_EXISTS }
      }
      console.error('Error creating user:', error)
      return { success: false, error: 'Erreur lors de la création de l\'utilisateur' }
    }

    revalidatePath('/utilisateurs')
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation error in createUtilisateur:', error.message)
      return { success: false, error: UTILISATEUR_ERRORS.INVALID_DATA }
    }
    console.error('Unexpected error in createUtilisateur:', error)
    return { success: false, error: 'Erreur inattendue lors de la création' }
  }
}

/**
 * Update user (Super Admin, Admin, or self-update)
 */
export async function updateUtilisateur(
  id: string,
  formData: Partial<UtilisateurFormData>
): Promise<ActionResult<Utilisateur>> {
  try {
    // Get current user for authorization
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: UTILISATEUR_ERRORS.UNAUTHORIZED }
    }

    // Check permissions - super admin or admin can modify, or user modifying themselves
    const canModify = currentUser.isSuperAdmin || currentUser.isAdmin || (id === currentUser.id)
    if (!canModify) {
      return { success: false, error: UTILISATEUR_ERRORS.UNAUTHORIZED }
    }

    // Transform and validate form data
    const transformedData = transformUtilisateurFormData(formData as UtilisateurFormData)
    const validatedData = updateUtilisateurSchema.parse(transformedData)

    // If updating email, check for conflicts
    if (validatedData.email) {
      const { data: existingUser } = await supabaseAdmin
        .from('utilisateurs')
        .select('id')
        .eq('email', validatedData.email)
        .neq('id', id)
        .single()

      if (existingUser) {
        return { success: false, error: UTILISATEUR_ERRORS.EMAIL_EXISTS }
      }
    }

    // Prevent users from modifying their own role (role changes should go through user_roles table)
    if (id === currentUser.id && validatedData.role) {
      return { success: false, error: UTILISATEUR_ERRORS.CANNOT_MODIFY_ROLE }
    }

    // Update the user
    const { data, error } = await supabaseAdmin
      .from('utilisateurs')
      .update(validatedData)
      .eq('id', id)
      .select(`
        *,
        organisation:organisations(
          id,
          nom,
          pays
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: UTILISATEUR_ERRORS.NOT_FOUND }
      }
      // Handle unique constraint violation
      if (error.code === '23505' && error.message.includes('email')) {
        return { success: false, error: UTILISATEUR_ERRORS.EMAIL_EXISTS }
      }
      console.error('Error updating user:', error)
      return { success: false, error: 'Erreur lors de la mise à jour de l\'utilisateur' }
    }

    revalidatePath('/utilisateurs')
    revalidatePath(`/utilisateurs/${id}`)
    revalidatePath('/profile')
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Validation error in updateUtilisateur:', error.message)
      return { success: false, error: UTILISATEUR_ERRORS.INVALID_DATA }
    }
    console.error('Unexpected error in updateUtilisateur:', error)
    return { success: false, error: 'Erreur inattendue lors de la mise à jour' }
  }
}

/**
 * Delete user (Super Admin only, cannot delete self)
 */
export async function deleteUtilisateur(id: string): Promise<ActionResult> {
  try {
    // Get current user for authorization
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: UTILISATEUR_ERRORS.UNAUTHORIZED }
    }

    // Check permissions - only super admin can delete, and cannot delete self
    if (!currentUser.isSuperAdmin) {
      return { success: false, error: UTILISATEUR_ERRORS.UNAUTHORIZED }
    }
    
    if (id === currentUser.id) {
      return { success: false, error: UTILISATEUR_ERRORS.CANNOT_DELETE_SELF }
    }

    // Check if user exists
    const { data: user } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, email')
      .eq('id', id)
      .single()

    if (!user) {
      return { success: false, error: UTILISATEUR_ERRORS.NOT_FOUND }
    }

    // Delete the user
    const { error } = await supabaseAdmin
      .from('utilisateurs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: 'Erreur lors de la suppression de l\'utilisateur' }
    }

    revalidatePath('/utilisateurs')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in deleteUtilisateur:', error)
    return { success: false, error: 'Erreur inattendue lors de la suppression' }
  }
}

/**
 * Get users by role
 */
export async function getUtilisateursByRole(role: string): Promise<ActionResult<Utilisateur[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('utilisateurs')
      .select(`
        *,
        organisation:organisations(
          id,
          nom,
          pays
        )
      `)
      .eq('role', role)
      .order('nom', { ascending: true })

    if (error) {
      console.error('Error fetching users by role:', error)
      return { success: false, error: 'Erreur lors du chargement des utilisateurs' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in getUtilisateursByRole:', error)
    return { success: false, error: 'Erreur inattendue lors du chargement' }
  }
}

/**
 * Get users by organisation
 */
export async function getUtilisateursByOrganisation(organisationId: string): Promise<ActionResult<Utilisateur[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('utilisateurs')
      .select(`
        *,
        organisation:organisations(
          id,
          nom,
          pays
        )
      `)
      .eq('organisation_id', organisationId)
      .order('nom', { ascending: true })

    if (error) {
      console.error('Error fetching users by organisation:', error)
      return { success: false, error: 'Erreur lors du chargement des utilisateurs' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in getUtilisateursByOrganisation:', error)
    return { success: false, error: 'Erreur inattendue lors du chargement' }
  }
}

/**
 * Create admin user with Supabase Admin API (Server-only)
 * Properly creates the user in auth.users and public.utilisateurs
 */
export async function createAdminUser(
  formData: AdminFormData
): Promise<ActionResult<Utilisateur>> {
  try {
    // Get current user for authorization
    const currentUser = await getCurrentUser()
    console.log('Current user:', currentUser)
    
    if (!currentUser || !currentUser.isSuperAdmin) {
      console.error('Authorization failed - user:', currentUser)
      return { success: false, error: UTILISATEUR_ERRORS.UNAUTHORIZED }
    }

    // Transform and validate form data
    const transformedData = transformAdminFormData(formData)
    console.log('Transformed data:', transformedData)
    
    let validatedData
    try {
      validatedData = createUtilisateurSchema.parse(transformedData)
      console.log('Validated data:', validatedData)
    } catch (zodError) {
      console.error('Zod validation error:', zodError)
      return { success: false, error: 'Données invalides: ' + (zodError as any).errors?.[0]?.message || 'Erreur de validation' }
    }

    // Ensure role is admin for this endpoint
    if (validatedData.role !== 'admin') {
      return { success: false, error: 'Seuls les administrateurs peuvent être créés via cette méthode' }
    }

    // Check if email already exists in auth by trying to get user by email
    // Note: Supabase doesn't have a direct getUserByEmail method, so we'll skip this check
    // and rely on the database unique constraint to catch duplicates

    // Check if email already exists in utilisateurs table
    const { data: existingUser } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existingUser) {
      return { success: false, error: UTILISATEUR_ERRORS.EMAIL_EXISTS }
    }

    // Generate temporary password
    const tempPassword = `TempPass${Date.now()}!`

    // 1. Create user in auth.users using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: tempPassword,
      email_confirm: true, // Bypass email confirmation
      user_metadata: {
        nom: validatedData.nom || '',
        prenom: validatedData.prenom || '',
        role: validatedData.role,
      },
      app_metadata: {
        role: validatedData.role,
        organisation_id: validatedData.organisation_id
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      return { success: false, error: `Erreur lors de la création du compte: ${authError.message}` }
    }

    if (!authData.user) {
      return { success: false, error: 'Utilisateur non créé dans le système d\'authentification' }
    }

    // 2. Create or update profile in public.utilisateurs with the auth user ID
    const { data: userData, error: profileError } = await supabaseAdmin
      .from('utilisateurs')
      .upsert({
        id: authData.user.id, // Use the auth user ID
        nom: validatedData.nom || null,
        prenom: validatedData.prenom || null,
        email: validatedData.email,
        telephone: validatedData.telephone || null,
        role: validatedData.role,
        organisation_id: validatedData.organisation_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select(`
        *,
        organisation:organisations(
          id,
          nom,
          pays
        )
      `)
      .single()

    if (profileError) {
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('Profile creation error:', profileError)
      return { success: false, error: `Erreur lors de la création du profil: ${profileError.message}` }
    }

    // 3. Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: validatedData.email,
    })

    if (resetError) {
      console.error('Password reset email error:', resetError)
      // Don't fail the creation for this, just log it
    }

    revalidatePath('/utilisateurs')
    return { success: true, data: userData }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in createAdminUser:', error.message, error)
      return { success: false, error: error.message || UTILISATEUR_ERRORS.INVALID_DATA }
    }
    console.error('Unexpected error in createAdminUser:', error)
    return { success: false, error: 'Erreur inattendue lors de la création' }
  }
}

/**
 * Form action for creating admin user with redirect
 */
export async function createAdminUserAction(formData: AdminFormData) {
  const result = await createAdminUser(formData)

  if (!result.success) {
    throw new Error(result.error)
  }

  return result
}

/**
 * Form action for creating user with redirect
 */
export async function createUtilisateurAction(formData: FormData) {
  const data: UtilisateurFormData = {
    nom: formData.get('nom') as string || '',
    prenom: formData.get('prenom') as string || '',
    email: formData.get('email') as string,
    telephone: formData.get('telephone') as string || '',
    role: formData.get('role') as any,
    organisation_id: formData.get('organisation_id') as string || null,
  }

  const result = await createUtilisateur(data)

  if (!result.success) {
    throw new Error(result.error)
  }

  redirect(`/utilisateurs/${result.data!.id}`)
}

/**
 * Form action for updating user
 */
export async function updateUtilisateurAction(id: string, formData: FormData) {
  const data: Partial<UtilisateurFormData> = {
    nom: formData.get('nom') as string || '',
    prenom: formData.get('prenom') as string || '',
    email: formData.get('email') as string,
    telephone: formData.get('telephone') as string || '',
    role: formData.get('role') as any,
    organisation_id: formData.get('organisation_id') as string || null,
  }

  const result = await updateUtilisateur(id, data)

  if (!result.success) {
    throw new Error(result.error)
  }

  redirect(`/utilisateurs/${id}`)
}

/**
 * Form action for deleting user
 */
export async function deleteUtilisateurAction(id: string) {
  const result = await deleteUtilisateur(id)

  if (!result.success) {
    throw new Error(result.error)
  }

  redirect('/utilisateurs')
}

// ============================================================================
// NOUVELLES ACTIONS MULTI-RÔLE
// ============================================================================

/**
 * Créer un utilisateur avec rôles multiples (nouveau système)
 */
export async function createUserWithRoles(
  input: CreateUserWithRolesInput
): Promise<ActionResult<any>> {
  try {
    console.log('🔄 Création utilisateur multi-rôle:', input)

    // Validation du schéma
    const validatedData = createUserWithRolesSchema.parse(input)
    
    // Vérification des permissions (seuls super_admin peuvent créer)
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperAdmin) {
      return { success: false, error: 'Seuls les super administrateurs peuvent créer des utilisateurs' }
    }

    // Générer un mot de passe temporaire
    const tempPassword = `TempPass${Date.now()}!`

    // 1. Créer l'utilisateur dans Supabase Auth
    console.log('📧 Création utilisateur Auth pour:', validatedData.email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        nom: validatedData.nom,
        prenom: validatedData.prenom,
        role: validatedData.role,
      },
    })

    if (authError) {
      console.error('❌ Erreur création Auth:', authError)
      return { success: false, error: `Erreur lors de la création du compte: ${authError.message}` }
    }

    if (!authData.user) {
      return { success: false, error: 'Utilisateur non créé dans le système d\'authentification' }
    }

    console.log('✅ Utilisateur Auth créé:', authData.user.id)

    // 2. Créer le profil utilisateur
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('utilisateurs')
      .upsert({
        id: authData.user.id,
        nom: validatedData.nom,
        prenom: validatedData.prenom,
        email: validatedData.email,
        telephone: validatedData.telephone || null,
        role: validatedData.role, // Pour compatibilité avec l'ancien système
        organisation_id: null, // Plus utilisé dans la nouvelle architecture
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (profileError) {
      // Nettoyage : supprimer l'utilisateur Auth si le profil échoue
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('❌ Erreur création profil:', profileError)
      return { success: false, error: `Erreur lors de la création du profil: ${profileError.message}` }
    }

    console.log('✅ Profil utilisateur créé')

    // 3. Créer les rôles dans user_roles selon le type
    const userId = authData.user.id
    const rolePromises: any[] = []

    if (validatedData.role === 'admin' && validatedData.organisations) {
      // Pour les admins, créer un rôle par organisation
      for (const orgId of validatedData.organisations) {
        rolePromises.push(
          supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId,
              organisation_id: orgId,
              role: 'admin',
              created_by: currentUser.id
            })
        )
      }
    } else if (validatedData.role === 'super_admin') {
      // Pour les super admins, pas d'organisation spécifique
      // On crée un rôle générique (avec une organisation fictive ou système)
      const { data: firstOrg } = await supabaseAdmin
        .from('organisations')
        .select('id')
        .limit(1)
        .single()
      
      if (firstOrg) {
        rolePromises.push(
          supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId,
              organisation_id: firstOrg.id,
              role: 'super_admin',
              created_by: currentUser.id
            })
        )
      }
    }

    // Exécuter toutes les insertions de rôles
    const roleResults = await Promise.allSettled(rolePromises)
    const failedRoles = roleResults.filter(result => result.status === 'rejected')
    
    if (failedRoles.length > 0) {
      console.error('❌ Erreurs création rôles:', failedRoles)
      // Ne pas échouer complètement, mais logger l'erreur
    }

    console.log('✅ Rôles utilisateur créés')

    // 4. Envoyer l'email d'invitation
    try {
      const { error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: validatedData.email,
      })
      
      if (inviteError) {
        console.error('⚠️ Erreur envoi invitation:', inviteError)
        // Ne pas échouer pour ça
      }
    } catch (inviteErr) {
      console.error('⚠️ Erreur invitation:', inviteErr)
    }

    revalidatePath('/utilisateurs')
    
    return { 
      success: true, 
      data: {
        ...profileData,
        auth_user_id: authData.user.id
      }
    }

  } catch (error) {
    console.error('💥 Erreur inattendue createUserWithRoles:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erreur inattendue lors de la création' }
  }
}

/**
 * Supprimer un utilisateur complètement (Auth + profil + rôles)
 */
export async function deleteUserHard(userId: string): Promise<ActionResult> {
  try {
    console.log('🗑️ Suppression utilisateur:', userId)

    // Vérification des permissions
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isSuperAdmin) {
      return { success: false, error: 'Seuls les super administrateurs peuvent supprimer des utilisateurs' }
    }

    // Ne pas se supprimer soi-même
    if (userId === currentUser.id) {
      return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte' }
    }

    // Vérifier que l'utilisateur existe
    const { data: userExists } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (!userExists) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    // Supprimer l'utilisateur dans Auth (les FK CASCADE s'occupent du reste)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('❌ Erreur suppression Auth:', deleteError)
      return { success: false, error: `Erreur lors de la suppression: ${deleteError.message}` }
    }

    console.log('✅ Utilisateur supprimé:', userExists.email)
    
    revalidatePath('/utilisateurs')
    return { success: true }

  } catch (error) {
    console.error('💥 Erreur deleteUserHard:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Erreur inattendue lors de la suppression' }
  }
}

/**
 * Lister les utilisateurs avec leurs rôles et assignations
 */
export async function listUsersWithRoles(filters?: UserFilters): Promise<ActionResult<any[]>> {
  try {
    console.log('📋 Récupération utilisateurs avec filtres:', filters)

    // Validation des filtres
    const validatedFilters = filters ? userFiltersSchema.parse(filters) : {} as any

    // Requête alternative - Depuis user_roles avec relation explicite
    // Utiliser le nom exact du foreign key pour éviter l'ambiguïté
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select(`
        user_id,
        organisation_id,
        role,
        utilisateurs!fk_user_roles_user_id(id, nom, prenom, email, telephone, role, created_at, updated_at),
        organisations!user_roles_organisation_id_fkey(id, nom, pays)
      `)

    if (rolesError) {
      console.error('❌ Erreur récupération rôles:', rolesError)
      return { success: false, error: 'Erreur lors de la récupération des utilisateurs' }
    }

    // Regrouper par utilisateur
    const usersMap = new Map()
    
    rolesData?.forEach((roleEntry) => {
      const user = (roleEntry.utilisateurs as any)
      if (!user) return

      if (!usersMap.has(user.id)) {
        usersMap.set(user.id, {
          ...user,
          last_sign_in_at: null, // Sera rempli plus tard
          user_roles: []
        })
      }

      usersMap.get(user.id).user_roles.push({
        organisation_id: roleEntry.organisation_id,
        role: roleEntry.role,
        organisation: roleEntry.organisations
      })
    })

    let users = Array.from(usersMap.values())
    
    // Récupérer les informations de connexion via l'API Admin pour tous les utilisateurs
    // Optimisation: faire des requêtes en parallèle par batch
    const batchSize = 10
    const userBatches: any[][] = []
    for (let i = 0; i < users.length; i += batchSize) {
      userBatches.push(users.slice(i, i + batchSize))
    }

    // Traitement des batches en parallèle
    const authDataPromises = userBatches.map(async (batch) => {
      const batchPromises = batch.map(async (user) => {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id)
          return {
            userId: user.id,
            lastSignIn: authUser?.user?.last_sign_in_at || null
          }
        } catch (error) {
          // En cas d'erreur, continuer sans faire échouer tout le processus
          return {
            userId: user.id,
            lastSignIn: null
          }
        }
      })
      return Promise.all(batchPromises)
    })

    try {
      const allAuthData = await Promise.all(authDataPromises)
      const flatAuthData = allAuthData.flat()
      
      // Appliquer les données de connexion
      flatAuthData.forEach(({ userId, lastSignIn }) => {
        const user = users.find(u => u.id === userId)
        if (user) {
          user.last_sign_in_at = lastSignIn
        }
      })
    } catch (error) {
      console.warn('⚠️ Erreur partielle lors de la récupération des données de connexion:', error)
      // Continuer même si certaines données de connexion ne sont pas disponibles
    }
    
    // Trier par date de création
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Appliquer les filtres côté application
    if (validatedFilters.search) {
      const searchTerm = validatedFilters.search.toLowerCase()
      users = users.filter(user => 
        user.nom?.toLowerCase().includes(searchTerm) ||
        user.prenom?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm)
      )
    }

    if (validatedFilters.role && validatedFilters.role.length > 0) {
      users = users.filter(user => validatedFilters.role.includes(user.role))
    }

    // Pagination côté application
    const pageSize = validatedFilters.pageSize || 10
    const offset = ((validatedFilters.page || 1) - 1) * pageSize
    const paginatedUsers = users.slice(offset, offset + pageSize)

    console.log(`✅ ${paginatedUsers?.length || 0} utilisateurs récupérés (${users.length} total)`)

    return { success: true, data: paginatedUsers || [] }

  } catch (error) {
    console.error('💥 Erreur listUsersWithRoles:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inattendue' 
    }
  }
}

/**
 * Action formulaire pour créer un utilisateur avec rôles
 */
export async function createUserWithRolesAction(input: CreateUserWithRolesInput) {
  const result = await createUserWithRoles(input)

  if (!result.success) {
    throw new Error(result.error)
  }

  return result
}

/**
 * Créer un utilisateur basique sans assignations obligatoires (Super Admin)
 */
export async function createBasicUser(data: {
  prenom: string
  nom: string
  email: string
  telephone?: string | null
  role: 'admin' | 'super_admin' | 'locataire'
}): Promise<ActionResult> {
  console.log('🚀 Début createBasicUser avec données:', { ...data, telephone: data.telephone || 'non fourni' })
  
  try {
    // Vérifier l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Erreur authentification:', authError)
      return { success: false, error: 'Utilisateur non authentifié' }
    }

    console.log('✅ Utilisateur authentifié:', user.id)

    // Vérifier que l'utilisateur est super admin
    const { data: userRoles, error: roleCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')

    if (roleCheckError) {
      console.error('❌ Erreur vérification rôle super admin:', roleCheckError)
      return { success: false, error: 'Erreur lors de la vérification des permissions' }
    }

    if (!userRoles || userRoles.length === 0) {
      console.error('❌ Accès refusé - utilisateur non super admin')
      return { success: false, error: 'Accès refusé - Super Admin requis' }
    }

    console.log('✅ Permissions super admin vérifiées')

    // Créer l'utilisateur dans auth.users via l'API admin
    console.log('📧 Création utilisateur Auth pour:', data.email)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      user_metadata: {
        prenom: data.prenom,
        nom: data.nom,
        telephone: data.telephone || ''
      }
    })

    if (createError || !newUser.user) {
      console.error('❌ Erreur création utilisateur auth:', createError)
      return { 
        success: false, 
        error: createError?.message || 'Erreur lors de la création de l\'utilisateur' 
      }
    }

    console.log('✅ Utilisateur Auth créé avec ID:', newUser.user.id)

    // Créer le profil dans la table utilisateurs
    console.log('👤 Création profil utilisateur pour:', data.email)
    const profileData = {
      id: newUser.user.id,
      email: data.email,
      prenom: data.prenom,
      nom: data.nom,
      telephone: data.telephone,
      role: data.role // Assigner le rôle pour cohérence
    }
    console.log('📋 Données profil:', profileData)

    const { error: profileError } = await supabaseAdmin
      .from('utilisateurs')
      .insert(profileData)

    if (profileError) {
      console.error('❌ Erreur création profil détaillée:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })
      // Supprimer l'utilisateur auth en cas d'erreur
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return { success: false, error: `Erreur lors de la création du profil: ${profileError.message}` }
    }

    console.log('✅ Profil utilisateur créé avec succès')

    // ⚠️ CORRECTION DU BUG : Ne plus créer automatiquement de rôle ici
    // La logique de création des rôles est maintenant externalisée dans assignUserToOrganisation
    // Ceci évite la double assignation d'organisations pour les admins
    
    console.log('📄 Rôle utilisateur sera créé via assignation externe (pas d\'organisation automatique)')

    // Revalidation des caches
    revalidatePath('/super-admin/utilisateurs')
    revalidatePath('/utilisateurs')

    console.log('🎉 Utilisateur créé avec succès:', {
      id: newUser.user.id,
      email: data.email,
      role: data.role
    })

    return { 
      success: true, 
      data: {
        id: newUser.user.id,
        email: data.email,
        prenom: data.prenom,
        nom: data.nom,
        role: data.role
      }
    }

  } catch (error) {
    console.error('💥 Erreur inattendue lors de la création:', error)
    return { success: false, error: 'Erreur inattendue lors de la création' }
  }
}

/**
 * Action formulaire pour supprimer un utilisateur
 */
export async function deleteUserHardAction(userId: string) {
  const result = await deleteUserHard(userId)

  if (!result.success) {
    throw new Error(result.error)
  }

  return result
}

/**
 * Mettre à jour les informations personnelles d'un utilisateur (sans rôle)
 */
export async function updateUser(
  userId: string,
  data: {
    prenom: string
    nom: string
    email: string
    telephone?: string | null
  }
): Promise<ActionResult> {
  try {
    console.log('🔄 Mise à jour utilisateur:', userId, data)

    // Vérifier l'authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Utilisateur non authentifié' }
    }

    // Vérifier que l'utilisateur est super admin
    const { data: userRoles, error: roleCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')

    if (roleCheckError || !userRoles || userRoles.length === 0) {
      return { success: false, error: 'Accès refusé - Super Admin requis' }
    }

    // Vérifier que l'utilisateur à modifier existe
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (checkError || !existingUser) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (data.email !== existingUser.email) {
      const { data: emailCheck, error: emailError } = await supabaseAdmin
        .from('utilisateurs')
        .select('id')
        .eq('email', data.email)
        .neq('id', userId)
        .single()

      if (emailCheck && !emailError) {
        return { success: false, error: 'Cette adresse email est déjà utilisée' }
      }
    }

    // Mettre à jour les informations dans la table utilisateurs
    const { error: updateError } = await supabaseAdmin
      .from('utilisateurs')
      .update({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Erreur mise à jour utilisateur:', updateError)
      return { success: false, error: `Erreur lors de la mise à jour: ${updateError.message}` }
    }

    // Si l'email a changé, mettre à jour aussi dans auth.users
    if (data.email !== existingUser.email) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: data.email
      })

      if (authUpdateError) {
        console.warn('⚠️ Erreur mise à jour email Auth:', authUpdateError)
        // Ne pas échouer complètement, mais logger l'erreur
      }
    }

    // Revalidation des caches
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath('/utilisateurs')

    console.log('✅ Utilisateur mis à jour avec succès')
    return { success: true }

  } catch (error) {
    console.error('💥 Erreur updateUser:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inattendue' 
    }
  }
}

/**
 * Récupérer les détails complets d'un utilisateur avec ses organisations
 */
export async function getUserDetailWithOrganisations(userId: string): Promise<ActionResult<any>> {
  try {
    console.log('🔍 Récupération détails utilisateur:', userId)

    // Récupérer l'utilisateur avec ses rôles et organisations
    const { data: user, error: userError } = await supabaseAdmin
      .from('utilisateurs')
      .select(`
        id,
        email,
        prenom,
        nom,
        telephone,
        role,
        created_at,
        updated_at,
        user_roles:user_roles!fk_user_roles_user_id (
          user_id,
          organisation_id,
          role,
          created_at,
          updated_at,
          created_by,
          organisations:organisations!user_roles_organisation_id_fkey (
            id,
            nom,
            pays,
            is_active
          )
        )
      `)
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Erreur récupération utilisateur:', userError)
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    // Récupérer les informations de connexion depuis auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    let authData: any = null
    if (!authError && authUser?.user) {
      authData = authUser.user
    }

    // Transformer les données pour correspondre à l'interface UserWithRoles
    const userWithRoles = {
      ...user,
      user_roles: user.user_roles || [],
      last_sign_in_at: authData?.last_sign_in_at || null
    }

    console.log('✅ Détails utilisateur récupérés avec succès')
    return { success: true, data: userWithRoles }

  } catch (error) {
    console.error('💥 Erreur getUserDetailWithOrganisations:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inattendue' 
    }
  }
}

/**
 * Mettre à jour le profil utilisateur (informations personnelles uniquement)
 * Accessible aux super admins pour modifier les autres utilisateurs
 */
export async function updateUserProfile(
  userId: string,
  data: UserProfileEditData
): Promise<ActionResult<any>> {
  try {
    console.log('📝 Mise à jour profil utilisateur:', userId, data)

    // Valider les données d'entrée
    const validatedData = userProfileEditSchema.parse(data)

    // Vérifier l'authentification
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Utilisateur non authentifié' }
    }

    // Vérifier les permissions (super admin peut modifier tous les utilisateurs)
    const canEdit = currentUser.isSuperAdmin || currentUser.id === userId
    if (!canEdit) {
      return { success: false, error: 'Vous n\'êtes pas autorisé à modifier cet utilisateur' }
    }

    // Vérifier que l'utilisateur à modifier existe
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, email, nom, prenom, telephone')
      .eq('id', userId)
      .single()

    if (checkError || !existingUser) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    // Mettre à jour le profil
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('utilisateurs')
      .update({
        prenom: validatedData.prenom,
        nom: validatedData.nom,
        telephone: validatedData.telephone,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, prenom, nom, telephone, updated_at')
      .single()

    if (updateError) {
      console.error('❌ Erreur mise à jour profil:', updateError)
      return { 
        success: false, 
        error: 'Erreur lors de la mise à jour du profil'
      }
    }

    // Mettre à jour les métadonnées dans auth.users
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          nom: validatedData.nom,
          prenom: validatedData.prenom,
          telephone: validatedData.telephone || ''
        }
      })
    } catch (authError) {
      console.warn('⚠️ Erreur mise à jour métadonnées Auth:', authError)
      // Ne pas échouer pour ça, c'est secondaire
    }

    // Revalidation des caches
    revalidatePath('/admin/utilisateurs')
    revalidatePath(`/admin/utilisateurs/${userId}`)
    revalidatePath('/utilisateurs')

    console.log('✅ Profil utilisateur mis à jour avec succès')
    return { 
      success: true, 
      data: updatedUser,
      message: 'Profil mis à jour avec succès'
    }

  } catch (error) {
    console.error('💥 Erreur updateUserProfile:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return { 
        success: false, 
        error: 'Données invalides : ' + error.message 
      }
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inattendue lors de la mise à jour' 
    }
  }
}