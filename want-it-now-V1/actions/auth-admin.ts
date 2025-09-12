'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Admin client with service role for bypassing RLS
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
}

// Types pour les opérations en attente
interface PendingAuthOperation {
  operation_type: 'create' | 'delete'
  user_id: string
  email?: string
  temp_password?: string
  user_metadata?: any
  created_at: string
}

/**
 * Traiter toutes les opérations Auth en attente
 * Cette fonction doit être appelée périodiquement ou après chaque création/suppression manuelle
 */
export async function processPendingAuthOperations(): Promise<ActionResult<{
  processed: number
  failed: number
  details: any[]
}>> {
  try {
    console.log('🔄 Traitement des opérations Auth en attente...')

    // Récupérer toutes les opérations en attente
    const { data: operations, error: fetchError } = await supabaseAdmin
      .rpc('get_pending_auth_operations')

    if (fetchError) {
      console.error('❌ Erreur récupération opérations:', fetchError)
      return { success: false, error: 'Erreur lors de la récupération des opérations en attente' }
    }

    if (!operations || operations.length === 0) {
      console.log('✅ Aucune opération en attente')
      return { success: true, data: { processed: 0, failed: 0, details: [] } }
    }

    console.log(`📋 ${operations.length} opérations à traiter`)

    let processed = 0
    let failed = 0
    const details: any[] = []

    // Traiter chaque opération
    for (const op of operations as PendingAuthOperation[]) {
      try {
        if (op.operation_type === 'create') {
          // Créer utilisateur Auth
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: op.email!,
            password: op.temp_password!,
            email_confirm: true,
            user_metadata: op.user_metadata || {},
            app_metadata: {
              role: op.user_metadata?.role || 'utilisateur'
            }
          })

          if (authError) {
            console.error(`❌ Erreur création Auth pour ${op.email}:`, authError)
            await supabaseAdmin.rpc('mark_auth_operation_processed', {
              operation_type: 'create',
              user_id: op.user_id,
              success: false,
              error_msg: authError.message
            })
            failed++
            details.push({
              operation: 'create',
              user_id: op.user_id,
              email: op.email,
              success: false,
              error: authError.message
            })
          } else {
            console.log(`✅ Utilisateur Auth créé: ${op.email}`)
            await supabaseAdmin.rpc('mark_auth_operation_processed', {
              operation_type: 'create',
              user_id: op.user_id,
              success: true
            })
            processed++
            details.push({
              operation: 'create',
              user_id: op.user_id,
              email: op.email,
              success: true,
              auth_user_id: authData.user?.id
            })

            // Envoyer email de récupération pour définir le mot de passe
            try {
              await supabaseAdmin.auth.admin.generateLink({
                type: 'recovery',
                email: op.email!
              })
              console.log(`📧 Email de récupération envoyé à ${op.email}`)
            } catch (emailErr) {
              console.warn(`⚠️ Erreur envoi email à ${op.email}:`, emailErr)
            }
          }

        } else if (op.operation_type === 'delete') {
          // Supprimer utilisateur Auth
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(op.user_id)

          if (deleteError) {
            console.error(`❌ Erreur suppression Auth ${op.user_id}:`, deleteError)
            await supabaseAdmin.rpc('mark_auth_operation_processed', {
              operation_type: 'delete',
              user_id: op.user_id,
              success: false,
              error_msg: deleteError.message
            })
            failed++
            details.push({
              operation: 'delete',
              user_id: op.user_id,
              success: false,
              error: deleteError.message
            })
          } else {
            console.log(`✅ Utilisateur Auth supprimé: ${op.user_id}`)
            await supabaseAdmin.rpc('mark_auth_operation_processed', {
              operation_type: 'delete',
              user_id: op.user_id,
              success: true
            })
            processed++
            details.push({
              operation: 'delete',
              user_id: op.user_id,
              success: true
            })
          }
        }
      } catch (operationError) {
        console.error(`❌ Erreur traitement opération ${op.operation_type} pour ${op.user_id}:`, operationError)
        failed++
        details.push({
          operation: op.operation_type,
          user_id: op.user_id,
          email: op.email,
          success: false,
          error: operationError instanceof Error ? operationError.message : 'Erreur inconnue'
        })
      }
    }

    console.log(`🎯 Traitement terminé: ${processed} réussies, ${failed} échouées`)
    
    return {
      success: true,
      data: {
        processed,
        failed,
        details
      }
    }

  } catch (error) {
    console.error('💥 Erreur globale processPendingAuthOperations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue'
    }
  }
}

/**
 * Définir/changer le mot de passe d'un utilisateur (Super Admin uniquement)
 */
export async function setUserPassword(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  try {
    console.log('🔐 Changement de mot de passe pour:', userId)

    // Changer le mot de passe via l'Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (updateError) {
      console.error('❌ Erreur changement mot de passe:', updateError)
      return { success: false, error: `Erreur: ${updateError.message}` }
    }

    console.log('✅ Mot de passe changé avec succès')
    return { success: true }

  } catch (error) {
    console.error('💥 Erreur setUserPassword:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue'
    }
  }
}

/**
 * Générer un mot de passe temporaire et l'assigner
 */
export async function resetUserPassword(userId: string): Promise<ActionResult<{ tempPassword: string }>> {
  try {
    console.log('🔄 Génération mot de passe temporaire pour:', userId)

    // Générer mot de passe temporaire sécurisé
    const tempPassword = `TempPass${Date.now()}${Math.random().toString(36).substring(2)}!`

    // Assigner le mot de passe temporaire
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: tempPassword
    })

    if (updateError) {
      console.error('❌ Erreur assignation mot de passe temporaire:', updateError)
      return { success: false, error: `Erreur: ${updateError.message}` }
    }

    console.log('✅ Mot de passe temporaire généré et assigné')
    
    return {
      success: true,
      data: { tempPassword }
    }

  } catch (error) {
    console.error('💥 Erreur resetUserPassword:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue'
    }
  }
}

/**
 * Envoyer un lien de récupération de mot de passe par email
 */
export async function sendPasswordResetEmail(userEmail: string): Promise<ActionResult> {
  try {
    console.log('📧 Envoi email de récupération à:', userEmail)

    const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail
    })

    if (linkError) {
      console.error('❌ Erreur génération lien de récupération:', linkError)
      return { success: false, error: `Erreur: ${linkError.message}` }
    }

    console.log('✅ Email de récupération envoyé avec succès')
    return { success: true }

  } catch (error) {
    console.error('💥 Erreur sendPasswordResetEmail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue'
    }
  }
}

/**
 * Récupérer les opérations Auth en attente (pour debugging/monitoring)
 */
export async function getPendingAuthOperations(): Promise<ActionResult<PendingAuthOperation[]>> {
  try {
    const { data: operations, error } = await supabaseAdmin
      .rpc('get_pending_auth_operations')

    if (error) {
      console.error('❌ Erreur récupération opérations en attente:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: operations || [] }

  } catch (error) {
    console.error('💥 Erreur getPendingAuthOperations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue'
    }
  }
}

/**
 * Créer un utilisateur complet avec Auth automatique
 * Cette fonction doit appeler processPendingAuthOperations après la création
 */
export async function createUserWithAutoAuth(data: {
  prenom: string
  nom: string
  email: string
  telephone?: string
  role: 'admin' | 'super_admin' | 'proprietaire'
  organisations?: string[]
}): Promise<ActionResult> {
  try {
    console.log('🚀 Création utilisateur avec Auth automatique:', data.email)

    // 1. Créer l'utilisateur dans la table publique (trigger se déclenche)
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('utilisateurs')
      .insert({
        email: data.email,
        prenom: data.prenom,
        nom: data.nom,
        telephone: data.telephone || null,
        role: data.role
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erreur création utilisateur:', insertError)
      return { success: false, error: insertError.message }
    }

    console.log('✅ Utilisateur créé dans la table publique')

    // 2. Créer les rôles si nécessaire
    if (data.role === 'admin' && data.organisations) {
      const rolePromises = data.organisations.map(orgId =>
        supabaseAdmin.from('user_roles').insert({
          user_id: newUser.id,
          organisation_id: orgId,
          role: 'admin',
          created_by: newUser.id // ou ID du super admin connecté
        })
      )
      
      await Promise.allSettled(rolePromises)
      console.log('✅ Rôles admin créés pour les organisations')
    }

    // 3. Traiter immédiatement les opérations Auth en attente
    const processingResult = await processPendingAuthOperations()
    
    if (processingResult.success) {
      console.log('✅ Opérations Auth traitées:', processingResult.data)
    } else {
      console.warn('⚠️ Erreur traitement Auth (utilisateur créé mais pas dans Auth):', processingResult.error)
    }

    revalidatePath('/admin/users')
    revalidatePath('/utilisateurs')

    return {
      success: true,
      data: {
        user: newUser,
        auth_processing: processingResult.data
      }
    }

  } catch (error) {
    console.error('💥 Erreur createUserWithAutoAuth:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue'
    }
  }
}

/**
 * Supprimer un utilisateur complet avec Auth automatique - Version directe et synchrone
 */
export async function deleteUserWithAutoAuth(userId: string): Promise<ActionResult> {
  try {
    console.log('🗑️ Suppression utilisateur directe et synchrone:', userId)

    // Étape 1: Récupérer les informations utilisateur avant suppression
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, email, nom, prenom')
      .eq('id', userId)
      .single()

    if (fetchError || !userData) {
      console.error('❌ Utilisateur non trouvé:', fetchError?.message)
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    console.log(`📋 Suppression de: ${userData.prenom} ${userData.nom} (${userData.email})`)

    // Étape 2: Supprimer les relations en premier (pour éviter les contraintes FK)
    console.log('🗑️ Suppression des rôles utilisateur...')
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (rolesError) {
      console.warn('⚠️ Erreur suppression rôles:', rolesError.message)
    } else {
      console.log('✅ Rôles utilisateur supprimés')
    }

    // Étape 3: Supprimer des assignations d'organisation
    console.log('🗑️ Suppression des assignations organisation...')
    const { error: assignmentsError } = await supabaseAdmin
      .from('user_organisation_assignments')
      .delete()
      .eq('user_id', userId)

    if (assignmentsError) {
      console.warn('⚠️ Erreur suppression assignations:', assignmentsError.message)
    } else {
      console.log('✅ Assignations organisation supprimées')
    }

    // Étape 4: Supprimer le profil utilisateur (cela déclenchera la suppression Auth via CASCADE)
    console.log('🗑️ Suppression du profil utilisateur...')
    const { error: profileDeleteError } = await supabaseAdmin
      .from('utilisateurs')
      .delete()
      .eq('id', userId)

    if (profileDeleteError) {
      console.error('❌ Erreur suppression profil:', profileDeleteError.message)
      return { 
        success: false, 
        error: `Erreur suppression profil: ${profileDeleteError.message}` 
      }
    }

    console.log('✅ Profil utilisateur supprimé')

    // Étape 5: Supprimer de Auth si ce n'était pas automatique (au cas où CASCADE ne marche pas)
    console.log('🗑️ Vérification suppression Auth...')
    const { data: authCheck } = await supabaseAdmin.auth.admin.getUserById(userId)
    let authDeleteError: any = null
    
    if (authCheck.user) {
      console.log('⚠️ Utilisateur Auth encore présent, suppression manuelle...')
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      authDeleteError = error
      
      if (authDeleteError) {
        console.warn('⚠️ Erreur suppression Auth manuelle:', authDeleteError.message)
      } else {
        console.log('✅ Utilisateur Auth supprimé manuellement')
      }
    } else {
      console.log('✅ Utilisateur Auth supprimé automatiquement via CASCADE')
    }

    // Étape 5: Nettoyer les opérations en attente si elles existent
    console.log('🧹 Nettoyage des opérations en attente...')
    try {
      await supabaseAdmin.rpc('mark_auth_operation_processed', {
        operation_type: 'delete',
        user_id: userId,
        success: true
      })
    } catch (cleanupError) {
      console.warn('⚠️ Nettoyage opérations en attente:', cleanupError)
      // Non critique, on continue
    }

    // Étape 6: Revalidation des caches
    revalidatePath('/admin/users')
    revalidatePath('/utilisateurs')

    console.log(`🎯 Suppression complète réussie: ${userData.email}`)

    return {
      success: true,
      data: {
        deleted_user: {
          id: userId,
          email: userData.email,
          name: `${userData.prenom} ${userData.nom}`
        },
        auth_deleted: !authDeleteError,
        profile_deleted: true
      }
    }

  } catch (error) {
    console.error('💥 Erreur critique deleteUserWithAutoAuth:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inattendue lors de la suppression'
    }
  }
}