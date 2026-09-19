/**
 * Reconstruction du panier à partir des prix de la base.
 *
 * Règle : le navigateur n'apporte QUE `product_id`, `quantity` et le choix du
 * montage. Tout ce qui devient un montant — prix, éco-participation, prix du
 * montage — est relu en base et recalculé ici. Les valeurs envoyées par le
 * navigateur ne servent qu'à une chose : être comparées aux vraies, pour
 * détecter un écart.
 *
 * Un écart n'est jamais corrigé en silence. Il est refusé et signalé : soit
 * c'est un prix qui a bougé pendant que le client remplissait son panier
 * (il doit le recharger), soit c'est une requête modifiée (il faut le voir).
 *
 * Fonction pure, sans accès réseau : c'est ce qui la rend testable.
 *
 * Sprint SI-CHECKOUT-PRICE-001 — 2026-09-19
 */

import type { CatalogPrice } from './catalog-prices';

/** Ce que le navigateur envoie. Seuls les trois premiers champs font foi. */
export interface DeclaredItem {
  product_id: string;
  quantity: number;
  include_assembly: boolean;
  /** Annoncé par le navigateur — comparé, jamais utilisé comme montant. */
  price_ttc: number;
  /** Annoncé par le navigateur — comparé, jamais utilisé comme montant. */
  eco_participation: number;
  /** Annoncé par le navigateur — comparé, jamais utilisé comme montant. */
  assembly_price: number;
}

/** Ce qui part chez Stripe et dans la commande : 100 % reconstruit en base. */
export interface ResolvedItem {
  product_id: string;
  name: string;
  quantity: number;
  include_assembly: boolean;
  price_ttc: number;
  eco_participation: number;
  assembly_price: number;
  /** Montant unitaire en centimes, tel qu'envoyé à Stripe. */
  unit_amount_cents: number;
}

export type CartRejectionReason =
  | 'produit_indisponible'
  | 'montage_indisponible'
  | 'prix_modifie';

export interface CartRejection {
  ok: false;
  reason: CartRejectionReason;
  /** Message destiné au client, en français. */
  error: string;
  /** Détail destiné aux journaux — jamais renvoyé au navigateur. */
  detail: string;
  product_id: string;
}

export interface CartResolution {
  ok: true;
  items: ResolvedItem[];
  /** Total TTC des articles, en euros (sert au promo et à la commande). */
  subtotalTtc: number;
  /** Même total en centimes (sert au seuil de franco de port). */
  subtotalCents: number;
}

/** Conversion en centimes, à l'identique du calcul envoyé à Stripe. */
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function resolveCartItems(
  declared: DeclaredItem[],
  catalog: Map<string, CatalogPrice>
): CartResolution | CartRejection {
  const items: ResolvedItem[] = [];
  let subtotalTtc = 0;
  let subtotalCents = 0;

  for (const line of declared) {
    const reference = catalog.get(line.product_id);

    if (!reference) {
      return {
        ok: false,
        reason: 'produit_indisponible',
        error:
          "Un article de votre panier n'est plus disponible à la vente. " +
          'Merci de le retirer avant de valider.',
        detail: `product_id absent du catalogue en ligne : ${line.product_id}`,
        product_id: line.product_id,
      };
    }

    if (line.include_assembly && !reference.requires_assembly) {
      return {
        ok: false,
        reason: 'montage_indisponible',
        error:
          "Le service de montage n'est pas proposé pour un article de votre " +
          'panier. Merci de recharger votre panier.',
        detail:
          `montage demandé sur ${line.product_id} alors que ` +
          'requires_assembly vaut false en base',
        product_id: line.product_id,
      };
    }

    const assemblyPrice = line.include_assembly ? reference.assembly_price : 0;
    const declaredAssembly = line.include_assembly ? line.assembly_price : 0;

    const actualUnitCents = toCents(
      reference.price_ttc + reference.eco_participation + assemblyPrice
    );
    const declaredUnitCents = toCents(
      line.price_ttc + line.eco_participation + declaredAssembly
    );

    if (actualUnitCents !== declaredUnitCents) {
      return {
        ok: false,
        reason: 'prix_modifie',
        error:
          "Le prix d'un article de votre panier a changé. " +
          'Merci de recharger votre panier avant de valider la commande.',
        detail:
          `prix annoncé ${declaredUnitCents} centimes, prix réel ` +
          `${actualUnitCents} centimes pour ${line.product_id}`,
        product_id: line.product_id,
      };
    }

    items.push({
      product_id: reference.product_id,
      name: reference.name,
      quantity: line.quantity,
      include_assembly: line.include_assembly,
      price_ttc: reference.price_ttc,
      eco_participation: reference.eco_participation,
      assembly_price: reference.assembly_price,
      unit_amount_cents: actualUnitCents,
    });

    subtotalTtc +=
      (reference.price_ttc + reference.eco_participation + assemblyPrice) *
      line.quantity;
    subtotalCents += actualUnitCents * line.quantity;
  }

  return { ok: true, items, subtotalTtc, subtotalCents };
}
