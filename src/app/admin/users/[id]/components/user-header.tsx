/**
 * 👤 Header Utilisateur - Vérone
 *
 * Composant d'en-tête affichant les informations principales
 * de l'utilisateur avec avatar, nom, rôle et statut.
 */

"use client"

import React from 'react'
import { User, Mail, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import { RoleBadge, type UserRole } from '@/components/ui/role-badge'
import { UserDetailData } from '../page'

interface UserHeaderProps {
  user: UserDetailData
}

export function UserHeader({ user }: UserHeaderProps) {
  const formatUserName = (email: string, user_metadata: any = null) => {
    if (user_metadata?.name) {
      return user_metadata.name
    }

    if (user_metadata?.first_name || user_metadata?.last_name) {
      return [user_metadata.first_name, user_metadata.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()
    }

    const tempName = email.split('@')[0].split('.') || ['']
    return tempName.length > 1 ? tempName.join(' ') : tempName[0]
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Jamais'

    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Il y a ${diffInHours}h`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`

    return formatDate(dateString)
  }

  const userName = formatUserName(user.email, user.user_metadata)
  const userInitials = getInitials(userName)
  const isEmailConfirmed = !!user.email_confirmed_at
  const isActiveUser = user.last_sign_in_at &&
    (Date.now() - new Date(user.last_sign_in_at).getTime()) < (30 * 24 * 60 * 60 * 1000) // 30 jours

  return (
    <div className="bg-white border border-black p-6">
      <div className="flex items-start space-x-6">
        {/* Avatar utilisateur */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-gray-100 border-2 border-black rounded-none flex items-center justify-center">
            <span className="text-2xl font-bold text-black">{userInitials}</span>
          </div>
        </div>

        {/* Informations principales */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              {/* Nom et statut */}
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-black truncate">
                  {userName}
                </h1>

                <div className="flex items-center space-x-2">
                  {isActiveUser ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Actif</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-500">
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Inactif</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Email et confirmation */}
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-black opacity-60" />
                <span className="text-sm text-black">{user.email}</span>
                {isEmailConfirmed ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>

              {/* Informations temporelles */}
              <div className="flex items-center space-x-6 text-sm text-black opacity-70">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Créé le {formatDate(user.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Dernière connexion: {getTimeAgo(user.last_sign_in_at)}</span>
                </div>
              </div>

              {/* Poste si disponible */}
              {user.user_metadata?.job_title && (
                <div className="text-sm text-black opacity-60">
                  {user.user_metadata.job_title}
                </div>
              )}
            </div>

            {/* Rôle et score d'engagement */}
            <div className="flex flex-col items-end space-y-3">
              {user.profile?.role && (
                <RoleBadge role={user.profile.role as UserRole} />
              )}

              <div className="text-center">
                <div className="text-2xl font-bold text-black">
                  {user.analytics.engagement_score}%
                </div>
                <div className="text-xs text-black opacity-60">
                  Score d'engagement
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateurs de statut */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-black opacity-60">
        <div>
          ID Utilisateur: <span className="font-mono">{user.id}</span>
        </div>
        <div>
          Compte {user.profile?.user_type === 'staff' ? 'Équipe' : 'Standard'} •
          Actif depuis {user.analytics.days_since_creation} jour{user.analytics.days_since_creation > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}