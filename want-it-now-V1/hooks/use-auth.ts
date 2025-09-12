// Hook pour utiliser le contexte d'authentification avec fallback de sécurité
// Updated to use the new authentication provider with safety measures

import { useAuthSSR } from '@/providers/auth-provider-ssr'
import { useEffect, useRef } from 'react'

export function useAuth() {
  try {
    const authData = useAuthSSR()
    
    // Log des changements d'état d'authentification pour le debug (simplifié)
    useEffect(() => {
      console.log('🔍 useAuth: État authentification:', {
        isAuthenticated: authData.isAuthenticated,
        hasProfile: !!authData.profile,
        loading: authData.loading,
        hasError: !!authData.error,
        userId: authData.user?.id
      })
    }, [authData.isAuthenticated, authData.profile, authData.loading, authData.error, authData.user?.id])
    
    return authData
  } catch (error) {
    console.error('💥 ERREUR CRITIQUE dans useAuth:', error)
    
    // Fallback de sécurité en cas d'erreur dans le hook
    return {
      user: null,
      session: null,
      profile: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Erreur critique dans useAuth',
      userRoles: [],
      userAssignments: [],
      signIn: async () => ({ success: false, error: 'Service d\'authentification indisponible' }),
      signUp: async () => ({ success: false, error: 'Service d\'authentification indisponible' }),
      signOut: async () => ({ success: false, error: 'Service d\'authentification indisponible' }),
      isAuthenticated: false,
      isSuperAdmin: false,
      isAdmin: false,
      canAccessAdmin: false,
      hasRole: () => false,
      hasAssignment: () => false,
      canManageOrganisation: () => false,
      adminOrganisations: [],
      assignedOrganisations: [],
      refreshUserData: async () => {
        console.error('❌ refreshUserData appelé pendant une erreur critique')
      }
    }
  }
}