# Sales Orders - Logique Stock Complète (2025-11-27)

## Résumé

Fix du bug de validation des commandes clients + Documentation complète de la logique métier stock.

## Bug Corrigé

**Erreur** : `violates check constraint "valid_quantity_logic"`
**Cause** : `create_sales_order_forecast_movements` insérait `quantity_change = v_item.quantity` (positif)
**Fix** : Migration `fix_sales_order_forecast_movements_negative_quantity` → `-v_item.quantity` (négatif)

---

## Logique Métier Complète

### 1. Alertes - Peuvent Coexister

- Un produit peut avoir 2 alertes simultanées : `low_stock` + `out_of_stock`
- Priorité : `out_of_stock` (P3 - critique) > `low_stock` (P2 - important)

### 2. Workflow Alertes - 3 États

**🔴 ROUGE (Alerte active)** :

- `low_stock` : `stock_real < min_stock`
- `out_of_stock` : `prévisionnel < 0`
- Les 2 peuvent coexister

**🟢 VERT (Commande en cours)** :

- Commande fournisseur confirmée couvre le besoin
- Alerte devient `validated=true`

**✅ DISPARUE (Historique)** :

- Réception physique complète
- `stock_real >= min_stock` ET `prévisionnel >= 0`

### 3. Stock Réel vs Prévisionnel

**STOCK RÉEL** (mise à jour UNIQUEMENT lors réception/expédition physique) :

- Réception fournisseur → `stock_real += quantité`
- Expédition client → `stock_real -= quantité`

**STOCK PRÉVISIONNEL** (mise à jour lors confirmation commande) :

- Confirmation PO → `stock_forecasted_in += quantité`
- Confirmation SO → `stock_forecasted_out += quantité`
- Réception PO → `stock_forecasted_in -= quantité_reçue`
- Expédition SO → `stock_forecasted_out -= quantité_expédiée`

### 4. Calcul Stock Prévisionnel

```sql
stock_prévisionnel = stock_real - stock_forecasted_out + stock_forecasted_in
```

### 5. Rollback Annulations

- PO annulée → `stock_forecasted_in -= quantité`
- SO annulée → `stock_forecasted_out -= quantité`
- **Règle absolue** : Commandes `received` ou `shipped` ne peuvent PAS être annulées

---

## Triggers Sales Orders (Actifs)

| Trigger                             | Fonction                          | Rôle                                            |
| ----------------------------------- | --------------------------------- | ----------------------------------------------- |
| `sales_order_status_change_trigger` | `handle_sales_order_confirmation` | Appelle `create_sales_order_forecast_movements` |
| `trigger_so_update_forecasted_out`  | `update_so_forecasted_out`        | MAJ `products.stock_forecasted_out`             |
| `trigger_so_cancellation_rollback`  | `rollback_so_forecasted`          | Rollback forecast si annulé                     |

---

## Chaîne Complète Validation SO

1. UI clique "Valider" → Server Action `updateSalesOrderStatus`
2. UPDATE `sales_orders` SET `status = 'validated'`
3. Trigger `sales_order_status_change_trigger` → `handle_sales_order_confirmation()`
4. Appelle `create_sales_order_forecast_movements(NEW.id)`
5. INSERT `stock_movements` avec `affects_forecast=true`, `quantity_change=-qty`
6. Trigger `trigger_so_update_forecasted_out` → `update_so_forecasted_out()`
7. UPDATE `products` SET `stock_forecasted_out += quantity`
8. Trigger `trg_update_stock_alert` → Recalcule alertes si nécessaire

---

## Validation Test (2025-11-27)

- ✅ SO-2025-00049 validée avec succès
- ✅ Mouvement `sales_order_forecast` créé avec `quantity_change = -10`
- ✅ `products.stock_forecasted_out = 10` (mis à jour)
- ✅ Stock prévisionnel = 0 - 10 + 0 = -10 (négatif → alerte out_of_stock attendue)
