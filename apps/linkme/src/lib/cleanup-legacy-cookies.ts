/**
 * Nettoyage des cookies d'authentification obsolètes
 *
 * Supprime les anciens cookies `sb-linkme-auth-*` qui peuvent causer
 * des conflits avec les nouveaux cookies standards `sb-{PROJECT_ID}-auth-token`.
 *
 * Race condition : Si les deux types de cookies existent, le browser peut
 * essayer de refresh avec les deux → erreur "Invalid Refresh Token"
 *
 * @module cleanup-legacy-cookies
 * @since 2026-01-24
 */

/**
 * Nettoie les cookies d'auth obsolètes (ancienne implémentation)
 * À exécuter une fois au démarrage de l'app
 */
export function cleanupLegacyCookies(): void {
  if (typeof document === 'undefined') return;

  const allCookies = document.cookie.split(';');

  for (const cookie of allCookies) {
    const cookieName = cookie.split('=')[0].trim();

    // Supprimer ancien prefix custom
    if (cookieName.startsWith('sb-linkme-auth')) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }
}
