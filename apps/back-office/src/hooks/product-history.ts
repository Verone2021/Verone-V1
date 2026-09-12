/**
 * Produit « qui a servi » : présent dans une consultation, une commande
 * fournisseur, une commande client ou un mouvement de stock.
 * Un tel produit se retire, il ne se supprime pas (BO-SOURCING-P3B-001).
 *
 * Module pur (aucun import) pour être testé avec `npx tsx`.
 */

export const PRODUCT_USED_MESSAGE =
  'Ce produit a servi : retirez-le, ne le supprimez pas';

type EmbeddedCount = readonly { count: number }[] | null | undefined;

export interface ProductHistoryRow {
  id: string;
  consultation_products: EmbeddedCount;
  purchase_order_items: EmbeddedCount;
  sales_order_items: EmbeddedCount;
  stock_movements: EmbeddedCount;
}

function embeddedCount(relation: EmbeddedCount): number {
  return relation?.[0]?.count ?? 0;
}

export function productIdsWithHistory(
  rows: readonly ProductHistoryRow[]
): Set<string> {
  const ids = new Set<string>();
  for (const row of rows) {
    const total =
      embeddedCount(row.consultation_products) +
      embeddedCount(row.purchase_order_items) +
      embeddedCount(row.sales_order_items) +
      embeddedCount(row.stock_movements);
    if (total > 0) ids.add(row.id);
  }
  return ids;
}
