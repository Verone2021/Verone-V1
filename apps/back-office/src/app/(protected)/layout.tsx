/**
 * Protected Layout — Back-Office
 *
 * Verifie l'authentification ET le role back-office cote serveur.
 * Base sur le pattern f352e5f3 (prouve fonctionnel) + verification role.
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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Verification role back-office (ajout par rapport a f352e5f3)
  const { data: role } = await supabase
    .from('user_app_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('app', 'back-office')
    .eq('is_active', true)
    .maybeSingle();

  if (!role) {
    // PAS de signOut() ici — modifier les cookies pendant le render serveur
    // peut causer des mismatches d'hydration. Simple redirect suffit.
    redirect('/login');
  }

  return <>{children}</>;
}
