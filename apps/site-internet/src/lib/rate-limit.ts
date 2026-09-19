/**
 * Limitation de débit en mémoire, par clé (en pratique : par adresse IP).
 *
 * Portée honnête : la mémoire est celle d'une instance serveur. Sur Vercel,
 * plusieurs instances peuvent coexister, donc la limite réelle est un multiple
 * de celle configurée. C'est volontaire : ça arrête un formulaire public rempli
 * en boucle sans ajouter de dépendance externe (Redis) ni d'écriture en base.
 * Le jour où il faudra une limite stricte partagée, ce module est le seul
 * endroit à remplacer.
 *
 * Fenêtre glissante : on garde les horodatages des tentatives récentes et on
 * refuse dès que leur nombre dépasse la limite sur la fenêtre.
 *
 * Sprint SI-CHECKOUT-PRICE-001 — 2026-09-19
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Secondes à attendre avant une nouvelle tentative (0 si autorisé). */
  retryAfterSeconds: number;
}

export interface RateLimiterOptions {
  /** Nombre de tentatives autorisées sur la fenêtre. */
  limit: number;
  /** Largeur de la fenêtre, en millisecondes. */
  windowMs: number;
  /** Garde-fou mémoire : au-delà, les clés les plus anciennes sont oubliées. */
  maxKeys?: number;
}

export interface RateLimiter {
  check: (key: string, now?: number) => RateLimitResult;
}

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
}: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, number[]>();

  function check(key: string, now: number = Date.now()): RateLimitResult {
    const windowStart = now - windowMs;
    const recent = (hits.get(key) ?? []).filter(time => time > windowStart);

    if (recent.length >= limit) {
      const oldest = recent[0] ?? now;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + windowMs - now) / 1000)
      );
      hits.set(key, recent);
      return { allowed: false, retryAfterSeconds };
    }

    recent.push(now);
    hits.set(key, recent);

    // Ménage : on ne laisse pas la table grossir indéfiniment.
    if (hits.size > maxKeys) {
      for (const [otherKey, times] of hits) {
        if (otherKey === key) continue;
        const last = times[times.length - 1] ?? 0;
        if (last <= windowStart) hits.delete(otherKey);
        if (hits.size <= maxKeys) break;
      }
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { check };
}

/**
 * Adresse de l'appelant telle que la passe l'hébergeur.
 * `x-forwarded-for` peut contenir une chaîne de relais : la première entrée
 * est le client d'origine.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() ?? 'inconnue';
}
