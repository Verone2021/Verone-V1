/**
 * Protected Layout — Back-Office
 *
 * Verifie l'authentification ET le role back-office cote serveur.
 * Base sur le pattern f352e5f3 (prouve fonctionnel) + verification role.
 *
 * 2026-09-17 — Robustesse : ce layout est `force-dynamic`, donc il se rejoue
 * cote serveur a CHAQUE navigation et a chaque rafraichissement declenche par
 * un ecran. Avant, la moindre erreur de `getUser()` — y compris un simple
 * "Failed to fetch" ou un 503 passager de Supabase — renvoyait vers la page de
 * connexion : l'utilisateur etait deconnecte sans que sa session soit invalide
 * (symptome rapporte par Romeo en ajoutant un produit a une consultation).
 * On distingue desormais "session invalide" (on renvoie vers /login, inchange)
 * de "echec passager" (on retente une fois, puis on echoue de facon fermee).
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
    redirect('/login');
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
    // La session est valide : la lecture du role a echoue, pas l'authentification.
    // On laisse remonter vers `error.tsx` (ecran "Reessayer") au lieu de
    // deconnecter quelqu'un qui a parfaitement le droit d'etre la.
    throw new Error(
      `Verification du role back-office indisponible: ${roleError.message}`
    );
  }

  if (!role) {
    // PAS de signOut() ici — modifier les cookies pendant le render serveur
    // peut causer des mismatches d'hydration. Simple redirect suffit.
    redirect('/login');
  }

  return <>{children}</>;
}
