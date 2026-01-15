'use client';

/**
 * SentryUserContext - Enrichissement du contexte Sentry avec données utilisateur
 *
 * Synchronise automatiquement les informations utilisateur avec Sentry:
 * - User ID (RGPD-safe: pas d'email)
 * - Organisation ID (pour filtrage)
 * - Rôle LinkMe (pour triage)
 * - Tags pour recherche/alertes
 *
 * @module SentryUserContext
 * @since 2026-01-15
 */

import { useEffect } from 'react';

import * as Sentry from '@sentry/nextjs';

import { useAuth } from '../contexts/AuthContext';

export function SentryUserContext({ children }: { children: React.ReactNode }) {
  const { user, linkMeRole } = useAuth();

  useEffect(() => {
    if (user && linkMeRole) {
      // ✅ RGPD: Utiliser uniquement l'ID (pas d'email ni nom)
      Sentry.setUser({
        id: user.id,
      });

      // Contexte additionnel pour debug (non-PII)
      Sentry.setContext('linkme', {
        organisation_id: linkMeRole.organisation_id,
        enseigne_id: linkMeRole.enseigne_id,
        role_name: linkMeRole.role,
        app: 'linkme',
      });

      // Tags pour filtrage/alertes (non-PII)
      Sentry.setTag('app', 'linkme');
      Sentry.setTag('role', linkMeRole.role);
      if (linkMeRole.organisation_id) {
        Sentry.setTag('organisation_id', linkMeRole.organisation_id);
      }
      if (linkMeRole.enseigne_id) {
        Sentry.setTag('enseigne_id', linkMeRole.enseigne_id);
      }
    } else {
      // Reset si déconnecté
      Sentry.setUser(null);
      Sentry.setContext('linkme', null);
    }
  }, [user, linkMeRole]);

  return <>{children}</>;
}
