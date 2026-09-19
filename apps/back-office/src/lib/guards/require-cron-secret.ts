/**
 * 🔐 Garde des appels machine : tâches planifiées Vercel et appels internes
 *
 * Règle absolue (`.claude/rules/api-guards.md`) : **variable absente = la route
 * refuse.** Une garde qui se désactive parce qu'une variable d'environnement
 * manque n'est pas une garde — c'est une porte qui s'ouvre toute seule le jour
 * où quelqu'un renomme un réglage.
 *
 * Le secret voyage en en-tête `Authorization: Bearer <CRON_SECRET>`, jamais
 * dans l'adresse : une adresse finit dans les journaux du serveur, l'historique
 * du navigateur et l'en-tête `Referer`.
 *
 * Sprint BO-SEC-MW-001 — 2026-09-19
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** En-tête à poser sur un appel interne d'une route vers une autre. */
export function cronAuthHeader(): Record<string, string> {
  const secret = process.env.CRON_SECRET;
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}

/**
 * Vrai uniquement si l'appelant présente le secret des tâches planifiées.
 * Faux si le secret n'est pas configuré : pas de dégradation possible.
 */
export function isCronCall(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

/**
 * Garde stricte pour une route appelée **uniquement** par une tâche planifiée.
 * Renvoie `null` si l'appel est légitime, une réponse 401/503 sinon.
 */
export function requireCronSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error(
      '[requireCronSecret] CRON_SECRET absent — la route refuse par sécurité'
    );
    return NextResponse.json(
      { success: false, error: 'Tache planifiee non configuree' },
      { status: 503 }
    );
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Garde d'une route appelée **soit** depuis un écran du back-office, **soit**
 * par une tâche planifiée (cas des synchronisations déclenchables à la main
 * comme automatiquement).
 *
 * Renvoie `null` si l'appel est légitime, une réponse 401/403 sinon.
 */
export async function requireBackofficeAdminOrCron(
  request: NextRequest
): Promise<NextResponse | null> {
  if (isCronCall(request)) return null;

  const { requireBackofficeAdmin } = await import('./require-backoffice-admin');
  const guardResult = await requireBackofficeAdmin(request);
  return guardResult instanceof NextResponse ? guardResult : null;
}
