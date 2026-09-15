/**
 * performance-analytics-aggregations — fonctions pures d'agrégation
 * pour les analytics LinkMe. Aucun effet de bord, testables unitairement.
 */

import type {
  AffiliateListItem,
  SelectionListItem,
  TopProduct,
} from './performance-analytics-types';
import type {
  RawCommission,
  RawOrderItem,
} from './performance-analytics-fetchers';

// ---------------------------------------------------------------------------
// KPIs globaux
// ---------------------------------------------------------------------------

export interface KPIResult {
  totalOrders: number;
  totalRevenueHT: number;
  totalCommissionsTTC: number;
  averageBasket: number;
}

export function calcKPIs(commissions: RawCommission[]): KPIResult {
  const totalOrders = commissions.length;
  const totalRevenueHT = commissions.reduce(
    (sum, c) => sum + (c.order_amount_ht ?? 0),
    0
  );
  const totalCommissionsTTC = commissions.reduce(
    (sum, c) => sum + (c.affiliate_commission_ttc ?? 0),
    0
  );
  const averageBasket = totalOrders > 0 ? totalRevenueHT / totalOrders : 0;
  return { totalOrders, totalRevenueHT, totalCommissionsTTC, averageBasket };
}

// ---------------------------------------------------------------------------
// Top produits
// ---------------------------------------------------------------------------

export function aggregateTopProducts(
  orderItemsData: RawOrderItem[],
  productImages: Map<string, string>
): TopProduct[] {
  const productMap = new Map<
    string,
    {
      id: string;
      name: string;
      sku: string;
      imageUrl: string | null;
      quantitySold: number;
      totalRevenueHT: number;
      orderIds: Set<string>;
    }
  >();

  orderItemsData.forEach(item => {
    const product = item.product as {
      id: string;
      name: string;
      sku: string;
    } | null;
    if (!product) return;

    const existing = productMap.get(product.id);
    if (existing) {
      existing.quantitySold += item.quantity ?? 0;
      existing.totalRevenueHT += item.total_ht ?? 0;
      existing.orderIds.add(item.sales_order_id);
    } else {
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
        sku: product.sku ?? '-',
        imageUrl: productImages.get(product.id) ?? null,
        quantitySold: item.quantity ?? 0,
        totalRevenueHT: item.total_ht ?? 0,
        orderIds: new Set([item.sales_order_id]),
      });
    }
  });

  return Array.from(productMap.values())
    .map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      imageUrl: p.imageUrl,
      quantitySold: p.quantitySold,
      totalRevenueHT: p.totalRevenueHT,
      ordersCount: p.orderIds.size,
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Agrégation par affilié
// ---------------------------------------------------------------------------

export function aggregateByAffiliate(
  commissions: RawCommission[]
): AffiliateListItem[] {
  const affiliateMap = new Map<string, AffiliateListItem>();

  commissions.forEach(c => {
    const affiliate = c.affiliate as {
      id: string;
      display_name: string;
      slug: string;
    } | null;
    if (!affiliate) return;

    const existing = affiliateMap.get(affiliate.id);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalRevenueHT += c.order_amount_ht ?? 0;
      existing.totalCommissionsTTC += c.affiliate_commission_ttc ?? 0;
    } else {
      affiliateMap.set(affiliate.id, {
        id: affiliate.id,
        displayName: affiliate.display_name,
        slug: affiliate.slug ?? '',
        ordersCount: 1,
        totalRevenueHT: c.order_amount_ht ?? 0,
        totalCommissionsTTC: c.affiliate_commission_ttc ?? 0,
      });
    }
  });

  return Array.from(affiliateMap.values()).sort(
    (a, b) => b.totalRevenueHT - a.totalRevenueHT
  );
}

// ---------------------------------------------------------------------------
// Agrégation par sélection
// ---------------------------------------------------------------------------

export function aggregateBySelection(
  commissions: RawCommission[]
): SelectionListItem[] {
  const selectionMap = new Map<string, SelectionListItem>();

  commissions.forEach(c => {
    const selection = c.selection as {
      id: string;
      name: string;
      slug: string;
      products_count: number;
    } | null;
    const affiliate = c.affiliate as {
      id: string;
      display_name: string;
    } | null;
    if (!selection) return;

    const existing = selectionMap.get(selection.id);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalRevenueHT += c.order_amount_ht ?? 0;
      existing.totalCommissionsTTC += c.affiliate_commission_ttc ?? 0;
    } else {
      selectionMap.set(selection.id, {
        id: selection.id,
        name: selection.name,
        slug: selection.slug ?? '',
        affiliateId: affiliate?.id ?? '',
        affiliateName: affiliate?.display_name ?? 'Inconnu',
        ordersCount: 1,
        totalRevenueHT: c.order_amount_ht ?? 0,
        totalCommissionsTTC: c.affiliate_commission_ttc ?? 0,
        productsCount: selection.products_count ?? 0,
      });
    }
  });

  return Array.from(selectionMap.values()).sort(
    (a, b) => b.totalRevenueHT - a.totalRevenueHT
  );
}

// ---------------------------------------------------------------------------
// Context info (nom affilié/sélection depuis commissions)
// ---------------------------------------------------------------------------

export function extractContextNames(
  commissions: RawCommission[],
  affiliateId?: string,
  selectionId?: string
): { affiliateName?: string; selectionName?: string } {
  if (commissions.length === 0) return {};

  const firstCommission = commissions[0];
  let affiliateName: string | undefined;
  let selectionName: string | undefined;

  if (affiliateId) {
    const affiliate = firstCommission.affiliate as {
      display_name: string;
    } | null;
    affiliateName = affiliate?.display_name;
  }

  if (selectionId) {
    const selection = firstCommission.selection as { name: string } | null;
    selectionName = selection?.name;
  }

  return { affiliateName, selectionName };
}
