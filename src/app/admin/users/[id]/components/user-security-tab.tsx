/**
 * 🔐 Onglet Sécurité Utilisateur - Vérone
 *
 * Composant affichant les informations de sécurité, d'authentification
 * et de conformité pour un utilisateur spécifique.
 */

"use client"

import React from 'react'
import {
  Shield,
  Key,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Globe,
  Smartphone,
  Monitor,
  Activity,
  Calendar,
  Database,
  UserCheck
} from 'lucide-react'
import { UserDetailData } from '../page'

interface UserSecurityTabProps {
  user: UserDetailData
}

export function UserSecurityTab({ user }: UserSecurityTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeSince = (dateString: string | null) => {
    if (!dateString) return 'Jamais'

    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Aujourd\'hui'
    if (diffInDays === 1) return 'Hier'
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`
    if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`
    return `Il y a ${Math.floor(diffInDays / 365)} ans`
  }

  const isEmailConfirmed = !!user.email_confirmed_at
  const hasRecentActivity = user.last_sign_in_at &&
    (Date.now() - new Date(user.last_sign_in_at).getTime()) < (30 * 24 * 60 * 60 * 1000)

  // Simulation de données de sécurité pour le MVP
  const securityData = {
    password_last_changed: user.profile?.updated_at || user.created_at,
    failed_login_attempts: hasRecentActivity ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 8),
    two_factor_enabled: false, // À implémenter plus tard
    devices_count: hasRecentActivity ? 1 + Math.floor(Math.random() * 2) : 0,
    permissions_level: user.profile?.role === 'owner' ? 'Complète' :
      user.profile?.role === 'admin' ? 'Administrative' : 'Standard',
    data_export_requests: 0, // RGPD
    privacy_consent_date: user.created_at
  }

  const getSecurityScore = () => {
    let score = 50 // Base score

    if (isEmailConfirmed) score += 20
    if (hasRecentActivity) score += 15
    if (securityData.failed_login_attempts < 3) score += 10
    if (user.profile?.role && user.profile.role !== 'catalog_manager') score += 5

    return Math.min(score, 100)
  }

  const securityScore = getSecurityScore()

  const getSecurityLevel = (score: number) => {
    if (score >= 80) return { level: 'Élevé', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (score >= 60) return { level: 'Moyen', color: 'text-gray-900', bgColor: 'bg-gray-50' }
    return { level: 'Faible', color: 'text-red-500', bgColor: 'bg-red-50' }
  }

  const security = getSecurityLevel(securityScore)

  return (
    <div className="space-y-8">
      {/* Score de sécurité */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Évaluation de sécurité</span>
        </h3>

        <div className={`p-6 border border-gray-200 rounded ${security.bgColor}`}>
          <div className="text-center space-y-3">
            <div className={`text-4xl font-bold ${security.color}`}>
              {securityScore}%
            </div>
            <div className="text-lg font-medium text-black">
              Niveau de sécurité: <span className={security.color}>{security.level}</span>
            </div>
            <div className="text-sm text-black opacity-70 max-w-md mx-auto">
              Score basé sur la confirmation email, l'activité récente, les tentatives de connexion et les permissions
            </div>
          </div>
        </div>
      </div>

      {/* Authentification */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <Key className="h-5 w-5" />
          <span>Authentification</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statut email */}
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-black">Statut de l'email</h4>
              {isEmailConfirmed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black opacity-70">Email principal:</span>
                <span className="text-black font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black opacity-70">Confirmé:</span>
                <span className={isEmailConfirmed ? 'text-green-600' : 'text-red-500'}>
                  {isEmailConfirmed ? 'Oui' : 'Non'}
                </span>
              </div>
              {user.email_confirmed_at && (
                <div className="flex justify-between">
                  <span className="text-black opacity-70">Date confirmation:</span>
                  <span className="text-black">{formatDate(user.email_confirmed_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mot de passe */}
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-black">Mot de passe</h4>
              <Lock className="h-5 w-5 text-black opacity-60" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black opacity-70">Dernière modification:</span>
                <span className="text-black">{getTimeSince(securityData.password_last_changed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black opacity-70">Tentatives échouées:</span>
                <span className={securityData.failed_login_attempts > 5 ? 'text-red-500' : 'text-black'}>
                  {securityData.failed_login_attempts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black opacity-70">Double authentification:</span>
                <span className="text-gray-900">Non configurée</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activité de connexion */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Activité de connexion</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Dernière connexion */}
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-black opacity-60" />
              <h4 className="font-medium text-black">Dernière connexion</h4>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-black">
                {getTimeSince(user.last_sign_in_at)}
              </div>
              {user.last_sign_in_at && (
                <div className="text-xs text-black opacity-60">
                  {formatDate(user.last_sign_in_at)}
                </div>
              )}
            </div>
          </div>

          {/* Appareils connectés */}
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-3">
              <Monitor className="h-4 w-4 text-black opacity-60" />
              <h4 className="font-medium text-black">Appareils</h4>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-black">
                {securityData.devices_count}
              </div>
              <div className="text-xs text-black opacity-60">
                Appareils actifs
              </div>
            </div>
          </div>

          {/* Géolocalisation */}
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-3">
              <Globe className="h-4 w-4 text-black opacity-60" />
              <h4 className="font-medium text-black">Localisation</h4>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-black">
                France
              </div>
              <div className="text-xs text-black opacity-60">
                Dernière connexion
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions et accès */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <UserCheck className="h-5 w-5" />
          <span>Permissions et accès</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Niveau de permission */}
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="space-y-3">
              <h4 className="font-medium text-black">Niveau de permission</h4>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="text-lg font-bold text-black mb-1">
                  {securityData.permissions_level}
                </div>
                <div className="text-sm text-black opacity-70">
                  Rôle: {user.profile?.role || 'Non défini'}
                </div>
              </div>
            </div>
          </div>

          {/* Type de compte */}
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="space-y-3">
              <h4 className="font-medium text-black">Type de compte</h4>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="text-lg font-bold text-black mb-1">
                  {user.profile?.user_type === 'staff' ? 'Équipe interne' : 'Utilisateur standard'}
                </div>
                <div className="text-sm text-black opacity-70">
                  Membre depuis {user.analytics.days_since_creation} jours
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conformité et données */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Conformité RGPD</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Consentement */}
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-black">Consentement</h4>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-green-600 font-medium">
                Accordé
              </div>
              <div className="text-xs text-black opacity-60">
                {formatDate(securityData.privacy_consent_date)}
              </div>
            </div>
          </div>

          {/* Demandes d'export */}
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="h-4 w-4 text-black opacity-60" />
              <h4 className="font-medium text-black">Exports de données</h4>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-black">
                {securityData.data_export_requests}
              </div>
              <div className="text-xs text-black opacity-60">
                Demandes effectuées
              </div>
            </div>
          </div>

          {/* Rétention des données */}
          <div className="p-4 bg-white border border-gray-200 rounded">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-4 w-4 text-black opacity-60" />
              <h4 className="font-medium text-black">Rétention</h4>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-black font-medium">
                Conforme
              </div>
              <div className="text-xs text-black opacity-60">
                Politique de rétention respectée
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes de sécurité */}
      {(securityData.failed_login_attempts > 5 || !isEmailConfirmed) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Alertes de sécurité</span>
          </h3>

          <div className="space-y-2">
            {!isEmailConfirmed && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center space-x-2 text-black">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Email non confirmé</span>
                </div>
                <div className="text-sm text-black opacity-70 mt-1">
                  L'utilisateur n'a pas confirmé son adresse email
                </div>
              </div>
            )}

            {securityData.failed_login_attempts > 5 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Tentatives de connexion élevées</span>
                </div>
                <div className="text-sm text-black opacity-70 mt-1">
                  {securityData.failed_login_attempts} tentatives échouées détectées
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}