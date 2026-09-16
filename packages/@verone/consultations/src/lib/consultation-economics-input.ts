/**
 * Consultation Economics Input — adaptateur unique ligne de consultation → calcul
 *
 * Aucun import React, Supabase ou navigateur.
 *
 * Avant BO-CONSULT-MULTI-001, cet adaptateur était recopié à l'identique dans
 * 7 fichiers (tableau, KPIs, dialogue de commande, hook items, handlers devis,
 * les 2 PDF). Aucun d'eux ne passait `settings`, donc la marge par défaut
 * n'était jamais appliquée. Source unique désormais : tout réglage ajouté ici
 * (marge, frais fournisseur, TVA) atteint les 7 écrans d'un coup.
 *
 * Sprint BO-CONSULT-MULTI-001 — 2026-09-16
 */

import {
  computeConsultationEconomics,
  type ConsultationEconomicsLineInput,
  type ConsultationEconomicsSettings,
  type ConsultationEconomicsTotals,
  type LineEconomics,
} from './consultation-economics';
import type {
  SupplierCostInput,
  SupplierEconomics,
} from './consultation-supplier-costs';

// ---------------------------------------------------------------------------
// Formes d'entrée (structurelles — ConsultationItem et ses variantes)
// ---------------------------------------------------------------------------

/** Ligne de consultation telle que chargée par `useConsultationItems`. */
export interface ConsultationEconomicsItemLike {
  id: string;
  quantity: number;
  /** Prix de vente saisi. null = non saisi (la marge peut alors le produire). */
  unit_price: number | null;
  is_free: boolean;
  is_sample: boolean;
  /** Statut de la ligne — même vocabulaire que les gardes de commande/devis. */
  status: string;
  shipping_cost?: number | null;
  selling_shipping_cost?: number | null;
  cost_price_override?: number | null;
  /** Marge de la ligne en % — prioritaire sur la marge par défaut. */
  margin_percentage?: number | null;
  product?: {
    cost_price?: number | null;
    eco_tax_default?: number | null;
    supplier_id?: string | null;
  } | null;
}

/** Consultation porteuse des réglages de calcul. */
export interface ConsultationEconomicsSettingsSource {
  default_margin_percentage?: number | null;
}

// ---------------------------------------------------------------------------
// Adaptateurs
// ---------------------------------------------------------------------------

/** Convertit une ligne de consultation en entrée de calcul. */
export function itemToEconomicsInput(
  item: ConsultationEconomicsItemLike
): ConsultationEconomicsLineInput {
  return {
    id: item.id,
    quantity: item.quantity,
    unitCost: item.cost_price_override ?? item.product?.cost_price ?? null,
    ecoTax: item.product?.eco_tax_default ?? 0,
    shippingCost: item.shipping_cost ?? 0,
    sellingShippingCost: item.selling_shipping_cost ?? 0,
    proposedPrice: item.unit_price ?? null,
    isFree: item.is_free,
    isSample: item.is_sample,
    status: item.status,
    supplierId: item.product?.supplier_id ?? null,
    marginPercentage: item.margin_percentage ?? null,
  };
}

/**
 * Convertit une liste de lignes, en écartant les quantités ≤ 0 que
 * `computeLineEconomics` refuse (RangeError).
 */
export function itemsToEconomicsInputs(
  items: readonly ConsultationEconomicsItemLike[]
): ConsultationEconomicsLineInput[] {
  return items.filter(item => item.quantity > 0).map(itemToEconomicsInput);
}

/** Réglages de calcul d'une consultation (marge par défaut, frais fournisseur). */
export function consultationToEconomicsSettings(
  consultation?: ConsultationEconomicsSettingsSource | null,
  supplierCosts?: readonly SupplierCostInput[]
): ConsultationEconomicsSettings {
  const raw = consultation?.default_margin_percentage;
  const defaultMarginPercentage =
    raw === null || raw === undefined ? null : Number(raw);
  return {
    defaultMarginPercentage: Number.isFinite(defaultMarginPercentage as number)
      ? defaultMarginPercentage
      : null,
    supplierCosts,
  };
}

// ---------------------------------------------------------------------------
// Calcul prêt à l'emploi
// ---------------------------------------------------------------------------

export interface ConsultationItemsEconomics {
  lines: LineEconomics[];
  totals: ConsultationEconomicsTotals;
  suppliers: SupplierEconomics[];
  /** Accès direct au calcul d'une ligne par son identifiant. */
  byItemId: Map<string, LineEconomics>;
}

/**
 * Calcule l'économie d'une consultation depuis ses lignes brutes et sa
 * consultation porteuse des réglages. Point d'entrée unique des écrans.
 */
export function computeItemsEconomics(
  items: readonly ConsultationEconomicsItemLike[],
  consultation?: ConsultationEconomicsSettingsSource | null,
  supplierCosts?: readonly SupplierCostInput[]
): ConsultationItemsEconomics {
  const { lines, totals, suppliers } = computeConsultationEconomics(
    itemsToEconomicsInputs(items),
    consultationToEconomicsSettings(consultation, supplierCosts)
  );
  return {
    lines,
    totals,
    suppliers,
    byItemId: new Map(lines.map(line => [line.lineId, line])),
  };
}

/**
 * Remplace `unit_price` par le prix de vente effectif (prix saisi, sinon prix
 * produit par la marge). Les gardes de commande/devis
 * (`filterBillableItems`, `countUnpricedLines`) et les documents raisonnent
 * ensuite sur ce prix sans rien savoir de la marge.
 *
 * Une ligne sans calcul (quantité ≤ 0) garde sa valeur d'origine.
 */
export function withResolvedPrices<T extends ConsultationEconomicsItemLike>(
  items: readonly T[],
  economics: Pick<ConsultationItemsEconomics, 'byItemId'>
): T[] {
  return items.map(item => {
    const econ = economics.byItemId.get(item.id);
    if (!econ || econ.unitPrice === item.unit_price) return item;
    return { ...item, unit_price: econ.unitPrice };
  });
}
