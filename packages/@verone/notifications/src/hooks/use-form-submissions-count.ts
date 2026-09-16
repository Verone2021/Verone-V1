/**
 * Hook Form Submissions Count - Vérone Back Office
 * Formulaires de contact non traités (status = new).
 *
 * Valeur lue dans l'appel unique du menu (`get_sidebar_counts`, champ
 * `formSubmissions`) : aucune requête propre. `form_submissions` n'est pas
 * publiée en temps réel — les écritures passent par `invalidateMenuCounts`.
 */

'use client';

import type { MenuCountHook } from './use-menu-count';
import { useMenuCount } from './use-menu-count';

export type FormSubmissionsCountHook = MenuCountHook;

/**
 * Hook pour compter les formulaires reçus non traités.
 *
 * @param options.enableRealtime  @deprecated ignoré — form_submissions non publiée
 * @param options.refetchInterval @deprecated ignoré — TanStack Query gère le cache
 */
export function useFormSubmissionsCount(_options?: {
  /** @deprecated ignoré */
  enableRealtime?: boolean;
  /** @deprecated ignoré */
  refetchInterval?: number;
}): FormSubmissionsCountHook {
  return useMenuCount('formSubmissions');
}
