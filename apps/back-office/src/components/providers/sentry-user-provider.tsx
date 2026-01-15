'use client';

/**
 * SentryUserProvider - Enrichissement du contexte Sentry avec données utilisateur
 *
 * Synchronise automatiquement les informations utilisateur avec Sentry:
 * - User ID (RGPD-safe: pas d'email)
 * - Tags pour recherche/alertes
 *
 * @module SentryUserProvider
 * @since 2026-01-15
 */

import { useEffect, useState } from 'react';

import type { User } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';

import { useSupabase } from './supabase-provider';

export function SentryUserProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Obtenir la session courante
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (user) {
      // ✅ RGPD: Utiliser uniquement l'ID (pas d'email ni nom)
      Sentry.setUser({
        id: user.id,
      });

      // Contexte additionnel pour debug (non-PII)
      Sentry.setContext('back-office', {
        app: 'back-office',
      });

      // Tags pour filtrage/alertes (non-PII)
      Sentry.setTag('app', 'back-office');
    } else {
      // Reset si déconnecté
      Sentry.setUser(null);
      Sentry.setContext('back-office', null);
    }
  }, [user]);

  return <>{children}</>;
}
