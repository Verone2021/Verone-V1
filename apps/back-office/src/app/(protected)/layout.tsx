/**
 * Protected Layout — Back-Office
 *
 * Ceinture cote serveur : authentification + role back-office.
 * Base sur le pattern f352e5f3 (prouve fonctionnel) + verification role.
 *
 * 2026-09-18 — Ce layout reste le garde-fou cote serveur. Un middleware a ete
 * essaye pour rafraichir la session en amont : le serveur de production refuse
 * de charger son module (« Cannot read properties of undefined (reading
 * 'default') », toutes les pages en 500 sur la sortie autonome). Faute de
 * pouvoir le verifier en conditions reelles, il n'a pas ete livre ; le reveil
 * de session se fait cote navigateur (`auth-wrapper.tsx`).
 *
 * Ce qu'on a corrige : la version precedente jetait une exception
 * quand la lecture du role echouait, en pensant que `(protected)/error.tsx`
 * l'attraperait. Ce n'est pas le cas — un `error.tsx` n'attrape pas les erreurs
 * du `layout.tsx` de son propre segment. L'exception tombait dans
 * `global-error.tsx` (« Erreur systeme Verone ») et « Reessayer » rejouait le
 * meme plantage : des collaborateurs se sont retrouves dehors, sans issue.
 *
 * Regle desormais : un echec de lecture renvoie vers la page de connexion avec
 * un motif affichable, jamais vers un ecran sans sortie.
 */
import { redirect } from 'next/navigation';

import { createServerClient } from '@verone/utils/supabase/server';

export const dynamic = 'force-dynamic';

/** Pause courte entre deux tentatives, pour laisser passer un incident reseau. */
const RETRY_DELAY_MS = 250;

/**
 * Un echec est "passager" quand il ne dit rien sur la validite de la session :
 * coupure reseau (pas de statut HTTP), surcharge (429) ou panne serveur (5xx).
 * Un jeton expire ou revoque, lui, repond 401/403 : ce n'est pas passager.
 */
function isTransientFailure(status: number | undefined): boolean {
  if (status === undefined) return true;
  return status === 408 || status === 429 || status >= 500;
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  let { data: userData, error: userError } = await supabase.auth.getUser();

  if (!userData.user && isTransientFailure(userError?.status)) {
    await wait(RETRY_DELAY_MS);
    ({ data: userData, error: userError } = await supabase.auth.getUser());
  }

  const user = userData.user;

  if (userError || !user) {
    redirect('/login?erreur=session');
  }

  // Verification role back-office (ajout par rapport a f352e5f3)
  let { data: role, error: roleError } = await supabase
    .from('user_app_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('app', 'back-office')
    .eq('is_active', true)
    .maybeSingle();

  if (roleError) {
    await wait(RETRY_DELAY_MS);
    ({ data: role, error: roleError } = await supabase
      .from('user_app_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('app', 'back-office')
      .eq('is_active', true)
      .maybeSingle());
  }

  if (roleError) {
    // La session est valide : c'est la lecture du role qui a echoue deux fois.
    // On trace de quoi retrouver la cause dans les journaux, et on renvoie vers
    // la connexion avec un motif — surtout pas vers un ecran sans issue.
    console.error(
      `[back-office/(protected)] Lecture du role impossible pour ${user.id} (${roleError.code ?? 'sans code'}): ${roleError.message}`
    );
    redirect('/login?erreur=role');
  }

  if (!role) {
    // Session valide, mais pas de role back-office actif : ce n'est pas un
    // probleme de connexion, inutile de renvoyer vers /login (l'utilisateur se
    // reconnecterait en boucle sans jamais comprendre).
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
