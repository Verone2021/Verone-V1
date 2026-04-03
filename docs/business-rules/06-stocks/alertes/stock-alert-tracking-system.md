# Systeme Stock Alert Tracking - Architecture Complete

**Module** : Stocks / Alertes
**Date creation** : 2025-11-10
**Derniere MAJ** : 2026-04-02
**Statut** : ACTIF (v4 — migrations 20251208_003/004/005)
**Commit de reference** : `9bde76c0` (8 dec 2025)

---

## Vue d'Ensemble

Le systeme d'alertes de stock repose sur 3 composants :

1. **`stock_alert_tracking`** — table des alertes actives (etat + validation)
2. **`stock_alerts_unified_view`** — vue calculee en temps reel (couleurs)
3. **`sync_stock_alert_tracking_v4()`** — trigger principal sur `products`

---

## Les 2 Types d'Alertes

| Type           | Condition                                   | Necessite min_stock ? | Priorite      |
| -------------- | ------------------------------------------- | --------------------- | ------------- |
| `out_of_stock` | `stock_previsionnel < 0`                    | NON                   | 3 (urgent)    |
| `low_stock`    | `stock_real < min_stock` ET `min_stock > 0` | OUI                   | 2 (important) |

- Un produit peut avoir **les 2 alertes simultanement** (contrainte UNIQUE sur `product_id, alert_type`)
- Les alertes sont **independantes** — `out_of_stock` existe meme si `min_stock = 0`
- `restock_needed` n'existe plus (supprime dec 2025)

### Calcul Stock Previsionnel

```
stock_previsionnel = stock_real + stock_forecasted_in - stock_forecasted_out
```

---

## Workflow : Impact selon le statut de commande

### Commandes Fournisseurs (PO)

```
BROUILLON         → 0 impact stock
VALIDE            → stock_forecasted_in += quantite  (alerte → VERT)
ANNULE            → stock_forecasted_in -= quantite  (rollback)
RECU              → stock_real += quantite, stock_forecasted_in -= quantite
```

### Commandes Clients (SO)

```
BROUILLON         → 0 impact stock
VALIDE            → stock_forecasted_out += quantite (peut creer alerte ROUGE)
ANNULE            → stock_forecasted_out -= quantite (rollback)
EXPEDIE           → stock_real -= quantite, stock_forecasted_out -= quantite
```

### Allers-retours

- Annuler une SO validee → `forecasted_out` diminue → previsionnel remonte → alerte peut disparaitre
- Repasser en brouillon → meme effet que annulation
- Re-valider → `forecasted_out` reaugmente → alerte peut revenir

---

## Cycle de Vie des Alertes (4 couleurs)

```
ROUGE (critical_red)  → previsionnel negatif, aucune PO ne couvre
ORANGE                → previsionnel negatif MAIS un brouillon PO couvre le besoin
VERT (green)          → PO validee en transit (validated=true, forecasted_in > 0)
DISPARUE (resolved)   → stock reel suffisant apres reception
```

### Transitions

1. SO validee avec stock insuffisant → alerte **ROUGE** apparait
2. PO creee en brouillon depuis l'alerte → alerte passe en **ORANGE**
3. PO validee → alerte passe au **VERT** (`validated = true`)
4. Reception confirmee → stock reel augmente → alerte **DISPARAIT**

---

## Table stock_alert_tracking

| Colonne                | Type        | Description                                      |
| ---------------------- | ----------- | ------------------------------------------------ |
| `id`                   | uuid PK     |                                                  |
| `product_id`           | uuid FK     |                                                  |
| `supplier_id`          | uuid FK     |                                                  |
| `alert_type`           | text        | `'low_stock'` ou `'out_of_stock'`                |
| `alert_priority`       | integer     | 2=important (low_stock), 3=urgent (out_of_stock) |
| `stock_real`           | integer     | Snapshot au moment de l'alerte                   |
| `stock_forecasted_in`  | integer     | Snapshot                                         |
| `stock_forecasted_out` | integer     | Snapshot                                         |
| `min_stock`            | integer     | Snapshot                                         |
| `shortage_quantity`    | integer     | Ecart                                            |
| `draft_order_id`       | uuid        | FK vers PO brouillon liee                        |
| `quantity_in_draft`    | integer     | Quantite dans le brouillon PO                    |
| `draft_order_number`   | varchar     | Numero PO brouillon                              |
| `validated`            | boolean     | `false`=ROUGE, `true`=VERT (PO validee)          |
| `validated_at`         | timestamptz |                                                  |
| `validated_by`         | uuid        |                                                  |

**Contrainte** : `UNIQUE (product_id, alert_type)` — max 2 alertes par produit.

---

## Triggers (liste complete)

### Trigger principal — `sync_stock_alert_tracking_v4`

- **Table** : `products` (AFTER INSERT/UPDATE)
- **Logique v4** (depuis dec 2025) :
  - Si `previsionnel < 0` → INSERT/UPDATE alerte `out_of_stock` (validated=false)
  - Si `min_stock > 0 ET stock_real < min_stock` → INSERT/UPDATE alerte `low_stock`
  - Si PO en transit ET SO en attente → passe au VERT (validated=true)
  - Sinon → DELETE alerte (disparait)

### Triggers PO

| Trigger                                          | Fonction                                     | Declencheur                                  |
| ------------------------------------------------ | -------------------------------------------- | -------------------------------------------- |
| `trg_po_validation_forecasted_stock`             | `update_forecasted_stock_on_po_validation`   | PO draft→validated : `forecasted_in += qty`  |
| `trigger_validate_stock_alerts_on_po`            | `validate_stock_alerts_on_po`                | PO draft→validated : alerte `validated=true` |
| `trigger_reset_alerts_on_po_cancel`              | `reset_stock_alerts_on_po_cancel`            | PO annulee : `validated=false`               |
| `trg_stock_alert_tracking_rollback_on_po_cancel` | `rollback_stock_alert_tracking_on_po_cancel` | PO annulee : reset champs draft              |

### Trigger SO

| Trigger                                | Fonction                                     | Declencheur                            |
| -------------------------------------- | -------------------------------------------- | -------------------------------------- |
| `trg_so_devalidation_forecasted_stock` | `rollback_forecasted_out_on_so_devalidation` | SO devalidee : `forecasted_out -= qty` |

### Triggers Notification

| Trigger                                             | Statut        | Role                                                    |
| --------------------------------------------------- | ------------- | ------------------------------------------------------- |
| `trigger_create_notification_on_stock_alert_insert` | **ACTIF**     | Cree notification quand alerte inseree                  |
| `trigger_create_notification_on_stock_alert_update` | **DESACTIVE** | Evite spam lors des mises a jour                        |
| `trigger_stock_negative_forecast_notification`      | **DESACTIVE** | Doublon — creait une 2eme notification (fix BO-STK-001) |

---

## Vue stock_alerts_unified_view

Calcule les alertes en temps reel sans dependre de la synchronisation de `stock_alert_tracking`.

**Conditions d'inclusion** :

- `stock_previsionnel < 0` → `out_of_stock` (pas besoin de `min_stock`)
- `min_stock > 0 AND stock_previsionnel < min_stock` → `low_stock`
- `validated = true AND stock_forecasted_in > 0 AND stock_forecasted_out > 0` → alertes VERTES

**Colonnes cles** : `alert_type`, `alert_color`, `severity`, `is_in_draft`, `validated`

---

## Notifications

Depuis migration BO-STK-001 (avril 2026), **1 seul trigger** cree des notifications stock :

- `create_notification_on_stock_alert()` sur INSERT de `stock_alert_tracking`
- Type : `business`
- URL : `/stocks/alertes`
- Dedup : titre + nom produit, fenetre 24h

---

## Historique

| Date       | Modification                                    | Commit     |
| ---------- | ----------------------------------------------- | ---------- |
| 2025-11-05 | Creation systeme stock_alert_tracking           |            |
| 2025-11-28 | Vue unifiee v1                                  |            |
| 2025-12-08 | Fix VERT + out_of_stock sans min_stock (v4)     | `9bde76c0` |
| 2026-03-05 | Ajout dedup 24h notifications                   |            |
| 2026-04-02 | Fix double notification + URL + dedup amelioree | BO-STK-001 |

---

**Statut** : PRODUCTION-READY
**Version** : 4.0.0
**Mainteneur** : Romeo Dos Santos
