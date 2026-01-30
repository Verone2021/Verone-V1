'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';

/**
 * Server Action pour authentification LinkMe
 *
 * Pattern Server-Side Auth (Next.js 15 + Supabase best practice)
 * - Pas de race condition client/server cookies
 * - RLS queries côté server (plus fiable)
 * - Redirect atomique server-side
 */
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectUrl = (formData.get('redirect') as string) || '/dashboard';

  if (!email || !password) {
    return { error: 'Email et mot de passe requis' };
  }

  const supabase = await createServerClient();

  // 1. Authentification Supabase
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!data.user) {
    return { error: 'Utilisateur non trouvé' };
  }

  // 2. Vérifier accès LinkMe (server-side, pas de problème RLS)
  const { data: roleData, error: roleError } = await supabase
    .from('user_app_roles')
    .select('id, role, enseigne_id, organisation_id')
    .eq('user_id', data.user.id)
    .eq('app', 'linkme')
    .eq('is_active', true)
    .single();

  if (roleError || !roleData) {
    // User n'a pas accès à LinkMe → déconnecter
    await supabase.auth.signOut();
    return {
      error: "Vous n'avez pas accès à LinkMe. Contactez votre administrateur.",
    };
  }

  // 3. Redirect server-side (atomique, pas de race condition)
  redirect(redirectUrl);
}
