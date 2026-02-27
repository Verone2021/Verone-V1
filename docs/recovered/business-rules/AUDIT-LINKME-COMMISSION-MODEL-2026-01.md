# Audit Complet: Modele de Commission LinkMe

**Date**: 2026-01-09
**Version**: 1.0
**Auteur**: Claude (Audit automatise)

---

## 1. Resume Executif

Ce document definit de maniere definitive le modele de commission LinkMe pour eviter toute confusion future.

**Points cles:**

- 2 types de produits avec logiques de commission INVERSEES
- Table `products` = source de verite pour les produits affilies
- Table `linkme_selection_items` = configuration marge par produit dans une selection
- Table `linkme_commissions` = commissions calculees automatiquement

---

## 2. Modele de Commission - 2 Types de Produits

### 2.1 Produits CATALOGUE (Verone)

| Attribut           | Valeur                                                 |
| ------------------ | ------------------------------------------------------ |
| **Identifiant DB** | `created_by_affiliate IS NULL`                         |
| **margin_rate**    | 1% a 15% (configurable)                                |
| **Logique**        | L'affilie GAGNE une marge sur chaque vente             |
| **Exemple**        | Produit vendu 100EUR, marge 15% = affilie recoit 15EUR |

```sql
-- Identifier les produits catalogue
SELECT * FROM products
WHERE created_by_affiliate IS NULL
  AND show_on_linkme_globe = true;
```

### 2.2 Produits AFFILIE (Modele Inverse)

| Attribut           | Valeur                                                 |
| ------------------ | ------------------------------------------------------ |
| **Identifiant DB** | `created_by_affiliate IS NOT NULL`                     |
| **margin_rate**    | Toujours 0% dans linkme_selection_items                |
| **Logique**        | Verone PREND une commission, l'affilie recoit le reste |
| **Champs cles**    | `affiliate_payout_ht`, `affiliate_commission_rate`     |

```sql
-- Identifier les produits affilies
SELECT
  id, name, sku,
  created_by_affiliate,
  affiliate_commission_rate,
  affiliate_payout_ht,
  affiliate_approval_status
FROM products
WHERE created_by_affiliate IS NOT NULL;
```

**Calcul pour produits affilies:**

```
Prix de vente HT = affiliate_payout_ht / (1 - affiliate_commission_rate/100)
Commission Verone = Prix de vente - affiliate_payout_ht

Exemple:
- Payout affilie: 100 EUR HT
- Commission Verone: 15%
- Prix vente: 100 / 0.85 = 117.65 EUR HT
- Verone gagne: 17.65 EUR
- Affilie recoit: 100 EUR (son payout)
```

---

## 3. Tables Source de Verite

### 3.1 Table `products` (Colonnes Affilies)

| Colonne                      | Type          | Description                                      |
| ---------------------------- | ------------- | ------------------------------------------------ |
| `created_by_affiliate`       | UUID          | ID de l'affilie createur (NULL = produit Verone) |
| `affiliate_commission_rate`  | NUMERIC(5,2)  | % commission que Verone prend (0-100)            |
| `affiliate_payout_ht`        | NUMERIC(10,2) | Montant HT que l'affilie recoit                  |
| `affiliate_approval_status`  | ENUM          | draft, pending_approval, approved, rejected      |
| `affiliate_approved_at`      | TIMESTAMPTZ   | Date d'approbation                               |
| `affiliate_approved_by`      | UUID          | Admin qui a approuve                             |
| `affiliate_rejection_reason` | TEXT          | Raison du rejet si applicable                    |

### 3.2 Table `linkme_selection_items`

| Colonne            | Type         | Description                               |
| ------------------ | ------------ | ----------------------------------------- |
| `id`               | UUID         | PK                                        |
| `selection_id`     | UUID         | FK vers linkme_selections                 |
| `product_id`       | UUID         | FK vers products                          |
| `margin_rate`      | NUMERIC(5,2) | Marge affilie (0% pour produits affilies) |
| `base_price_ht`    | NUMERIC      | Prix de base HT                           |
| `selling_price_ht` | NUMERIC      | Prix de vente configure                   |

**REGLE CRITIQUE:**

```
Pour produits CATALOGUE: margin_rate = 1-15% (affilie gagne)
Pour produits AFFILIE: margin_rate = 0% TOUJOURS (modele inverse)
```

### 3.3 Table `linkme_commissions`

| Colonne                    | Type    | Description                        |
| -------------------------- | ------- | ---------------------------------- |
| `affiliate_id`             | UUID    | L'affilie concerne                 |
| `order_id`                 | UUID    | La commande (1:1)                  |
| `affiliate_commission`     | NUMERIC | Commission HT gagnee par l'affilie |
| `affiliate_commission_ttc` | NUMERIC | Commission TTC                     |
| `linkme_commission`        | NUMERIC | Commission Verone                  |
| `margin_rate_applied`      | NUMERIC | Taux applique                      |
| `status`                   | TEXT    | pending, validated, paid           |

### 3.4 Vue `linkme_order_items_enriched`

Vue calculee qui joint:

- `sales_order_items`
- `linkme_selection_items`
- `products`

Fournit `affiliate_margin` calcule automatiquement.

---

## 4. Flux de Travail

### 4.1 Creation Produit Affilie

```
1. Affilie cree produit dans LinkMe
   → products.affiliate_approval_status = 'draft'
   → products.created_by_affiliate = affiliate_id

2. Affilie soumet pour approbation
   → products.affiliate_approval_status = 'pending_approval'

3. Admin approuve (Back-Office)
   → products.affiliate_approval_status = 'approved'
   → products.affiliate_commission_rate = X% (defini par admin)
   → products.affiliate_approved_at = NOW()
   → products.affiliate_approved_by = admin_id

4. Produit ajoute a selection
   → INSERT linkme_selection_items (margin_rate = 0)

5. Commande passee
   → Trigger cree linkme_commissions automatiquement
```

### 4.2 Calcul Commission sur Commande

```sql
-- Trigger simplifie
FOR EACH sales_order_item:
  IF product.created_by_affiliate IS NOT NULL THEN
    -- Modele inverse: Verone prend commission
    commission_verone = item.total_ht * (product.affiliate_commission_rate / 100)
    payout_affilie = item.total_ht - commission_verone
  ELSE
    -- Modele standard: affilie gagne marge
    commission_affilie = item.total_ht * (lsi.margin_rate / 100)
  END IF
```

---

## 5. Exemple Concret: Pokawa

### Produits Affilies Pokawa

| Produit                 | SKU      | Commission Verone | Statut   |
| ----------------------- | -------- | ----------------- | -------- |
| Poubelle a POKAWA       | PRD-0132 | 15%               | Approuve |
| Meuble TABESTO a POKAWA | PRD-0309 | 15%               | Approuve |

### Verification SQL

```sql
SELECT
  p.name,
  p.sku,
  p.affiliate_commission_rate,
  p.affiliate_approval_status,
  lsi.margin_rate,
  ls.name as selection_name
FROM products p
LEFT JOIN linkme_selection_items lsi ON lsi.product_id = p.id
LEFT JOIN linkme_selections ls ON ls.id = lsi.selection_id
WHERE p.created_by_affiliate IS NOT NULL
ORDER BY p.name;
```

**Resultat attendu:**

```
name                      | sku      | affiliate_commission_rate | margin_rate | selection_name
--------------------------|----------|---------------------------|-------------|------------------------
Meuble TABESTO a POKAWA   | PRD-0309 | 15.00                     | 0.00        | Collection Mobilier Pokawa
Poubelle a POKAWA         | PRD-0132 | 15.00                     | 0.00        | Collection Mobilier Pokawa
```

---

## 6. Tables/Champs Obsoletes

### 6.1 Table Supprimee

| Table                     | Date Suppression | Raison                          |
| ------------------------- | ---------------- | ------------------------------- |
| `linkme_catalog_products` | 2026-01-05       | Remplacee par `channel_pricing` |

### 6.2 Champs Dupliques

| Table               | Champ        | Doublon       | Action                            |
| ------------------- | ------------ | ------------- | --------------------------------- |
| `linkme_selections` | `view_count` | `views_count` | Utiliser `views_count` uniquement |

---

## 7. Regles Metier Non-Negociables

1. **margin_rate = 0 pour produits affilies**
   - JAMAIS modifier le margin_rate d'un produit affilie
   - La commission est geree via `affiliate_commission_rate` dans `products`

2. **affiliate_commission_rate obligatoire**
   - Un produit affilie ne peut etre approuve sans commission definie
   - Valeurs autorisees: 0-100%

3. **Historique des modifications**
   - Table `product_commission_history` trace tous les changements
   - Trigger automatique sur modification

4. **Commission appliquee a la commande**
   - Le taux en vigueur au moment de la commande est celui applique
   - Les modifications de taux n'affectent pas les commandes existantes

---

## 8. Fichiers de Reference

| Fichier                                                                   | Description                |
| ------------------------------------------------------------------------- | -------------------------- |
| `docs/assets/Tableau remuneration Pokawa - V2 - Pokawa.csv`               | Donnees historiques Pokawa |
| `supabase/migrations/20260108_fix_linkme_selection_items_margin_rate.sql` | Correction margin_rate     |
| `apps/back-office/src/app/canaux-vente/linkme/approbations/page.tsx`      | Page approbations          |
| `apps/linkme/src/lib/hooks/use-all-products-stats.ts`                     | Hook statistiques          |

---

## 9. Changelog

| Date       | Version | Modification                                          |
| ---------- | ------- | ----------------------------------------------------- |
| 2026-01-09 | 1.0     | Creation du document                                  |
| 2026-01-08 | -       | Correction margin_rate Separateur Terrasse (0% → 15%) |

---

_Document genere automatiquement - Ne pas modifier manuellement_
