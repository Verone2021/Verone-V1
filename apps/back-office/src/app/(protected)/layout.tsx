/**
 * 🔐 Protected Layout - Server-side Auth Protection
 *
 * Route group layout qui vérifie l'authentification côté serveur
 * AVANT de render les pages enfants.
 *
 * Pattern Next.js 15 App Router recommandé pour sécuriser des routes.
 *
 * Fonctionnement:
 * - Toutes les routes dans (protected)/ nécessitent une session valide
 * - Vérification serveur = pas de flash de contenu non-authentifié
 * - Redirection automatique vers /login si pas de session
 *
 * Routes protégées:
 * - /dashboard
 * - /ventes
 * - /consultations
 * - /factures
 * - /tresorerie
 * - /livraisons
 * - etc.
 *
 * Ref: https://nextjs.org/docs/app/building-your-application/routing/route-groups
 * Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { redirect } from 'next/navigation';

import { createServerClient } from '@verone/utils/supabase/server';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Pas de session = redirection vers login
  if (!session) {
    redirect('/login');
  }

  // Session valide = render la page demandée
  return <>{children}</>;
}
