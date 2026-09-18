'use client';

/**
 * Fournisseur PostHog — LinkMe.
 *
 * Monte dans `app/layout.tsx`, autour de `{children}` : c'est le seul endroit
 * commun aux pages publiques et a l'espace affilie, ce layout ne montant aucun
 * autre fournisseur.
 *
 * Sans cle, ce composant ne fait rien du tout.
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

/** Identifiant Supabase + role, jamais l'e-mail. */
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
    .eq('app', 'linkme')
    .eq('is_active', true)
    .maybeSingle();

  posthog.identify(user.id, {
    app: 'linkme',
    role: role?.role ?? 'inconnu',
  });
}

export function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !shouldInitPosthog()) return;
    started.current = true;

    const key = getPosthogKey();
    if (!key) return;

    posthog.init(key, buildPosthogConfig({ app: 'linkme' }));

    void identifyCurrentUser().catch(error => {
      console.error('[PostHog] identification impossible:', error);
    });
  }, []);

  return <>{children}</>;
}
