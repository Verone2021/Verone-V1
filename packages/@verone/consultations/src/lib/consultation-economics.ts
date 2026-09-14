/**
 * Consultation Economics — calcul pur de la rentabilité consultation
 *
 * Aucun import React, Supabase ou navigateur.
 * Exécutable côté serveur, dans les tests et dans les Server Components.
 *
 * Formules : docs/scratchpad/dev-plan-2026-09-12-BO-CONSULT-P2-001.md § B2
 * Frais par fournisseur : consultation-supplier-costs.ts (BO-CONSULT-P9-001)
 * Sprints BO-CONSULT-P2-001 — 2026-09-12 · BO-CONSULT-P9-001 — 2026-09-13
 */

import {
  allocateSupplierCosts,
  summarizeSuppliers,
  type SupplierCostInput,
  type SupplierEconomics,
} from './consultation-supplier-costs';

// ---------------------------------------------------------------------------
// Interfaces d'entrée
// ---------------------------------------------------------------------------

export interface ConsultationEconomicsLineInput {
  id: string;
  quantity: number;
  /** Coût unitaire : cost_price_override ?? products.cost_price ?? null */
  unitCost: number | null;
  ecoTax?: number | null;
  /** Transport d'achat — total de ligne (pas unitaire) */
  shippingCost?: number | null;
  /** Transport de vente — total de ligne (pas unitaire) */
  sellingShippingCost?: number | null;
  proposedPrice: number | null;
  isFree: boolean;
  isSample: boolean;
  status: string;
  supplierId: string | null;
  /** Marge par défaut de la ligne (prioritaire sur le réglage global) */
  marginPercentage?: number | null;
}

export interface ConsultationEconomicsSettings {
  defaultMarginPercentage?: number | null;
  /**
   * Frais saisis par fournisseur. Répartis par computeConsultationEconomics
   * sur les lignes de chaque fournisseur ; computeLineEconomics reçoit la part
   * déjà calculée en paramètre.
   */
  supplierCosts?: readonly SupplierCostInput[];
}

// ---------------------------------------------------------------------------
// Interfaces de sortie
// ---------------------------------------------------------------------------

export interface LineEconomics {
  lineId: string;
  /** Ligne incluse dans les totaux (status !== 'rejected') */
  included: boolean;
  /** Coût unitaire absent en base (unitCost était null) */
  costMissing: boolean;
  /** Coût d'achat unitaire (0 si absent) */
  unitCost: number;
  ecoTax: number;
  /** Transport d'achat total de ligne, ou 0 si gratuit/échantillon */
  fees: number;
  /** Part des frais du fournisseur imputée à la ligne (total de ligne), 0 si gratuit/échantillon */
  supplierFees: number;
  /** Prix de revient unitaire = unitCost + ecoTax + (fees + supplierFees)/quantity */
  unitCostPrice: number;
  /** Prix par défaut calculé depuis la marge, ou null si pas de marge */
  defaultUnitPrice: number | null;
  /** Prix de vente effectif (proposedPrice ?? defaultUnitPrice ?? null) */
  unitPrice: number | null;
  /** Ligne incluse non gratuite sans prix de vente — à fixer */
  priceToFix: boolean;
  /** CA HT = unitPrice × qty + sellingShippingCost (0 si gratuit/échantillon) */
  revenue: number;
  /** Coût total = (unitCost + ecoTax) × qty + fees + supplierFees */
  cost: number;
  /** Marge brute = revenue − cost */
  margin: number;
  /** Marge % = margin / cost × 100, null si gratuit/échantillon/priceToFix/cost=0 */
  marginPercent: number | null;
  /** Sous-total achat = unitCost × quantity (affiché dans le tableau) */
  purchaseAmount: number;
  /** Sous-total vente = unitPrice × quantity, null si prix à fixer */
  salesAmount: number | null;
  /**
   * Montant facturé au client (décision 5 BO-CONSULT-P2-001) :
   * incluse, non gratuite, unitPrice != null ⇒ unitPrice × quantity ; sinon 0.
   * Échantillon non gratuit = facturé à son prix.
   */
  billedAmount: number;
}

export interface ConsultationEconomicsTotals {
  revenue: number;
  cost: number;
  fees: number;
  /** Somme des parts fournisseur des lignes incluses */
  supplierFees: number;
  /** Frais de fournisseurs sans ligne éligible — hors coût total */
  unallocatedSupplierFees: number;
  margin: number;
  marginPercent: number | null;
  includedLines: number;
  linesToPrice: number;
  /** Somme des billedAmount des lignes incluses */
  billed: number;
}

// ---------------------------------------------------------------------------
// Calcul d'une ligne
// ---------------------------------------------------------------------------

/**
 * Calcule la rentabilité d'une ligne de consultation.
 *
 * @param supplierFees part des frais du fournisseur imputée à la ligne, calculée
 *   par computeConsultationEconomics (settings.supplierCosts n'est pas réparti ici)
 * @throws {RangeError} si quantity ≤ 0
 */
export function computeLineEconomics(
  line: ConsultationEconomicsLineInput,
  settings: ConsultationEconomicsSettings = {},
  supplierFees = 0
): LineEconomics {
  // --- Guard quantité ---
  if (line.quantity <= 0) {
    throw new RangeError(
      `[consultation-economics] quantity doit être > 0, reçu: ${line.quantity} (ligne ${line.id})`
    );
  }

  // --- Coût unitaire ---
  const costMissing = line.unitCost === null || line.unitCost === undefined;
  const unitCost: number = costMissing ? 0 : (line.unitCost as number);
  const ecoTax: number = line.ecoTax ?? 0;
  const shippingCost: number = line.shippingCost ?? 0;
  const sellingShippingCost: number = line.sellingShippingCost ?? 0;

  // --- Inclusion ---
  const included = line.status !== 'rejected';

  // --- Frais de transport et part fournisseur (exclus pour gratuit ou échantillon) ---
  const fees: number = line.isFree || line.isSample ? 0 : shippingCost;
  const lineSupplierFees: number =
    line.isFree || line.isSample ? 0 : supplierFees;

  // --- Prix de revient unitaire ---
  const unitCostPrice: number =
    unitCost + ecoTax + (fees + lineSupplierFees) / line.quantity;

  // --- Marge applicable (ligne prioritaire sur réglage global) ---
  // marginPercentage ligne ?? réglage global ?? null (jamais undefined en sortie)
  const resolvedMargin: number | null =
    line.marginPercentage ?? settings.defaultMarginPercentage ?? null;

  // --- Prix par défaut ---
  const defaultUnitPrice: number | null =
    resolvedMargin !== null ? unitCostPrice * (1 + resolvedMargin / 100) : null;

  // --- Prix de vente ---
  const unitPrice: number | null =
    line.proposedPrice ?? defaultUnitPrice ?? null;
  const priceToFix: boolean = unitPrice === null && !line.isFree;

  // --- CA ---
  const revenue: number =
    line.isFree || line.isSample
      ? 0
      : (unitPrice ?? 0) * line.quantity + sellingShippingCost;

  // --- Coût total ---
  const cost: number =
    (unitCost + ecoTax) * line.quantity + fees + lineSupplierFees;

  // --- Marge ---
  const margin: number = revenue - cost;
  const marginPercent: number | null =
    line.isFree || line.isSample || priceToFix || cost === 0
      ? null
      : (margin / cost) * 100;

  // --- Montant facturé au client (décision 5 BO-CONSULT-P2-001) ---
  // PDF client, devis et commande : ligne incluse, non gratuite, prix renseigné
  // ⇒ unitPrice × quantity. Échantillon non gratuit = facturé à son prix.
  const billedAmount: number =
    included && !line.isFree && unitPrice !== null
      ? unitPrice * line.quantity
      : 0;

  // --- Sous-totaux affichés ---
  const purchaseAmount: number = unitCost * line.quantity;
  const salesAmount: number | null =
    unitPrice === null ? null : unitPrice * line.quantity;

  return {
    lineId: line.id,
    included,
    costMissing,
    unitCost,
    ecoTax,
    fees,
    supplierFees: lineSupplierFees,
    unitCostPrice,
    defaultUnitPrice,
    unitPrice,
    priceToFix,
    revenue,
    cost,
    margin,
    marginPercent,
    purchaseAmount,
    salesAmount,
    billedAmount,
  };
}

// ---------------------------------------------------------------------------
// Calcul de la consultation complète
// ---------------------------------------------------------------------------

/**
 * Calcule la rentabilité de toutes les lignes d'une consultation.
 * Les frais saisis par fournisseur sont répartis sur ses seules lignes
 * éligibles avant le calcul de chaque ligne. Les totaux n'incluent que les
 * lignes « included » (status !== 'rejected').
 *
 * @throws {RangeError} si une ligne a quantity ≤ 0
 */
export function computeConsultationEconomics(
  lines: readonly ConsultationEconomicsLineInput[],
  settings: ConsultationEconomicsSettings = {}
): {
  lines: LineEconomics[];
  totals: ConsultationEconomicsTotals;
  suppliers: SupplierEconomics[];
} {
  const allocation = allocateSupplierCosts(lines, settings.supplierCosts);

  const computedLines: LineEconomics[] = lines.map(line =>
    computeLineEconomics(line, settings, allocation.shares.get(line.id) ?? 0)
  );

  const includedLines = computedLines.filter(l => l.included);

  const totalRevenue = includedLines.reduce((sum, l) => sum + l.revenue, 0);
  const totalCost = includedLines.reduce((sum, l) => sum + l.cost, 0);
  const totalFees = includedLines.reduce((sum, l) => sum + l.fees, 0);
  const totalSupplierFees = includedLines.reduce(
    (sum, l) => sum + l.supplierFees,
    0
  );
  const totalMargin = totalRevenue - totalCost;
  const linesToPrice = includedLines.filter(l => l.priceToFix).length;
  // Pas de pourcentage total tant qu'un prix reste à fixer : sinon le total
  // afficherait -100 % alors que chaque ligne affiche « non calculé ».
  const totalMarginPercent: number | null =
    totalCost === 0 || linesToPrice > 0
      ? null
      : (totalMargin / totalCost) * 100;
  const totalBilled = includedLines.reduce((sum, l) => sum + l.billedAmount, 0);

  const totals: ConsultationEconomicsTotals = {
    revenue: totalRevenue,
    cost: totalCost,
    fees: totalFees,
    supplierFees: totalSupplierFees,
    unallocatedSupplierFees: allocation.unallocated,
    margin: totalMargin,
    marginPercent: totalMarginPercent,
    includedLines: includedLines.length,
    linesToPrice,
    billed: totalBilled,
  };

  const suppliers = summarizeSuppliers(
    lines,
    computedLines,
    settings.supplierCosts
  );

  return { lines: computedLines, totals, suppliers };
}
