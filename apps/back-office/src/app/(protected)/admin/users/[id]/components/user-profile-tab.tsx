/**
 * 👤 Onglet Profil Utilisateur - Vérone
 *
 * Composant affichant toutes les informations détaillées
 * du profil utilisateur dans l'interface d'administration.
 */

'use client';

import React from 'react';

import { RoleBadge, type UserRole } from '@verone/ui';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Database,
  Key,
} from 'lucide-react';

import type { UserDetailData } from '../page';

interface UserProfileTabProps {
  user: UserDetailData;
}

export function UserProfileTab({ user }: UserProfileTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatUserName = (email: string, user_metadata: any = null) => {
    if (user_metadata?.name) {
      return user_metadata.name;
    }

    if (user_metadata?.first_name || user_metadata?.last_name) {
      return [user_metadata.first_name, user_metadata.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();
    }

    const tempName = email.split('@')[0].split('.') || [''];
    return tempName.length > 1 ? tempName.join(' ') : tempName[0];
  };

  const getFirstName = (email: string, user_metadata: any = null) => {
    if (user_metadata?.first_name) return user_metadata.first_name;
    const tempName = email.split('@')[0].split('.') || [''];
    return tempName[0] ?? '';
  };

  const getLastName = (email: string, user_metadata: any = null) => {
    if (user_metadata?.last_name) return user_metadata.last_name;
    const tempName = email.split('@')[0].split('.') || [''];
    return tempName[1] ?? '';
  };

  const isEmailConfirmed = !!user.email_confirmed_at;

  return (
    <div className="space-y-2">
      {/* Informations personnelles */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center space-x-2">
          <User className="h-3.5 w-3.5" />
          <span>Informations personnelles</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Prénom */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Prénom
            </label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
              <span className="text-neutral-900">
                {getFirstName(user.email, user.user_metadata) ||
                  'Non renseigné'}
              </span>
            </div>
          </div>

          {/* Nom */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">Nom</label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
              <span className="text-neutral-900">
                {getLastName(user.email, user.user_metadata) || 'Non renseigné'}
              </span>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Adresse e-mail
            </label>
            <div className="p-2 bg-neutral-50 border border-neutral-200 rounded flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 text-neutral-500" />
                <span className="text-neutral-900">{user.email}</span>
              </div>
              {isEmailConfirmed ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="text-xs">Confirmé</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-500">
                  <XCircle className="h-3.5 w-3.5" />
                  <span className="text-xs">Non confirmé</span>
                </div>
              )}
            </div>
          </div>

          {/* Téléphone */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Téléphone
            </label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded flex items-center space-x-2">
              <Phone className="h-3 w-3 text-neutral-500" />
              <span className="text-neutral-900">
                {user.user_metadata?.phone || 'Non renseigné'}
              </span>
            </div>
          </div>

          {/* Poste */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Poste
            </label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded flex items-center space-x-2">
              <Briefcase className="h-3 w-3 text-neutral-500" />
              <span className="text-neutral-900">
                {user.user_metadata?.job_title || 'Non renseigné'}
              </span>
            </div>
          </div>

          {/* Nom complet affiché */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Nom d'affichage
            </label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
              <span className="text-neutral-900 font-medium">
                {formatUserName(user.email, user.user_metadata)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Informations système */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center space-x-2">
          <Shield className="h-3.5 w-3.5" />
          <span>Informations système</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Rôle */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Rôle système
            </label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
              {user.profile?.role ? (
                <RoleBadge role={user.profile.role as UserRole} />
              ) : (
                <span className="text-neutral-500">Non défini</span>
              )}
            </div>
          </div>

          {/* Type utilisateur */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Type utilisateur
            </label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded flex items-center space-x-2">
              <Tag className="h-3 w-3 text-neutral-500" />
              <span className="text-neutral-900">
                {user.profile?.user_type === 'staff'
                  ? 'Équipe Vérone'
                  : 'Utilisateur standard'}
              </span>
            </div>
          </div>

          {/* ID Utilisateur */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Identifiant unique
            </label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded flex items-center space-x-2">
              <Key className="h-3 w-3 text-neutral-500" />
              <span className="text-neutral-900 font-mono text-xs">
                {user.id}
              </span>
            </div>
          </div>

          {/* Statut du compte */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Statut du compte
            </label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
              {user.last_sign_in_at &&
              Date.now() - new Date(user.last_sign_in_at).getTime() <
                30 * 24 * 60 * 60 * 1000 ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span className="font-medium">Compte actif</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-neutral-900">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">Compte dormant</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dates importantes */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center space-x-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>Chronologie du compte</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Date de création */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Compte créé le
            </label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded flex items-center space-x-2">
              <Calendar className="h-3 w-3 text-neutral-500" />
              <span className="text-neutral-900">
                {formatDate(user.created_at)}
              </span>
            </div>
          </div>

          {/* Dernière connexion */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-600">
              Dernière connexion
            </label>
            <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded flex items-center space-x-2">
              <Clock className="h-3 w-3 text-neutral-500" />
              <span className="text-neutral-900">
                {user.last_sign_in_at
                  ? formatDate(user.last_sign_in_at)
                  : 'Jamais connecté'}
              </span>
            </div>
          </div>

          {/* Confirmation email */}
          {user.email_confirmed_at && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-600">
                Email confirmé le
              </label>
              <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-neutral-900">
                  {formatDate(user.email_confirmed_at)}
                </span>
              </div>
            </div>
          )}

          {/* Dernière mise à jour profil */}
          {user.profile?.updated_at && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-600">
                Profil mis à jour
              </label>
              <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded flex items-center space-x-2">
                <Database className="h-3 w-3 text-neutral-500" />
                <span className="text-neutral-900">
                  {formatDate(user.profile.updated_at)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Métadonnées utilisateur (si disponibles) */}
      {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center space-x-2">
            <Database className="h-3.5 w-3.5" />
            <span>Métadonnées utilisateur</span>
          </h3>

          <div className="p-2 bg-neutral-50 border border-neutral-200 rounded">
            <pre className="text-[11px] text-neutral-900 font-mono whitespace-pre-wrap overflow-auto max-h-32">
              {JSON.stringify(user.user_metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
