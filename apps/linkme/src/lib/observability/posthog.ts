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
 * Elements qui contiennent de la DONNEE, par opposition a l'habillage de
 * l'interface. Tout texte a l'interieur est masque sans condition.
 *
 * Pourquoi c'est necessaire : aucune expression reguliere ne reconnait un NOM.
 * Constate en production le 2026-09-19 sur un rejeu de l'ecran Facturation :
 * « MONSIEUR LAURENT DANIEL LEJOSNE », « Pokawa Lille flandres », « MT Solutions »
 * etaient lisibles en clair. Le filtre par motif attrapait les montants, jamais
 * les noms.
 *
 * Le compromis : dans un outil de gestion, diagnostiquer un plantage demande de
 * voir QUEL ECRAN, QUELS BOUTONS, QUELLE NAVIGATION — pas le contenu des
 * tableaux. On masque donc la donnee et on garde l'habillage lisible.
 */
const DATA_SELECTORS = 'td, th, [data-posthog-mask]';

function isInsideDataCell(element?: HTMLElement): boolean {
  if (!element || typeof element.closest !== 'function') return false;
  try {
    return element.closest(DATA_SELECTORS) !== null;
  } catch {
    return false;
  }
}

/**
 * Decide si un texte doit etre masque dans un rejeu.
 * Separee de l'acces au DOM pour rester testable.
 */
export function shouldMaskText(text: string, insideDataCell: boolean): boolean {
  if (insideDataCell) return true;
  return isSensitiveText(text);
}

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

    // Aucun enregistrement permanent — mais le rejeu doit contenir CE QUI A
    // PRECEDE le plantage, pas seulement l'ecran fige apres coup.
    //
    // Le mecanisme : l'enregistreur tourne en memoire et garde une fenetre
    // glissante (une minute par defaut) SANS RIEN ENVOYER. Il ne persiste la
    // session que si le declencheur configure cote projet se produit —
    // ici l'evenement `$exception`.
    //
    // ⚠️ DEPENDANCE : ce reglage suppose que le declencheur sur `$exception`
    // est bien configure dans PostHog (Session replay → Recording conditions →
    // Event emitted). SANS LUI, PostHog enregistrerait TOUTES les sessions en
    // permanence, ce que Romeo a explicitement refuse.
    // Verification : Settings → Session replay → « Trigger summary » doit
    // afficher « Event triggers (1 event) ». Cf. .claude/local/OPERATIONS-RUNBOOK.md
    disable_session_recording: false,

    // Console et requetes reseau dans le rejeu, corps des requetes EXCLUS.
    enable_recording_console_log: true,
    capture_performance: { network_timing: true },

    session_recording: {
      maskAllInputs: true,

      // ⚠️ `maskTextSelector` est OBLIGATOIRE pour que `maskTextFn` serve a
      // quelque chose. La documentation de la bibliotheque est explicite :
      // « Session replay masks input values by default (see maskAllInputs),
      //   but it does not mask other DOM text or images. »
      // Sans selecteur, la fonction ci-dessous n'est JAMAIS appelee sur le
      // texte de la page. Constate en production le 2026-09-19 : un rejeu de
      // l'ecran Facturation laissait lire en clair le nom des clients
      // (« MONSIEUR LAURENT DANIEL LEJOSNE », « Pokawa Lille flandres ») et
      // les montants (« 557,28 € »).
      //
      // `'*'` fait passer TOUT noeud de texte par `maskTextFn`, qui decide
      // ensuite au cas par cas : masque ce qui ressemble a une donnee
      // personnelle, laisse lisible le reste (libelles, boutons, statuts) —
      // sans quoi le rejeu ne servirait plus a diagnostiquer quoi que ce soit.
      maskTextSelector: '*',
      maskTextFn: (text: string, element?: HTMLElement) =>
        shouldMaskText(text, isInsideDataCell(element)) ? MASK : text,

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
 * Remonte une erreur attrapee par nos propres filets (limite d'erreur React,
 * ecrans `error.tsx`), et force la persistance du rejeu.
 *
 * Le declencheur `$exception` cote projet couvre deja les erreurs non
 * rattrapees ; cet appel explicite couvre le cas ou l'erreur est attrapee
 * avant d'atteindre `window.onerror`. Idempotent : un second demarrage est
 * ignore par PostHog.
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
