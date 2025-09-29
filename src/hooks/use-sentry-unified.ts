/**
 * 🚀 RÉVOLUTIONNAIRE: Hook Sentry Unifié - Vérone Back Office 2025
 *
 * Source de vérité unique pour toutes les données Sentry
 * Remplace les systèmes dual incohérents par une solution unifiée
 * Temps réel + Auto-détection + Synchronisation parfaite
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// 🎯 Interface unifiée des statistiques Sentry
export interface SentryUnifiedStats {
  // Core metrics (API Sentry officielle)
  totalIssues: number
  unresolvedCount: number
  last24hCount: number
  criticalCount: number
  affectedUsers: number

  // Local detection metrics
  localErrorsDetected: number
  sessionErrors: number

  // Status & metadata
  status: 'healthy' | 'warning' | 'critical'
  isConnected: boolean
  lastSync: Date | null
  apiHealth: 'ok' | 'degraded' | 'error'
}

// 🎯 Interface issue Sentry
export interface SentryIssue {
  id: string
  shortId: string
  title: string
  level: string
  status: string
  culprit?: string
  permalink: string
  lastSeen: string
  count: number
  userCount: number
}

// 🎯 Configuration du hook
interface SentryUnifiedConfig {
  pollingInterval?: number // Default: 30000ms (30s)
  enableLocalDetection?: boolean // Default: true
  autoRefresh?: boolean // Default: true
  maxRetries?: number // Default: 3
}

export function useSentryUnified(config: SentryUnifiedConfig = {}) {
  const {
    pollingInterval = 30000,
    enableLocalDetection = true,
    autoRefresh = true,
    maxRetries = 3
  } = config

  // 📊 States unifiés
  const [stats, setStats] = useState<SentryUnifiedStats>({
    totalIssues: 0,
    unresolvedCount: 0,
    last24hCount: 0,
    criticalCount: 0,
    affectedUsers: 0,
    localErrorsDetected: 0,
    sessionErrors: 0,
    status: 'healthy',
    isConnected: false,
    lastSync: null,
    apiHealth: 'ok'
  })

  const [issues, setIssues] = useState<SentryIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔧 Refs pour éviter les re-renders
  const retryCountRef = useRef(0)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isClientSide = typeof window !== 'undefined'

  // 🌐 Fonction principale de récupération des données
  const fetchSentryData = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true)
        setError(null)
      }

      const response = await fetch('/api/monitoring/sentry-issues', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // 📊 Calculer les statistiques unifiées
      const apiStats = data.stats || {}
      const localErrors = isClientSide ? getLocalErrorCount() : 0

      const newStats: SentryUnifiedStats = {
        totalIssues: apiStats.totalIssues || 0,
        unresolvedCount: apiStats.unresolvedCount || 0,
        last24hCount: apiStats.last24hCount || 0,
        criticalCount: apiStats.criticalCount || 0,
        affectedUsers: apiStats.affectedUsers || 0,
        localErrorsDetected: localErrors,
        sessionErrors: getSessionErrorCount(),
        status: determineStatus(apiStats, localErrors),
        isConnected: true,
        lastSync: new Date(),
        apiHealth: 'ok'
      }

      setStats(newStats)
      setIssues(data.issues || [])
      retryCountRef.current = 0 // Reset retry count on success

      console.log('✅ [Sentry Unified] Données synchronisées:', {
        unresolvedCount: newStats.unresolvedCount,
        localErrors,
        status: newStats.status
      })

    } catch (fetchError) {
      console.error('❌ [Sentry Unified] Erreur récupération:', fetchError)

      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Erreur inconnue'

      // 🔄 Système de retry intelligent
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        console.log(`🔄 [Sentry Unified] Retry ${retryCountRef.current}/${maxRetries}`)

        setTimeout(() => fetchSentryData(true), 1000 * retryCountRef.current)
        return
      }

      // Mode dégradé avec données locales uniquement
      const localErrors = isClientSide ? getLocalErrorCount() : 0
      setStats(prev => ({
        ...prev,
        localErrorsDetected: localErrors,
        isConnected: false,
        apiHealth: 'error',
        status: localErrors > 0 ? 'warning' : 'healthy'
      }))

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [maxRetries, isClientSide])

  // 🧠 Détermination intelligente du statut
  const determineStatus = (apiStats: any, localErrors: number): 'healthy' | 'warning' | 'critical' => {
    const totalUnresolved = (apiStats.unresolvedCount || 0) + localErrors
    const criticalCount = apiStats.criticalCount || 0

    if (criticalCount > 5 || totalUnresolved > 20) {
      return 'critical'
    } else if (criticalCount > 0 || totalUnresolved > 5 || localErrors > 3) {
      return 'warning'
    }

    return 'healthy'
  }

  // 📱 Récupération des erreurs locales (localStorage) avec auto-nettoyage
  const getLocalErrorCount = (): number => {
    if (!isClientSide || !window.localStorage) return 0

    try {
      const localCount = parseInt(localStorage.getItem('sentry-error-count') || '0')

      // Auto-nettoyage si le nombre est anormalement élevé (> 50)
      if (localCount > 50) {
        console.warn('🧹 [Sentry Unified] Auto-nettoyage localStorage erreurs:', localCount)
        localStorage.setItem('sentry-error-count', '0')
        return 0
      }

      return localCount
    } catch {
      return 0
    }
  }

  // 📊 Récupération des erreurs de session avec auto-nettoyage
  const getSessionErrorCount = (): number => {
    if (!isClientSide || !window.sessionStorage) return 0

    try {
      const sessionCount = parseInt(sessionStorage.getItem('session-error-count') || '0')

      // Auto-nettoyage si le nombre est anormalement élevé (> 20)
      if (sessionCount > 20) {
        console.warn('🧹 [Sentry Unified] Auto-nettoyage sessionStorage erreurs:', sessionCount)
        sessionStorage.setItem('session-error-count', '0')
        return 0
      }

      return sessionCount
    } catch {
      return 0
    }
  }

  // 🔄 Setup polling intelligent
  useEffect(() => {
    if (!autoRefresh) return

    // Fetch initial
    fetchSentryData()

    // Setup polling
    const startPolling = () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current)
      }

      pollingTimeoutRef.current = setTimeout(() => {
        fetchSentryData()
        startPolling() // Recursive polling
      }, pollingInterval)
    }

    startPolling()

    // Cleanup
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current)
      }
    }
  }, [fetchSentryData, autoRefresh, pollingInterval])

  // 🎧 Event listener pour auto-détection locale (localStorage)
  useEffect(() => {
    if (!enableLocalDetection || !isClientSide) return

    const handleLocalErrorDetected = (event: CustomEvent) => {
      const localCount = event.detail.count || 0

      setStats(prev => ({
        ...prev,
        localErrorsDetected: localCount,
        sessionErrors: prev.sessionErrors + 1,
        status: determineStatus(
          { unresolvedCount: prev.unresolvedCount, criticalCount: prev.criticalCount },
          localCount
        )
      }))

      console.log('🤖 [Sentry Unified] Erreur locale détectée:', localCount)
    }

    window.addEventListener('sentry-error-detected', handleLocalErrorDetected as EventListener)

    return () => {
      window.removeEventListener('sentry-error-detected', handleLocalErrorDetected as EventListener)
    }
  }, [enableLocalDetection, isClientSide])

  // 🔄 Fonction de refresh manuel
  const refreshData = useCallback(() => {
    retryCountRef.current = 0
    fetchSentryData()
  }, [fetchSentryData])

  // 🧹 Fonction de reset des erreurs locales
  const resetLocalErrors = useCallback(() => {
    if (!isClientSide) return

    try {
      localStorage.setItem('sentry-error-count', '0')
      sessionStorage.setItem('session-error-count', '0')

      setStats(prev => ({
        ...prev,
        localErrorsDetected: 0,
        sessionErrors: 0
      }))

      console.log('🧹 [Sentry Unified] Erreurs locales reset')
    } catch (error) {
      console.warn('❌ [Sentry Unified] Impossible de reset les erreurs locales:', error)
    }
  }, [isClientSide])

  // 📊 Calcul du compteur total unifié - Prioriser les erreurs API réelles
  const totalErrorCount = stats.unresolvedCount

  return {
    // Data
    stats,
    issues,
    loading,
    error,

    // Computed
    totalErrorCount,
    isHealthy: stats.status === 'healthy',
    isConnected: stats.isConnected,

    // Actions
    refresh: refreshData,
    resetLocalErrors,

    // Metadata
    lastSync: stats.lastSync,
    apiHealth: stats.apiHealth
  }
}