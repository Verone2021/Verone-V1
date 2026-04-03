# Regles Prix & Commissions LinkMe

**Version** : 2026-03-05
**Status** : DOCUMENTATION CANONIQUE (source de verite unique)

---

## 1. total_ht : Difference Bubble vs Notre Base

Notre `sales_orders.total_ht` = somme des items HT **SANS shipping**.

```
Notre base : total_ht = SUM(unit_price_ht * quantity)
Bubble "Total HT" = notre total_ht + shipping_cost_ht
```

**REGLE** : Ne JAMAIS comparer directement notre `total_ht` avec Bubble sans ajouter `shipping_cost_ht`.

---

## 2. retrocession_rate sur sales_order_items

Le taux de retrocession est **TOUJOURS** `margin_rate / 100` de la selection LinkMe.

```sql
-- CORRECT
retrocession_rate = linkme_selection_items.margin_rate / 100

-- Exemples :
-- Pokawa : margin_rate = 15 → retrocession_rate = 0.15
-- B&W Burger : margin_rate = 10 → retrocession_rate = 0.10
-- SEP-0001 : margin_rate = 0 → retrocession_rate = 0
```

### INTERDIT

- Calculer retrocession_rate a partir d'un ratio de prix (`selling_price * X / unit_price`)
- Modifier retrocession_rate via un trigger (les triggers calculent le **montant**, pas le taux)
- Supposer un taux fixe pour tous les affilies (chaque selection a ses propres marges)

---

## 3. Prix Figes par Commande (champs `_locked`)

Les prix sont figes au moment de la commande sur `sales_order_items` :

| Champ                     | Description                                 |
| ------------------------- | ------------------------------------------- |
| `selling_price_ht_locked` | Prix de vente fige au moment de la commande |
| `base_price_ht_locked`    | Prix d'achat fige au moment de la commande  |
| `retrocession_rate`       | Taux fige pour cette commande               |

**REGLE** : Si on change le prix dans la selection, les anciennes commandes ne bougent PAS.
Les champs `_locked` sont la source de verite pour les commandes passees.

---

## 4. Produits Utilisateur (created_by_affiliate IS NOT NULL)

Pour les produits crees par l'affilie :

- `retrocession_rate` = 0 (pas de retrocession catalogue)
- Commission divergente avec Bubble = **NORMAL** (Bubble calcule differemment)
- Ne pas chercher a matcher les commissions Bubble sur ces produits

Identification : `products.created_by_affiliate IS NOT NULL`

---

## 5. Cas Speciaux

- **SEP-0001** (Separateur Terrasse) : margin_rate = 0% confirme → retrocession_rate = 0
- **Items orphelins** (5 suspensions sans `linkme_selection_item_id`) : pas recalculables automatiquement

---

## 6. Formules de Calcul

### Par ligne (sales_order_items)

```sql
retrocession_amount = unit_price_ht * quantity * retrocession_rate
```

### Par commande (linkme_commissions)

```sql
-- Commission affilie = retrocession des produits CATALOGUE uniquement
affiliate_commission = SUM(retrocession_amount)
  WHERE products.created_by_affiliate IS NULL

-- Commission LinkMe = taxe Verone sur produits UTILISATEUR uniquement
linkme_commission = SUM(selling_price_ht * 0.15 * quantity)
  WHERE products.created_by_affiliate IS NOT NULL
```

### Totaux

```sql
affiliate_total_ht = SUM(retrocession_amount)  -- tous les items
affiliate_total_ttc = affiliate_total_ht * 1.20
```

---

## 7. Audit Bubble vs Notre Base (5 mars 2026)

**Resultat global : donnees correctes a ~97%.**

- **Totaux HT** : 100% matchent (formule : `total_ht + shipping_cost_ht` = Bubble "Total HT")
- **Commissions sans produit utilisateur** : ~97% matchent parfaitement
- **3 divergences identifiees** (sur ~90 commandes) :
  - 240028 : +3,95 EUR (COU-0001 a 16% au lieu de 15%)
  - 240032 : -46,23 EUR (taux faux sur suspensions/deco)
  - 240066 : commission 0 EUR chez nous vs 59,50 EUR Bubble (shipping 39 EUR manquant)
- **Commandes avec produit utilisateur** : divergence = normal (voir section 4)

---

## 8. Historique Corrections

| Date       | Migration                                | Description                                                             |
| ---------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| 2026-02-12 | 20260212_001_fix_retrocession_amounts    | Formule FAUSSE (`selling_price * margin / unit_price`)                  |
| 2026-03-04 | 20260304100000                           | SEP-0001 margin 0%, trigger affiliate_commission, recalcul 23 commandes |
| 2026-03-05 | 20260305_fix_linkme_import_retrocessions | Correction retrocession_rate = margin_rate/100 (113 items)              |
