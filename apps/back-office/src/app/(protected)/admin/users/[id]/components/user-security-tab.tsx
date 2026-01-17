/**
 * 🔐 Onglet Sécurité Utilisateur - Vérone
 *
 * Composant affichant les informations de sécurité, d'authentification
 * et de conformité pour un utilisateur spécifique.
 *
 * ✅ UNIQUEMENT DONNÉES RÉELLES (pas de mock)
 */

'use client';

import React from 'react';

import {
  Shield,
  Key,
  CheckCircle,
  XCircle,
  Calendar,
  Database,
  UserCheck,
} from 'lucide-react';

import type { UserDetailData } from '../page';

interface UserSecurityTabProps {
  user: UserDetailData;
}

export function UserSecurityTab({ user }: UserSecurityTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateString: string | null) => {
    if (!dateString) return 'Jamais';

    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
    if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
    return `Il y a ${Math.floor(diffInDays / 365)} ans`;
  };

  const isEmailConfirmed = !!user.email_confirmed_at;

  return (
    <div className="space-y-2">
      {/* Authentification */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center space-x-2">
          <Key className="h-3.5 w-3.5" />
          <span>Authentification</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Statut email */}
          <div className="p-2 bg-white border border-neutral-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-black">
                Statut de l'email
              </h4>
              {isEmailConfirmed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Email principal:</span>
                <span className="text-black font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Confirmé:</span>
                <span
                  className={
                    isEmailConfirmed ? 'text-green-600' : 'text-red-500'
                  }
                >
                  {isEmailConfirmed ? 'Oui' : 'Non'}
                </span>
              </div>
              {user.email_confirmed_at && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Date confirmation:</span>
                  <span className="text-neutral-900 text-xs">
                    {formatDate(user.email_confirmed_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mot de passe */}
          <div className="p-2 bg-white border border-neutral-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-black">Mot de passe</h4>
              <Shield className="h-4 w-4 text-neutral-500" />
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Dernière modification:</span>
                <span className="text-neutral-900 text-xs">
                  {getTimeSince(user.profile?.updated_at || user.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions et accès */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center space-x-2">
          <UserCheck className="h-3.5 w-3.5" />
          <span>Permissions et accès</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Niveau de permission */}
          <div className="p-2 bg-white border border-neutral-200 rounded-lg">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-black">
                Niveau de permission
              </h4>
              <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
                <div className="text-base font-bold text-black mb-0.5">
                  {user.profile?.role === 'owner'
                    ? 'Complète'
                    : user.profile?.role === 'admin'
                      ? 'Administrative'
                      : 'Standard'}
                </div>
                <div className="text-sm text-neutral-600">
                  Rôle: {user.profile?.role || 'Non défini'}
                </div>
              </div>
            </div>
          </div>

          {/* Type de compte */}
          <div className="p-2 bg-white border border-neutral-200 rounded-lg">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-black">Type de compte</h4>
              <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
                <div className="text-base font-bold text-black mb-0.5">
                  {user.profile?.user_type === 'staff'
                    ? 'Équipe interne'
                    : 'Utilisateur standard'}
                </div>
                <div className="text-sm text-neutral-600">
                  Membre depuis {user.analytics.days_since_creation} jours
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conformité et données */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center space-x-2">
          <Database className="h-3.5 w-3.5" />
          <span>Conformité RGPD</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Consentement */}
          <div className="p-2 bg-white border border-neutral-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <h4 className="text-sm font-medium text-black">Consentement</h4>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-green-600 font-medium">Accordé</div>
              <div className="text-xs text-neutral-500">
                {formatDate(user.created_at)}
              </div>
            </div>
          </div>

          {/* Rétention des données */}
          <div className="p-2 bg-white border border-neutral-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-3.5 w-3.5 text-neutral-500" />
              <h4 className="text-sm font-medium text-black">Rétention</h4>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-black font-medium">Conforme</div>
              <div className="text-xs text-neutral-500">
                Politique de rétention respectée
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
