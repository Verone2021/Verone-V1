/**
 * 📊 Cartes Statistiques Utilisateur - Vérone
 *
 * Composant affichant les métriques clés d'engagement et d'activité
 * de l'utilisateur sous forme de cartes d'information.
 *
 * Chaque carte affiche un badge indiquant si les données sont RÉELLES ou MOCK.
 */

'use client';

import React from 'react';

import { DataStatusBadge } from '@verone/ui';
import {
  Clock,
  Activity,
  Calendar,
  TrendingUp,
  Users,
  Target,
} from 'lucide-react';

import type { UserDetailData } from '../page';

interface UserStatsCardsProps {
  user: UserDetailData;
}

export function UserStatsCards({ user }: UserStatsCardsProps) {
  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { level: 'Très élevé', color: 'text-green-600' };
    if (score >= 60) return { level: 'Élevé', color: 'text-blue-600' };
    if (score >= 40) return { level: 'Moyen', color: 'text-neutral-900' };
    return { level: 'Faible', color: 'text-red-500' };
  };

  const getFrequencyLabel = (frequency: 'high' | 'medium' | 'low') => {
    switch (frequency) {
      case 'high':
        return { label: 'Fréquent', color: 'text-green-600' };
      case 'medium':
        return { label: 'Régulier', color: 'text-blue-600' };
      case 'low':
        return { label: 'Occasionnel', color: 'text-neutral-900' };
      default:
        return { label: 'Inconnu', color: 'text-neutral-500' };
    }
  };

  const engagement = getEngagementLevel(user.analytics.engagement_score);
  const frequency = getFrequencyLabel(user.analytics.login_frequency);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Sessions totales */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3 relative">
        <DataStatusBadge type="real" className="absolute top-2 right-2" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Sessions totales</p>
            <p className="text-xl font-bold text-neutral-900">
              {user.analytics.total_sessions}
            </p>
            <p className="text-[11px] text-neutral-500">
              Sessions enregistrées
            </p>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <Users className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Durée moyenne session */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3 relative">
        <DataStatusBadge type="real" className="absolute top-2 right-2" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Durée moy. session</p>
            <p className="text-xl font-bold text-neutral-900">
              {user.analytics.avg_session_duration}min
            </p>
            <p className="text-[11px] text-neutral-500">
              Temps moyen d'utilisation
            </p>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <Clock className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Fréquence de connexion */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3 relative">
        <DataStatusBadge type="real" className="absolute top-2 right-2" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Fréquence</p>
            <p className={`text-xl font-bold ${frequency.color}`}>
              {frequency.label}
            </p>
            <p className="text-[11px] text-neutral-500">Rythme de connexion</p>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <TrendingUp className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Score d'engagement */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3 relative">
        <DataStatusBadge type="real" className="absolute top-2 right-2" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Engagement</p>
            <p className={`text-xl font-bold ${engagement.color}`}>
              {engagement.level}
            </p>
            <p className="text-[11px] text-neutral-500">
              {user.analytics.engagement_score}% d'activité
            </p>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <Target className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Ancienneté du compte */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3 relative">
        <DataStatusBadge type="real" className="absolute top-2 right-2" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Ancienneté</p>
            <p className="text-xl font-bold text-neutral-900">
              {user.analytics.days_since_creation}
            </p>
            <p className="text-[11px] text-neutral-500">
              Jour{user.analytics.days_since_creation > 1 ? 's' : ''}{' '}
              d'existence
            </p>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <Calendar className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Statut d'activité */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3 relative">
        <DataStatusBadge type="real" className="absolute top-2 right-2" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Statut</p>
            <p className="text-xl font-bold text-neutral-900">
              {user.last_sign_in_at &&
              Date.now() - new Date(user.last_sign_in_at).getTime() <
                7 * 24 * 60 * 60 * 1000
                ? 'Actif'
                : 'Dormant'}
            </p>
            <p className="text-[11px] text-neutral-500">
              {user.last_sign_in_at
                ? 'Dernière activité récente'
                : 'Pas de connexion récente'}
            </p>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <Activity className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Type de compte */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3 relative">
        <DataStatusBadge type="real" className="absolute top-2 right-2" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Type compte</p>
            <p className="text-xl font-bold text-neutral-900">
              {user.profile?.user_type === 'staff' ? 'Équipe' : 'Standard'}
            </p>
            <p className="text-[11px] text-neutral-500">
              Niveau d'accès système
            </p>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <Users className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
