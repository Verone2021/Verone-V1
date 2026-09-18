'use client';

/**
 * Fournisseur PostHog — back-office.
 *
 * Monte le plus haut possible dans `app/layout.tsx`, au-dessus de tous les
 * autres fournisseurs : une erreur nee dans l'un d'eux doit encore pouvoir
 * etre remontee.
 *
 * Sans cle, ce composant ne fait rien du tout et rend ses enfants tels quels.
 *
 * @since 2026-09-18 - [BO-OBS-001]
 */

import { useEffect, useRef } from 'react';

import posthog from 'posthog-js';

import { createClient } from '@verone/utils/supabase/client';

import {
  buildPosthogConfig,
  getPosthogKey,
  shouldInitPosthog,
} from '@/lib/observability/posthog';

/**
 * Identifie l'utilisateur par son identifiant Supabase et son role.
 * JAMAIS par son e-mail : un rejeu ne doit pas permettre de lire qui travaille
 * sur quel dossier client.
 */
async function identifyCurrentUser(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: role } = await supabase
    .from('user_app_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('app', 'back-office')
    .eq('is_active', true)
    .maybeSingle();

  posthog.identify(user.id, {
    app: 'back-office',
    role: role?.role ?? 'inconnu',
  });
}

export function PosthogProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const started = useRef(false);

  useEffect(() => {
    // `reactStrictMode` monte les effets deux fois en developpement.
    if (started.current || !shouldInitPosthog()) return;
    started.current = true;

    const key = getPosthogKey();
    if (!key) return;

    posthog.init(key, buildPosthogConfig({ app: 'back-office' }));

    void identifyCurrentUser().catch(error => {
      console.error('[PostHog] identification impossible:', error);
    });
  }, []);

  return <>{children}</>;
}
