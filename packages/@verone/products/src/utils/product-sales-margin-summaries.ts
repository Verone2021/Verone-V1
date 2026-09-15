/**
 * product-sales-margin-summaries.ts — synthèses par canal et LinkMe.
 * Importé et ré-exporté depuis product-sales-margin.ts.
 *
 * Sprint : BO-PRODUCTS-PROFIT-002
 */

import { isValidLine } from './product-sales-margin';

import type {
  AffiliateSummary,
  ChannelSummary,
  ComputedSaleLine,
  LinkMeSummary,
  ResolvedCost,
  TheoreticalMargin,
} from './product-sales-margin';

// ---------- summarizeByChannel ----------

/** Synthèse par canal — somme sur lignes couvertes uniquement */
export function summarizeByChannel(
  lines: ComputedSaleLine[]
): ChannelSummary[] {
  type Acc = {
    channelId: string | null;
    channelCode: string | null;
    channelName: string | null;
    quantity: number;
    veroneRevenue: number;
    marginTotalAcc: number;
    coveredLines: number;
    uncoveredLines: number;
    withoutFeesLines: number;
    costTotal: number;
    coveredRevenue: number;
    orderIds: Set<string>;
  };

  const byChannel = new Map<string, Acc>();

  for (const line of lines) {
    if (!isValidLine(line)) continue;
    const key = line.channelId ?? '__none__';
    let acc = byChannel.get(key);
    if (acc == null) {
      acc = {
        channelId: line.channelId,
        channelCode: line.channelCode,
        channelName: line.channelName,
        quantity: 0,
        veroneRevenue: 0,
        marginTotalAcc: 0,
        coveredLines: 0,
        uncoveredLines: 0,
        withoutFeesLines: 0,
        costTotal: 0,
        coveredRevenue: 0,
        orderIds: new Set(),
      };
      byChannel.set(key, acc);
    }

    acc.quantity += line.quantity;
    acc.veroneRevenue += line.veroneRevenue;
    acc.orderIds.add(line.orderId);

    if (line.marginTotal != null) {
      // Ligne couverte (non affilié + coût connu)
      acc.coveredLines += 1;
      acc.marginTotalAcc += line.marginTotal;
      acc.coveredRevenue += line.veroneRevenue;
      if (line.costUnit != null) {
        acc.costTotal += line.costUnit * line.quantity;
      }
      if (line.costIncludesFees === false) {
        acc.withoutFeesLines += 1;
      }
    } else if (!line.isAffiliateProduct) {
      // Coût manquant (pas un produit affilié)
      acc.uncoveredLines += 1;
    }
    // Les lignes produit affilié ne sont ni couvertes ni non-couvertes
  }

  return Array.from(byChannel.values()).map(ch => ({
    channelId: ch.channelId,
    channelCode: ch.channelCode,
    channelName: ch.channelName,
    quantity: ch.quantity,
    veroneRevenue: ch.veroneRevenue,
    avgVeronePrice: ch.quantity > 0 ? ch.veroneRevenue / ch.quantity : null,
    marginTotal: ch.coveredLines > 0 ? ch.marginTotalAcc : null,
    marginPercent:
      ch.coveredLines > 0 && ch.coveredRevenue > 0
        ? (ch.marginTotalAcc / ch.coveredRevenue) * 100
        : null,
    coefficient: ch.costTotal > 0 ? ch.coveredRevenue / ch.costTotal : null,
    coveredLines: ch.coveredLines,
    uncoveredLines: ch.uncoveredLines,
    withoutFeesLines: ch.withoutFeesLines,
    costTotal: ch.costTotal,
    coveredRevenue: ch.coveredRevenue,
    orderCount: ch.orderIds.size,
  }));
}

// ---------- summarizeLinkMe ----------

/** Synthèse LinkMe détaillée — somme sur lignes couvertes uniquement */
export function summarizeLinkMe(
  lines: ComputedSaleLine[],
  options: {
    linkmePriceHt: number | null;
    cost: ResolvedCost;
    offeringAffiliateCount: number;
  }
): LinkMeSummary {
  type AffAcc = {
    affiliateId: string;
    name: string;
    quantity: number;
    veroneRevenue: number;
    marginTotalAcc: number;
    coveredLines: number;
  };

  let quantity = 0;
  let veroneRevenue = 0;
  let affiliateCommissionTotal = 0;
  let clientRevenue = 0;
  let veroneCommissionTotal = 0;
  let marginTotalAcc = 0;
  let coveredLines = 0;
  let uncoveredLines = 0;
  let withoutFeesLines = 0;
  let affiliateProductLines = 0;
  let costTotal = 0;
  let coveredRevenue = 0;
  const orderIds = new Set<string>();
  const sellingAffiliateIds = new Set<string>();
  const byAffiliateMap = new Map<string, AffAcc>();

  for (const line of lines) {
    if (!line.isLinkMe || !isValidLine(line)) continue;
    quantity += line.quantity;
    veroneRevenue += line.veroneRevenue;
    affiliateCommissionTotal += line.affiliateCommission;
    clientRevenue += line.clientRevenue;
    veroneCommissionTotal += line.veroneCommission ?? 0;
    orderIds.add(line.orderId);

    if (line.isAffiliateProduct) {
      affiliateProductLines += 1;
    } else if (line.marginTotal != null) {
      coveredLines += 1;
      marginTotalAcc += line.marginTotal;
      coveredRevenue += line.veroneRevenue;
      if (line.costUnit != null) {
        costTotal += line.costUnit * line.quantity;
      }
      if (line.costIncludesFees === false) {
        withoutFeesLines += 1;
      }
    } else {
      uncoveredLines += 1;
    }

    if (line.affiliateId) {
      sellingAffiliateIds.add(line.affiliateId);
      const acc = byAffiliateMap.get(line.affiliateId);
      if (acc != null) {
        acc.quantity += line.quantity;
        acc.veroneRevenue += line.veroneRevenue;
        if (line.marginTotal != null) {
          acc.coveredLines += 1;
          acc.marginTotalAcc += line.marginTotal;
        }
      } else {
        byAffiliateMap.set(line.affiliateId, {
          affiliateId: line.affiliateId,
          name: line.affiliateName ?? line.affiliateId,
          quantity: line.quantity,
          veroneRevenue: line.veroneRevenue,
          marginTotalAcc: line.marginTotal ?? 0,
          coveredLines: line.marginTotal != null ? 1 : 0,
        });
      }
    }
  }

  const finalMarginTotal = coveredLines > 0 ? marginTotalAcc : null;
  const theoreticalUnitMargin = computeTheoreticalMargin(
    options.linkmePriceHt,
    options.cost
  );

  return {
    quantity,
    veroneRevenue,
    avgVeronePrice: quantity > 0 ? veroneRevenue / quantity : null,
    marginTotal: finalMarginTotal,
    marginPercent:
      finalMarginTotal != null && coveredRevenue > 0
        ? (finalMarginTotal / coveredRevenue) * 100
        : null,
    coefficient: costTotal > 0 ? coveredRevenue / costTotal : null,
    coveredLines,
    uncoveredLines,
    withoutFeesLines,
    affiliateProductLines,
    costTotal,
    coveredRevenue,
    affiliateCommissionTotal,
    clientRevenue,
    veroneCommissionTotal,
    orderCount: orderIds.size,
    sellingAffiliateCount: sellingAffiliateIds.size,
    offeringAffiliateCount: options.offeringAffiliateCount,
    byAffiliate: Array.from(byAffiliateMap.values()).map(
      (a): AffiliateSummary => ({
        affiliateId: a.affiliateId,
        name: a.name,
        quantity: a.quantity,
        veroneRevenue: a.veroneRevenue,
        marginTotal: a.coveredLines > 0 ? a.marginTotalAcc : null,
      })
    ),
    theoreticalUnitMargin,
  };
}

// ---------- summarizeFilteredLines ----------

/**
 * Synthèse globale sur un sous-ensemble de lignes (après filtrage côté client).
 * Utilisé par SalesHistoryTable pour afficher les totaux filtrés.
 */
export interface FilteredSummary {
  quantity: number;
  veroneRevenue: number;
  marginTotal: number | null;
  marginPercent: number | null;
  coefficient: number | null;
}

export function summarizeFilteredLines(
  lines: ComputedSaleLine[]
): FilteredSummary {
  let quantity = 0;
  let veroneRevenue = 0;
  let marginTotalAcc = 0;
  let coveredRevenue = 0;
  let costTotal = 0;
  let coveredLines = 0;

  for (const line of lines) {
    quantity += line.quantity;
    veroneRevenue += line.veroneRevenue;
    if (line.marginTotal != null && !line.isAffiliateProduct) {
      coveredLines += 1;
      marginTotalAcc += line.marginTotal;
      coveredRevenue += line.veroneRevenue;
      if (line.costUnit != null) {
        costTotal += line.costUnit * line.quantity;
      }
    }
  }

  return {
    quantity,
    veroneRevenue,
    marginTotal: coveredLines > 0 ? marginTotalAcc : null,
    marginPercent:
      coveredLines > 0 && coveredRevenue > 0
        ? (marginTotalAcc / coveredRevenue) * 100
        : null,
    coefficient: costTotal > 0 ? coveredRevenue / costTotal : null,
  };
}

function computeTheoreticalMargin(
  linkmePriceHt: number | null,
  cost: ResolvedCost
): TheoreticalMargin {
  if (linkmePriceHt == null || cost.cost == null) {
    return { amount: null, percent: null, coefficient: null };
  }
  const amount = linkmePriceHt - cost.cost;
  return {
    amount,
    percent: linkmePriceHt > 0 ? (amount / linkmePriceHt) * 100 : null,
    coefficient: cost.cost > 0 ? linkmePriceHt / cost.cost : null,
  };
}
