'use server'

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

// Interface pour les données utilisateur avec rôle
export interface ServerUserData {
  user: {
    id: string
    email?: string
  } | null
  userRole: {
    organisation_id: string
    role: 'super_admin' | 'admin' | 'user'
  } | null
  organisationId?: string
  isAuthenticated: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  canCreateUnlimited: boolean
}

// Helper cached pour récupérer les données utilisateur serveur
export const getServerUserData = cache(async (): Promise<ServerUserData> => {
  try {
    const supabase = await createClient()
    
    // Récupérer l'utilisateur authentifié
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        user: null,
        userRole: null,
        isAuthenticated: false,
        isSuperAdmin: false,
        isAdmin: false,
        canCreateUnlimited: false
      }
    }

    // Récupérer le rôle de l'utilisateur
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('organisation_id, role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return {
        user,
        userRole: null,
        isAuthenticated: true,
        isSuperAdmin: false,
        isAdmin: false,
        canCreateUnlimited: false
      }
    }

    const isSuperAdmin = userRole.role === 'super_admin'
    const isAdmin = userRole.role === 'admin'
    const canCreateUnlimited = isSuperAdmin || isAdmin

    return {
      user,
      userRole,
      organisationId: userRole.organisation_id,
      isAuthenticated: true,
      isSuperAdmin,
      isAdmin,
      canCreateUnlimited
    }
  } catch (error) {
    console.error('Erreur getServerUserData:', error)
    return {
      user: null,
      userRole: null,
      isAuthenticated: false,
      isSuperAdmin: false,
      isAdmin: false,
      canCreateUnlimited: false
    }
  }
})

// Helper pour vérifier les permissions de création
export const canCreateProprietaire = cache(async (): Promise<boolean> => {
  const userData = await getServerUserData()
  return userData.canCreateUnlimited
})

// Helper pour récupérer l'organisation ID pour les requêtes filtrées
export const getOrganisationFilter = cache(async (): Promise<string | undefined> => {
  const userData = await getServerUserData()
  // Super admin voir tout, admin/user voir leur organisation
  return userData.isSuperAdmin ? undefined : userData.organisationId
})

// Helper pour vérifier l'authentification
export const requireAuth = cache(async (): Promise<ServerUserData> => {
  const userData = await getServerUserData()
  
  if (!userData.isAuthenticated) {
    throw new Error('Non autorisé')
  }
  
  return userData
})