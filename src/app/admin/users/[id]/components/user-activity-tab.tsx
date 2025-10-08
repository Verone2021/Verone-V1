/**
 * 📊 Onglet Activité Utilisateur - Vérone
 *
 * Composant affichant les métriques d'engagement, d'activité
 * et d'usage détaillées de l'utilisateur.
 *
 * ✅ CONNECTÉ AUX VRAIES DONNÉES via API
 */

"use client"

import React from 'react'
import {
  Activity,
  Clock,
  Calendar,
  TrendingUp,
  BarChart3,
  MousePointer,
  Monitor,
  Zap,
  Target,
  Eye,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { UserDetailData } from '../page'
import { useEffect, useState } from 'react'

interface UserActivityTabProps {
  user: UserDetailData
}

interface ActivityStats {
  total_sessions: number
  total_actions: number
  avg_session_duration: number | null
  most_used_module: string | null
  engagement_score: number
  last_activity: string | null
}

interface RecentAction {
  id: string
  action: string
  module: string | null
  new_data: any
  created_at: string
}

interface ActivityData {
  statistics: ActivityStats
  recent_actions: RecentAction[]
  active_sessions: any[]
}

export function UserActivityTab({ user }: UserActivityTabProps) {
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/users/${user.id}/activity?days=30&limit=50`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors du chargement')
        }

        setActivityData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivity()
  }, [user.id])

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: 'Très élevé', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (score >= 60) return { level: 'Élevé', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    if (score >= 40) return { level: 'Moyen', color: 'text-gray-900', bgColor: 'bg-gray-50' }
    return { level: 'Faible', color: 'text-red-500', bgColor: 'bg-red-50' }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '0 min'
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }

  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'À l\'instant'
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 30) return `Il y a ${diffDays} jours`

    return date.toLocaleDateString('fr-FR')
  }

  const getActionIcon = (action: string) => {
    if (action.includes('page_view')) return <Eye className="h-4 w-4" />
    if (action.includes('form_submit')) return <MousePointer className="h-4 w-4" />
    if (action.includes('create')) return <TrendingUp className="h-4 w-4" />
    if (action.includes('update')) return <BarChart3 className="h-4 w-4" />
    if (action.includes('delete')) return <AlertCircle className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const getModuleLabel = (module: string | null): string => {
    if (!module) return 'Système'
    const labels: Record<string, string> = {
      'dashboard': 'Dashboard',
      'catalogue': 'Catalogue',
      'stocks': 'Stocks',
      'sourcing': 'Sourcing',
      'commandes': 'Commandes',
      'interactions': 'Interactions',
      'organisation': 'Organisation',
      'admin': 'Administration'
    }
    return labels[module] || module
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!activityData) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-sm text-gray-600">Aucune donnée d'activité disponible</p>
      </div>
    )
  }

  const stats = activityData.statistics
  const engagement = getEngagementLevel(stats.engagement_score)
  const sessionsPerWeek = user.analytics.days_since_creation > 0
    ? (stats.total_sessions / Math.max(user.analytics.days_since_creation, 1) * 7).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-8">
      {/* Métriques d'engagement */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Métriques d'engagement</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score d'engagement */}
          <div className={`p-4 border border-gray-200 rounded ${engagement.bgColor}`}>
            <div className="text-center space-y-2">
              <div className={`text-3xl font-bold ${engagement.color}`}>
                {stats.engagement_score}%
              </div>
              <div className="text-sm text-black opacity-70">Score d'engagement</div>
              <div className={`text-xs font-medium ${engagement.color}`}>
                {engagement.level}
              </div>
            </div>
          </div>

          {/* Sessions totales */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-black">
                {stats.total_sessions}
              </div>
              <div className="text-sm text-black opacity-70">Sessions totales</div>
              <div className="text-xs text-black opacity-50">
                30 derniers jours
              </div>
            </div>
          </div>

          {/* Fréquence moyenne */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-black">
                {sessionsPerWeek}
              </div>
              <div className="text-sm text-black opacity-70">Sessions/semaine</div>
              <div className="text-xs text-black opacity-50">
                Rythme moyen d'utilisation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activité détaillée */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Statistiques détaillées</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <MousePointer className="h-4 w-4 text-black opacity-60" />
              <span className="text-sm font-medium text-black">Actions totales</span>
            </div>
            <div className="text-2xl font-bold text-black">{stats.total_actions}</div>
            <div className="text-xs text-black opacity-50">
              {stats.total_sessions > 0
                ? `${Math.round(stats.total_actions / stats.total_sessions)} par session`
                : 'Aucune session'}
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-black opacity-60" />
              <span className="text-sm font-medium text-black">Durée moyenne</span>
            </div>
            <div className="text-2xl font-bold text-black">
              {formatDuration(stats.avg_session_duration)}
            </div>
            <div className="text-xs text-black opacity-50">
              Par session
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <Monitor className="h-4 w-4 text-black opacity-60" />
              <span className="text-sm font-medium text-black">Module préféré</span>
            </div>
            <div className="text-lg font-bold text-black">
              {getModuleLabel(stats.most_used_module)}
            </div>
            <div className="text-xs text-black opacity-50">
              Le plus utilisé
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-black opacity-60" />
              <span className="text-sm font-medium text-black">Dernière activité</span>
            </div>
            <div className="text-sm font-bold text-black">
              {stats.last_activity
                ? formatRelativeTime(stats.last_activity)
                : 'Jamais'}
            </div>
            <div className="text-xs text-black opacity-50">
              {stats.last_activity
                ? new Date(stats.last_activity).toLocaleString('fr-FR')
                : 'Aucune activité enregistrée'}
            </div>
          </div>
        </div>
      </div>

      {/* Historique des actions récentes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Activité récente</span>
          <span className="text-sm text-gray-500 font-normal">
            ({activityData.recent_actions.length} actions)
          </span>
        </h3>

        <div className="bg-white border border-gray-200 rounded">
          {activityData.recent_actions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {activityData.recent_actions.map((action) => (
                <div key={action.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {getActionIcon(action.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-black capitalize">
                            {action.action.replace('_', ' ')}
                          </span>
                          {action.module && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                              {getModuleLabel(action.module)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(action.created_at)}
                        </div>
                        {action.new_data?.page_url && (
                          <div className="text-xs text-gray-400 mt-1 font-mono">
                            {action.new_data.page_url}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Aucune activité récente enregistrée</p>
              <p className="text-xs text-gray-500 mt-1">
                Les actions de l'utilisateur apparaîtront ici
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sessions actives */}
      {activityData.active_sessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Sessions actives</span>
          </h3>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <span className="text-sm font-medium text-green-800">
                {activityData.active_sessions.length} session(s) active(s) en cours
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
