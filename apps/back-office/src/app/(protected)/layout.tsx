/**
 * Protected Layout — Back-Office (Mur Porteur)
 *
 * Verifie l'authentification ET le role back-office AVANT de render.
 * Tourne en Node.js complet sur Vercel (pas Edge Runtime).
 *
 * Verification en 2 etapes :
 * 1. getUser() — valide le JWT avec le serveur Supabase
 * 2. user_app_roles — verifie role actif pour back-office
 *
 * Si refus : signOut + redirect vers /login?error=no_access
 */
import { redirect } from 'next/navigation';

import { createServerClient } from '@verone/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  // Etape 1 : Verifier l'authentification (getUser, pas getSession)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Etape 2 : Verifier le role back-office dans user_app_roles
  const { data: role } = await supabase
    .from('user_app_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('app', 'back-office')
    .eq('is_active', true)
    .maybeSingle();

  if (!role) {
    await supabase.auth.signOut();
    redirect('/login?error=no_access');
  }

  return <>{children}</>;
}
