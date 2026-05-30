/**
 * resolveOrderItemTaxRate — résout la TVA d'une ligne de commande pour les
 * documents financiers (devis, facture, proforma) côté UI.
 *
 * RÈGLE CRITIQUE — TVA par ligne (cf. .claude/rules/finance.md R8) :
 * `sales_order_items.tax_rate` EST la source de vérité.
 * `sales_orders.tax_rate` est une colonne historique souvent à 0 sur les
 * commandes B2B / LinkMe (la TVA est portée par chaque article).
 *
 * NE JAMAIS écraser `item.tax_rate` par `order.tax_rate` dans un mapping
 * UI → modal/document, sous peine de produire des factures à 0%.
 *
 * Incident SO-2026-00178 (2026-05-29) : devis D-2026-076 correct à 20%
 * mais le modal facture sortait 0% car le mapping inline utilisait
 * `order.tax_rate ?? 20` (commande avait tax_rate=0).
 */
export function resolveOrderItemTaxRate(
  item: { tax_rate?: number | null },
  order: { tax_rate?: number | null }
): number {
  return item.tax_rate ?? order.tax_rate ?? 0.2;
}
