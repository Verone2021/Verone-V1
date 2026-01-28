'use client';

/**
 * Hook: useEnseigneId
 *
 * Récupère l'enseigne_id depuis le context AuthContext.
 * Utile pour les queries qui nécessitent l'enseigne_id (ex: organisation mère).
 *
 * @module useEnseigneId
 * @since 2026-01-15 (LM-ORD-009)
 */

import { useAuth } from '@/contexts/AuthContext';

/**
 * Récupère l'enseigne_id de l'affilié connecté
 *
 * @returns {string | null} L'enseigne_id ou null si non disponible
 *
 * @example
 * ```tsx
 * const enseigneId = useEnseigneId();
 * const { data: parentOrg } = useEnseigneParentOrganisation(enseigneId);
 * ```
 */
export function useEnseigneId(): string | null {
  const { linkMeRole } = useAuth();
  return linkMeRole?.enseigne_id ?? null;
}

export default useEnseigneId;
