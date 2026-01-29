/**
 * 🔐 Protected Layout - Server-side Auth Protection
 *
 * Route group layout qui vérifie l'authentification côté serveur
 * AVANT de render les pages enfants.
 *
 * IMPORTANT (Best Practices 2025):
 * ================================
 * - Utilise getUser() PAS getSession() pour la sécurité
 * - getUser() valide le JWT avec le serveur Supabase
 * - getSession() lit seulement le cookie (peut être falsifié)
 *
 * ⚠️ LIMITATION: Les layouts ne re-render pas sur navigation client-side
 * Pour une protection complète, utiliser aussi:
 * - Le Data Access Layer (dal.ts) dans les pages
 * - RLS Supabase pour la protection des données
 *
 * Ref: https://nextjs.org/docs/app/guides/authentication
 * Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * @updated 2026-01-29 - Migration getSession → getUser
 */

import { redirect } from 'next/navigation';

import { createServerClient } from '@verone/utils/supabase/server';

// Force dynamic rendering for all protected routes
// Prevents build-time errors when auth check fails (no session at build time)
export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  // IMPORTANT: Utiliser getUser() pas getSession()
  // getUser() valide le JWT avec le serveur Supabase
  // getSession() lit seulement le cookie (peut être falsifié)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Pas d'utilisateur ou erreur = redirection vers login
  if (error || !user) {
    redirect('/login');
  }

  // Utilisateur authentifié = render la page demandée
  return <>{children}</>;
}
