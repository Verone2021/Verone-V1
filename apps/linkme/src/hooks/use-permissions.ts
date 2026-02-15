/**
 * usePermissions - Hook centralisé pour les permissions LinkMe
 *
 * Centralise TOUTES les règles de permissions en un seul endroit.
 * Utiliser ce hook plutôt que des vérifications de rôle dispersées.
 *
 * @module hooks/use-permissions
 * @since 2026-01-30
 */

'use client';

import { useMemo } from 'react';
import { useAuth, type LinkMeRole } from '@/contexts/AuthContext';

/**
 * Définition des permissions par fonctionnalité
 * Modifier ici pour changer les autorisations globalement
 */
const PERMISSION_MATRIX = {
  // Gestion des organisations (chaînes/enseignes)
  manageOrganisations: ['enseigne_admin'] as LinkMeRole[],

  // Création de produits
  createProducts: ['enseigne_admin', 'organisation_admin'] as LinkMeRole[],

  // Gestion des sélections
  manageSelections: ['enseigne_admin', 'organisation_admin'] as LinkMeRole[],

  // Voir les commandes
  viewOrders: ['enseigne_admin', 'organisation_admin'] as LinkMeRole[],

  // Voir les commissions/rémunérations
  viewCommissions: ['enseigne_admin', 'organisation_admin'] as LinkMeRole[],

  // Voir les analytiques
  viewAnalytics: ['enseigne_admin', 'organisation_admin'] as LinkMeRole[],

  // Accès paramètres avancés
  accessAdvancedSettings: ['enseigne_admin'] as LinkMeRole[],

  // Inviter des utilisateurs
  inviteUsers: ['enseigne_admin', 'organisation_admin'] as LinkMeRole[],
} as const;

export type PermissionKey = keyof typeof PERMISSION_MATRIX;

export interface UsePermissionsReturn {
  /** Rôle actuel de l'utilisateur */
  role: LinkMeRole | null;

  /** Vérifie si l'utilisateur a une permission spécifique */
  can: (permission: PermissionKey) => boolean;

  /** Vérifie si l'utilisateur a un des rôles spécifiés */
  hasRole: (roles: LinkMeRole[]) => boolean;

  // Permissions courantes (accès direct)
  canManageOrganisations: boolean;
  canCreateProducts: boolean;
  canManageSelections: boolean;
  canViewOrders: boolean;
  canViewCommissions: boolean;
  canViewAnalytics: boolean;
  canAccessAdvancedSettings: boolean;
  canInviteUsers: boolean;

  /** Indique si le contexte auth est en cours de chargement */
  isLoading: boolean;

  /** Indique si l'utilisateur est authentifié avec un rôle LinkMe */
  isAuthenticated: boolean;
}

/**
 * Hook centralisé pour les permissions LinkMe
 *
 * @example
 * ```tsx
 * const { canManageOrganisations, can } = usePermissions();
 *
 * // Accès direct aux permissions courantes
 * if (canManageOrganisations) { ... }
 *
 * // Vérification dynamique
 * if (can('createProducts')) { ... }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const { linkMeRole, initializing } = useAuth();

  const role = linkMeRole?.role ?? null;
  const isLoading = initializing;
  const isAuthenticated = !!linkMeRole && linkMeRole.is_active;

  // Fonction de vérification générique
  const hasRole = useMemo(() => {
    return (roles: LinkMeRole[]): boolean => {
      if (!role) return false;
      return roles.includes(role);
    };
  }, [role]);

  // Fonction can() pour vérification par clé de permission
  const can = useMemo(() => {
    return (permission: PermissionKey): boolean => {
      if (!role) return false;
      const allowedRoles = PERMISSION_MATRIX[permission];
      return allowedRoles.includes(role);
    };
  }, [role]);

  // Permissions calculées (mémorisées)
  const permissions = useMemo(() => {
    if (!role) {
      return {
        canManageOrganisations: false,
        canCreateProducts: false,
        canManageSelections: false,
        canViewOrders: false,
        canViewCommissions: false,
        canViewAnalytics: false,
        canAccessAdvancedSettings: false,
        canInviteUsers: false,
      };
    }

    return {
      canManageOrganisations:
        PERMISSION_MATRIX.manageOrganisations.includes(role),
      canCreateProducts: PERMISSION_MATRIX.createProducts.includes(role),
      canManageSelections: PERMISSION_MATRIX.manageSelections.includes(role),
      canViewOrders: PERMISSION_MATRIX.viewOrders.includes(role),
      canViewCommissions: PERMISSION_MATRIX.viewCommissions.includes(role),
      canViewAnalytics: PERMISSION_MATRIX.viewAnalytics.includes(role),
      canAccessAdvancedSettings:
        PERMISSION_MATRIX.accessAdvancedSettings.includes(role),
      canInviteUsers: PERMISSION_MATRIX.inviteUsers.includes(role),
    };
  }, [role]);

  return {
    role,
    can,
    hasRole,
    ...permissions,
    isLoading,
    isAuthenticated,
  };
}

/**
 * Exporte la matrice de permissions pour usage externe (tests, documentation)
 */
export { PERMISSION_MATRIX };
