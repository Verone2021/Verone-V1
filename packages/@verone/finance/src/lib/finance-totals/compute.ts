/**
 * Module de calcul des totaux financiers — Source de vérité unique
 *
 * Formule round-per-line : l'arrondi se fait sur chaque ligne, pas sur le total.
 * Identique à la logique des triggers DB et aux exigences de l'API Qonto.
 *
 * Sprint BO-FIN-046 — 2026-05-06
 * ADR : docs/current/finance/totals-source-of-truth.md
 */

import type {
  FinancialItem,
  FinancialFees,
  FinancialTotals,
  ComputeOptions,
} from './types';
import { FORMULA_VERSION } from './types';

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/** Arrondi à 2 décimales (cents) */
function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Résoudre le tax_rate d'un item.
 * - Mode strict (défaut) : null/undefined → Error explicite
 * - Mode permissif : null/undefined → 0
 */
function resolveTaxRate(item: FinancialItem, strict: boolean): number {
  if (item.tax_rate === null || item.tax_rate === undefined) {
    if (strict) {
      const label = item.description ?? 'inconnu';
      throw new Error(
        `[finance-totals] tax_rate manquant sur l'article "${label}". ` +
          `Vérifiez que chaque article a un taux de TVA défini (0, 0.055, 0.085, 0.10 ou 0.20).`
      );
    }
    return 0;
  }
  return item.tax_rate;
}

// ---------------------------------------------------------------------------
// Fonction principale
// ---------------------------------------------------------------------------

/**
 * Calculer les totaux financiers d'un document (devis, facture, proforma).
 *
 * @param items    Articles de la commande
 * @param fees     Frais annexes (livraison, manutention, assurance)
 * @param options  Options (strict : défaut true)
 * @returns        Totaux calculés round-per-line
 *
 * @example
 * ```ts
 * const totals = computeFinancialTotals(
 *   [{ quantity: 2, unit_price_ht: 100, tax_rate: 0.2 }],
 *   { shipping_cost_ht: 10, handling_cost_ht: 0, insurance_cost_ht: 0, fees_vat_rate: 0.2 }
 * );
 * // → { totalHt: 210, totalTtc: 252, totalVat: 42, ... }
 * ```
 */
export function computeFinancialTotals(
  items: FinancialItem[],
  fees: FinancialFees,
  options: ComputeOptions = {}
): FinancialTotals {
  const strict = options.strict !== false; // strict par défaut

  // Validation entrées
  if (!Array.isArray(items)) {
    throw new Error('[finance-totals] items doit être un tableau');
  }

  let itemsHt = 0;
  let itemsTtc = 0;
  const vatByRate: Record<string, number> = {};

  // --- Calcul article par article (round-per-line) ---
  for (const item of items) {
    const qty = item.quantity ?? 0;
    const unitPriceHt = item.unit_price_ht ?? 0;
    const discount = item.discount_percentage ?? 0;
    const ecoTax = item.eco_tax ?? 0;
    const taxRate = resolveTaxRate(item, strict);

    if (qty === 0) continue; // articles à quantité 0 ignorés
    if (unitPriceHt < 0 || qty < 0) {
      throw new Error(
        `[finance-totals] Montants négatifs non autorisés (article: "${item.description ?? 'inconnu'}"). ` +
          `Utilisez computeRefundTotals pour les avoirs.`
      );
    }

    // HT de la ligne : qty × prix × (1 − remise%) arrondi
    const lineBaseHt = qty * unitPriceHt * (1 - discount / 100);
    const lineEcoTax = ecoTax * qty;
    const lineHt = roundCents(lineBaseHt + lineEcoTax);

    // TTC de la ligne : (baseHt + ecoTax) × (1 + taxRate) arrondi
    const lineTtc = roundCents((lineBaseHt + lineEcoTax) * (1 + taxRate));

    // TVA de la ligne
    const lineVat = roundCents(lineTtc - lineHt);

    itemsHt += lineHt;
    itemsTtc += lineTtc;

    // Accumulation TVA par taux
    const rateKey = taxRate.toFixed(3);
    vatByRate[rateKey] = roundCents((vatByRate[rateKey] ?? 0) + lineVat);
  }

  // --- Frais annexes (round-per-ligne de frais) ---
  const shippingHt = fees.shipping_cost_ht ?? 0;
  const handlingHt = fees.handling_cost_ht ?? 0;
  const insuranceHt = fees.insurance_cost_ht ?? 0;
  const feesVatRate = fees.fees_vat_rate ?? 0;
  const feesRateKey = feesVatRate.toFixed(3);

  let feesTtc = 0;
  let feesHt = 0;

  if (shippingHt > 0) {
    const lineTtc = roundCents(shippingHt * (1 + feesVatRate));
    const lineVat = roundCents(lineTtc - shippingHt);
    feesHt += shippingHt;
    feesTtc += lineTtc;
    vatByRate[feesRateKey] = roundCents(
      (vatByRate[feesRateKey] ?? 0) + lineVat
    );
  }
  if (handlingHt > 0) {
    const lineTtc = roundCents(handlingHt * (1 + feesVatRate));
    const lineVat = roundCents(lineTtc - handlingHt);
    feesHt += handlingHt;
    feesTtc += lineTtc;
    vatByRate[feesRateKey] = roundCents(
      (vatByRate[feesRateKey] ?? 0) + lineVat
    );
  }
  if (insuranceHt > 0) {
    const lineTtc = roundCents(insuranceHt * (1 + feesVatRate));
    const lineVat = roundCents(lineTtc - insuranceHt);
    feesHt += insuranceHt;
    feesTtc += lineTtc;
    vatByRate[feesRateKey] = roundCents(
      (vatByRate[feesRateKey] ?? 0) + lineVat
    );
  }

  // --- Totaux finaux ---
  const totalHt = roundCents(itemsHt + feesHt);
  const totalTtc = roundCents(itemsTtc + feesTtc);
  const totalVat = roundCents(
    Object.values(vatByRate).reduce((sum, v) => sum + v, 0)
  );

  // Supprimer les taux à 0 VAT pour ne pas polluer vatByRate
  // (ex: frais à fees_vat_rate=0.2 mais montant=0)
  for (const key of Object.keys(vatByRate)) {
    if (vatByRate[key] === 0) {
      delete vatByRate[key];
    }
  }

  return {
    itemsHt: roundCents(itemsHt),
    feesHt: roundCents(feesHt),
    totalHt,
    vatByRate,
    totalVat,
    totalTtc,
    formulaVersion: FORMULA_VERSION,
  };
}
