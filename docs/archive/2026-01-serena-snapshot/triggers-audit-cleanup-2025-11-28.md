# Audit Triggers Désactivés - 2025-11-28

## Contexte

Suite à la correction du bug des badges orange (PO validation), un audit complet des 8 triggers désactivés a été réalisé.

## Résultats de l'Audit

### ✅ TRIGGERS RÉACTIVÉS (4) - Critiques pour intégrité données

| Trigger                                            | Table                | Fonction                                 | Raison réactivation                      |
| -------------------------------------------------- | -------------------- | ---------------------------------------- | ---------------------------------------- |
| `trigger_update_cost_price_from_po`                | purchase_order_items | update_product_cost_price_from_po        | Met à jour cost_price produit (LPP)      |
| `trigger_handle_po_deletion`                       | purchase_orders      | handle_po_deletion                       | Rollback stock + alertes si PO supprimée |
| `trigger_handle_so_item_quantity_change_confirmed` | sales_order_items    | handle_so_item_quantity_change_confirmed | Ajuste forecasted_out si qté modifiée    |
| `sales_order_shipment_trigger`                     | sales_orders         | handle_sales_order_shipment              | Crée mouvements stock OUT (stock_real)   |

### ❌ TRIGGERS SUPPRIMÉS (2) - Doublons redondants

| Trigger                                | Raison suppression                                   |
| -------------------------------------- | ---------------------------------------------------- |
| `purchase_order_status_change_trigger` | Doublon de `trg_po_validation_forecasted_stock`      |
| `trigger_po_cancellation_rollback`     | Triple redondance avec triggers annulation PO actifs |

### 🔇 TRIGGERS GARDÉS DÉSACTIVÉS (2) - Notifications non critiques

| Trigger                                             | Raison                        |
| --------------------------------------------------- | ----------------------------- |
| `trigger_po_created_notification`                   | Génère du bruit, non critique |
| `trigger_create_notification_on_stock_alert_update` | INSERT trigger suffit         |

## Migrations Appliquées

1. `20251128_008_fix_po_validation_clear_draft_fields.sql` - Fix badge orange validation PO
2. `20251128_009_audit_disabled_triggers_cleanup.sql` - Audit et nettoyage triggers

## Impact Business

- **Prix de revient** : Maintenant mis à jour automatiquement lors réception PO
- **Stock réel** : Déduit automatiquement lors expédition SO (était cassé !)
- **Intégrité données** : Rollback correct si suppression/modification PO/SO validées
- **Performance** : 2 triggers redondants supprimés (moins de charge DB)

## Référence

- Migration: `supabase/migrations/20251128_009_audit_disabled_triggers_cleanup.sql`
- Plan: `.claude/plans/delegated-swimming-lantern.md`
