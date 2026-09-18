/**
 * Fermeture provisoire du site public.
 *
 * Interrupteur : variable d'environnement `SITE_MAINTENANCE=1`.
 * Absente ou differente de '1' → le site se comporte exactement comme avant.
 *
 * La reponse est emise depuis le middleware, pas depuis une page, pour garantir
 * un vrai code HTTP 503. Google traite un 503 comme une indisponibilite
 * temporaire et conserve l'indexation ; une page d'attente renvoyee en 200
 * ferait desindexer le site.
 *
 * @since 2026-09-18 - [SI-MAINT-001] decision Romeo : fermeture le temps
 *   des corrections de securite (les portes API du back-office et la
 *   revalidation du prix au paiement).
 */

/** Chemins qui continuent de repondre normalement pendant la fermeture. */
const EXEMPT_PREFIXES = [
  // Paiements deja engages : couper ce webhook perdrait des commandes payees.
  '/api/webhooks/stripe',
  // Taches planifiees Vercel (paniers abandonnes, primes ambassadeurs...).
  '/api/cron/',
  // Sonde de disponibilite.
  '/api/health',
] as const;

export function isMaintenanceMode(): boolean {
  return process.env.SITE_MAINTENANCE === '1';
}

export function isMaintenanceExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

const CONTACT_EMAIL = 'contact@veronecollections.fr';

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Vérone — nous revenons très vite</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #ffffff;
        color: #111111;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        line-height: 1.6;
      }
      main { max-width: 32rem; text-align: center; }
      h1 {
        margin: 0 0 1.5rem;
        font-size: 1.75rem;
        font-weight: 400;
        letter-spacing: 0.35em;
        text-transform: uppercase;
      }
      p { margin: 0 0 1rem; font-size: 1rem; color: #3f3f3f; }
      a { color: #111111; }
      .rule { width: 3rem; height: 1px; margin: 2rem auto; background: #d4d4d4; }
      @media (min-width: 768px) { h1 { font-size: 2.25rem; } }
    </style>
  </head>
  <body>
    <main>
      <h1>Vérone</h1>
      <div class="rule"></div>
      <p>La boutique est momentanément fermée.</p>
      <p>Nous revenons très vite.</p>
      <p>
        Une question ?
        <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
      </p>
    </main>
  </body>
</html>
`;

/** Reponse servie a tout visiteur pendant la fermeture. */
export function maintenanceResponse(): Response {
  return new Response(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Indique aux moteurs de recherche que l'indisponibilite est temporaire.
      'retry-after': '3600',
      'cache-control': 'no-store, must-revalidate',
    },
  });
}
