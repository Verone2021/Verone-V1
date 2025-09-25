"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { TestSection, TestStatus } from "./use-manual-tests"

// Types pour la persistence
interface PersistenceOptions {
  enableLocalStorage?: boolean
  enableSupabaseSync?: boolean
  syncDebounceMs?: number
  maxRetries?: number
  retryDelayMs?: number
}

interface SyncStatus {
  isOnline: boolean
  lastSync: Date | null
  pendingChanges: number
  syncErrors: string[]
  retryCount: number
}

interface PersistenceError {
  type: 'storage' | 'network' | 'supabase'
  message: string
  timestamp: Date
  recoverable: boolean
}

const STORAGE_KEY = 'manual-tests-progress'
const SECTIONS_KEY = 'manual-tests-sections'
const PENDING_CHANGES_KEY = 'manual-tests-pending-changes'

// Queue des changements en attente (pour mode offline)
interface PendingChange {
  id: string
  type: 'test_update' | 'section_update' | 'batch_update'
  data: any
  timestamp: Date
  retryCount: number
}

export function useTestPersistence(options: PersistenceOptions = {}) {
  const {
    enableLocalStorage = true,
    enableSupabaseSync = true,
    syncDebounceMs = 1000,
    maxRetries = 3,
    retryDelayMs = 2000
  } = options

  // États de la persistence
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: 0,
    syncErrors: [],
    retryCount: 0
  })

  const [errors, setErrors] = useState<PersistenceError[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Refs pour la gestion des timers et retry
  const syncTimeoutRef = useRef<NodeJS.Timeout>()
  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const pendingChangesRef = useRef<Map<string, PendingChange>>(new Map())

  const supabase = createClient()

  // Surveillance de l'état réseau
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }))
      // Tenter de synchroniser les changements en attente
      if (enableSupabaseSync) {
        processPendingChanges()
      }
    }

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enableSupabaseSync])

  // Nettoyage des timers
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Charger les changements en attente depuis le localStorage
  const loadPendingChanges = useCallback((): PendingChange[] => {
    if (!enableLocalStorage) return []

    try {
      const stored = localStorage.getItem(PENDING_CHANGES_KEY)
      if (stored) {
        const changes = JSON.parse(stored)
        return changes.map((change: any) => ({
          ...change,
          timestamp: new Date(change.timestamp)
        }))
      }
      return []
    } catch (error) {
      console.error('Error loading pending changes:', error)
      return []
    }
  }, [enableLocalStorage])

  // Sauvegarder les changements en attente
  const savePendingChanges = useCallback((changes: PendingChange[]) => {
    if (!enableLocalStorage) return

    try {
      localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes))
      setSyncStatus(prev => ({ ...prev, pendingChanges: changes.length }))
    } catch (error) {
      console.error('Error saving pending changes:', error)
      addError({
        type: 'storage',
        message: 'Impossible de sauvegarder les changements en attente',
        timestamp: new Date(),
        recoverable: false
      })
    }
  }, [enableLocalStorage])

  // Ajouter une erreur à la liste
  const addError = useCallback((error: PersistenceError) => {
    setErrors(prev => {
      const newErrors = [error, ...prev].slice(0, 10) // Garder max 10 erreurs
      return newErrors
    })
  }, [])

  // Initialiser la persistence
  const initialize = useCallback(async () => {
    if (isInitialized) return

    try {
      // Charger les changements en attente depuis le localStorage
      const pendingChanges = loadPendingChanges()
      pendingChanges.forEach(change => {
        pendingChangesRef.current.set(change.id, change)
      })

      setSyncStatus(prev => ({
        ...prev,
        pendingChanges: pendingChanges.length
      }))

      // Traiter les changements en attente si en ligne
      if (syncStatus.isOnline && enableSupabaseSync) {
        await processPendingChanges()
      }

      setIsInitialized(true)
    } catch (error) {
      console.error('Error initializing persistence:', error)
      addError({
        type: 'storage',
        message: 'Erreur d\'initialisation de la persistence',
        timestamp: new Date(),
        recoverable: true
      })
    }
  }, [isInitialized, loadPendingChanges, syncStatus.isOnline, enableSupabaseSync])

  // Sauvegarder dans localStorage
  const saveToLocalStorage = useCallback((sections: TestSection[]) => {
    if (!enableLocalStorage) return

    try {
      // Sauvegarder l'état des tests
      const testsProgress: Record<string, TestStatus> = {}
      sections.forEach(section => {
        section.tests.forEach(test => {
          testsProgress[test.id] = test.status
        })
      })

      localStorage.setItem(STORAGE_KEY, JSON.stringify(testsProgress))
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections))

      // Déclencher l'événement pour le header
      window.dispatchEvent(new Event('storage'))

    } catch (error) {
      console.error('Error saving to localStorage:', error)
      addError({
        type: 'storage',
        message: 'Impossible de sauvegarder en local',
        timestamp: new Date(),
        recoverable: false
      })
    }
  }, [enableLocalStorage, addError])

  // Charger depuis localStorage
  const loadFromLocalStorage = useCallback((): {
    tests: Record<string, TestStatus>
    sections: TestSection[]
  } => {
    if (!enableLocalStorage) return { tests: {}, sections: [] }

    try {
      const testsData = localStorage.getItem(STORAGE_KEY)
      const sectionsData = localStorage.getItem(SECTIONS_KEY)

      return {
        tests: testsData ? JSON.parse(testsData) : {},
        sections: sectionsData ? JSON.parse(sectionsData) : []
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      addError({
        type: 'storage',
        message: 'Impossible de charger les données locales',
        timestamp: new Date(),
        recoverable: true
      })
      return { tests: {}, sections: [] }
    }
  }, [enableLocalStorage, addError])

  // Ajouter un changement à la queue
  const queueChange = useCallback((change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>) => {
    const pendingChange: PendingChange = {
      ...change,
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    }

    pendingChangesRef.current.set(pendingChange.id, pendingChange)

    // Sauvegarder les changements en attente
    const allChanges = Array.from(pendingChangesRef.current.values())
    savePendingChanges(allChanges)

    // Déclencher la synchronisation avec debounce
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      if (syncStatus.isOnline && enableSupabaseSync) {
        processPendingChanges()
      }
    }, syncDebounceMs)

  }, [savePendingChanges, syncStatus.isOnline, enableSupabaseSync, syncDebounceMs])

  // Traiter les changements en attente
  const processPendingChanges = useCallback(async () => {
    if (!enableSupabaseSync || !syncStatus.isOnline) return

    const changes = Array.from(pendingChangesRef.current.values())
    if (changes.length === 0) return

    setSyncStatus(prev => ({ ...prev, syncErrors: [] }))

    for (const change of changes) {
      try {
        await processChange(change)

        // Retirer le changement traité avec succès
        pendingChangesRef.current.delete(change.id)

      } catch (error) {
        console.error('Error processing change:', error)

        // Incrémenter le compteur de retry
        change.retryCount++

        if (change.retryCount >= maxRetries) {
          // Retirer le changement après max retries
          pendingChangesRef.current.delete(change.id)

          addError({
            type: 'supabase',
            message: `Échec définitif de synchronisation: ${error}`,
            timestamp: new Date(),
            recoverable: false
          })
        } else {
          // Programmer un retry
          setTimeout(() => {
            processPendingChanges()
          }, retryDelayMs * Math.pow(2, change.retryCount)) // Backoff exponential
        }
      }
    }

    // Sauvegarder les changements restants
    const remainingChanges = Array.from(pendingChangesRef.current.values())
    savePendingChanges(remainingChanges)

    setSyncStatus(prev => ({
      ...prev,
      lastSync: new Date(),
      pendingChanges: remainingChanges.length,
      retryCount: 0
    }))

  }, [enableSupabaseSync, syncStatus.isOnline, maxRetries, retryDelayMs, addError, savePendingChanges])

  // Traiter un changement spécifique
  const processChange = useCallback(async (change: PendingChange) => {
    switch (change.type) {
      case 'test_update':
        const { testId, status, notes, sectionName } = change.data

        const { error: upsertError } = await supabase
          .from('manual_tests_progress')
          .upsert({
            test_id: testId,
            section_name: sectionName || 'default',
            subsection_name: sectionName || 'default',
            test_title: `Test ${testId}`,
            test_description: notes || 'Test description',
            status,
            notes,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'test_id'
          })

        if (upsertError) throw upsertError
        break

      case 'batch_update':
        const { testIds, status: batchStatus } = change.data

        for (const testId of testIds) {
          const { error } = await supabase
            .from('manual_tests_progress')
            .upsert({
              test_id: testId,
              section_name: 'batch',
              subsection_name: 'batch',
              test_title: `Test ${testId}`,
              test_description: 'Batch updated test',
              status: batchStatus,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'test_id'
            })

          if (error) throw error
        }
        break

      case 'section_update':
        // Traitement des mises à jour de section
        // À implémenter selon les besoins
        break

      default:
        throw new Error(`Unknown change type: ${change.type}`)
    }
  }, [supabase])

  // Synchroniser avec Supabase (récupération des changements distants)
  const syncFromSupabase = useCallback(async (): Promise<TestSection[] | null> => {
    if (!enableSupabaseSync || !syncStatus.isOnline) return null

    try {
      const { data: remoteTests, error } = await supabase
        .from('manual_tests_progress')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      return remoteTests || []
    } catch (error) {
      console.error('Error syncing from Supabase:', error)
      addError({
        type: 'supabase',
        message: `Erreur de synchronisation: ${error}`,
        timestamp: new Date(),
        recoverable: true
      })
      return null
    }
  }, [enableSupabaseSync, syncStatus.isOnline, supabase, addError])

  // API publique du hook
  const persistence = {
    // États
    syncStatus,
    errors,
    isInitialized,

    // Actions de persistence
    initialize,
    saveToLocalStorage,
    loadFromLocalStorage,

    // Synchronisation Supabase
    queueChange,
    syncFromSupabase,
    processPendingChanges,

    // Méthodes de convenance
    queueTestUpdate: (testId: string, status: TestStatus, notes?: string, sectionName?: string) => {
      queueChange({
        type: 'test_update',
        data: { testId, status, notes, sectionName }
      })
    },

    queueBatchUpdate: (testIds: string[], status: TestStatus) => {
      queueChange({
        type: 'batch_update',
        data: { testIds, status }
      })
    },

    // Utilitaires
    clearErrors: () => setErrors([]),

    retry: () => {
      if (syncStatus.isOnline) {
        processPendingChanges()
      }
    },

    // Statistiques de debug
    getDebugInfo: () => ({
      pendingChangesCount: pendingChangesRef.current.size,
      pendingChanges: Array.from(pendingChangesRef.current.values()),
      syncStatus,
      errors: errors.slice(0, 5) // Dernières 5 erreurs
    })
  }

  return persistence
}

// Hook léger pour juste localStorage (sans Supabase)
export function useLocalStoragePersistence() {
  const saveProgress = useCallback((sections: TestSection[]) => {
    try {
      const testsProgress: Record<string, TestStatus> = {}
      sections.forEach(section => {
        section.tests.forEach(test => {
          testsProgress[test.id] = test.status
        })
      })

      localStorage.setItem(STORAGE_KEY, JSON.stringify(testsProgress))
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections))

      // Déclencher l'événement pour le header
      window.dispatchEvent(new Event('storage'))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [])

  const loadProgress = useCallback((): {
    tests: Record<string, TestStatus>
    sections: TestSection[]
  } => {
    try {
      const testsData = localStorage.getItem(STORAGE_KEY)
      const sectionsData = localStorage.getItem(SECTIONS_KEY)

      return {
        tests: testsData ? JSON.parse(testsData) : {},
        sections: sectionsData ? JSON.parse(sectionsData) : []
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return { tests: {}, sections: [] }
    }
  }, [])

  return {
    saveProgress,
    loadProgress
  }
}