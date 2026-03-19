# Glossaire des Champs Prix/Commission LinkMe

**Version** : 1.0.0 (2026-03-18)
**Status** : Source de verite

## Modele Metier (Additif)

```
Prix selection (Verone)  :  450,00 EUR  (selling_price_ht)
Commission 10% de 450   :   45,00 EUR  (margin_rate = 10)
-------------------------------------
Prix client final        :  495,00 EUR  (unit_price_ht dans la commande)

Verone encaisse          :  450,00 EUR
Affilie gagne            :   45,00 EUR
```

---

## Table `channel_pricing` (Catalogue LinkMe)

| Champ DB                  | Nom Metier                 | Role                                                                           |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| `custom_price_ht`         | Prix catalogue Verone HT   | Prix de vente Verone dans le catalogue LinkMe. Source de verite pour les prix. |
| `public_price_ht`         | Prix public HT (indicatif) | Prix indicatif, NE sert PAS au calcul. Affichage uniquement.                   |
| `channel_commission_rate` | Taux commission canal      | Commission Verone sur produits utilisateurs (15%). 0% pour produits catalogue. |

## Table `linkme_selection_items` (Selection affilie)

| Champ DB           | Nom Metier                    | Role                                                              | Exemple |
| ------------------ | ----------------------------- | ----------------------------------------------------------------- | ------- |
| `base_price_ht`    | Prix base selection           | Prix de base Verone (depuis channel_pricing).                     | 450 EUR |
| `margin_rate`      | Taux commission affilie (%)   | Pourcentage que l'affilie ajoute EN PLUS du prix Verone. Additif. | 10.00   |
| `selling_price_ht` | Prix Verone dans la selection | GENERATED = `base_price_ht * (1 + margin_rate / 100)`.            | 495 EUR |

> Migration `20260318200000_switch_to_additive_margin_model.sql` : formule GENERATED column = `base * (1 + margin_rate/100)`.

## Table `sales_order_items` (Ligne de commande)

| Champ DB                   | Nom Metier                | Role                                                      | Valeur correcte |
| -------------------------- | ------------------------- | --------------------------------------------------------- | --------------- |
| `unit_price_ht`            | Prix client HT unitaire   | Ce que le client paie = selling_price \* (1 + margin/100) | 495 EUR         |
| `total_ht`                 | Total HT ligne            | `unit_price_ht * quantity`                                | 495 EUR         |
| `retrocession_rate`        | Taux commission (decimal) | `margin_rate / 100`. Stocke en decimal.                   | 0.10            |
| `retrocession_amount`      | Commission affilie (EUR)  | `selling_price_ht * margin_rate/100 * quantity`           | 45 EUR          |
| `base_price_ht_locked`     | Prix base (snapshot)      | Snapshot de `base_price_ht` au moment de la validation    | 405 EUR         |
| `selling_price_ht_locked`  | Prix Verone (snapshot)    | Snapshot de `selling_price_ht` au moment de la validation | 450 EUR         |
| `price_locked_at`          | Date verrouillage         | Quand les prix ont ete verrouilles                        | timestamp       |
| `linkme_selection_item_id` | Lien vers selection       | FK vers `linkme_selection_items.id`                       | uuid            |

## Table `sales_orders` (Commande)

| Champ DB              | Nom Metier                   | Role                                       |
| --------------------- | ---------------------------- | ------------------------------------------ |
| `total_ht`            | Total HT commande            | SUM(items.total_ht) — inclut la commission |
| `total_ttc`           | Total TTC commande           | total_ht \* (1 + tax_rate)                 |
| `affiliate_total_ht`  | Total commission affilie HT  | SUM(retrocession_amount)                   |
| `affiliate_total_ttc` | Total commission affilie TTC | `affiliate_total_ht * (1 + tax_rate)`      |
| `linkme_selection_id` | Selection source             | UUID de la selection LinkMe d'origine      |

## Table `linkme_commissions` (Commission par commande)

| Champ DB               | Nom Metier                 | Role                                               |
| ---------------------- | -------------------------- | -------------------------------------------------- |
| `order_amount_ht`      | Montant commande HT        | Total HT de la commande                            |
| `affiliate_commission` | Commission affilie HT      | SUM des retrocession_amount produits catalogue     |
| `linkme_commission`    | Commission Verone HT       | Prelevement Verone sur produits utilisateurs (15%) |
| `total_payout_ht`      | Total a verser affilie HT  | commission catalogue + encaissement net revendeur  |
| `total_payout_ttc`     | Total a verser affilie TTC | Source de verite pour KPIs                         |

---

## Formules de Calcul (Reference)

### A la creation de commande (RPCs)

```sql
-- Prix client = prix Verone + commission
unit_price_ht = ROUND(selling_price_ht * (1 + margin_rate / 100), 2)

-- Taux retrocession (decimal)
retrocession_rate = margin_rate / 100
```

### Trigger calculate_retrocession_amount (INSERT/UPDATE sur sales_order_items)

```sql
-- Commission = prix Verone * taux * quantite
retrocession_amount = ROUND(selling_price_ht * (margin_rate / 100) * quantity, 2)
```

### Trigger lock_prices_on_validation (draft -> validated)

```sql
-- Snapshot des prix selection
base_price_ht_locked = lsi.base_price_ht
selling_price_ht_locked = lsi.selling_price_ht

-- Recalcul prix client et commission
unit_price_ht = ROUND(lsi.selling_price_ht * (1 + lsi.margin_rate / 100), 2)
retrocession_amount = ROUND(lsi.selling_price_ht * (lsi.margin_rate / 100) * quantity, 2)
```
