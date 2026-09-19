/**
 * Liste blanche des routes `/api/*` joignables sans session back-office.
 *
 * Isolée du middleware pour être **testable** : `__tests__/public-api-routes.test.ts`
 * parcourt les fichiers de routes réels du dépôt et vérifie que l'ensemble des
 * portes ouvertes est exactement celui-ci. Ajouter une route la ferme par
 * défaut ; l'ouvrir demande de toucher ce fichier, donc de le justifier.
 *
 * ⚠️ Ce module est importé par `src/middleware.ts` (runtime Edge) : il ne doit
 * contenir que du JavaScript pur — aucun import `@verone/*`, `next/headers`,
 * `node:*` ni accès réseau.
 *
 * Sprint BO-SEC-MW-001 — 2026-09-19
 */

export interface PublicApiRoute {
  pattern: RegExp;
  /** Qui appelle cette route, et avec quelle serrure à elle. */
  justification: string;
}

export const PUBLIC_API_ROUTES: PublicApiRoute[] = [
  {
    pattern: /^\/api\/csp-report$/,
    justification:
      'Le navigateur lui-même, quand la politique de sécurité de contenu est ' +
      'violée. Aucune authentification possible par nature.',
  },
  {
    pattern: /^\/api\/health$/,
    justification:
      'Surveillance de disponibilité. Ne renvoie aucune donnée métier.',
  },
  {
    pattern: /^\/api\/cron\//,
    justification:
      'Tâches planifiées Vercel. Serrure propre : CRON_SECRET en en-tête, ' +
      'obligatoire (variable absente = la route refuse).',
  },
  {
    pattern: /^\/api\/gmail\/watch\/refresh$/,
    justification:
      'Tâche planifiée Vercel (renouvellement de la surveillance Gmail). ' +
      'Serrure propre : CRON_SECRET obligatoire.',
  },
  {
    pattern: /^\/api\/gmail\/inbound$/,
    justification:
      'Google Pub/Sub pousse les nouveaux messages. Serrure propre : jeton ' +
      'partagé, obligatoire. Pub/Sub n’accepte pas d’en-tête personnalisé sur ' +
      'un abonnement push, d’où le jeton encore accepté dans l’adresse.',
  },
  {
    pattern: /^\/api\/webhooks\/packlink$/,
    justification:
      'Packlink pousse les changements d’expédition. Serrure propre : secret ' +
      'partagé — NON configuré en production au 19/09, décision Roméo en attente.',
  },
  {
    pattern: /^\/api\/emails\/linkme-info-completed$/,
    justification:
      'Notification serveur à serveur envoyée par l’application LinkMe. ' +
      'Destinataire FIXE et interne (backoffice@verone.fr), aucun paramètre ' +
      'd’adresse : pas un relais d’envoi exploitable. À passer sous secret ' +
      'partagé quand la variable pourra être ajoutée aux deux projets Vercel.',
  },
];

/** Vrai si le chemin est joignable sans session back-office. */
export function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => route.pattern.test(pathname));
}
