# Commissions LinkMe - Modèle et Sources de Vérité

**Date:** 2026-01-20 (consolidation)
**Sources:** commissions.md (2026-01-07) + commission-model.md (2026-01-09)

---

## 1. Résumé Exécutif

Ce document définit de manière définitive le modèle de commission LinkMe pour éviter toute confusion future.

**Points clés:**

- 2 types de produits avec logiques de commission INVERSÉES
- Table `products` = source de vérité pour les produits affiliés
- Table `linkme_selection_items` = configuration marge par produit dans une sélection
- Table `linkme_commissions` = commissions calculées automatiquement

---

## 2. Modèle de Commission - 2 Types de Produits

### 2.1 Produits CATALOGUE (Vérone distribue à l'affilié)

| Attribut           | Valeur                                                 |
| ------------------ | ------------------------------------------------------ |
| **Identifiant DB** | `created_by_affiliate IS NULL`                         |
| **margin_rate**    | 1% à 15% (configurable)                                |
| **Logique**        | L'affilié GAGNE une marge sur chaque vente             |
| **Exemple**        | Produit vendu 100EUR, marge 15% = affilié reçoit 15EUR |

```sql
-- Identifier les produits catalogue
SELECT * FROM products
WHERE created_by_affiliate IS NULL
  AND show_on_linkme_globe = true;
```

**Formule:**
```sql
-- L'affilié GAGNE une marge SUR le prix de base
commission_affilié = base_price_ht × (margin_rate / 100) × quantity
prix_vente_final = base_price_ht × (1 + margin_rate / 100)
```

### 2.2 Produits AFFILIÉ/REVENDEUR (Modèle Inverse)

| Attribut           | Valeur                                                 |
| ------------------ | ------------------------------------------------------ |
| **Identifiant DB** | `created_by_affiliate IS NOT NULL`                     |
| **margin_rate**    | Toujours 0% dans linkme_selection_items                |
| **Logique**        | Vérone PREND une commission, l'affilié reçoit le reste |
| **Champs clés**    | `affiliate_payout_ht`, `affiliate_commission_rate`     |

```sql
-- Identifier les produits affiliés
SELECT
  id, name, sku,
  created_by_affiliate,
  affiliate_commission_rate,
  affiliate_payout_ht,
  affiliate_approval_status
FROM products
WHERE created_by_affiliate IS NOT NULL;
```

**Formule:**
```sql
-- INVERSE: Vérone DÉDUIT sa commission du prix de vente
-- Le prix catalogue EST le prix de vente final au client
prix_vente_client = products.price_ht  -- C'est le prix affiché
commission_verone = prix_vente_client × (affiliate_commission_rate / 100)
payout_affilié = prix_vente_client - commission_verone
-- Exemple: 500€ vente - 75€ commission = 425€ pour l'affilié
```

**Calcul détaillé:**
```
Prix de vente HT = affiliate_payout_ht / (1 - affiliate_commission_rate/100)
Commission Vérone = Prix de vente - affiliate_payout_ht

Exemple:
- Payout affilié: 100 EUR HT
- Commission Vérone: 15%
- Prix vente: 100 / 0.85 = 117.65 EUR HT
- Vérone gagne: 17.65 EUR
- Affilié reçoit: 100 EUR (son payout)
```

**ATTENTION CRITIQUE:**

- Produit CATALOGUE: on AJOUTE la marge au prix → prix final > prix base
- Produit AFFILIÉ: on DÉDUIT la commission du prix → payout < prix vente

---

## 3. Hiérarchie et Sources de Vérité

### 3.1 Hiérarchie des Données

```
products → channel_pricing → linkme_selection_items → sales_order_items → linkme_commissions
```

### 3.2 Sources de Vérité par Donnée

| Donnée                   | Source       | Table                         | Colonne                |
| ------------------------ | ------------ | ----------------------------- | ---------------------- |
| Prix produit catalogue   | products     | `products`                    | `price_ht`             |
| **Marge affilié (%)**    | Sélection    | `linkme_selection_items`      | `margin_rate`          |
| Prix vente affilié       | Sélection    | `linkme_selection_items`      | `selling_price_ht`     |
| **Commission par ligne** | Vue enrichie | `linkme_order_items_enriched` | `affiliate_margin`     |
| Commission par commande  | Commissions  | `linkme_commissions`          | `affiliate_commission` |

---

## 4. Formules Officielles

### Produits CATALOGUE

```sql
-- L'affilié GAGNE une marge SUR le prix de base
commission_affilié = base_price_ht × (margin_rate / 100) × quantity
prix_vente_final = base_price_ht × (1 + margin_rate / 100)
```

### Produits AFFILIÉ

```sql
-- INVERSE: Vérone DÉDUIT sa commission du prix de vente
prix_vente_client = products.price_ht
commission_verone = prix_vente_client × (affiliate_commission_rate / 100)
payout_affilié = prix_vente_client - commission_verone
```

---

## 5. Flux de Travail

### 5.1 Création Produit Affilié

```
1. Affilié crée produit dans LinkMe
   → products.affiliate_approval_status = 'draft'
   → products.created_by_affiliate = affiliate_id

2. Affilié soumet pour approbation
   → products.affiliate_approval_status = 'pending_approval'

3. Admin approuve (Back-Office)
   → products.affiliate_approval_status = 'approved'
   → products.affiliate_commission_rate = X% (défini par admin)
   → products.affiliate_approved_at = NOW()
   → products.affiliate_approved_by = admin_id

4. Produit ajouté à sélection
   → INSERT linkme_selection_items (margin_rate = 0)

5. Commande passée
   → Trigger crée linkme_commissions automatiquement
```

### 5.2 Calcul Commission sur Commande

```sql
-- Trigger simplifié
FOR EACH sales_order_item:
  IF product.created_by_affiliate IS NOT NULL THEN
    -- Modèle inverse: Vérone prend commission
    commission_verone = item.total_ht * (product.affiliate_commission_rate / 100)
    payout_affilie = item.total_ht - commission_verone
  ELSE
    -- Modèle standard: affilié gagne marge
    commission_affilie = item.total_ht * (lsi.margin_rate / 100)
  END IF
```

---

## 6. Erreurs Corrigées (Historique)

### ERREUR CORRIGÉE (2026-01-10): Formule RPC Public

Le RPC `create_public_linkme_order` n'utilisait pas la bonne formule.

**FORMULE CORRECTE (TAUX DE MARQUE):**

```sql
-- margin_rate = TAUX DE MARQUE (sur prix de vente), PAS taux de marge (sur coût)
retrocession_amount = selling_price_ht × margin_rate / 100 × quantity
```

**Exemple Plateau bois 20x30:**

- base_price_ht = 20.19€
- selling_price_ht = 23.75€
- margin_rate = 15%
- **CORRECT**: 23.75 × 15% = **3.56€**
- **INCORRECT**: 20.19 × 15% = 3.03€ ❌

### ERREUR HISTORIQUE CORRIGÉE (2026-01-09)

Le code AJOUTAIT la marge au lieu de la DÉDUIRE pour les produits affiliés.

- FAUX: 500€ + 15% = 575€
- CORRECT: 500€ - 15% = 425€ payout

---

## 7. Tables et Champs

### 7.1 Table `products` (Colonnes Affiliés)

| Colonne                      | Type          | Description                                      |
| ---------------------------- | ------------- | ------------------------------------------------ |
| `created_by_affiliate`       | UUID          | ID de l'affilié créateur (NULL = produit Vérone) |
| `affiliate_commission_rate`  | NUMERIC(5,2)  | % commission que Vérone prend (0-100)            |
| `affiliate_payout_ht`        | NUMERIC(10,2) | Montant HT que l'affilié reçoit                  |
| `affiliate_approval_status`  | ENUM          | draft, pending_approval, approved, rejected      |
| `affiliate_approved_at`      | TIMESTAMPTZ   | Date d'approbation                               |
| `affiliate_approved_by`      | UUID          | Admin qui a approuvé                             |
| `affiliate_rejection_reason` | TEXT          | Raison du rejet si applicable                    |

### 7.2 Table `linkme_selection_items`

| Colonne            | Type         | Description                               |
| ------------------ | ------------ | ----------------------------------------- |
| `id`               | UUID         | PK                                        |
| `selection_id`     | UUID         | FK vers linkme_selections                 |
| `product_id`       | UUID         | FK vers products                          |
| `margin_rate`      | NUMERIC(5,2) | Marge affilié (0% pour produits affiliés) |
| `base_price_ht`    | NUMERIC      | Prix de base HT                           |
| `selling_price_ht` | NUMERIC      | Prix de vente configuré                   |

**RÈGLE CRITIQUE:**

```
Pour produits CATALOGUE: margin_rate = 1-15% (affilié gagne)
Pour produits AFFILIÉ: margin_rate = 0% TOUJOURS (modèle inverse)
```

### 7.3 Table `linkme_commissions`

| Colonne                    | Type    | Description                        |
| -------------------------- | ------- | ---------------------------------- |
| `affiliate_id`             | UUID    | L'affilié concerné                 |
| `order_id`                 | UUID    | La commande (1:1)                  |
| `affiliate_commission`     | NUMERIC | Commission HT gagnée par l'affilié |
| `affiliate_commission_ttc` | NUMERIC | Commission TTC                     |
| `linkme_commission`        | NUMERIC | Commission Vérone                  |
| `margin_rate_applied`      | NUMERIC | Taux appliqué                      |
| `status`                   | TEXT    | pending, validated, paid           |

### 7.4 Vue `linkme_order_items_enriched`

Vue calculée qui joint:

- `sales_order_items`
- `linkme_selection_items`
- `products`

Fournit `affiliate_margin` calculé automatiquement.

### 7.5 Tables/Champs Obsolètes

| Table/Champ                         | Date Suppression | Raison                          |
| ----------------------------------- | ---------------- | ------------------------------- |
| Table `linkme_catalog_products`     | 2026-01-05       | Remplacée par `channel_pricing` |
| `linkme_selections.view_count`      | -                | Utiliser `views_count`          |

---

## 8. Règles Métier Non-Négociables

1. **margin_rate = 0 pour produits affiliés**
   - JAMAIS modifier le margin_rate d'un produit affilié
   - La commission est gérée via `affiliate_commission_rate` dans `products`

2. **affiliate_commission_rate obligatoire**
   - Un produit affilié ne peut être approuvé sans commission définie
   - Valeurs autorisées: 0-100%

3. **Historique des modifications**
   - Table `product_commission_history` trace tous les changements
   - Trigger automatique sur modification

4. **Commission appliquée à la commande**
   - Le taux en vigueur au moment de la commande est celui appliqué
   - Les modifications de taux n'affectent pas les commandes existantes

---

## 9. Exemple Concret: Pokawa

### Produits Affiliés Pokawa

| Produit                 | SKU      | Commission Vérone | Statut   |
| ----------------------- | -------- | ----------------- | -------- |
| Poubelle à POKAWA       | PRD-0132 | 15%               | Approuvé |
| Meuble TABESTO à POKAWA | PRD-0309 | 15%               | Approuvé |

### Vérification SQL

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

**Résultat attendu:**

```
name                      | sku      | affiliate_commission_rate | margin_rate | selection_name
--------------------------|----------|---------------------------|-------------|------------------------
Meuble TABESTO à POKAWA   | PRD-0309 | 15.00                     | 0.00        | Collection Mobilier Pokawa
Poubelle à POKAWA         | PRD-0132 | 15.00                     | 0.00        | Collection Mobilier Pokawa
```

### Résultats Audit Pokawa

- **Commissions récupérées**: +1,737.83€
- **Total après correction**: 28,434.57€
- **Affiliate ID**: `cdcb3238-0abd-4c43-b1fa-11bb633df163`

---

## 10. Vues Importantes

- `linkme_order_items_enriched` - Items avec calcul marge correct
- `linkme_orders_with_margins` - Commandes avec marge totale
- `linkme_orders_enriched` - Commandes avec infos client/affilié

---

## 11. À Utiliser Maintenant

- `sales_order_items.retrocession_amount` - ✅ Correctement peuplé depuis 2026-01-10
- `sales_order_items.retrocession_rate` - ✅ Taux de marque depuis sélection
- `linkme_order_items_enriched.affiliate_margin` pour vues enrichies
- `products.created_by_affiliate` pour identifier le type de produit
- `products.affiliate_commission_rate` pour le taux Vérone sur produits affiliés

---

## 12. Comment Identifier le Type de Produit

```typescript
const isAffiliateProduct = item.product?.created_by_affiliate !== null;

if (isAffiliateProduct) {
  // Modèle INVERSÉ: Vérone DÉDUIT sa commission
  const fraisLinkMe = prixVente * (affiliateCommissionRate / 100);
  const payoutAffilie = prixVente - fraisLinkMe;
} else {
  // Modèle STANDARD: L'affilié GAGNE une marge
  const margeAffilie = prixBase * (marginRate / 100);
  const prixFinal = prixBase + margeAffilie;
}
```

---

## 13. Fichiers Clés Corrigés (Audit 2026-01-09)

| Fichier                                                         | Rôle                                                | Status |
| --------------------------------------------------------------- | --------------------------------------------------- | ------ |
| `apps/back-office/.../selections/[id]/page.tsx`                 | Page sélection avec calcul corrigé + onglets        | ✅     |
| `apps/back-office/.../hooks/use-linkme-selections.ts`           | Hook avec champs produits affiliés                  | ✅     |
| `apps/linkme/src/lib/hooks/use-all-products-stats.ts`           | Stats produits (utilise vue enrichie)               | ✅     |
| `apps/linkme/src/lib/hooks/use-affiliate-analytics.ts`          | Analytics affilié (corrigé: affiliate_margin)       | ✅     |
| `packages/@verone/orders/src/hooks/linkme/use-linkme-orders.ts` | Création commandes (corrigé: base_price_ht)         | ✅     |
| `apps/back-office/.../hooks/use-linkme-orders.ts`               | Hook commandes back-office (corrigé: base_price_ht) | ✅     |

---

## 14. Migrations Appliquées

| Migration                                             | Description                          | Résultat     |
| ----------------------------------------------------- | ------------------------------------ | ------------ |
| `20260109_003_fix_affiliate_products_margin_rate.sql` | margin_rate=0 pour produits affiliés | 0 violations |
| `20260109_004_recalculate_pokawa_commissions.sql`     | Recalcul 12 commissions Pokawa       | +1,737.83€   |

---

## 15. Fichiers de Référence

| Fichier                                                                   | Description                |
| ------------------------------------------------------------------------- | -------------------------- |
| `docs/assets/Tableau remuneration Pokawa - V2 - Pokawa.csv`               | Données historiques Pokawa |
| `supabase/migrations/20260108_fix_linkme_selection_items_margin_rate.sql` | Correction margin_rate     |
| `apps/back-office/src/app/canaux-vente/linkme/approbations/page.tsx`      | Page approbations          |
| `apps/linkme/src/lib/hooks/use-all-products-stats.ts`                     | Hook statistiques          |

---

## Changelog

| Date       | Version | Modification                                              |
| ---------- | ------- | --------------------------------------------------------- |
| 2026-01-20 | 2.0     | Consolidation commissions.md + commission-model.md        |
| 2026-01-09 | 1.0     | Création commission-model.md (audit automatisé)           |
| 2026-01-08 | -       | Correction margin_rate Séparateur Terrasse (0% → 15%)     |
| 2026-01-07 | -       | Création commissions.md (sources de vérité)               |

---

**Source de vérité unique - Ne pas créer de fichiers redondants**
