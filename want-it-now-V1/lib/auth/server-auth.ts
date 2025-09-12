import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

// Types pour la nouvelle architecture server-side
interface UserProfile {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  created_at: string
  updated_at: string
}

interface UserRoleData {
  organisation_id: string
  organisation_nom: string
  role: 'super_admin' | 'admin'
}

interface UserAssignmentData {
  organisation_id: string
  organisation_nom: string
  relationship_type: 'proprietaire' | 'locataire' | 'prestataire'
  metadata: Record<string, any>
}

export interface ServerAuthData {
  user: User | null
  profile: UserProfile | null
  userRoles: UserRoleData[]
  userAssignments: UserAssignmentData[]
  error: string | null
}

export async function getServerAuthData(): Promise<ServerAuthData> {
  console.log('🔄 [SERVER-AUTH] Début getServerAuthData')
  try {
    const supabase = await createClient()
    console.log('✅ [SERVER-AUTH] Client Supabase créé')
    
    // Récupérer l'utilisateur authentifié
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('🔍 [SERVER-AUTH] Résultat auth.getUser:', { 
      hasUser: !!user, 
      userId: user?.id, 
      error: userError?.message 
    })
    
    if (userError || !user) {
      console.log('❌ [SERVER-AUTH] Pas d\'utilisateur authentifié, retour données vides')
      return {
        user: null,
        profile: null,
        userRoles: [],
        userAssignments: [],
        error: userError?.message || null
      }
    }

    // Charger toutes les données en parallèle avec Promise.all
    console.log('🔄 [SERVER-AUTH] Chargement données en parallèle pour userId:', user.id)
    const [profileResult, rolesResult, assignmentsResult] = await Promise.all([
      // Profil utilisateur avec fallback
      supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', user.id)
        .single(),
      
      // Rôles utilisateur
      supabase
        .from('user_roles')
        .select('organisation_id, role')
        .eq('user_id', user.id),
      
      // Assignations utilisateur
      supabase
        .from('user_organisation_assignments')
        .select('organisation_id, relationship_type, metadata')
        .eq('user_id', user.id)
    ])

    console.log('📊 [SERVER-AUTH] Résultats requêtes:', {
      profile: { hasData: !!profileResult.data, error: profileResult.error?.message },
      roles: { count: rolesResult.data?.length || 0, error: rolesResult.error?.message },
      assignments: { count: assignmentsResult.data?.length || 0, error: assignmentsResult.error?.message }
    })

    // Traitement du profil avec fallback robuste
    let profile: UserProfile
    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      // Fallback avec les données auth
      profile = {
        id: user.id,
        email: user.email || '',
        nom: user.user_metadata?.nom || 'Utilisateur',
        prenom: user.user_metadata?.prenom || '',
        telephone: user.user_metadata?.telephone || '',
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      }
    } else {
      profile = profileResult.data || {
        id: user.id,
        email: user.email || '',
        nom: user.user_metadata?.nom || 'Utilisateur',
        prenom: user.user_metadata?.prenom || '',
        telephone: '',
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      }
    }

    // Traitement des rôles avec fallback
    const userRoles: UserRoleData[] = rolesResult.error ? [] : (rolesResult.data?.map(r => ({
      organisation_id: r.organisation_id,
      organisation_nom: 'Organisation',
      role: r.role as 'super_admin' | 'admin'
    })) || [])

    // Traitement des assignations avec fallback
    const userAssignments: UserAssignmentData[] = assignmentsResult.error ? [] : (assignmentsResult.data?.map(a => ({
      organisation_id: a.organisation_id,
      organisation_nom: 'Organisation',
      relationship_type: a.relationship_type as 'proprietaire' | 'locataire' | 'prestataire',
      metadata: a.metadata || {}
    })) || [])

    console.log('✅ [SERVER-AUTH] Données finales assemblées:', {
      hasUser: !!user,
      hasProfile: !!profile,
      rolesCount: userRoles.length,
      assignmentsCount: userAssignments.length,
      userId: user.id
    })

    return {
      user,
      profile,
      userRoles,
      userAssignments,
      error: null
    }

  } catch (error) {
    console.error('💥 [SERVER-AUTH] ERREUR CRITIQUE server auth:', error)
    console.error('💥 [SERVER-AUTH] Stack trace:', error instanceof Error ? error.stack : 'No stack')
    return {
      user: null,
      profile: null,
      userRoles: [],
      userAssignments: [],
      error: error instanceof Error ? error.message : 'Erreur serveur auth'
    }
  }
}