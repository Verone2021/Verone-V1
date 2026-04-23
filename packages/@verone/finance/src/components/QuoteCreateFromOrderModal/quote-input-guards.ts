/**
 * quote-input-guards.ts
 *
 * Créé 2026-04-24 (INFRA-HARDENING-001) pour détecter les consumers qui
 * passent un `order` dégradé au modal devis — cause racine des régressions
 * BO-FIN-040 (enseigne_id non fetché, customer_id absent, etc.).
 *
 * Ces guards NE lèvent PAS d'exception en prod : ils loguent un warning
 * explicite dans la console. En CI, les smoke tests détectent ce warning
 * et cassent le build (voir ConsoleErrorCollector dans tests/fixtures/base.ts).
 *
 * Règle : un consumer qui n'envoie pas les champs critiques au modal est
 * détecté au runtime dès le premier render, avec un pointeur clair sur le
 * fichier à corriger.
 */

import type { IOrderForDocument } from '../order-select/types';

interface IWarnOptions {
  /** Identifiant du consumer — sert à remonter à la source du bug. */
  consumer: string;
}

/**
 * Vérifie que l'objet `order` passé au modal contient les champs nécessaires
 * pour activer la détection de maison mère. Ne jette PAS — log une fois par
 * ID de commande pour éviter le spam.
 */
export function warnIfQuoteOrderInputDegraded(
  order: IOrderForDocument | null | undefined,
  options: IWarnOptions
): void {
  if (!order) return;
  if (warnedOrderIds.has(order.id)) return;

  const missing: string[] = [];
  if (order.customer_id === undefined) missing.push('customer_id');
  if (
    order.customer_type === 'organization' &&
    order.organisations !== null &&
    order.organisations !== undefined &&
    order.organisations.enseigne_id === undefined
  ) {
    missing.push('organisations.enseigne_id');
  }

  if (missing.length === 0) return;

  warnedOrderIds.add(order.id);
  // console.error volontaire : les smoke tests E2E Playwright (CI gate)
  // détectent ces erreurs et cassent la PR. Cela force la correction à la
  // source (la requête SELECT chez le consumer) avant merge.

  console.error(
    `[quote-input-guards] Ordre ${order.order_number ?? order.id} passé au modal devis avec des champs manquants: ${missing.join(', ')}. ` +
      `Consumer: ${options.consumer}. ` +
      `Ces champs sont requis pour la détection maison mère (BO-FIN-040). ` +
      `Corriger la requête SELECT en amont du consumer.`
  );
}

const warnedOrderIds = new Set<string>();
