/**
 * product-sales-margin.ts — calculs purs de marge LinkMe et par canal.
 * Aucun accès réseau. Toutes les fonctions sont pures.
 *
 * Sprint : BO-PRODUCTS-PROFIT-001
 */

// ---------- Constants ----------

/** Canal LinkMe UUID — source de vérité : sales_channels.code = 'linkme' */
export const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

/** Statuts de vente comptabilisés dans les marges */
export const VALID_SALE_STATUSES = [
  'validated',
  'partially_shipped',
  'shipped',
  'delivered',
  'closed',
] as const;

export type ValidSaleStatus = (typeof VALID_SALE_STATUSES)[number];

// ---------- Input types ----------

export interface SaleLineInput {
  orderId: string;
  orderNumber: string;
  orderDate: string | null;
  channelId: string | null;
  channelCode: string | null;
  channelName: string | null;
  status: string;
  quantity: number;
  unitPriceHt: number;
  totalHt: number | null;
  basePriceLocked: number | null;
  sellingPriceLocked: number | null;
  retrocessionAmount: number | null;
  affiliateId: string | null;
  affiliateName: string | null;
}

export interface ProductCostInput {
  costNetAvg: number | null;
  costPrice: number | null;
  createdByAffiliate: boolean;
  affiliateCommissionRate: number | null;
}

// ---------- Output types ----------

export interface ResolvedCost {
  cost: number | null;
  includesFees: boolean;
  missing: boolean;
}

export interface ComputedSaleLine {
  orderId: string;
  orderNumber: string;
  orderDate: string | null;
  channelId: string | null;
  channelCode: string | null;
  channelName: string | null;
  status: string;
  quantity: number;
  isLinkMe: boolean;
  veroneUnitPrice: number;
  veroneRevenue: number;
  clientRevenue: number;
  affiliateCommission: number;
  veroneCommission: number | null;
  affiliateId: string | null;
  affiliateName: string | null;
  marginTotal: number | null;
  marginUnit: number | null;
  marginPercent: number | null;
  coefficient: number | null;
}

export interface ChannelSummary {
  channelId: string | null;
  channelCode: string | null;
  channelName: string | null;
  quantity: number;
  veroneRevenue: number;
  avgVeronePrice: number | null;
  marginTotal: number | null;
  marginPercent: number | null;
  orderCount: number;
}

export interface AffiliateSummary {
  affiliateId: string;
  name: string;
  quantity: number;
  veroneRevenue: number;
  marginTotal: number | null;
}

export interface TheoreticalMargin {
  amount: number | null;
  percent: number | null;
  coefficient: number | null;
}

export interface LinkMeSummary {
  quantity: number;
  veroneRevenue: number;
  avgVeronePrice: number | null;
  marginTotal: number | null;
  marginPercent: number | null;
  affiliateCommissionTotal: number;
  clientRevenue: number;
  veroneCommissionTotal: number;
  orderCount: number;
  sellingAffiliateCount: number;
  offeringAffiliateCount: number;
  byAffiliate: AffiliateSummary[];
  theoreticalUnitMargin: TheoreticalMargin;
}

// ---------- Pure functions ----------

/** Résout le coût du produit avec priorité cost_net_avg > cost_price */
export function resolveCost(input: {
  costNetAvg: number | null;
  costPrice: number | null;
}): ResolvedCost {
  if (input.costNetAvg != null && input.costNetAvg > 0) {
    return { cost: input.costNetAvg, includesFees: true, missing: false };
  }
  if (input.costPrice != null && input.costPrice > 0) {
    return { cost: input.costPrice, includesFees: false, missing: false };
  }
  return { cost: null, includesFees: false, missing: true };
}

/** Filtre les lignes sur les statuts de vente valables */
export function isValidLine(line: Pick<SaleLineInput, 'status'>): boolean {
  return (VALID_SALE_STATUSES as ReadonlyArray<string>).includes(line.status);
}

/** Calcule les métriques de marge pour une ligne de vente */
export function computeSaleLine(
  line: SaleLineInput,
  product: ProductCostInput,
  cost: ResolvedCost
): ComputedSaleLine {
  const isLinkMe = line.channelId === LINKME_CHANNEL_ID;
  const qty = line.quantity;

  let veroneUnitPrice: number;
  let veroneRevenue: number;
  let clientRevenue: number;
  let affiliateCommission: number;

  if (isLinkMe) {
    veroneUnitPrice = line.basePriceLocked ?? line.unitPriceHt;
    veroneRevenue = veroneUnitPrice * qty;
    clientRevenue = line.totalHt ?? line.unitPriceHt * qty;
    const sellingUnit = line.sellingPriceLocked ?? line.unitPriceHt;
    affiliateCommission =
      line.retrocessionAmount ??
      Math.max(0, sellingUnit - veroneUnitPrice) * qty;
  } else {
    clientRevenue = line.totalHt ?? line.unitPriceHt * qty;
    veroneRevenue = clientRevenue;
    veroneUnitPrice = qty > 0 ? veroneRevenue / qty : line.unitPriceHt;
    affiliateCommission = 0;
  }

  let veroneCommission: number | null = null;
  if (product.createdByAffiliate && isLinkMe) {
    veroneCommission =
      (line.unitPriceHt * qty * (product.affiliateCommissionRate ?? 0)) / 100;
  }

  let marginTotal: number | null = null;
  let marginUnit: number | null = null;
  let marginPercent: number | null = null;
  let coefficient: number | null = null;

  if (!product.createdByAffiliate && cost.cost != null) {
    marginUnit = veroneUnitPrice - cost.cost;
    marginTotal = marginUnit * qty;
    marginPercent =
      veroneRevenue > 0 ? (marginTotal / veroneRevenue) * 100 : null;
    coefficient = cost.cost > 0 ? veroneUnitPrice / cost.cost : null;
  }

  return {
    orderId: line.orderId,
    orderNumber: line.orderNumber,
    orderDate: line.orderDate,
    channelId: line.channelId,
    channelCode: line.channelCode,
    channelName: line.channelName,
    status: line.status,
    quantity: qty,
    isLinkMe,
    veroneUnitPrice,
    veroneRevenue,
    clientRevenue,
    affiliateCommission,
    veroneCommission,
    affiliateId: line.affiliateId,
    affiliateName: line.affiliateName,
    marginTotal,
    marginUnit,
    marginPercent,
    coefficient,
  };
}

/** Synthèse par canal (lignes valides uniquement) */
export function summarizeByChannel(
  lines: ComputedSaleLine[]
): ChannelSummary[] {
  type Acc = {
    channelId: string | null;
    channelCode: string | null;
    channelName: string | null;
    quantity: number;
    veroneRevenue: number;
    marginTotal: number | null;
    marginMissing: boolean;
    orderIds: Set<string>;
  };

  const byChannel = new Map<string, Acc>();

  for (const line of lines) {
    if (!isValidLine(line)) continue;
    const key = line.channelId ?? '__none__';
    const acc = byChannel.get(key);
    if (acc) {
      acc.quantity += line.quantity;
      acc.veroneRevenue += line.veroneRevenue;
      if (line.marginTotal != null && !acc.marginMissing) {
        acc.marginTotal = (acc.marginTotal ?? 0) + line.marginTotal;
      } else if (line.marginTotal == null) {
        acc.marginMissing = true;
      }
      acc.orderIds.add(line.orderId);
    } else {
      byChannel.set(key, {
        channelId: line.channelId,
        channelCode: line.channelCode,
        channelName: line.channelName,
        quantity: line.quantity,
        veroneRevenue: line.veroneRevenue,
        marginTotal: line.marginTotal,
        marginMissing: line.marginTotal == null,
        orderIds: new Set([line.orderId]),
      });
    }
  }

  return Array.from(byChannel.values()).map(ch => ({
    channelId: ch.channelId,
    channelCode: ch.channelCode,
    channelName: ch.channelName,
    quantity: ch.quantity,
    veroneRevenue: ch.veroneRevenue,
    avgVeronePrice: ch.quantity > 0 ? ch.veroneRevenue / ch.quantity : null,
    marginTotal: ch.marginMissing ? null : ch.marginTotal,
    marginPercent:
      !ch.marginMissing && ch.marginTotal != null && ch.veroneRevenue > 0
        ? (ch.marginTotal / ch.veroneRevenue) * 100
        : null,
    orderCount: ch.orderIds.size,
  }));
}

/** Synthèse LinkMe détaillée (lignes valides uniquement) */
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
    marginTotal: number | null;
    marginMissing: boolean;
  };

  let quantity = 0;
  let veroneRevenue = 0;
  let affiliateCommissionTotal = 0;
  let clientRevenue = 0;
  let veroneCommissionTotal = 0;
  let marginTotalAcc: number | null = null;
  let marginMissing = false;
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

    if (line.marginTotal != null && !marginMissing) {
      marginTotalAcc = (marginTotalAcc ?? 0) + line.marginTotal;
    } else if (line.marginTotal == null) {
      marginMissing = true;
    }

    if (line.affiliateId) {
      sellingAffiliateIds.add(line.affiliateId);
      const acc = byAffiliateMap.get(line.affiliateId);
      if (acc) {
        acc.quantity += line.quantity;
        acc.veroneRevenue += line.veroneRevenue;
        if (line.marginTotal != null && !acc.marginMissing) {
          acc.marginTotal = (acc.marginTotal ?? 0) + line.marginTotal;
        } else if (line.marginTotal == null) {
          acc.marginMissing = true;
        }
      } else {
        byAffiliateMap.set(line.affiliateId, {
          affiliateId: line.affiliateId,
          name: line.affiliateName ?? line.affiliateId,
          quantity: line.quantity,
          veroneRevenue: line.veroneRevenue,
          marginTotal: line.marginTotal,
          marginMissing: line.marginTotal == null,
        });
      }
    }
  }

  const finalMarginTotal = marginMissing ? null : marginTotalAcc;
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
      finalMarginTotal != null && veroneRevenue > 0
        ? (finalMarginTotal / veroneRevenue) * 100
        : null,
    affiliateCommissionTotal,
    clientRevenue,
    veroneCommissionTotal,
    orderCount: orderIds.size,
    sellingAffiliateCount: sellingAffiliateIds.size,
    offeringAffiliateCount: options.offeringAffiliateCount,
    byAffiliate: Array.from(byAffiliateMap.values()).map(a => ({
      affiliateId: a.affiliateId,
      name: a.name,
      quantity: a.quantity,
      veroneRevenue: a.veroneRevenue,
      marginTotal: a.marginMissing ? null : a.marginTotal,
    })),
    theoreticalUnitMargin,
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
