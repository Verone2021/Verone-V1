/**
 * Protections anti-spam des formulaires publics LinkMe.
 *
 * Deux garde-fous sans friction pour le visiteur (pas de captcha) :
 * 1. Champ piège (« honeypot ») invisible : un humain ne le remplit jamais,
 *    un robot qui remplit tous les champs du DOM se trahit.
 * 2. Délai minimal entre l'affichage du formulaire et la soumission : un
 *    humain met plusieurs secondes à saisir ses coordonnées.
 *
 * Plus une limite d'envois par IP. Limite connue et assumée : le compteur vit
 * en mémoire d'instance, donc il n'est pas partagé entre les instances
 * serverless. C'est un frein aux rafales, pas une barrière absolue.
 *
 * @module lib/anti-spam
 * @since 2026-07-22 - LM-SEC-ANTISPAM-001
 */

import { z } from 'zod';

/** Délai minimal (ms) entre affichage du formulaire et soumission. */
const MIN_FILL_DURATION_MS = 3_000;

/** Fenêtre et quota de la limite d'envois par IP. */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;

/**
 * Champs anti-spam ajoutés à tout schéma de formulaire public.
 * `company` est le champ piège, `formLoadedAt` l'horodatage d'affichage.
 */
export const antiSpamSchemaShape = {
  company: z.string().max(200).optional(),
  formLoadedAt: z.number().int().nonnegative().optional(),
};

export interface IAntiSpamSignals {
  company?: string;
  formLoadedAt?: number;
}

/**
 * Vrai si la soumission porte les marques d'un robot : champ piège rempli,
 * ou formulaire envoyé trop vite après son affichage.
 */
export function isLikelyBot(signals: IAntiSpamSignals): boolean {
  if (signals.company != null && signals.company.trim() !== '') return true;

  if (signals.formLoadedAt != null) {
    const elapsed = Date.now() - signals.formLoadedAt;
    // Horodatage incohérent (dans le futur) ou saisie trop rapide.
    if (elapsed < MIN_FILL_DURATION_MS) return true;
  }

  return false;
}

/** Historique des soumissions par IP, propre à l'instance serveur. */
const submissionsByIp = new Map<string, number[]>();

/** Extrait l'IP appelante des en-têtes de la requête. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Enregistre une soumission et indique si l'IP dépasse le quota.
 * Retourne `true` quand la requête doit être refusée.
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submissionsByIp.get(ip) ?? []).filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recent.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
    submissionsByIp.set(ip, recent);
    return true;
  }

  recent.push(now);
  submissionsByIp.set(ip, recent);

  // Purge opportuniste des IP inactives pour borner la mémoire.
  if (submissionsByIp.size > 5_000) {
    for (const [key, timestamps] of submissionsByIp) {
      if (
        timestamps.every(timestamp => now - timestamp >= RATE_LIMIT_WINDOW_MS)
      )
        submissionsByIp.delete(key);
    }
  }

  return false;
}
