/**
 * Consultation Supplier Costs — répartition pure des frais par fournisseur
 *
 * Aucun import React, Supabase ou navigateur.
 *
 * Décision Roméo 2026-09-11 : port, douane et autres frais sont saisis une fois
 * par fournisseur dans la consultation (table consultation_supplier_costs) et
 * imputés aux seules lignes de ce fournisseur, au prorata de la valeur de ligne
 * (coût unitaire × quantité). La marge par fournisseur est calculée ici, jamais
 * stockée.
 *
 * Sprint BO-CONSULT-P9-001 — 2026-09-13
 */

import { isRetainedLine } from './consultation-line-status';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Frais saisis pour un fournisseur dans une consultation (montants HT). */
export interface SupplierCostInput {
  supplierId: string;
  shippingCostHt: number;
  customsCostHt: number;
  otherCostHt: number;
}

/** Champs d'une ligne utiles à la répartition (sous-ensemble de ConsultationEconomicsLineInput). */
export interface SupplierCostLineInput {
  id: string;
  quantity: number;
  unitCost: number | null;
  status: string;
  isFree: boolean;
  isSample: boolean;
  supplierId: string | null;
  /**
   * La ligne porte-t-elle une part des frais de son fournisseur ?
   * Décochée par l'utilisateur quand un fournisseur a plusieurs lignes et que
   * celle-ci n'est pas concernée (livrée à part, déjà en stock…).
   * Absent = true (comportement d'avant BO-CONSULT-SOURCING-001).
   */
  carriesSupplierFees?: boolean;
}

/** Résultat de ligne utile à la synthèse (sous-ensemble de LineEconomics). */
export interface SupplierCostLineResult {
  included: boolean;
  unitPrice: number | null;
  unitCostPrice: number;
}

export interface SupplierCostAllocation {
  /** Part des frais fournisseur par ligne : lineId → montant HT total de ligne */
  shares: ReadonlyMap<string, number>;
  /** Frais d'un fournisseur sans aucune ligne éligible (non répartis) */
  unallocated: number;
}

export interface SupplierEconomics {
  supplierId: string;
  /** Frais saisis pour ce fournisseur (port + douane + autres) */
  supplierCosts: number;
  /** Lignes retenues de ce fournisseur (ni refusées ni simples options) */
  optionCount: number;
  /** Σ prix de vente (unitPrice × quantité) des lignes incluses facturables */
  proposedTotal: number;
  /** Σ prix de revient (unitCostPrice × quantité) des mêmes lignes */
  costPriceTotal: number;
  /**
   * (proposedTotal − costPriceTotal) / costPriceTotal × 100.
   * null si un prix reste à fixer, ou si aucun prix de revient.
   */
  marginPercent: number | null;
}

// ---------------------------------------------------------------------------
// Répartition
// ---------------------------------------------------------------------------

export function supplierCostTotal(cost: SupplierCostInput): number {
  return cost.shippingCostHt + cost.customsCostHt + cost.otherCostHt;
}

/**
 * Ligne qui porte une part des frais de son fournisseur : retenue (ni refusée
 * ni simple option), ni gratuite ni échantillon — même règle que les frais de
 * ligne — et non décochée par l'utilisateur. Une option candidate ne compte pas
 * dans les totaux : lui imputer des frais les ferait disparaître du prix de
 * revient des lignes retenues.
 */
export function isEligibleForSupplierCosts(
  line: SupplierCostLineInput
): boolean {
  return (
    isRetainedLine(line.status) &&
    !line.isFree &&
    !line.isSample &&
    line.supplierId !== null &&
    line.carriesSupplierFees !== false
  );
}

/**
 * Répartit les frais de chaque fournisseur sur ses seules lignes éligibles,
 * au prorata de la valeur de ligne (coût unitaire × quantité). Si toutes ces
 * lignes ont une valeur nulle (coût absent), répartition au prorata des
 * quantités. Les options encore candidates en sont exclues : elles ne comptent
 * pas dans les totaux, leur imputer des frais les retirerait du prix de
 * revient des lignes retenues.
 */
export function allocateSupplierCosts(
  lines: readonly SupplierCostLineInput[],
  supplierCosts: readonly SupplierCostInput[] = []
): SupplierCostAllocation {
  const shares = new Map<string, number>();
  let unallocated = 0;

  // Plusieurs entrées pour un même fournisseur s'additionnent (la base les
  // interdit par UNIQUE ; summarizeSuppliers les additionne de la même façon).
  for (const cost of supplierCosts) {
    const total = supplierCostTotal(cost);
    if (total === 0) continue;

    const eligible = lines.filter(
      line =>
        isEligibleForSupplierCosts(line) && line.supplierId === cost.supplierId
    );
    if (eligible.length === 0) {
      unallocated += total;
      continue;
    }

    const values = eligible.map(line => (line.unitCost ?? 0) * line.quantity);
    const valueSum = values.reduce((sum, value) => sum + value, 0);
    const weights = valueSum > 0 ? values : eligible.map(line => line.quantity);
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    // Aucune base de répartition (quantités invalides) : rien de réparti,
    // computeLineEconomics refusera ces lignes.
    if (weightSum <= 0) {
      unallocated += total;
      continue;
    }

    eligible.forEach((line, index) => {
      const share = (total * weights[index]) / weightSum;
      shares.set(line.id, (shares.get(line.id) ?? 0) + share);
    });
  }

  return { shares, unallocated };
}

// ---------------------------------------------------------------------------
// Synthèse par fournisseur
// ---------------------------------------------------------------------------

/**
 * Marge agrégée par fournisseur, calculée sur ses lignes incluses facturables
 * (ni gratuites ni échantillons). `computed[i]` est le résultat de `inputs[i]`.
 * Fournisseurs listés dans l'ordre des lignes, puis ceux qui n'ont que des
 * frais saisis.
 */
export function summarizeSuppliers(
  inputs: readonly SupplierCostLineInput[],
  computed: readonly SupplierCostLineResult[],
  supplierCosts: readonly SupplierCostInput[] = []
): SupplierEconomics[] {
  const order: string[] = [];
  const addSupplier = (supplierId: string | null) => {
    if (supplierId !== null && !order.includes(supplierId)) {
      order.push(supplierId);
    }
  };
  inputs.forEach(line => addSupplier(line.supplierId));
  supplierCosts.forEach(cost => addSupplier(cost.supplierId));

  return order.map(supplierId => {
    const costs = supplierCosts
      .filter(cost => cost.supplierId === supplierId)
      .reduce((sum, cost) => sum + supplierCostTotal(cost), 0);

    let optionCount = 0;
    let proposedTotal = 0;
    let costPriceTotal = 0;
    let priceMissing = false;

    inputs.forEach((line, index) => {
      const econ = computed[index];
      if (line.supplierId !== supplierId || !econ.included) return;
      optionCount++;
      if (line.isFree || line.isSample) return;
      if (econ.unitPrice === null) {
        priceMissing = true;
        return;
      }
      proposedTotal += econ.unitPrice * line.quantity;
      costPriceTotal += econ.unitCostPrice * line.quantity;
    });

    const marginPercent =
      priceMissing || costPriceTotal === 0
        ? null
        : ((proposedTotal - costPriceTotal) / costPriceTotal) * 100;

    return {
      supplierId,
      supplierCosts: costs,
      optionCount,
      proposedTotal,
      costPriceTotal,
      marginPercent,
    };
  });
}
