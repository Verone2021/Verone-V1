# Protocole Smoke Tests Stock — Scenario complet 9 etapes

**Sprint** : BO-STOCK-004
**Branche** : `feat/BO-STOCK-004-tests-and-cleanup`
**Date** : 2026-04-17
**Sources de verite** :

- `docs/business-rules/06-stocks/alertes/stock-alert-tracking-system.md` (si encore present)
- `docs/current/database/triggers-stock-reference.md` (48 triggers)
- `docs/current/modules/stock-module-reference.md`

---

## Objectif

Valider le cycle metier complet d'un produit : configuration alerte → commande client → alerte rouge → commande fournisseur → alerte orange → validation PO (alerte verte) → receptions partielles/complete (alerte disparue) → expedition SO → rollback.

Romeo pilote l'UI. L'agent execute les SELECT de verification entre chaque etape et valide la coherence.

---

## Section 1 — Setup

### Pre-requis

- Tous les fixs BO-STOCK-001/002/003 merges sur staging (confirme 2026-04-17)
- Romeo connecte au back-office (`http://localhost:3000`)
- MCP Supabase + Playwright dispo cote agent

### Produit de test

Romeo choisit un produit parmi ceux avec `stock_real` bas (ex: `DEC-0002 Rond paille S` stock=1, `PLA-0002 Plateau bois 30x40` stock=30 etc.).

**Communication attendue** : Romeo donne le SKU choisi en debut de protocole.

### Format des etapes

```
UI : [action que Romeo fait dans l'interface]
SQL : [requete que l'agent execute pour verifier]
Attendu : [etat resultant attendu]
Verdict : PASS / FAIL / ANOMALIE
```

---

## Section 2 — Scenario 9 etapes

### ETAPE 1 — Configuration `min_stock`

**UI** : Romeo va sur la fiche produit (`/produits/catalogue/[id]`) et met `min_stock = stock_real + 5`.

**Exemple** : si `DEC-0002 stock_real=1`, mettre `min_stock=6`.

**SQL verif** :

```sql
SELECT sku, stock_real, min_stock,
       EXISTS(SELECT 1 FROM stock_alert_tracking
              WHERE product_id = p.id AND alert_type = 'low_stock') AS has_low_stock_alert
FROM products p
WHERE p.sku = '<SKU_TESTE>';

-- Alerte attendue
SELECT alert_type, alert_priority, stock_real AS snapshot, shortage_quantity,
       validated, draft_order_id, created_at
FROM stock_alert_tracking
WHERE product_id = (SELECT id FROM products WHERE sku = '<SKU_TESTE>');
```

**Attendu** :

- 1 ligne `stock_alert_tracking` `alert_type='low_stock'`, `alert_priority=2`, `validated=false`
- UI `/stocks/alertes` montre une alerte ROUGE

---

### ETAPE 2 — Creation SO en brouillon

**UI** : Romeo cree une SO via `/commandes/clients/create` ou wizard.

- Client : n'importe quel client existant
- Produit : le SKU teste
- Quantite : `stock_real + 2` (force un forecast negatif si validee)
- Status : laisse en `draft`

**SQL verif** :

```sql
-- Produit snapshot (inchange)
SELECT sku, stock_real, stock_forecasted_out, stock_forecasted_in
FROM products WHERE sku = '<SKU_TESTE>';

-- Nouvelle SO
SELECT order_number, status, total_ht
FROM sales_orders
ORDER BY created_at DESC LIMIT 1;

-- Items
SELECT soi.product_id, soi.quantity, soi.quantity_shipped
FROM sales_order_items soi
WHERE soi.sales_order_id = (SELECT id FROM sales_orders ORDER BY created_at DESC LIMIT 1);
```

**Attendu** :

- `stock_forecasted_out` INCHANGE (SO en draft, pas encore reserve)
- Pas de nouvelle alerte `out_of_stock`
- SO status = `draft`

---

### ETAPE 3 — Validation SO (`draft -> validated`)

**UI** : Romeo ouvre la SO et clique "Valider".

**SQL verif** :

```sql
-- Produit apres validation
SELECT sku, stock_real, stock_forecasted_out, stock_forecasted_in,
       (stock_real + stock_forecasted_in - stock_forecasted_out) AS previsionnel
FROM products WHERE sku = '<SKU_TESTE>';

-- SO status
SELECT order_number, status FROM sales_orders
WHERE id = '<SO_ID>';

-- Alertes actives
SELECT alert_type, alert_priority, stock_real AS snapshot, shortage_quantity
FROM stock_alert_tracking
WHERE product_id = (SELECT id FROM products WHERE sku = '<SKU_TESTE>')
ORDER BY alert_priority DESC;
```

**Attendu** :

- `stock_forecasted_out += quantity` de la SO
- `previsionnel` devient negatif (car qty > stock_real)
- 2e ligne `stock_alert_tracking` `alert_type='out_of_stock'` `alert_priority=3`
- Ligne `low_stock` reste
- SO status = `validated`

**Test critique trigger** : `trigger_so_update_forecasted_out` (SECURITY DEFINER post BO-STOCK-002) + `sync_stock_alert_tracking_v4`.

---

### ETAPE 4 — Creation PO en brouillon depuis l'alerte

**UI** : Romeo va sur `/stocks/alertes`, clique sur l'alerte rouge, bouton "Creer PO".

- Fournisseur : un fournisseur actif
- Produit pre-rempli + qty proposee (doit etre >= shortage)
- Sauvegarde en draft (ne pas valider)

**SQL verif** :

```sql
-- PO creee (draft)
SELECT po_number, status, supplier_id FROM purchase_orders
ORDER BY created_at DESC LIMIT 1;

-- Items PO
SELECT product_id, quantity FROM purchase_order_items
WHERE purchase_order_id = (SELECT id FROM purchase_orders ORDER BY created_at DESC LIMIT 1);

-- Stock alert tracking mis a jour
SELECT alert_type, validated, draft_order_id, draft_order_number, quantity_in_draft
FROM stock_alert_tracking
WHERE product_id = (SELECT id FROM products WHERE sku = '<SKU_TESTE>');

-- Produit (stock inchange, pas encore validated)
SELECT stock_forecasted_in FROM products WHERE sku = '<SKU_TESTE>';
```

**Attendu** :

- PO status = `draft`
- `stock_forecasted_in` INCHANGE (PO pas encore validated)
- `stock_alert_tracking.draft_order_id` pointe vers la nouvelle PO
- `draft_order_number`, `quantity_in_draft`, `added_to_draft_at` remplis
- `validated` = false
- Alerte passe a ORANGE dans l'UI (cote app, condition `is_in_draft`)

**Test critique trigger** : `track_product_added_to_draft` sur `purchase_order_items`.

---

### ETAPE 5 — Validation PO (`draft -> validated`)

**UI** : Romeo valide la PO.

**SQL verif** :

```sql
-- Produit
SELECT sku, stock_real, stock_forecasted_out, stock_forecasted_in,
       (stock_real + stock_forecasted_in - stock_forecasted_out) AS previsionnel
FROM products WHERE sku = '<SKU_TESTE>';

-- PO
SELECT po_number, status FROM purchase_orders WHERE id = '<PO_ID>';

-- Alertes
SELECT alert_type, validated, validated_at, draft_order_id
FROM stock_alert_tracking
WHERE product_id = (SELECT id FROM products WHERE sku = '<SKU_TESTE>');
```

**Attendu** :

- `stock_forecasted_in += quantity` de la PO
- `previsionnel` remonte, devient >= 0
- PO status = `validated`
- `stock_alert_tracking.validated = true` (via `validate_stock_alerts_on_po` post BO-STOCK-002 SECURITY DEFINER)
- `draft_order_id` remis a NULL (PO plus en draft)
- Si `previsionnel >= min_stock` : alerte `out_of_stock` DISPARAIT
- Alerte `low_stock` reste (car `stock_real` toujours < `min_stock`)
- UI : alerte passe en VERT

**Tests critiques triggers** :

- `trigger_po_update_forecasted_in` / `update_forecasted_stock_on_po_validation`
- `trigger_validate_stock_alerts_on_po` (post BO-STOCK-002 SECURITY DEFINER)

---

### ETAPE 6 — Reception PO partielle

**UI** : Romeo va sur `/stocks/receptions`, ouvre la PO, receptionne la moitie des qty.

**SQL verif** :

```sql
-- Produit
SELECT sku, stock_real, stock_forecasted_in FROM products WHERE sku = '<SKU_TESTE>';

-- PO
SELECT po_number, status FROM purchase_orders WHERE id = '<PO_ID>';

-- Items PO
SELECT product_id, quantity, quantity_received FROM purchase_order_items
WHERE purchase_order_id = '<PO_ID>';

-- Reception creee
SELECT reception_number, status, quantity_received FROM purchase_order_receptions
WHERE purchase_order_id = '<PO_ID>'
ORDER BY created_at DESC LIMIT 1;

-- Stock movement
SELECT movement_type, quantity_change, affects_forecast, reference_type
FROM stock_movements
WHERE reference_type = 'reception'
  AND reference_id = '<RECEPTION_ID>';
```

**Attendu** :

- `stock_real += qty recue`
- `stock_forecasted_in -= qty recue`
- PO status = `partially_received`
- 1 `stock_movements` `movement_type='IN'` `affects_forecast=false`
- 1 `purchase_order_receptions` status `received`

**Tests critiques triggers** :

- `trigger_reception_update_stock` / `update_stock_on_reception`
- `trg_sync_product_stock_after_movement`

---

### ETAPE 7 — Reception PO complete

**UI** : Romeo receptionne le reste des qty.

**SQL verif** :

```sql
SELECT sku, stock_real, stock_forecasted_in, min_stock FROM products WHERE sku = '<SKU_TESTE>';

SELECT po_number, status FROM purchase_orders WHERE id = '<PO_ID>';

SELECT alert_type, validated, created_at
FROM stock_alert_tracking
WHERE product_id = (SELECT id FROM products WHERE sku = '<SKU_TESTE>');
```

**Attendu** :

- `stock_real += reste`
- `stock_forecasted_in = 0`
- PO status = `received`
- Si `stock_real >= min_stock` : alerte `low_stock` DISPARAIT
- Sinon : alerte `low_stock` reste (mais `validated` toujours true)

**Tests critiques triggers** :

- `trigger_po_received_notification`
- `sync_stock_alert_tracking_v4`
- `revalidate_alerts_on_reception` (post BO-STOCK-002 SECURITY DEFINER)

---

### ETAPE 8 — Expedition SO

**UI** : Romeo va sur `/stocks/expeditions`, ouvre la SO, clique "Expedier" -> mode "Expedition manuelle" -> valider.

**SQL verif** :

```sql
SELECT sku, stock_real, stock_forecasted_out FROM products WHERE sku = '<SKU_TESTE>';

SELECT order_number, status, shipped_at FROM sales_orders WHERE id = '<SO_ID>';

SELECT product_id, quantity, quantity_shipped FROM sales_order_items
WHERE sales_order_id = '<SO_ID>';

SELECT id, delivery_method, carrier_name, quantity_shipped, shipped_at
FROM sales_order_shipments
WHERE sales_order_id = '<SO_ID>';

SELECT movement_type, quantity_change, affects_forecast
FROM stock_movements
WHERE reference_type = 'shipment'
  AND reference_id IN (SELECT id FROM sales_order_shipments WHERE sales_order_id = '<SO_ID>');

-- Alertes apres expedition
SELECT alert_type, validated FROM stock_alert_tracking
WHERE product_id = (SELECT id FROM products WHERE sku = '<SKU_TESTE>');
```

**Attendu** :

- `stock_real -= quantity`
- `stock_forecasted_out -= quantity` (retombe a 0 pour cette SO)
- `sales_order_items.quantity_shipped = quantity` (fix BO-STOCK-001)
- SO status = `shipped`
- 1 `stock_movements` `movement_type='OUT'` `affects_forecast=false`
- 1 `sales_order_shipments` `delivery_method='manual'`
- Si nouveau `stock_real < min_stock` : alerte `low_stock` REAPPARAIT
- **UI modal historique** (`/stocks/expeditions` -> Historique -> Voir details) : quantite affichee en **-N** rouge (fix BO-STOCK-003)

**Tests critiques triggers** :

- `trigger_shipment_update_stock` / `update_stock_on_shipment` (post BO-STOCK-001 SECURITY DEFINER)
- `sync_stock_alert_tracking_v4`

---

### ETAPE 9 — Remise en etat d'origine

**UI/SQL** :

- DELETE tous les shipments de la SO test (via SQL ou UI si dispo)
- DELETE reception SQL ou annuler PO (`status='cancelled'`)
- Passer SO en `cancelled` OU supprimer la SO test (selon preference Romeo)
- Remettre `min_stock` a valeur initiale

**SQL verif final** :

```sql
SELECT sku, stock_real, stock_forecasted_in, stock_forecasted_out, min_stock
FROM products WHERE sku = '<SKU_TESTE>';

SELECT COUNT(*) AS nb_alerts FROM stock_alert_tracking
WHERE product_id = (SELECT id FROM products WHERE sku = '<SKU_TESTE>');
```

**Attendu** :

- `stock_real` = valeur initiale
- `stock_forecasted_in` = 0
- `stock_forecasted_out` = 0
- `min_stock` = valeur initiale
- `stock_alert_tracking` vide pour ce produit

**Tests critiques triggers** :

- `handle_shipment_deletion` (post BO-STOCK-001 SECURITY DEFINER + restauree)
- `handle_reception_deletion` (post BO-STOCK-002 SECURITY DEFINER)
- `rollback_so_forecasted` / `rollback_po_forecasted`
- `reset_stock_alerts_on_po_cancel` (post BO-STOCK-002 SECURITY DEFINER)

---

## Section 3 — Scenarios BONUS

A executer si le scenario principal passe sans probleme et qu'il reste du temps.

### BONUS A — Devalidation SO (`validated -> draft`)

**UI** : sur une SO validated non expediee, clic "Devalider".
**Attendu** : `stock_forecasted_out -= quantity` (rollback via `trg_so_devalidation_forecasted_stock`).

### BONUS B — Annulation PO validated

**UI** : sur une PO validated non recue, clic "Annuler".
**Attendu** : `stock_forecasted_in -= quantity` + alerte `validated` remise a `false` (via `reset_stock_alerts_on_po_cancel` + `rollback_stock_alert_tracking_on_po_cancel`).

### BONUS C — Changement qty sur item de SO validated

**UI** : modifier la quantite d'un item sur une SO deja validated.
**Attendu** : `stock_forecasted_out` ajuste du delta (via `handle_so_item_quantity_change_confirmed`).

### BONUS D — SO creee directement validated (test trigger BO-STOCK-002)

**SQL** :

```sql
-- Simuler import Bubble : INSERT direct en validated
INSERT INTO sales_orders (...) VALUES (..., 'validated');
-- Puis INSERT items
-- Attendu : trigger_so_insert_validated_forecast tourne et incremente forecasted_out
```

---

## Section 4 — Rapport final

Format attendu : `docs/scratchpad/resultats-tests-stock-complet-YYYY-MM-DD.md`

Pour chaque etape :

- Verdict : PASS / FAIL / ANOMALIE
- Diff SQL avant/apres
- Screenshots UI (avant action + apres action)
- Anomalies (criticite + description)

**Verdict global** : PASS si 9/9 etapes OK. Sinon FAIL avec plan correctif.

---

## Checklist execution

- [ ] ETAPE 1 : Configuration min_stock -> alerte ROUGE
- [ ] ETAPE 2 : SO draft -> aucun impact
- [ ] ETAPE 3 : SO validated -> forecasted_out + alerte out_of_stock
- [ ] ETAPE 4 : PO draft -> alerte ORANGE (draft_order_id rempli)
- [ ] ETAPE 5 : PO validated -> forecasted_in + alerte VERT
- [ ] ETAPE 6 : Reception partielle -> stock_real partiel
- [ ] ETAPE 7 : Reception complete -> alerte DISPARUE
- [ ] ETAPE 8 : Expedition SO -> status shipped + affichage -N
- [ ] ETAPE 9 : Remise etat d'origine -> tout a 0
- [ ] BONUS A/B/C/D selon temps dispo

---

**Contacts** : Romeo pilote UI, agent execute SELECT + screenshots Playwright + rapport.
