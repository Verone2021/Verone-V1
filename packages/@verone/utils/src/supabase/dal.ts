/**
 * 🔐 Data Access Layer (DAL) - Authentication
 *
 * Couche d'accès aux données avec vérification d'authentification.
 *
 * IMPORTANT (Best Practices 2025):
 * - C'est ICI que l'auth doit être vérifiée, pas dans le middleware
 * - Utiliser getUser() pas getSession() pour la sécurité
 * - Utiliser React cache() pour éviter les appels multiples
 *
 * Ref: https://nextjs.org/docs/app/guides/authentication
 * Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * @module dal
 * @since 2026-01-29
 */

import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';

import { createServerClient } from './server';

import type { User } from '@supabase/supabase-js';

/**
 * Résultat de la vérification de session
 */
export interface SessionResult {
  isAuth: true;
  user: User;
}

/**
 * Vérifie la session utilisateur et redirige si non authentifié.
 *
 * Utilise React cache() pour mémoriser le résultat pendant le render.
 * Cela évite de faire plusieurs appels à getUser() dans la même requête.
 *
 * @param redirectTo - URL de redirection si non authentifié (défaut: /login)
 * @returns Session vérifiée avec user
 * @throws Redirect vers /login si non authentifié
 *
 * @example
 * // Dans un Server Component ou page
 * const { user } = await verifySession();
 * // user est garanti d'exister ici
 */
export const verifySession = cache(
  async (redirectTo: string = '/login'): Promise<SessionResult> => {
    const supabase = await createServerClient();

    // IMPORTANT: Utiliser getUser() pas getSession()
    // getUser() valide le JWT avec le serveur Supabase
    // getSession() lit seulement le cookie (peut être falsifié)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      redirect(redirectTo);
    }

    return {
      isAuth: true,
      user,
    };
  }
);

/**
 * Récupère l'utilisateur courant sans redirection.
 *
 * Utilise React cache() pour mémoriser le résultat.
 * Retourne null si non authentifié (pas de redirection).
 *
 * @returns User ou null
 *
 * @example
 * const user = await getUser();
 * if (!user) {
 *   // Gérer le cas non authentifié
 * }
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

/**
 * Vérifie si l'utilisateur est authentifié (sans redirection).
 *
 * Utile pour les vérifications conditionnelles.
 *
 * @returns true si authentifié, false sinon
 *
 * @example
 * if (await isAuthenticated()) {
 *   // Utilisateur connecté
 * }
 */
export const isAuthenticated = cache(async (): Promise<boolean> => {
  const user = await getUser();
  return user !== null;
});

/**
 * Vérifie que l'utilisateur a accès à l'app LinkMe.
 *
 * Interroge la table user_app_roles pour vérifier les permissions.
 *
 * @param redirectTo - URL de redirection si pas d'accès
 * @returns Session avec user et role
 *
 * @example
 * const { user, role } = await verifyLinkMeAccess();
 */
export const verifyLinkMeAccess = cache(
  async (redirectTo: string = '/login') => {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect(redirectTo);
    }

    // Vérifier le rôle LinkMe dans user_app_roles
    const { data: roleData, error: roleError } = await supabase
      .from('user_app_roles')
      .select(
        'id, user_id, app, role, enseigne_id, organisation_id, is_active, created_at'
      )
      .eq('user_id', user.id)
      .eq('app', 'linkme')
      .eq('is_active', true)
      .single();

    if (roleError || !roleData) {
      // Pas d'accès à LinkMe
      redirect(redirectTo);
    }

    return {
      isAuth: true as const,
      user,
      role: roleData,
    };
  }
);
