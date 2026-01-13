# Triggers Réactivation - Plan 2025-11-27

## Contexte

Suite à l'audit complet des 158 triggers PostgreSQL, réactivation des triggers critiques
alignée sur les bonnes pratiques Odoo/SAP.

## Principe Notification ERP

- 🔴 **Urgent** → Action requise immédiate (dans cloche)
- 🟠 **Important** → Information métier clé (dans cloche)
- 🔵 **Info** → Traçabilité (audit trail uniquement, PAS dans cloche)

> "Too many notifications kill the information" - Odoo

## Migration Appliquée: 20251127_002_reactivate_critical_triggers.sql

### Triggers Techniques Réactivés (4)

| Trigger                         | Table                 | Rôle                 |
| ------------------------------- | --------------------- | -------------------- |
| `trigger_shipment_update_stock` | sales_order_shipments | MAJ stock expédition |
| `purchase_orders_updated_at`    | purchase_orders       | Timestamp auto       |
| `audit_purchase_orders`         | purchase_orders       | Audit trail          |
| `audit_stock_movements`         | stock_movements       | Audit trail          |

### Notifications Urgentes 🔴 (2)

| Trigger                                             | Table                | Notification          |
| --------------------------------------------------- | -------------------- | --------------------- |
| `trigger_create_notification_on_stock_alert_insert` | stock_alert_tracking | Alerte stock critique |
| `trigger_po_delayed_notification`                   | purchase_orders      | PO en retard          |

### Notifications Importantes 🟠 (2)

| Trigger                                    | Table           | Notification        |
| ------------------------------------------ | --------------- | ------------------- |
| `trigger_po_received_notification`         | purchase_orders | Réception complète  |
| `trigger_po_partial_received_notification` | purchase_orders | Réception partielle |

### Doublons Supprimés (1)

- `trigger_purchase_orders_updated_at` (doublon de `purchase_orders_updated_at`)

### Triggers NON Activés (Info → Audit Trail)

- `trigger_po_created_notification` → Trop de bruit
- `trigger_create_notification_on_stock_alert_update` → Trop de bruit

## Notifications Sales Orders (Déjà Actifs)

- ✅ `trigger_order_confirmed_notification`
- ✅ `trigger_order_shipped_notification`
- ✅ `trigger_payment_received_notification`
- ✅ `trigger_order_cancelled_notification`

## Statut Final

- **Total triggers**: 158
- **Enabled**: 143 (90.5%)
- **Disabled**: 15 (9.5%)

## Sources Best Practices

- Odoo: https://www.odoo.com/forum/help-1/what-are-alerts-in-purchasing-3811
- SAP S/4HANA: https://help.sap.com/docs/buying-invoicing/notifications-reference-guide
