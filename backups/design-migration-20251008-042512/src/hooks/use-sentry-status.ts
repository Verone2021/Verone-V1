/**
 * 🔍 Hook Sentry Status - Statut erreurs temps réel
 *
 * Hook intelligent pour récupérer et monitorer le statut Sentry
 * Synchronisation automatique avec l'API dashboard
 */

'use client'

import { useEffect, useState } from 'react'

interface SentryStats {
  totalIssues: number
  unresolvedCount: number
  last24hCount: number
  criticalCount: number
  affectedUsers: number
}

interface SentryStatus {
  errorCount: number
  status: 'healthy' | 'warning' | 'critical'
  loading: boolean
  lastUpdate: Date | null
  stats: SentryStats | null
}

export function useSentryStatus() {
  const [sentryStatus, setSentryStatus] = useState<SentryStatus>({
    errorCount: 0,
    status: 'healthy',
    loading: true,
    lastUpdate: null,
    stats: null
  })

  const fetchSentryStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/sentry-issues')

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const stats = data.stats as SentryStats

      // Déterminer le statut basé sur les statistiques
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'

      if (stats.criticalCount > 5 || stats.unresolvedCount > 20) {
        status = 'critical'
      } else if (stats.criticalCount > 0 || stats.unresolvedCount > 5) {
        status = 'warning'
      }

      setSentryStatus({
        errorCount: stats.unresolvedCount,
        status,
        loading: false,
        lastUpdate: new Date(),
        stats
      })

    } catch (error) {
      console.error('❌ [useSentryStatus] Erreur récupération:', error)

      // Fallback mode - ne pas affecter l'UX
      setSentryStatus(prev => ({
        ...prev,
        loading: false,
        lastUpdate: new Date()
      }))
    }
  }

  useEffect(() => {
    // Chargement initial
    fetchSentryStatus()

    // Mise à jour automatique toutes les 30 secondes
    const interval = setInterval(fetchSentryStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  // Fonction pour forcer une mise à jour
  const refreshStatus = () => {
    setSentryStatus(prev => ({ ...prev, loading: true }))
    fetchSentryStatus()
  }

  return {
    ...sentryStatus,
    refreshStatus
  }
}