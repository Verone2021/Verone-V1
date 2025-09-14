/**
 * 🔧 Server Actions - Gestion des Utilisateurs
 *
 * Actions serveur pour la création et gestion des utilisateurs
 * dans l'interface d'administration Vérone.
 */

"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
// import { validateProfileForm, sanitizeProfileData } from '@/lib/validation/profile-validation'

export interface CreateUserData {
  email: string
  password: string
  role: 'owner' | 'admin' | 'catalog_manager'
  firstName: string
  lastName: string
  phone: string
  jobTitle: string
}

export interface ActionResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Vérifier que l'utilisateur actuel est un owner
 */
async function verifyOwnerAccess(): Promise<ActionResult> {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Non authentifié' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'Profil utilisateur non trouvé' }
  }

  if (profile.role !== 'owner') {
    return { success: false, error: 'Accès non autorisé - Rôle owner requis' }
  }

  return { success: true }
}

/**
 * Créer un nouvel utilisateur avec son rôle
 */
export async function createUserWithRole(userData: CreateUserData): Promise<ActionResult> {
  // CORRECTION: Try-catch global plus robuste selon bonnes pratiques Next.js
  try {
    // Validation des données d'entrée
    if (!userData?.email || !userData?.password || !userData?.role) {
      return {
        success: false,
        error: 'Données manquantes: email, password et role sont requis'
      }
    }

    // Vérifier les permissions
    const accessCheck = await verifyOwnerAccess()
    if (!accessCheck.success) {
      return accessCheck
    }

    // CORRECTION: Initialiser les clients avec gestion d'erreur
    let supabase: any
    let adminClient: any

    try {
      supabase = await createServerClient()
      adminClient = createAdminClient()
    } catch (clientError) {
      console.error('Erreur initialisation clients Supabase:', clientError)
      return {
        success: false,
        error: 'Erreur de configuration Supabase'
      }
    }

    // 1. Créer l'utilisateur dans Supabase Auth avec l'API Admin
    let newUser: any
    let authError: any

    try {
      const result = await adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirmer l'email
        user_metadata: {
          name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : userData.email.split('@')[0]
        }
      })

      newUser = result.data
      authError = result.error
    } catch (adminError) {
      console.error('Erreur Admin API createUser:', adminError)
      return {
        success: false,
        error: 'Erreur lors de la création du compte utilisateur'
      }
    }

    if (authError || !newUser?.user) {
      console.error('Erreur création auth user:', authError)
      return {
        success: false,
        error: authError?.message || 'Erreur lors de la création du compte utilisateur'
      }
    }

    // 2. Créer le profil utilisateur dans la table user_profiles
    let profileError: any

    try {
      const result = await supabase
        .from('user_profiles')
        .insert({
          user_id: newUser.user.id,
          role: userData.role,
          user_type: 'staff',
          scopes: [], // À définir selon les besoins
          partner_id: null
          // Note: first_name, last_name, phone, job_title pas encore dans le schéma
          // Ces colonnes seront ajoutées dans une prochaine migration
        })

      profileError = result.error
    } catch (dbError) {
      console.error('Erreur DB insert profil:', dbError)
      profileError = dbError
    }

    if (profileError) {
      console.error('Erreur création profil:', profileError)

      // Supprimer l'utilisateur auth si la création du profil a échoué
      try {
        await adminClient.auth.admin.deleteUser(newUser.user.id)
      } catch (cleanupError) {
        console.error('Erreur cleanup utilisateur:', cleanupError)
      }

      return {
        success: false,
        error: 'Erreur lors de la création du profil utilisateur'
      }
    }

    // Revalider la page d'administration pour afficher le nouvel utilisateur
    try {
      revalidatePath('/admin/users')
    } catch (revalidateError) {
      console.error('Erreur revalidation:', revalidateError)
      // Ne pas faire échouer la création pour une erreur de revalidation
    }

    // CORRECTION: Retour structuré garanti
    return {
      success: true,
      data: {
        user_id: newUser.user.id,
        email: newUser.user.email,
        role: userData.role
      }
    }

  } catch (error: any) {
    // CORRECTION: Catch global qui capture TOUT problème imprévu
    console.error('Erreur globale createUserWithRole:', error)
    return {
      success: false,
      error: error?.message || 'Une erreur inattendue s\'est produite lors de la création de l\'utilisateur'
    }
  }
}

/**
 * Supprimer un utilisateur
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    // Vérifier les permissions
    const accessCheck = await verifyOwnerAccess()
    if (!accessCheck.success) {
      return accessCheck
    }

    const supabase = await createServerClient()
    const adminClient = createAdminClient()

    // Vérifier qu'on ne supprime pas le dernier owner
    const { data: owners } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('role', 'owner')

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (userProfile?.role === 'owner' && owners && owners.length <= 1) {
      return {
        success: false,
        error: 'Impossible de supprimer le dernier propriétaire du système'
      }
    }

    // Supprimer d'abord le profil utilisateur
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    if (profileError) {
      console.error('Erreur suppression profil:', profileError)
      return {
        success: false,
        error: 'Erreur lors de la suppression du profil utilisateur'
      }
    }

    // Ensuite supprimer l'utilisateur auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Erreur suppression auth user:', authError)
      return {
        success: false,
        error: 'Erreur lors de la suppression du compte utilisateur'
      }
    }

    // Revalider la page d'administration
    revalidatePath('/admin/users')

    return { success: true }

  } catch (error) {
    console.error('Erreur deleteUser:', error)
    return {
      success: false,
      error: 'Une erreur inattendue s\'est produite lors de la suppression'
    }
  }
}

/**
 * Mettre à jour le rôle d'un utilisateur
 */
export async function updateUserRole(userId: string, newRole: 'owner' | 'admin' | 'catalog_manager'): Promise<ActionResult> {
  try {
    // Vérifier les permissions
    const accessCheck = await verifyOwnerAccess()
    if (!accessCheck.success) {
      return accessCheck
    }

    const supabase = await createServerClient()

    // Vérifier qu'on ne retire pas le rôle owner du dernier owner
    if (newRole !== 'owner') {
      const { data: owners } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('role', 'owner')

      const { data: currentUser } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (currentUser?.role === 'owner' && owners && owners.length <= 1) {
        return {
          success: false,
          error: 'Impossible de modifier le rôle du dernier propriétaire du système'
        }
      }
    }

    // Mettre à jour le rôle
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) {
      console.error('Erreur mise à jour rôle:', error)
      return {
        success: false,
        error: 'Erreur lors de la mise à jour du rôle'
      }
    }

    // Revalider la page d'administration
    revalidatePath('/admin/users')

    return { success: true }

  } catch (error) {
    console.error('Erreur updateUserRole:', error)
    return {
      success: false,
      error: 'Une erreur inattendue s\'est produite lors de la mise à jour du rôle'
    }
  }
}

/**
 * Réinitialiser le mot de passe d'un utilisateur
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<ActionResult> {
  try {
    // Vérifier les permissions
    const accessCheck = await verifyOwnerAccess()
    if (!accessCheck.success) {
      return accessCheck
    }

    const adminClient = createAdminClient()

    // Mettre à jour le mot de passe via l'API Admin
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (error) {
      console.error('Erreur réinitialisation mot de passe:', error)
      return {
        success: false,
        error: 'Erreur lors de la réinitialisation du mot de passe'
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Erreur resetUserPassword:', error)
    return {
      success: false,
      error: 'Une erreur inattendue s\'est produite lors de la réinitialisation'
    }
  }
}

export interface UpdateUserProfileData {
  first_name?: string
  last_name?: string
  job_title?: string
  role?: string
}

/**
 * Mettre à jour le profil complet d'un utilisateur
 */
export async function updateUserProfile(userId: string, updateData: UpdateUserProfileData): Promise<ActionResult> {
  try {
    // Vérifier les permissions
    const accessCheck = await verifyOwnerAccess()
    if (!accessCheck.success) {
      return accessCheck
    }

    const supabase = await createServerClient()
    const adminClient = createAdminClient()

    // Vérifier que l'utilisateur existe
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!existingProfile) {
      return {
        success: false,
        error: 'Profil utilisateur non trouvé'
      }
    }

    // Préparer les mises à jour
    const profileUpdates: any = {
      updated_at: new Date().toISOString()
    }

    if (updateData.role) {
      profileUpdates.role = updateData.role
    }

    // Note: Les colonnes first_name, last_name, job_title seront ajoutées plus tard
    // En attendant, on met à jour les user_metadata

    // Mettre à jour le profil
    if (Object.keys(profileUpdates).length > 1) { // Plus que juste updated_at
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('user_id', userId)

      if (updateError) {
        console.error('Erreur mise à jour profil:', updateError)
        return {
          success: false,
          error: 'Erreur lors de la mise à jour du profil'
        }
      }
    }

    // Mettre à jour les métadonnées utilisateur
    if (updateData.first_name || updateData.last_name) {
      const displayName = [updateData.first_name, updateData.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()

      if (displayName) {
        const { error: metadataError } = await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: {
            name: displayName,
            first_name: updateData.first_name || '',
            last_name: updateData.last_name || '',
            job_title: updateData.job_title || ''
          }
        })

        if (metadataError) {
          console.error('Erreur mise à jour métadonnées:', metadataError)
          // Ne pas faire échouer complètement pour une erreur de métadonnées
        }
      }
    }

    // Revalider la page
    revalidatePath('/admin/users')

    return { success: true }

  } catch (error: any) {
    console.error('Erreur updateUserProfile:', error)
    return {
      success: false,
      error: error.message || 'Une erreur inattendue s\'est produite'
    }
  }
}