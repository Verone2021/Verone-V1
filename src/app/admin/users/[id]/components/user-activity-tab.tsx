/**
 * 📊 Onglet Activité Utilisateur - Vérone
 *
 * Composant affichant les métriques d'engagement, d'activité
 * et d'usage détaillées de l'utilisateur.
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
  Users,
  Eye,
  ChevronRight
} from 'lucide-react'
import { UserDetailData } from '../page'

interface UserActivityTabProps {
  user: UserDetailData
}

export function UserActivityTab({ user }: UserActivityTabProps) {
  // Simulation de données d'activité pour le MVP
  const getSimulatedActivityData = () => {
    const isActiveUser = user.last_sign_in_at &&
      (Date.now() - new Date(user.last_sign_in_at).getTime()) < (7 * 24 * 60 * 60 * 1000)

    // Données simulées basées sur le niveau d'engagement
    const baseMultiplier = user.analytics.engagement_score / 100

    return {
      daily_active_days: Math.floor(user.analytics.days_since_creation * baseMultiplier * 0.3),
      weekly_active_weeks: Math.floor(user.analytics.days_since_creation / 7 * baseMultiplier * 0.6),
      monthly_active_months: Math.floor(user.analytics.days_since_creation / 30 * baseMultiplier * 0.8),
      total_page_views: Math.floor(user.analytics.total_sessions * (15 + Math.random() * 25)),
      avg_pages_per_session: Math.floor(8 + Math.random() * 12),
      bounce_rate: Math.floor((100 - user.analytics.engagement_score) * 0.8),
      peak_hour: Math.floor(9 + Math.random() * 8), // Entre 9h et 17h
      favorite_features: [
        { name: 'Dashboard', usage: Math.floor(60 + Math.random() * 40) },
        { name: 'Catalogue', usage: Math.floor(40 + Math.random() * 35) },
        { name: 'Commandes', usage: Math.floor(20 + Math.random() * 30) },
        { name: 'Rapports', usage: Math.floor(10 + Math.random() * 25) }
      ].sort((a, b) => b.usage - a.usage)
    }
  }

  const activityData = getSimulatedActivityData()

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: 'Très élevé', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (score >= 60) return { level: 'Élevé', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    if (score >= 40) return { level: 'Moyen', color: 'text-orange-500', bgColor: 'bg-orange-50' }
    return { level: 'Faible', color: 'text-red-500', bgColor: 'bg-red-50' }
  }

  const engagement = getEngagementLevel(user.analytics.engagement_score)

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }

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
                {user.analytics.engagement_score}%
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
                {user.analytics.total_sessions}
              </div>
              <div className="text-sm text-black opacity-70">Sessions totales</div>
              <div className="text-xs text-black opacity-50">
                Depuis {user.analytics.days_since_creation} jours
              </div>
            </div>
          </div>

          {/* Fréquence moyenne */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-black">
                {user.analytics.days_since_creation > 0
                  ? (user.analytics.total_sessions / Math.max(user.analytics.days_since_creation, 1) * 7).toFixed(1)
                  : '0.0'
                }
              </div>
              <div className="text-sm text-black opacity-70">Sessions/semaine</div>
              <div className="text-xs text-black opacity-50">
                Rythme moyen d'utilisation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activité temporelle */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Activité temporelle</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-black opacity-60" />
              <span className="text-sm font-medium text-black">Jours actifs</span>
            </div>
            <div className="text-2xl font-bold text-black">{activityData.daily_active_days}</div>
            <div className="text-xs text-black opacity-50">
              {user.analytics.days_since_creation > 0
                ? `${(activityData.daily_active_days / user.analytics.days_since_creation * 100).toFixed(0)}% du temps`
                : '0% du temps'
              }
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-4 w-4 text-black opacity-60" />
              <span className="text-sm font-medium text-black">Semaines actives</span>
            </div>
            <div className="text-2xl font-bold text-black">{activityData.weekly_active_weeks}</div>
            <div className="text-xs text-black opacity-50">
              Sur {Math.floor(user.analytics.days_since_creation / 7)} semaines
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-black opacity-60" />
              <span className="text-sm font-medium text-black">Mois actifs</span>
            </div>
            <div className="text-2xl font-bold text-black">{activityData.monthly_active_months}</div>
            <div className="text-xs text-black opacity-50">
              Sur {Math.floor(user.analytics.days_since_creation / 30) || 1} mois
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-black opacity-60" />
              <span className="text-sm font-medium text-black">Heure favorite</span>
            </div>
            <div className="text-2xl font-bold text-black">{activityData.peak_hour}h00</div>
            <div className="text-xs text-black opacity-50">
              Pic d'activité quotidien
            </div>
          </div>
        </div>
      </div>

      {/* Usage des pages */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <Eye className="h-5 w-5" />
          <span>Usage des pages</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Métriques de navigation */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">Métriques de navigation</h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-black opacity-60" />
                  <span className="text-sm text-black">Pages vues totales</span>
                </div>
                <span className="font-bold text-black">{activityData.total_page_views.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center space-x-2">
                  <MousePointer className="h-4 w-4 text-black opacity-60" />
                  <span className="text-sm text-black">Pages par session</span>
                </div>
                <span className="font-bold text-black">{activityData.avg_pages_per_session}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-black opacity-60" />
                  <span className="text-sm text-black">Taux de rebond</span>
                </div>
                <span className="font-bold text-black">{activityData.bounce_rate}%</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-black opacity-60" />
                  <span className="text-sm text-black">Durée moyenne</span>
                </div>
                <span className="font-bold text-black">{formatDuration(user.analytics.avg_session_duration)}</span>
              </div>
            </div>
          </div>

          {/* Fonctionnalités favorites */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">Fonctionnalités favorites</h4>

            <div className="space-y-2">
              {activityData.favorite_features.map((feature, index) => (
                <div key={feature.name} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-black text-white text-xs font-bold rounded-none flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-black">{feature.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${feature.usage}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-black w-12">{feature.usage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dernières activités (simulées) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Activité récente</span>
        </h3>

        <div className="bg-white border border-gray-200 rounded">
          <div className="p-4 space-y-3">
            {user.last_sign_in_at ? (
              <>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-black">Dernière connexion</div>
                      <div className="text-xs text-black opacity-60">
                        {new Date(user.last_sign_in_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-black opacity-40" />
                </div>
                <div className="text-center py-4 text-sm text-black opacity-60">
                  <p>Historique détaillé des activités</p>
                  <p className="text-xs mt-1">Sera disponible avec le système de tracking complet</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-sm text-black opacity-60">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Aucune activité enregistrée</p>
                <p className="text-xs mt-1">L'utilisateur ne s'est jamais connecté</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}