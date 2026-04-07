# INTERDIT ABSOLU : Triggers Stock et Alertes

## JAMAIS modifier les triggers et fonctions suivants

Ces triggers ont été validés et testés. Ils sont PROTÉGÉS comme les routes Qonto.
Toute modification casse systématiquement le stock prévisionnel et les alertes.

### Fonctions IMMUABLES (sales_orders)

- `update_forecasted_out_on_so_validation` — stock prévisionnel sortant à la validation SO
- `rollback_forecasted_out_on_so_devalidation` — rollback stock prévisionnel SO dévalidation
- `rollback_so_forecasted` — rollback stock prévisionnel SO annulation
- `handle_sales_order_confirmation` — crée les stock_movements forecast
- `create_sales_order_forecast_movements` — helper pour stock_movements forecast
- `prevent_so_direct_cancellation` — empêche annulation directe

### Fonctions IMMUABLES (purchase_orders)

- `update_forecasted_stock_on_po_validation` — stock prévisionnel entrant PO (validation + dévalidation + annulation)
- `validate_stock_alerts_on_po` — passage alerte ROUGE → VERT
- `rollback_validated_to_draft_tracking` — rollback alertes PO dévalidation

### Fonctions IMMUABLES (shipments/receptions)

- `update_stock_on_shipment` — stock réel sortant (expédition SO)
- `confirm_packlink_shipment_stock` — stock après paiement Packlink
- `update_stock_on_reception` — stock réel entrant (réception PO)
- `handle_purchase_order_reception_validation` — validation réception PO

### Fonctions IMMUABLES (alertes)

- Tout trigger sur `stock_alert_tracking`
- `handle_so_item_quantity_change_confirmed` — ajustement quantité SO validée
- `handle_po_item_quantity_change_confirmed` — ajustement quantité PO validée

## Pourquoi cette protection ?

Le 28 novembre 2025, un agent a supprimé `trigger_po_cancellation_rollback` en le qualifiant de "redondant".
Il ne l'était PAS. Résultat : les PO annulées ne rollbackaient plus le stock prévisionnel.

Ce bug est resté invisible pendant 4 mois jusqu'à l'audit du 7 avril 2026.

## Si un agent veut modifier le stock

1. **REFUSER** et rediriger vers Romeo
2. Citer cette règle
3. Rappeler le bug du 28 novembre 2025
