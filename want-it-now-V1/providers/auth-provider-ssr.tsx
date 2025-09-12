'use client'

import { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ServerAuthData } from '@/lib/auth/server-auth'
import { 
  logSupabaseError, 
  withRetry, 
  analyzeSupabaseAuthState, 
  clearSupabaseCache, 
  runSupabaseHealthCheck 
} from '@/lib/utils/supabase-debug'

// Types pour la nouvelle architecture
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
  role: 'super_admin' | 'admin' | 'utilisateur'
}

interface UserAssignmentData {
  organisation_id: string
  organisation_nom: string
  relationship_type: 'proprietaire' | 'locataire' | 'prestataire'
  metadata: Record<string, any>
}

interface AuthContextType {
  // États de base
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  
  // Données multi-organisation
  userRoles: UserRoleData[]
  userAssignments: UserAssignmentData[]
  
  // Fonctions d'authentification
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  
  // Helpers d'autorisation
  isAuthenticated: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  canAccessAdmin: boolean
  hasRole: (organisationId: string, role: string) => boolean
  hasAssignment: (organisationId: string, relationshipType: string) => boolean
  canManageOrganisation: (organisationId: string) => boolean
  adminOrganisations: string[]
  assignedOrganisations: string[]
  
  // Refresh des données
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderSSRProps {
  children: React.ReactNode
  initialData?: ServerAuthData
}

export function AuthProviderSSR({ children, initialData }: AuthProviderSSRProps) {
  console.log('🔄 [CLIENT-AUTH] AuthProviderSSR init avec initialData:', {
    hasInitialData: !!initialData,
    hasUser: !!initialData?.user,
    hasProfile: !!initialData?.profile,
    rolesCount: initialData?.userRoles?.length || 0,
    error: initialData?.error
  })

  // Router pour le rafraîchissement après connexion
  const router = useRouter()

  // Utiliser useRef pour stocker les données initiales sans re-render
  const initialDataRef = useRef(initialData)
  const hasProcessedInitialData = useRef(false)

  // Validation et nettoyage des données initiales pour éviter les états incohérents
  const cleanInitialData = useMemo(() => {
    if (!initialDataRef.current) {
      return {
        user: null,
        profile: null,
        userRoles: [],
        userAssignments: [],
        error: null
      }
    }

    return {
      user: initialDataRef.current.user || null,
      profile: initialDataRef.current.profile || null,
      userRoles: Array.isArray(initialDataRef.current.userRoles) ? initialDataRef.current.userRoles : [],
      userAssignments: Array.isArray(initialDataRef.current.userAssignments) ? initialDataRef.current.userAssignments : [],
      error: initialDataRef.current.error || null
    }
  }, []) // Pas de dépendances pour éviter les re-calculs

  // États hydratés avec les données serveur nettoyées
  const [user, setUser] = useState<User | null>(cleanInitialData.user)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(cleanInitialData.profile)
  const [userRoles, setUserRoles] = useState<UserRoleData[]>(cleanInitialData.userRoles)
  const [userAssignments, setUserAssignments] = useState<UserAssignmentData[]>(cleanInitialData.userAssignments)
  // 🔧 Fix: Loading state optimisé selon présence de données SSR
  const [loading, setLoading] = useState(!cleanInitialData.user && !cleanInitialData.error)
  const [error, setError] = useState<string | null>(cleanInitialData.error)
  
  const supabase = useMemo(() => createClient(), [])
  const abortControllerRef = useRef<AbortController | null>(null)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour charger les données utilisateur avec robustesse améliorée
  const loadUserData = useCallback(async (currentUser: User, signal?: AbortSignal) => {
    try {
      console.log('🔄 [CLIENT-AUTH] loadUserData démarré pour userId:', currentUser.id)
      setError(null)

      // Vérifier si l'opération a été annulée
      if (signal?.aborted) {
        console.log('⏹️ [CLIENT-AUTH] loadUserData annulé avant démarrage')
        return
      }

      // Exécuter les requêtes avec retry automatique
      const loadDataWithRetry = async () => {
        const operations = [
          // Profil utilisateur
          async () => {
            const query = supabase
              .from('utilisateurs')
              .select('*')
              .eq('id', currentUser.id)
              .single()
            
            return signal ? query.abortSignal(signal) : query
          },
          
          // Rôles utilisateur
          async () => {
            const query = supabase
              .from('user_roles')
              .select('organisation_id, role')
              .eq('user_id', currentUser.id)
              
            return signal ? query.abortSignal(signal) : query
          },
          
          // Assignations utilisateur
          async () => {
            const query = supabase
              .from('user_organisation_assignments')
              .select('organisation_id, relationship_type, metadata')
              .eq('user_id', currentUser.id)
              
            return signal ? query.abortSignal(signal) : query
          }
        ]

        // Exécuter avec retry pour chaque opération
        const results = await Promise.allSettled([
          withRetry(operations[0], 2, 500).catch(err => {
            logSupabaseError(err, 'Load Profile Data')
            return { data: null, error: err }
          }),
          withRetry(operations[1], 2, 500).catch(err => {
            logSupabaseError(err, 'Load Roles Data')
            return { data: [], error: err }
          }),
          withRetry(operations[2], 2, 500).catch(err => {
            logSupabaseError(err, 'Load Assignments Data')
            return { data: [], error: err }
          })
        ])

        return results.map(result => 
          result.status === 'fulfilled' ? result.value : { data: null, error: result.reason }
        )
      }

      const [profileResult, rolesResult, assignmentsResult] = await loadDataWithRetry()

      console.log('📊 [CLIENT-AUTH] Résultats requêtes client:', {
        profile: { hasData: !!profileResult.data, error: profileResult.error?.code },
        roles: { count: rolesResult.data?.length || 0, error: rolesResult.error?.message },
        assignments: { count: assignmentsResult.data?.length || 0, error: assignmentsResult.error?.message }
      })

      // Vérifier à nouveau si annulé après les requêtes
      if (signal?.aborted) {
        console.log('⏹️ [CLIENT-AUTH] loadUserData annulé après requêtes')
        return
      }

      // Traitement du profil
      if (profileResult.error && profileResult.error.code !== 'PGRST116') {
        console.log('⚠️ [CLIENT-AUTH] Erreur profil, utilisation fallback:', profileResult.error)
        const fallbackProfile = {
          id: currentUser.id,
          email: currentUser.email || '',
          nom: currentUser.user_metadata?.nom || 'Utilisateur',
          prenom: currentUser.user_metadata?.prenom || '',
          telephone: currentUser.user_metadata?.telephone || '',
          created_at: currentUser.created_at,
          updated_at: new Date().toISOString()
        }
        setProfile(fallbackProfile)
      } else {
        setProfile(profileResult.data)
      }

      // Traitement des rôles
      const formattedRoles = rolesResult.error ? [] : (rolesResult.data?.map(r => ({
        organisation_id: r.organisation_id,
        organisation_nom: 'Organisation',
        role: r.role as 'super_admin' | 'admin' | 'utilisateur'
      })) || [])
      setUserRoles(formattedRoles)

      // Traitement des assignations
      const formattedAssignments = assignmentsResult.error ? [] : (assignmentsResult.data?.map(a => ({
        organisation_id: a.organisation_id,
        organisation_nom: 'Organisation',
        relationship_type: a.relationship_type as 'proprietaire' | 'locataire' | 'prestataire',
        metadata: a.metadata || {}
      })) || [])
      setUserAssignments(formattedAssignments)

      console.log('✅ [CLIENT-AUTH] Données utilisateur chargées avec succès')

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('⏹️ [CLIENT-AUTH] Requête annulée (AbortError)')
        return
      }
      
      console.error('💥 [CLIENT-AUTH] ERREUR chargement données utilisateur:', err)
      setError(err instanceof Error ? err.message : 'Erreur chargement données utilisateur')
      
      // Fallback avec données auth en cas d'erreur
      const minimalProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        nom: currentUser.user_metadata?.nom || 'Utilisateur',
        prenom: currentUser.user_metadata?.prenom || '',
        telephone: '',
        created_at: currentUser.created_at,
        updated_at: new Date().toISOString()
      }
      setProfile(minimalProfile)
      setUserRoles([])
      setUserAssignments([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fonction de refresh avec protection renforcée contre les appels multiples
  const refreshUserData = useCallback(async () => {
    if (user && !loading) {
      console.log('🔄 [CLIENT-AUTH] Refresh des données utilisateur...')
      setLoading(true)
      
      // Annuler les requêtes précédentes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Créer un nouveau contrôleur d'abort
      abortControllerRef.current = new AbortController()
      await loadUserData(user, abortControllerRef.current.signal)
    }
  }, [user, loading, loadUserData])

  // Initialisation et écoute des changements d'auth - SIMPLIFIÉ
  useEffect(() => {
    console.log('🔄 [CLIENT-AUTH] useEffect init démarré avec données SSR:', {
      hasSSRUser: !!cleanInitialData.user,
      hasSSRError: !!cleanInitialData.error,
      hasProcessed: hasProcessedInitialData.current
    })
    
    let isMounted = true

    // 🔧 FIX: Éviter double initialisation - traiter seulement les cas nécessaires
    if (!hasProcessedInitialData.current) {
      hasProcessedInitialData.current = true
      
      // Si on a des données SSR valides (user ou error), on n'initialise PAS côté client
      if (cleanInitialData.user || cleanInitialData.error) {
        console.log('✅ [CLIENT-AUTH] Données SSR présentes, pas d\'initialisation client nécessaire')
        setLoading(false) // Important: Arrêter le loading si on a des données SSR
      } else {
        console.log('⚠️ [CLIENT-AUTH] Pas de données initiales SSR, initialisation client requise')
        
        const initializeAuth = async () => {
          try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            console.log('🔍 [CLIENT-AUTH] Session récupérée:', { hasSession: !!session, hasUser: !!session?.user })
            
            if (session?.user && isMounted) {
              setUser(session.user)
              setSession(session)
              
              // Créer contrôleur d'abort pour l'initialisation
              const controller = new AbortController()
              abortControllerRef.current = controller
              await loadUserData(session.user, controller.signal)
            } else if (isMounted) {
              setLoading(false)
            }
          } catch (err) {
            console.error('💥 [CLIENT-AUTH] ERREUR initialisation auth:', err)
            if (isMounted) {
              setError(err instanceof Error ? err.message : 'Erreur initialisation')
              setLoading(false)
            }
          }
        }

        initializeAuth()
      }
    }

    // Écouter les changements d'auth - OPTIMISÉ pour éviter les boucles
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 [CLIENT-AUTH] Changement auth state:', { 
        event, 
        hasSession: !!session, 
        hasUser: !!session?.user,
        isMounted,
        currentUser: !!user
      })
      
      if (!isMounted) {
        return
      }

      // 🔧 FIX: Traiter seulement les événements qui nécessitent une action
      if (event === 'SIGNED_IN' && session?.user && session.user.id !== user?.id) {
        console.log('✅ [CLIENT-AUTH] SIGNED_IN détecté avec nouvel utilisateur, mise à jour état')
        setUser(session.user)
        setSession(session)
        setLoading(true)
        
        // Annuler les requêtes précédentes
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        
        // Créer nouveau contrôleur
        const controller = new AbortController()
        abortControllerRef.current = controller
        await loadUserData(session.user, controller.signal)
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 [CLIENT-AUTH] SIGNED_OUT détecté, nettoyage état')
        // Annuler toutes les requêtes en cours
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        
        setUser(null)
        setSession(null)
        setProfile(null)
        setUserRoles([])
        setUserAssignments([])
        setLoading(false)
        setError(null)
      }
      // Ignorer TOKEN_REFRESHED et USER_UPDATED pour éviter les boucles
      // Ignorer SIGNED_IN si c'est le même utilisateur (évite double chargement)
    })

    return () => {
      console.log('🧹 [CLIENT-AUTH] Nettoyage lors du démontage du composant')
      isMounted = false
      
      // Annuler toutes les requêtes en cours
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Nettoyer les timeouts de sécurité
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }
      
      subscription.unsubscribe()
    }
  }, []) // Tableau vide pour éviter les re-exécutions

  // Fonctions d'authentification avec gestion d'erreurs robuste
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      console.log('🔐 [CLIENT-AUTH] Tentative de connexion pour:', email)

      // Vérifier l'état auth avant de procéder
      const authState = analyzeSupabaseAuthState()
      if (authState.error && authState.error.includes('expiré')) {
        console.log('🧹 [CLIENT-AUTH] Nettoyage cache avant nouvelle connexion')
        clearSupabaseCache()
      }

      const signInOperation = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        return data
      }

      const result = await withRetry(signInOperation, 2, 1000)
      
      console.log('✅ [CLIENT-AUTH] Connexion réussie, rafraîchissement...')
      router.refresh()
      
      return { success: true }
    } catch (err) {
      logSupabaseError(err, 'Sign In Operation')
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la connexion'
      setError(errorMsg)
      
      // En cas d'échec persistant, proposer un diagnostic
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        console.log('🏥 [CLIENT-AUTH] Échec connexion, diagnostic automatique...')
        runSupabaseHealthCheck()
      }
      
      return { success: false, error: errorMsg }
    }
  }, [supabase, router])

  const signUp = useCallback(async (email: string, password: string, metadata?: any) => {
    try {
      setError(null)
      console.log('📝 [CLIENT-AUTH] Tentative d\'inscription pour:', email)

      const signUpOperation = async () => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata }
        })
        
        if (error) throw error
        return data
      }

      const result = await withRetry(signUpOperation, 2, 1000)
      
      console.log('✅ [CLIENT-AUTH] Inscription réussie')
      return { success: true }
    } catch (err) {
      logSupabaseError(err, 'Sign Up Operation')
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'inscription'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    try {
      setError(null)
      console.log('🚪 [CLIENT-AUTH] Déconnexion en cours...')
      
      // Annuler toutes les requêtes en cours
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      const signOutOperation = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }

      // Utiliser retry même pour signOut pour gérer les problèmes réseau
      await withRetry(signOutOperation, 2, 500)
      
      // Nettoyer complètement le cache après déconnexion réussie
      console.log('🧹 [CLIENT-AUTH] Nettoyage cache après déconnexion')
      clearSupabaseCache()
      
      console.log('✅ [CLIENT-AUTH] Déconnexion réussie, redirection...')
      // Redirection directe pour éviter les problèmes avec le middleware
      window.location.href = '/'
      
      return { success: true }
    } catch (err) {
      logSupabaseError(err, 'Sign Out Operation')
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la déconnexion'
      setError(errorMsg)
      
      // Même en cas d'erreur, nettoyer le cache local et rediriger
      console.log('⚠️ [CLIENT-AUTH] Erreur déconnexion, nettoyage forcé')
      clearSupabaseCache()
      
      // Rediriger quand même en cas d'erreur pour éviter un état incohérent
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
      
      return { success: false, error: errorMsg }
    }
  }, [supabase])

  // Helpers d'autorisation avec useMemo pour éviter les recalculs
  const authHelpers = useMemo(() => {
    const hasRole = (organisationId: string, role: string): boolean => {
      return userRoles.some(userRole => 
        userRole.organisation_id === organisationId && userRole.role === role
      )
    }

    const hasAssignment = (organisationId: string, relationshipType: string): boolean => {
      return userAssignments.some(assignment => 
        assignment.organisation_id === organisationId && assignment.relationship_type === relationshipType
      )
    }

    const isSuperAdmin = userRoles.some(role => role.role === 'super_admin')
    const isAdmin = userRoles.some(role => role.role === 'admin') || isSuperAdmin
    const canAccessAdmin = isSuperAdmin || userRoles.some(role => role.role === 'admin')
    
    const canManageOrganisation = (organisationId: string): boolean => {
      return isSuperAdmin || hasRole(organisationId, 'admin')
    }
    
    const adminOrganisations = userRoles
      .filter(role => role.role === 'admin')
      .map(role => role.organisation_id)
    
    const assignedOrganisations = Array.from(new Set([
      ...userRoles.map(role => role.organisation_id),
      ...userAssignments.map(assignment => assignment.organisation_id)
    ]))

    return {
      hasRole,
      hasAssignment,
      isSuperAdmin,
      isAdmin,
      canAccessAdmin,
      canManageOrganisation,
      adminOrganisations,
      assignedOrganisations
    }
  }, [userRoles, userAssignments])

  // Valeur contexte mémorisée pour éviter les re-renders
  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    error,
    userRoles,
    userAssignments,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    refreshUserData,
    ...authHelpers
  }), [
    user,
    session,
    profile,
    loading,
    error,
    userRoles,
    userAssignments,
    signIn,
    signUp,
    signOut,
    refreshUserData,
    authHelpers
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthSSR() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthSSR must be used within an AuthProviderSSR')
  }
  return context
}