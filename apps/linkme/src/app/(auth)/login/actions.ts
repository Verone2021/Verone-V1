'use server';

import { createServerClient } from '@/lib/supabase-server';

type LoginState =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string }
  | null;

/**
 * Server Action pour authentification LinkMe
 *
 * Pattern Server-Side Auth (Next.js 15 + Supabase best practice)
 * - Pas de race condition client/server cookies
 * - RLS queries côté server (plus fiable)
 * - Redirect client-side après succès
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectUrl = (formData.get('redirect') as string) || '/dashboard';

  if (!email || !password) {
    return { ok: false, error: 'Email et mot de passe requis' };
  }

  const supabase = await createServerClient();

  // 1. Authentification Supabase
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { ok: false, error: authError.message };
  }

  if (!data.user) {
    return { ok: false, error: 'Utilisateur non trouvé' };
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
      ok: false,
      error: "Vous n'avez pas accès à LinkMe. Contactez votre administrateur.",
    };
  }

  // 3. Succès - retourner state pour redirect client-side
  return { ok: true, redirectTo: redirectUrl };
}
