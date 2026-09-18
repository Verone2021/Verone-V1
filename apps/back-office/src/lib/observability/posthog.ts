/**
 * Observabilite navigateur — reglages PostHog partages.
 *
 * Pourquoi ce fichier existe : le 17-18/09/2026, une collaboratrice est restee
 * bloquee sur l'ecran « Erreur systeme Verone », sans issue. Les journaux
 * Supabase prouvent que toutes ses requetes repondaient 200 : le plantage est
 * ne dans son navigateur, et rien ne le capturait. Deux heures d'enquete pour
 * finir sur une hypothese.
 *
 * Deux principes non negociables :
 *   1. sans cle, RIEN ne demarre — ni en local, ni dans les controles
 *      automatiques, ni en preproduction ;
 *   2. le rejeu de session sert a voir un plantage, pas a lire la fiche d'un
 *      client : toutes les saisies sont masquees, et tout texte qui ressemble a
 *      un e-mail, un telephone, une adresse ou un montant est remplace.
 *
 * @since 2026-09-18 - [BO-OBS-001]
 */

import type { PostHog, PostHogConfig } from 'posthog-js';

/** Hebergement europeen impose : les rejeus contiennent des donnees de clients francais. */
const DEFAULT_HOST = 'https://eu.i.posthog.com';

export function getPosthogKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  return key && key.length > 0 ? key : undefined;
}

export function getPosthogHost(): string {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  return host && host.length > 0 ? host : DEFAULT_HOST;
}

/**
 * On n'envoie rien depuis un poste de developpement ni depuis la CI.
 * Exigence, pas effet de bord : une erreur locale ne doit pas polluer les
 * vraies erreurs des utilisateurs.
 */
export function shouldInitPosthog(): boolean {
  return process.env.NODE_ENV === 'production' && getPosthogKey() !== undefined;
}

/**
 * Motifs consideres comme donnee personnelle dans un rejeu.
 * Volontairement large : en cas de doute, on masque.
 */
const SENSITIVE_PATTERNS: readonly RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.]+/, // e-mail
  /(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/, // telephone francais
  /\b\d{1,4}\s+(?:rue|avenue|av\.|boulevard|bd|impasse|chemin|allee|allée|place|route)\b/i, // adresse
  /\b\d{5}\b\s+[A-Za-zÀ-ÿ]/, // code postal suivi d'une ville
  /\d[\d\s.,]*\s?(?:€|EUR)/i, // montant
  /\b(?:FR\d{2}|IBAN)[\dA-Z\s]{10,}/i, // IBAN
];

/** Vrai si ce texte ne doit jamais apparaitre en clair dans un rejeu. */
export function isSensitiveText(text: string): boolean {
  if (text.length === 0) return false;
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
}

const MASK = '•••';

/**
 * Version de l'application, pour pouvoir dire « cette erreur date de la mise en
 * ligne de 13 h 45 ». Injectee au build depuis VERCEL_GIT_COMMIT_SHA
 * (cf. next.config.js), sinon « local ».
 */
export function getAppVersion(): string {
  const sha = process.env.NEXT_PUBLIC_APP_VERSION;
  return sha && sha.length > 0 ? sha.slice(0, 7) : 'local';
}

export interface IPosthogAppContext {
  /** Nom de l'application, pour distinguer les evenements dans un projet unique. */
  app: 'back-office' | 'linkme';
}

export function buildPosthogConfig({
  app,
}: IPosthogAppContext): Partial<PostHogConfig> {
  return {
    api_host: getPosthogHost(),
    ui_host: 'https://eu.posthog.com',

    // On ne suit pas les parcours : on cherche des plantages.
    autocapture: false,
    capture_pageview: false,
    person_profiles: 'identified_only',

    // Exceptions non rattrapees ET rejets de promesse non geres.
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: true,
    },

    // Aucun enregistrement permanent : le rejeu ne demarre QUE sur erreur,
    // via startSessionReplayOnError() ci-dessous.
    disable_session_recording: true,

    // Console et requetes reseau dans le rejeu, corps des requetes EXCLUS.
    enable_recording_console_log: true,
    capture_performance: { network_timing: true },

    session_recording: {
      maskAllInputs: true,
      maskTextFn: (text: string) => (isSensitiveText(text) ? MASK : text),
      recordHeaders: true,
      recordBody: false,
    },

    // Version attachee a chaque evenement.
    sanitize_properties: properties => ({
      ...properties,
      app,
      app_version: getAppVersion(),
    }),
  };
}

/**
 * Demarre le rejeu au moment ou une erreur survient, puis remonte l'erreur.
 * Idempotent : PostHog ignore un second demarrage.
 */
export function reportErrorToPosthog(
  client: PostHog,
  error: unknown,
  context: Record<string, unknown> = {}
): void {
  try {
    client.startSessionRecording();
    client.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { ...context, app_version: getAppVersion() }
    );
  } catch {
    // L'observabilite ne casse jamais l'application qu'elle observe.
  }
}
