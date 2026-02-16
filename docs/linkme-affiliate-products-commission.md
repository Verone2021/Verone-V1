# LinkMe : Commission Produits Affiliés

**Version** : 1.0.0
**Date** : 2026-02-13
**Status** : DOCUMENTATION CANONIQUE

---

## Contexte

LinkMe gère **2 types de produits** avec des règles de commission différentes :

### 1. Produits Catalogue Verone

**Caractéristiques** :

- Produits du catalogue Verone (coussins, suspensions, déco, etc.)
- `linkme_selection_items.margin_rate = 15%`
- Commission = marge commerciale sur vente

**Formule commission** :

```
commission = (selling_price_ht - base_price_ht) × quantity
```

**Exemple** : Coussin Bleu

- Prix achat : 47.70 €
- Prix vente : 56.12 €
- Marge : 15%
- **Commission** : (56.12 - 47.70) × 1 = **8.42 €**

---

### 2. Produits Affilié (Catalogue Enseigne)

**Caractéristiques** :

- Produits du catalogue propre de l'affilié (ex: Pokawa)
- Stockés en base de données de l'enseigne
- `linkme_selection_items.margin_rate = 0%` ← **NORMAL**
- Commission = **taxe plateforme 15%** sur prix de vente

**Produits identifiés** :
| SKU | Nom | Prix Vente | Taxe 15% |
|-----|-----|------------|----------|
| PRD-0132 | Poubelle à POKAWA | 500.00 € | **75.00 €** |
| PRD-0309 | Meuble TABESTO à POKAWA | 1006.14 € | **150.92 €** |

**Formule commission** :

```
commission = selling_price_ht × 0.15 × quantity
```

**Exemple** : Poubelle à POKAWA

- Prix vente : 500.00 €
- Taxe Verone : 15%
- **Commission** : 500.00 × 0.15 × 1 = **75.00 €**

---

## ⚠️ Erreur Historique Corrigée (2026-02-13)

**Problème** : Les produits affiliés (margin_rate=0%) avaient une commission de **0 €** au lieu de la taxe 15%.

**Impact** :

- 8 factures shipped affectées
- **1203.68 € de commissions manquantes** récupérées

**Correction appliquée** :

```sql
UPDATE sales_order_items soi
SET retrocession_amount = ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
FROM linkme_selection_items lsi,
     sales_orders so
WHERE lsi.id = soi.linkme_selection_item_id
  AND so.id = soi.sales_order_id
  AND lsi.margin_rate = 0
  AND so.status = 'shipped';
```

**Factures corrigées** :

- F-25-048 : +75.00 €
- LINK-230026 : +75.00 €
- LINK-240006 : +75.00 €
- LINK-240022 : +75.00 €
- LINK-240038 : +451.84 € (2 poubelles + 2 meubles)
- LINK-240046 : +301.84 € (2 meubles)
- LINK-240060 : +150.00 € (2 poubelles)

---

## Formule Universelle de Calcul

Pour calculer correctement la commission sur **N'IMPORTE QUEL produit** :

```sql
CASE
  -- Produit affilié (margin_rate = 0%) → Taxe 15% sur vente
  WHEN lsi.margin_rate = 0 THEN
    ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)

  -- Produit Verone (margin_rate > 0%) → Marge commerciale
  ELSE
    ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
END as commission
```

---

## Validation

**Requête de vérification** :

```sql
-- Vérifier que TOUS les produits affiliés ont bien la taxe 15%
SELECT
  so.order_number,
  p.sku,
  p.name,
  lsi.selling_price_ht,
  soi.quantity,
  soi.retrocession_amount as commission_actuelle,
  ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2) as commission_attendue,
  CASE
    WHEN soi.retrocession_amount = ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
    THEN '✅ OK'
    ELSE '❌ ERREUR'
  END as verification
FROM sales_orders so
JOIN sales_order_items soi ON soi.sales_order_id = so.id
JOIN products p ON p.id = soi.product_id
JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
WHERE lsi.margin_rate = 0
  AND so.status = 'shipped';
```

**Résultat attendu** : Tous les produits doivent afficher `✅ OK`.

---

## Références

- Workflow vérification factures : `docs/linkme-invoice-verification-workflow.md`
- Tables impactées : `linkme_selection_items`, `sales_order_items`
- Date correction : 2026-02-13
