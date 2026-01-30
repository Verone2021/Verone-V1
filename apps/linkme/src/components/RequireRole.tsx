/**
 * RequireRole - Composant guard pour contrôle d'accès basé sur le rôle
 *
 * Affiche le contenu uniquement si l'utilisateur a un des rôles autorisés.
 * Utilisable pour masquer conditionnellement des sections de l'UI.
 *
 * @module components/RequireRole
 * @since 2026-01-30
 */

'use client';

import type { ReactNode } from 'react';
import { useAuth, type LinkMeRole } from '@/contexts/AuthContext';

export interface RequireRoleProps {
  /** Rôles autorisés à voir le contenu */
  roles: LinkMeRole[];

  /** Contenu à afficher si autorisé */
  children: ReactNode;

  /** Contenu alternatif si non autorisé (optionnel) */
  fallback?: ReactNode;

  /** Si true, affiche le fallback pendant le chargement (défaut: true) */
  showFallbackWhileLoading?: boolean;
}

/**
 * Composant guard pour contrôle d'accès basé sur le rôle
 *
 * @example
 * ```tsx
 * // Masquer une section pour les non-admins
 * <RequireRole roles={['enseigne_admin']}>
 *   <AdminSection />
 * </RequireRole>
 *
 * // Avec fallback
 * <RequireRole
 *   roles={['enseigne_admin', 'org_independante']}
 *   fallback={<p>Accès restreint</p>}
 * >
 *   <FeatureContent />
 * </RequireRole>
 * ```
 */
export function RequireRole({
  roles,
  children,
  fallback = null,
  showFallbackWhileLoading = true,
}: RequireRoleProps): ReactNode {
  const { linkMeRole, initializing } = useAuth();

  // Pendant le chargement initial
  if (initializing) {
    return showFallbackWhileLoading ? fallback : null;
  }

  // Pas de rôle LinkMe = pas d'accès
  if (!linkMeRole) {
    return fallback;
  }

  // Vérifier si le rôle est dans la liste autorisée
  if (!roles.includes(linkMeRole.role)) {
    return fallback;
  }

  // Autorisé
  return children;
}

/**
 * Composant inverse: RequireNotRole
 * Affiche le contenu si l'utilisateur N'A PAS les rôles spécifiés
 *
 * @example
 * ```tsx
 * <RequireNotRole roles={['enseigne_admin']}>
 *   <p>Message visible uniquement pour les non-admins</p>
 * </RequireNotRole>
 * ```
 */
export function RequireNotRole({
  roles,
  children,
  fallback = null,
  showFallbackWhileLoading = true,
}: RequireRoleProps): ReactNode {
  const { linkMeRole, initializing } = useAuth();

  // Pendant le chargement initial
  if (initializing) {
    return showFallbackWhileLoading ? fallback : null;
  }

  // Pas de rôle LinkMe = afficher (car n'a pas les rôles interdits)
  if (!linkMeRole) {
    return children;
  }

  // Si le rôle EST dans la liste, masquer
  if (roles.includes(linkMeRole.role)) {
    return fallback;
  }

  // Non dans la liste = afficher
  return children;
}

export default RequireRole;
