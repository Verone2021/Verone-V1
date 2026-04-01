# Logique Stock et Commandes

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- packages/@verone/stock/src/
- packages/@verone/orders/src/
- supabase/migrations/
  Owner: Romeo Dos Santos
  Created: 2025-11-27
  Updated: 2026-01-10

---

## Stock Reel vs Previsionnel

### Stock Reel

Mise a jour **UNIQUEMENT** lors reception/expedition physique :

- Reception fournisseur → `stock_real += quantite`
- Expedition client → `stock_real -= quantite`

### Stock Previsionnel

Mise a jour lors confirmation commande :

- Confirmation PO → `stock_forecasted_in += quantite`
- Confirmation SO → `stock_forecasted_out += quantite`
- Reception PO → `stock_forecasted_in -= quantite_recue`
- Expedition SO → `stock_forecasted_out -= quantite_expediee`

### Calcul Stock Previsionnel

```sql
stock_previsionnel = stock_real - stock_forecasted_out + stock_forecasted_in
```

---

## Workflow Alertes - 3 Etats

### ROUGE (Alerte active)

- `low_stock` : `stock_real < min_stock`
- `out_of_stock` : `previsionnel < 0`
- Les 2 peuvent coexister

### VERT (Commande en cours)

- Commande fournisseur confirmee couvre le besoin
- Alerte devient `validated=true`

### DISPARUE (Historique)

- Reception physique complete
- `stock_real >= min_stock` ET `previsionnel >= 0`

---

## Triggers Sales Orders (Actifs)

| Trigger                             | Fonction                          | Role                                            |
| ----------------------------------- | --------------------------------- | ----------------------------------------------- |
| `sales_order_status_change_trigger` | `handle_sales_order_confirmation` | Appelle `create_sales_order_forecast_movements` |
| `trigger_so_update_forecasted_out`  | `update_so_forecasted_out`        | MAJ `products.stock_forecasted_out`             |
| `trigger_so_cancellation_rollback`  | `rollback_so_forecasted`          | Rollback forecast si annule                     |

---

## Chaine Complete Validation SO

1. UI clique "Valider" → Server Action `updateSalesOrderStatus`
2. UPDATE `sales_orders` SET `status = 'validated'`
3. Trigger `sales_order_status_change_trigger` → `handle_sales_order_confirmation()`
4. Appelle `create_sales_order_forecast_movements(NEW.id)`
5. INSERT `stock_movements` avec `affects_forecast=true`, `quantity_change=-qty`
6. Trigger `trigger_so_update_forecasted_out` → `update_so_forecasted_out()`
7. UPDATE `products` SET `stock_forecasted_out += quantity`
8. Trigger `trg_update_stock_alert` → Recalcule alertes si necessaire

---

## Rollback Annulations

- PO annulee → `stock_forecasted_in -= quantite`
- SO annulee → `stock_forecasted_out -= quantite`
- **Regle absolue** : Commandes `received` ou `shipped` ne peuvent PAS etre annulees

---

## Contrainte Critique

```sql
-- Contrainte valid_quantity_logic
-- quantity_change doit etre NEGATIF pour les sorties
INSERT INTO stock_movements SET quantity_change = -v_item.quantity  -- CORRECT
INSERT INTO stock_movements SET quantity_change = v_item.quantity   -- ERREUR
```

---

## Regles Absolues

1. **JAMAIS** modifier stock_real sans mouvement physique
2. **TOUJOURS** utiliser quantity_change negatif pour sorties
3. **JAMAIS** annuler une commande received/shipped

---

## References

- `packages/@verone/stock/src/` - Composants stock
- `packages/@verone/orders/src/` - Composants commandes
- `docs/current/serena/database-implementation.md` - Triggers DB
