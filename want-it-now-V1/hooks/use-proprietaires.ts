'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'

import {
  getProprietaires,
  searchProprietaires,
  createProprietaire,
  updateProprietaire,
  toggleProprietaireBrouillon,
} from '@/actions/proprietaires'
import {
  type Proprietaire,
  type CreateProprietaire,
  type ProprietaireType,
} from '@/lib/validations/proprietaires'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface UseProprietairesOptions {
  initialData?: Proprietaire[]
  autoFetch?: boolean
  filterType?: ProprietaireType | 'all'
  hideInactive?: boolean
  hideBrouillons?: boolean
}

interface UseProprietairesReturn {
  // Data
  proprietaires: Proprietaire[]
  loading: boolean
  error: string | null
  
  // Filtered data
  filteredProprietaires: Proprietaire[]
  totalCount: number
  activeCount: number
  brouillonCount: number
  
  // Filter state
  filterType: ProprietaireType | 'all'
  hideInactive: boolean
  hideBrouillons: boolean
  searchQuery: string
  
  // Actions
  refetch: () => Promise<void>
  search: (query: string) => Promise<Proprietaire[]>
  setFilterType: (type: ProprietaireType | 'all') => void
  setHideInactive: (hide: boolean) => void
  setHideBrouillons: (hide: boolean) => void
  setSearchQuery: (query: string) => void
  
  // CRUD operations
  create: (data: CreateProprietaire) => Promise<{ success: boolean; error?: string; data?: Proprietaire }>
  update: (id: string, data: Partial<CreateProprietaire>) => Promise<{ success: boolean; error?: string; data?: Proprietaire }>
  delete: (id: string) => Promise<{ success: boolean; error?: string }>
  toggleBrouillon: (id: string, isBrouillon: boolean) => Promise<{ success: boolean; error?: string; data?: Proprietaire }>
  
  // Navigation helpers
  navigateToProprietaire: (id: string) => void
  navigateToEdit: (id: string) => void
  navigateToNew: () => void
}

interface UseProprietaireSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  filterType?: ProprietaireType | 'all'
  hideInactive?: boolean
  hideBrouillons?: boolean
}

interface UseProprietaireSearchReturn {
  results: Proprietaire[]
  loading: boolean
  error: string | null
  search: (query: string) => Promise<void>
  clearResults: () => void
}

// ==============================================================================
// MAIN HOOK: useProprietaires
// ==============================================================================

export function useProprietaires({
  initialData = [],
  autoFetch = true,
  filterType: initialFilterType = 'all',
  hideInactive: initialHideInactive = false,
  hideBrouillons: initialHideBrouillons = false,
}: UseProprietairesOptions = {}): UseProprietairesReturn {
  const router = useRouter()
  
  // Core state
  const [proprietaires, setProprietaires] = useState<Proprietaire[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter state
  const [filterType, setFilterType] = useState<ProprietaireType | 'all'>(initialFilterType)
  const [hideInactive, setHideInactive] = useState(initialHideInactive)
  const [hideBrouillons, setHideBrouillons] = useState(initialHideBrouillons)
  const [searchQuery, setSearchQuery] = useState('')

  // ==============================================================================
  // COMPUTED VALUES
  // ==============================================================================

  const filteredProprietaires = useMemo(() => {
    let filtered = [...proprietaires]
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType)
    }
    
    // Filter by active status
    if (hideInactive) {
      filtered = filtered.filter(p => p.is_active)
    }
    
    // Filter by brouillon status
    if (hideBrouillons) {
      filtered = filtered.filter(p => !p.is_brouillon)
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.nom.toLowerCase().includes(query) ||
        (p.prenom && p.prenom.toLowerCase().includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query)) ||
        (p.numero_identification && p.numero_identification.toLowerCase().includes(query))
      )
    }
    
    return filtered
  }, [proprietaires, filterType, hideInactive, hideBrouillons, searchQuery])

  const stats = useMemo(() => ({
    totalCount: proprietaires.length,
    activeCount: proprietaires.filter(p => p.is_active).length,
    brouillonCount: proprietaires.filter(p => p.is_brouillon).length,
  }), [proprietaires])

  // ==============================================================================
  // DATA FETCHING
  // ==============================================================================

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await getProprietaires()
      setProprietaires(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement'
      setError(message)
      console.error('Erreur useProprietaires refetch:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const search = useCallback(async (query: string): Promise<Proprietaire[]> => {
    if (query.trim().length < 2) {
      return []
    }
    
    try {
      const results = await searchProprietaires(query)
      return results
    } catch (err) {
      console.error('Erreur useProprietaires search:', err)
      return []
    }
  }, [])

  // ==============================================================================
  // CRUD OPERATIONS
  // ==============================================================================

  const create = useCallback(async (data: CreateProprietaire) => {
    try {
      const result = await createProprietaire(data)
      
      if (result.success && result.data) {
        // Add to local state
        setProprietaires(prev => [result.data!, ...prev])
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création'
      return { success: false, error: message }
    }
  }, [])

  const update = useCallback(async (id: string, data: Partial<CreateProprietaire>) => {
    try {
      const result = await updateProprietaire(id, data)
      
      if (result.success && result.data) {
        // Update local state
        setProprietaires(prev => 
          prev.map(p => p.id === id ? result.data! : p)
        )
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la modification'
      return { success: false, error: message }
    }
  }, [])

  // Note: Suppression définitive désactivée - sera implémentée avec le module propriétés
  const deleteProprietaireLocal = useCallback(async (id: string) => {
    return { 
      success: false, 
      error: 'Suppression définitive non disponible - Utilisez la désactivation pour l\'instant' 
    }
  }, [])

  const toggleBrouillon = useCallback(async (id: string, isBrouillon: boolean) => {
    try {
      const result = await toggleProprietaireBrouillon(id, isBrouillon)
      
      if (result.success && result.data) {
        // Update local state
        setProprietaires(prev => 
          prev.map(p => p.id === id ? result.data! : p)
        )
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du changement de statut'
      return { success: false, error: message }
    }
  }, [])

  // ==============================================================================
  // NAVIGATION HELPERS
  // ==============================================================================

  const navigateToProprietaire = useCallback((id: string) => {
    router.push(`/proprietaires/${id}`)
  }, [router])

  const navigateToEdit = useCallback((id: string) => {
    router.push(`/proprietaires/${id}/edit`)
  }, [router])

  const navigateToNew = useCallback(() => {
    router.push('/proprietaires/new')
  }, [router])

  // ==============================================================================
  // EFFECTS
  // ==============================================================================

  useEffect(() => {
    if (autoFetch && proprietaires.length === 0) {
      refetch()
    }
  }, [autoFetch, refetch, proprietaires.length])

  // ==============================================================================
  // RETURN
  // ==============================================================================

  return {
    // Data
    proprietaires,
    loading,
    error,
    
    // Filtered data
    filteredProprietaires,
    totalCount: stats.totalCount,
    activeCount: stats.activeCount,
    brouillonCount: stats.brouillonCount,
    
    // Filter state
    filterType,
    hideInactive,
    hideBrouillons,
    searchQuery,
    
    // Actions
    refetch,
    search,
    setFilterType,
    setHideInactive,
    setHideBrouillons,
    setSearchQuery,
    
    // CRUD operations
    create,
    update,
    delete: deleteProprietaireLocal,
    toggleBrouillon,
    
    // Navigation helpers
    navigateToProprietaire,
    navigateToEdit,
    navigateToNew,
  }
}

// ==============================================================================
// SEARCH HOOK: useProprietaireSearch
// ==============================================================================

export function useProprietaireSearch({
  debounceMs = 300,
  minQueryLength = 2,
  filterType = 'all',
  hideInactive = true,
  hideBrouillons = false,
}: UseProprietaireSearchOptions = {}): UseProprietaireSearchReturn {
  const [results, setResults] = useState<Proprietaire[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const search = useCallback(async (query: string) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Clear results if query is too short
    if (query.trim().length < minQueryLength) {
      setResults([])
      setError(null)
      return
    }

    // Set loading state
    setLoading(true)
    setError(null)

    // Debounce the search
    const timeout = setTimeout(async () => {
      try {
        const searchResults = await searchProprietaires(query)
        
        // Apply filters
        let filtered = searchResults
        
        if (filterType !== 'all') {
          filtered = filtered.filter(p => p.type === filterType)
        }
        
        if (hideInactive) {
          filtered = filtered.filter(p => p.is_active)
        }
        
        if (hideBrouillons) {
          filtered = filtered.filter(p => !p.is_brouillon)
        }
        
        setResults(filtered)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la recherche'
        setError(message)
        setResults([])
        console.error('Erreur useProprietaireSearch:', err)
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    setSearchTimeout(timeout)
  }, [searchTimeout, minQueryLength, debounceMs, filterType, hideInactive, hideBrouillons])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      setSearchTimeout(null)
    }
  }, [searchTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  }
}

// ==============================================================================
// CONVENIENCE HOOKS
// ==============================================================================

/**
 * Hook pour récupérer uniquement les propriétaires actifs
 */
export function useActiveProprietaires(options: Omit<UseProprietairesOptions, 'hideInactive'> = {}) {
  return useProprietaires({
    ...options,
    hideInactive: true,
  })
}

/**
 * Hook pour récupérer uniquement les propriétaires non-brouillons
 */
export function useCompletedProprietaires(options: Omit<UseProprietairesOptions, 'hideBrouillons'> = {}) {
  return useProprietaires({
    ...options,
    hideBrouillons: true,
  })
}

/**
 * Hook pour récupérer uniquement les personnes physiques
 */
export function usePersonnesPhysiques(options: Omit<UseProprietairesOptions, 'filterType'> = {}) {
  return useProprietaires({
    ...options,
    filterType: 'physique',
  })
}

/**
 * Hook pour récupérer uniquement les personnes morales
 */
export function usePersonnesMorales(options: Omit<UseProprietairesOptions, 'filterType'> = {}) {
  return useProprietaires({
    ...options,
    filterType: 'morale',
  })
}