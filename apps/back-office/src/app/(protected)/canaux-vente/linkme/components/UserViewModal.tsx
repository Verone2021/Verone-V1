'use client';

import { cn } from '@verone/utils';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Store,
  ShoppingCart,
  Briefcase,
  Check,
  Calendar,
  Shield,
} from 'lucide-react';

import {
  type LinkMeUser,
  LINKME_ROLE_LABELS,
  LINKME_ROLE_COLORS,
  LINKME_ROLE_PERMISSIONS,
} from '../hooks/use-linkme-users';

interface UserViewModalProps {
  isOpen: boolean;
  user: LinkMeUser;
  onClose: () => void;
}

/**
 * Modal de visualisation des détails d'un utilisateur LinkMe
 */
export function UserViewModal({ isOpen, user, onClose }: UserViewModalProps) {
  if (!isOpen) return null;

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Sans nom';
  const initials =
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
    '?';

  const RoleIcon =
    user.linkme_role === 'enseigne_admin'
      ? Building2
      : user.linkme_role === 'organisation_admin'
        ? Store
        : user.linkme_role === 'org_independante'
          ? Briefcase
          : ShoppingCart;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Détails utilisateur</h2>
                <p className="text-sm text-gray-500">Informations du compte</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Avatar et nom */}
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={fullName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-medium text-gray-600">
                  {initials}
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {fullName}
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                    LINKME_ROLE_COLORS[user.linkme_role]
                  )}
                >
                  <RoleIcon className="h-3 w-3" />
                  {LINKME_ROLE_LABELS[user.linkme_role]}
                </span>
              </div>
            </div>

            {/* Statut */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Statut:</span>
              {user.is_active ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Check className="h-3 w-3" />
                  Actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <X className="h-3 w-3" />
                  Inactif
                </span>
              )}
            </div>

            {/* Informations de contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enseigne / Organisation */}
            {(user.enseigne_name || user.organisation_name) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Rattachement
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {user.enseigne_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-500" />
                      <div>
                        <span className="text-xs text-gray-500">Enseigne</span>
                        <p className="text-sm font-medium">
                          {user.enseigne_name}
                        </p>
                      </div>
                    </div>
                  )}
                  {user.organisation_name && (
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-blue-500" />
                      <div>
                        <span className="text-xs text-gray-500">
                          Organisation
                        </span>
                        <p className="text-sm font-medium">
                          {user.organisation_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Permissions du rôle */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissions
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-1">
                  {LINKME_ROLE_PERMISSIONS[user.linkme_role].map(
                    (perm, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {perm}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            {/* Date création */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                Créé le{' '}
                {new Date(user.role_created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
