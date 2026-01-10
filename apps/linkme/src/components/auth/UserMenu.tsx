'use client';

/**
 * UserMenu - Menu dropdown pour utilisateur connecté
 *
 * Affiche le nom, rôle et actions disponibles
 *
 * @module UserMenu
 * @since 2025-12-01
 */

import { useState, useRef, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { User, Building2, Store, LogOut, ChevronDown } from 'lucide-react';

import { useAuth, type LinkMeRole } from '../../contexts/AuthContext';

// Labels des rôles
const ROLE_LABELS: Record<LinkMeRole, string> = {
  enseigne_admin: 'Admin Enseigne',
  organisation_admin: 'Organisation Enseigne',
  org_independante: 'Org. Indépendante',
  client: 'Client',
};

// Couleurs des badges par rôle
const ROLE_COLORS: Record<LinkMeRole, string> = {
  enseigne_admin: 'bg-purple-100 text-purple-700',
  organisation_admin: 'bg-blue-100 text-blue-700',
  org_independante: 'bg-orange-100 text-orange-700',
  client: 'bg-green-100 text-green-700',
};

interface IUserMenuProps {
  className?: string;
}

export function UserMenu({ className }: IUserMenuProps): JSX.Element | null {
  const router = useRouter();
  const { user, linkMeRole, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gérer la déconnexion - redirige vers l'accueil
  const handleSignOut = async (): Promise<void> => {
    await signOut('/');
  };

  if (!user) return null;

  // Obtenir le nom d'affichage
  const displayName =
    user.user_metadata?.first_name && user.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : (user.email?.split('@')[0] ?? 'Utilisateur');

  // Obtenir l'entité associée (enseigne ou organisation)
  const entityName =
    linkMeRole?.enseigne_name ?? linkMeRole?.organisation_name ?? null;

  return (
    <div className={`relative ${className ?? ''}`} ref={menuRef}>
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
          {displayName.charAt(0).toUpperCase()}
        </div>

        {/* Nom et rôle */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
            {displayName}
          </div>
          {linkMeRole && (
            <div className="text-xs text-gray-500">
              {ROLE_LABELS[linkMeRole.role]}
            </div>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Header avec infos utilisateur */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-medium text-gray-900">{displayName}</div>
            <div className="text-sm text-gray-500 truncate">{user.email}</div>
            {linkMeRole && (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${ROLE_COLORS[linkMeRole.role]}`}
                >
                  {ROLE_LABELS[linkMeRole.role]}
                </span>
              </div>
            )}
            {entityName && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                {linkMeRole?.enseigne_id ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <Store className="h-4 w-4" />
                )}
                <span className="truncate">{entityName}</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="py-2">
            <Link
              href="/profil"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="h-4 w-4" />
              Mon profil
            </Link>
            {/* Lien Organisations - uniquement pour enseignes */}
            {(linkMeRole?.role === 'enseigne_admin' ||
              linkMeRole?.role === 'organisation_admin') && (
              <Link
                href="/organisations"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Building2 className="h-4 w-4" />
                Mes organisations
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={() => void handleSignOut()}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
