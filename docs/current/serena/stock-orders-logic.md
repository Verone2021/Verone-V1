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

- Commande fournisseur **validee** couvre le besoin
- Alerte devient `validated=true` dans `stock_alert_tracking`
- Condition : `stock_forecasted_in > 0` ET `stock_forecasted_out > 0`
- Signifie : PO en transit va couvrir les SO en attente
- L'alerte reste visible en VERT jusqu'a reception physique

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

---

## Mises a jour BO-STOCK-001 a 007 (avril 2026)

### BO-STOCK-001 (PR #623) — Fix RLS silent failure

`update_stock_on_shipment`, `confirm_packlink_shipment_stock`, `handle_shipment_deletion`
passes en `SECURITY DEFINER` + `SET search_path = public`. Avant ce fix, le trigger
echouait silencieusement sur `UPDATE sales_order_items` car la table n'a pas de policy
RLS UPDATE pour les staff. Consequence : stock_real decremente mais `quantity_shipped`
reste a 0 et SO reste en `validated`.

Trigger `trigger_before_delete_shipment` restaure apres disparition non tracee.

### BO-STOCK-002 (PR #624) — Hardening 9 fonctions triggers

- `SECURITY DEFINER` ajoute a 7 fonctions trigger :
  `update_stock_alert_on_movement`, `validate_stock_alerts_on_po`,
  `reverse_stock_on_movement_delete`, `handle_reception_deletion`,
  `reset_stock_alerts_on_po_cancel`, `revalidate_alerts_on_reception`,
  `update_sales_order_affiliate_totals`.
- 2 triggers BEFORE UPDATE restaures : `trigger_before_update_shipment`,
  `trigger_before_update_reception` (ajustement stock sur changement quantity).
- Suppression doublon `trig_recalc_po_totals` (recalcul po totaux 2x).
- Nouveau trigger AFTER INSERT `trigger_so_insert_validated_forecast` pour
  couvrir les SOs creees directement en `validated` (imports Bubble / backfill).

### BO-STOCK-003 (PR #625) — Fix affichage quantite expedition

Modal `/stocks/expeditions` historique : quantite affichee avec prefixe `-` rouge
(avant : `+` vert, incoherent pour une SORTIE de stock).

### BO-STOCK-005 (PR #627) — Restauration regressions A7 + A9

- **A7** : `getSeverityColor()` de `StockAlertCard` lit a nouveau `alert.validated`
  (logique restauree du commit `3afbb41ed` du 7 dec 2025, cassee le 8 dec par
  `9bde76c00`).
- **A9** : bouton "Voir Commande" redirige vers `/commandes/fournisseurs?id=${draft_order_id}`
  (avant : liste sans id, risque de creer PO dupliquee).

### BO-STOCK-006 (PR #628) — Corrections logique DB

- **A6** : `validate_stock_alerts_on_po` filtre maintenant sur `alert_type='out_of_stock'`.
  Avant, toutes les alertes d'un produit passaient `validated=true` lors de la validation
  PO, y compris `low_stock` meme quand previsionnel < min_stock.
- **A3** : suppression du double UPDATE sur `stock_alert_tracking.stock_forecasted_out`
  dans `update_forecasted_out_on_so_validation` + `trigger_so_insert_validated_forecast`.
  `sync_stock_alert_tracking_v4` est maintenant source unique de verite pour les
  snapshots alertes.
- **A5** : helper text "Il manque X unites pour atteindre le seuil minimum" dans
  `QuickPurchaseOrderModal`.

### BO-STOCK-007 (PR #629) — Nouvelles features

- **A2** : composant `StockAlertsBanner` sur la fiche produit onglet Stock.
- **A4** : regroupement des alertes par `product_id` dans `AlertsListCard` —
  une carte par produit avec badges multiples si plusieurs types d'alerte.
- **A8** : nouveau `alert_type='low_stock_forecast'` pour alerter quand
  `stock_real >= min_stock` mais `previsionnel < min_stock` (stock OK mais
  va tomber sous le seuil apres SO validees en attente). Badge ambre
  "Stock minimum anticipe". `validated=true` si
  `stock_forecasted_in >= shortage` (PO couvre le manque).

### BO-STOCK-004 (PR en cours) — Anomalie A1 + restauration docs

- **A1** : `handle_shipment_deletion` rebascule en `partially_shipped` si apres
  DELETE d'un shipment il reste d'autres shipments actifs mais total_shipped <
  total_quantity. Avant, le status restait `shipped` meme si un item devenait
  incomplet.
- Restauration de 6 docs business-rules supprimees dans commits `f48d059bd`
  (14 mars 2026) et `2abd93328` (27 mars 2026) vers `docs/current/business-rules/06-stocks/`.

Voir audit complet : `docs/scratchpad/audit-regressions-stock-alertes-2026-04-17.md`.
