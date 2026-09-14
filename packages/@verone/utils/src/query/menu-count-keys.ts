/**
 * Clés de cache des compteurs du menu de gauche et des listes de l'en-tête.
 *
 * Source unique : les hooks de `@verone/notifications` lisent ces clés, les
 * mutations métier les invalident après une écriture réussie. Les tables
 * comptées (consultations, transactions, formulaires, demandes d'info) ne sont
 * pas publiées en temps réel et les produits en sourcing échappent au canal
 * `products` (filtré sur `active`) : sans invalidation, la pastille attendrait
 * le retour sur l'onglet.
 */

export const MENU_COUNT_QUERY_KEYS = {
  sidebar: ['notifications', 'sidebar_counts'],
  consultations: ['consultations', 'count'],
  bankTransactions: ['bank_transactions', 'unreconciled_count'],
  formSubmissions: ['form_submissions', 'new_count'],
  linkmeInfoRequests: ['linkme_info_requests', 'pending_count'],
} as const;

/** Domaine métier dont une écriture peut changer une pastille. */
export type MenuCountDomain =
  | 'sourcing'
  | 'consultations'
  | 'bankTransactions'
  | 'formSubmissions'
  | 'linkmeInfoRequests';

/** Partie de `QueryClient` utilisée ici (utils ne dépend pas de TanStack Query). */
export interface MenuCountInvalidator {
  invalidateQueries(filters: { queryKey: readonly unknown[] }): Promise<void>;
}

/**
 * Clés à invalider pour les domaines donnés : toujours l'agrégat du menu,
 * plus le compteur individuel du domaine quand il existe (le sourcing n'est
 * compté que dans l'agrégat).
 */
export function menuCountKeysFor(
  domains: readonly MenuCountDomain[]
): (readonly string[])[] {
  const keys: (readonly string[])[] = [MENU_COUNT_QUERY_KEYS.sidebar];
  for (const domain of domains) {
    if (domain === 'sourcing') continue;
    const key = MENU_COUNT_QUERY_KEYS[domain];
    if (!keys.includes(key)) keys.push(key);
  }
  return keys;
}

/** À appeler après une écriture réussie qui peut changer une pastille. */
export async function invalidateMenuCounts(
  queryClient: MenuCountInvalidator,
  ...domains: MenuCountDomain[]
): Promise<void> {
  await Promise.all(
    menuCountKeysFor(domains).map(queryKey =>
      queryClient.invalidateQueries({ queryKey })
    )
  );
}
