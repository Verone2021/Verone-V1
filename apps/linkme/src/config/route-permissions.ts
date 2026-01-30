/**
 * Configuration centralisée des permissions de routes LinkMe
 *
 * Définit quels rôles peuvent accéder à quelles routes.
 * Utilisé par le middleware et les composants client.
 *
 * NOTE: Le middleware actuel vérifie UNIQUEMENT l'authentification.
 * La vérification des rôles se fait côté client (AuthContext + pages).
 * Cette config sert de référence centralisée pour les deux.
 *
 * @module config/route-permissions
 * @since 2026-01-30
 */

import type { LinkMeRole } from '@/contexts/AuthContext';

export interface RoutePermission {
  /** Rôles autorisés (vide = tous les rôles authentifiés) */
  roles: LinkMeRole[];
  /** URL de redirection si non autorisé */
  redirect: string;
  /** Description pour documentation */
  description?: string;
}

/**
 * Configuration des permissions par route
 *
 * Les routes non listées ici sont:
 * - Soit publiques (définies dans middleware.ts)
 * - Soit accessibles à tous les utilisateurs authentifiés
 */
export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  // Routes restreintes par rôle
  '/organisations': {
    roles: ['enseigne_admin', 'organisation_admin'],
    redirect: '/dashboard',
    description: 'Gestion des organisations de la chaîne',
  },

  // Routes accessibles à tous les rôles actifs (liste explicite pour documentation)
  '/dashboard': {
    roles: ['enseigne_admin', 'org_independante', 'organisation_admin'],
    redirect: '/login',
    description: 'Tableau de bord principal',
  },

  '/commandes': {
    roles: ['enseigne_admin', 'org_independante', 'organisation_admin'],
    redirect: '/dashboard',
    description: 'Liste des commandes',
  },

  '/ma-selection': {
    roles: ['enseigne_admin', 'org_independante'],
    redirect: '/dashboard',
    description: 'Gestion des sélections de produits',
  },

  '/mes-produits': {
    roles: ['enseigne_admin', 'org_independante'],
    redirect: '/dashboard',
    description: "Produits créés par l'affilié",
  },

  '/commissions': {
    roles: ['enseigne_admin', 'org_independante', 'organisation_admin'],
    redirect: '/dashboard',
    description: 'Rémunérations et commissions',
  },

  '/analytiques': {
    roles: ['enseigne_admin', 'org_independante', 'organisation_admin'],
    redirect: '/dashboard',
    description: 'Statistiques et analytiques',
  },

  '/parametres': {
    roles: ['enseigne_admin', 'org_independante', 'organisation_admin'],
    redirect: '/dashboard',
    description: 'Paramètres du compte',
  },

  '/profil': {
    roles: ['enseigne_admin', 'org_independante', 'organisation_admin'],
    redirect: '/dashboard',
    description: 'Profil utilisateur',
  },

  '/catalogue': {
    roles: ['enseigne_admin', 'org_independante', 'organisation_admin'],
    redirect: '/dashboard',
    description: 'Catalogue global des produits',
  },
} as const;

/**
 * Vérifie si un rôle a accès à une route
 *
 * @param pathname - Chemin de la route
 * @param role - Rôle de l'utilisateur
 * @returns true si autorisé, false sinon
 */
export function isRouteAllowed(
  pathname: string,
  role: LinkMeRole | null
): boolean {
  // Pas de rôle = pas d'accès aux routes protégées
  if (!role) return false;

  // Chercher la route exacte ou le préfixe
  const routeConfig = ROUTE_PERMISSIONS[pathname];

  // Route non configurée = accès libre pour les authentifiés
  if (!routeConfig) return true;

  // Vérifier si le rôle est autorisé
  return routeConfig.roles.includes(role);
}

/**
 * Obtient l'URL de redirection pour une route non autorisée
 *
 * @param pathname - Chemin de la route
 * @returns URL de redirection
 */
export function getRedirectUrl(pathname: string): string {
  const routeConfig = ROUTE_PERMISSIONS[pathname];
  return routeConfig?.redirect ?? '/dashboard';
}

/**
 * Liste des routes qui nécessitent une vérification de rôle côté client
 * (utile pour le composant de navigation)
 */
export const RESTRICTED_ROUTES = Object.entries(ROUTE_PERMISSIONS)
  .filter(([_, config]) => config.roles.length > 0)
  .map(([path]) => path);

/**
 * Vérifie si une route est restreinte (pas accessible à tous les rôles)
 */
export function isRestrictedRoute(pathname: string): boolean {
  const config = ROUTE_PERMISSIONS[pathname];
  if (!config) return false;

  // Une route est restreinte si elle n'inclut pas tous les rôles principaux
  const allMainRoles: LinkMeRole[] = [
    'enseigne_admin',
    'org_independante',
    'organisation_admin',
  ];
  return !allMainRoles.every(role => config.roles.includes(role));
}
