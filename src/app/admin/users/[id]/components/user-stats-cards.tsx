/**
 * 📊 Cartes Statistiques Utilisateur - Vérone
 *
 * Composant affichant les métriques clés d'engagement et d'activité
 * de l'utilisateur sous forme de cartes d'information.
 */

"use client"

import React from 'react'
import { Clock, Activity, Calendar, TrendingUp, Users, Target } from 'lucide-react'
import { UserDetailData } from '../page'

interface UserStatsCardsProps {
  user: UserDetailData
}

export function UserStatsCards({ user }: UserStatsCardsProps) {
  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: 'Très élevé', color: 'text-green-600' }
    if (score >= 60) return { level: 'Élevé', color: 'text-blue-600' }
    if (score >= 40) return { level: 'Moyen', color: 'text-gray-900' }
    return { level: 'Faible', color: 'text-red-500' }
  }

  const getFrequencyLabel = (frequency: 'high' | 'medium' | 'low') => {
    switch (frequency) {
      case 'high': return { label: 'Fréquent', color: 'text-green-600' }
      case 'medium': return { label: 'Régulier', color: 'text-blue-600' }
      case 'low': return { label: 'Occasionnel', color: 'text-gray-900' }
      default: return { label: 'Inconnu', color: 'text-gray-500' }
    }
  }

  const engagement = getEngagementLevel(user.analytics.engagement_score)
  const frequency = getFrequencyLabel(user.analytics.login_frequency)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Sessions totales */}
      <div className="bg-white border border-black p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-black opacity-60">Sessions totales</p>
            <p className="text-2xl font-bold text-black">
              {user.analytics.total_sessions}
            </p>
            <p className="text-xs text-black opacity-50">
              Sessions enregistrées
            </p>
          </div>
          <div className="p-2 bg-gray-50 border border-gray-200">
            <Users className="h-6 w-6 text-black opacity-60" />
          </div>
        </div>
      </div>

      {/* Durée moyenne session */}
      <div className="bg-white border border-black p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-black opacity-60">Durée moy. session</p>
            <p className="text-2xl font-bold text-black">
              {user.analytics.avg_session_duration}min
            </p>
            <p className="text-xs text-black opacity-50">
              Temps moyen d'utilisation
            </p>
          </div>
          <div className="p-2 bg-gray-50 border border-gray-200">
            <Clock className="h-6 w-6 text-black opacity-60" />
          </div>
        </div>
      </div>

      {/* Fréquence de connexion */}
      <div className="bg-white border border-black p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-black opacity-60">Fréquence</p>
            <p className={`text-2xl font-bold ${frequency.color}`}>
              {frequency.label}
            </p>
            <p className="text-xs text-black opacity-50">
              Rythme de connexion
            </p>
          </div>
          <div className="p-2 bg-gray-50 border border-gray-200">
            <TrendingUp className="h-6 w-6 text-black opacity-60" />
          </div>
        </div>
      </div>

      {/* Score d'engagement */}
      <div className="bg-white border border-black p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-black opacity-60">Engagement</p>
            <p className={`text-2xl font-bold ${engagement.color}`}>
              {engagement.level}
            </p>
            <p className="text-xs text-black opacity-50">
              {user.analytics.engagement_score}% d'activité
            </p>
          </div>
          <div className="p-2 bg-gray-50 border border-gray-200">
            <Target className="h-6 w-6 text-black opacity-60" />
          </div>
        </div>
      </div>

      {/* Ancienneté du compte */}
      <div className="bg-white border border-black p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-black opacity-60">Ancienneté</p>
            <p className="text-2xl font-bold text-black">
              {user.analytics.days_since_creation}
            </p>
            <p className="text-xs text-black opacity-50">
              Jour{user.analytics.days_since_creation > 1 ? 's' : ''} d'existence
            </p>
          </div>
          <div className="p-2 bg-gray-50 border border-gray-200">
            <Calendar className="h-6 w-6 text-black opacity-60" />
          </div>
        </div>
      </div>

      {/* Statut d'activité */}
      <div className="bg-white border border-black p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-black opacity-60">Statut</p>
            <p className="text-2xl font-bold text-black">
              {user.last_sign_in_at &&
                (Date.now() - new Date(user.last_sign_in_at).getTime()) < (7 * 24 * 60 * 60 * 1000)
                ? 'Actif' : 'Dormant'
              }
            </p>
            <p className="text-xs text-black opacity-50">
              {user.last_sign_in_at ? 'Dernière activité récente' : 'Pas de connexion récente'}
            </p>
          </div>
          <div className="p-2 bg-gray-50 border border-gray-200">
            <Activity className="h-6 w-6 text-black opacity-60" />
          </div>
        </div>
      </div>

      {/* Type de compte */}
      <div className="bg-white border border-black p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-black opacity-60">Type compte</p>
            <p className="text-2xl font-bold text-black">
              {user.profile?.user_type === 'staff' ? 'Équipe' : 'Standard'}
            </p>
            <p className="text-xs text-black opacity-50">
              Niveau d'accès système
            </p>
          </div>
          <div className="p-2 bg-gray-50 border border-gray-200">
            <Users className="h-6 w-6 text-black opacity-60" />
          </div>
        </div>
      </div>

      {/* Score de productivité (calculé) */}
      <div className="bg-white border border-black p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-black opacity-60">Productivité</p>
            <p className="text-2xl font-bold text-black">
              {Math.round((user.analytics.total_sessions * user.analytics.avg_session_duration) / user.analytics.days_since_creation || 0)}
            </p>
            <p className="text-xs text-black opacity-50">
              Score d'efficacité
            </p>
          </div>
          <div className="p-2 bg-gray-50 border border-gray-200">
            <Target className="h-6 w-6 text-black opacity-60" />
          </div>
        </div>
      </div>
    </div>
  )
}