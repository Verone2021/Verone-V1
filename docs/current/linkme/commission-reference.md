# LinkMe Commission Reference

**Version**: 2.0.0 (consolidated)
**Last updated**: 2026-02-26
**Status**: CANONICAL - Single source of truth for commission logic

---

## 1. Two Product Types

### CATALOGUE Products (Verone distributes to affiliate)

| Attribute                            | Value                                   |
| ------------------------------------ | --------------------------------------- |
| DB identifier                        | `products.created_by_affiliate IS NULL` |
| `linkme_selection_items.margin_rate` | 1-15% (configurable per selection item) |
| Logic                                | Affiliate EARNS a margin on each sale   |
| Key column                           | `linkme_selection_items.margin_rate`    |

### AFFILIATE Products (Verone takes a fee)

| Attribute                            | Value                                                                |
| ------------------------------------ | -------------------------------------------------------------------- |
| DB identifier                        | `products.created_by_affiliate IS NOT NULL`                          |
| `linkme_selection_items.margin_rate` | Always 0% (NEVER modify)                                             |
| Logic                                | Verone DEDUCTS its commission; affiliate receives the rest           |
| Key columns                          | `products.affiliate_commission_rate`, `products.affiliate_payout_ht` |

---

## 2. Formulas

### CATALOGUE products: affiliate earns margin

```
margin_rate = TAUX DE MARQUE (on selling price), NOT taux de marge (on cost)

retrocession_amount = selling_price_ht * margin_rate / 100 * quantity
```

Example (Plateau bois 20x30):

- base_price_ht = 20.19 EUR
- selling_price_ht = 23.75 EUR
- margin_rate = 15%
- Commission = 23.75 \* 0.15 = **3.56 EUR** (CORRECT)
- NOT 20.19 \* 0.15 = 3.03 EUR (WRONG - this would be taux de marge)

### AFFILIATE products: Verone takes platform fee

```
commission_verone = selling_price_ht * 0.15 * quantity
payout_affiliate = selling_price_ht - commission_verone
```

Example (Poubelle Pokawa):

- selling_price_ht = 500.00 EUR
- Platform fee = 15%
- Commission Verone = 500.00 \* 0.15 = **75.00 EUR**
- Affiliate receives = 500.00 - 75.00 = **425.00 EUR**

### Universal SQL formula

```sql
CASE
  WHEN lsi.margin_rate = 0 THEN
    -- Affiliate product: platform fee 15% on sale price
    ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
  ELSE
    -- Catalogue product: margin on selling price (taux de marque)
    ROUND(lsi.selling_price_ht * lsi.margin_rate / 100 * soi.quantity, 2)
END AS commission
```

---

## 3. Source-of-Truth Tables and Columns

### Data hierarchy

```
products -> channel_pricing -> linkme_selection_items -> sales_order_items -> linkme_commissions
```

### `products` (affiliate columns)

| Column                      | Type          | Description                                  |
| --------------------------- | ------------- | -------------------------------------------- |
| `created_by_affiliate`      | UUID          | Affiliate creator ID (NULL = Verone product) |
| `affiliate_commission_rate` | NUMERIC(5,2)  | % Verone takes (0-100)                       |
| `affiliate_payout_ht`       | NUMERIC(10,2) | HT amount affiliate receives                 |
| `affiliate_approval_status` | ENUM          | draft, pending_approval, approved, rejected  |

### `linkme_selection_items`

| Column             | Type         | Description                                                       |
| ------------------ | ------------ | ----------------------------------------------------------------- |
| `margin_rate`      | NUMERIC(5,2) | Affiliate margin (0% for affiliate products, 1-15% for catalogue) |
| `base_price_ht`    | NUMERIC      | Base price HT                                                     |
| `selling_price_ht` | NUMERIC      | Selling price configured                                          |

### `sales_order_items`

| Column                | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `retrocession_amount` | Commission amount (correctly populated since 2026-01-10) |
| `retrocession_rate`   | Margin rate from selection                               |

### `linkme_commissions`

| Column                     | Description                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `affiliate_commission`     | HT commission earned by affiliate (catalogue products only)        |
| `affiliate_commission_ttc` | TTC commission (catalogue products only)                           |
| `linkme_commission`        | Verone's commission                                                |
| `total_payout_ht`          | **Total amount due to affiliate HT** (commission + net revendeur)  |
| `total_payout_ttc`         | **Total amount due to affiliate TTC** (commission + net revendeur) |
| `margin_rate_applied`      | Rate applied at order time                                         |
| `status`                   | pending, validated, in_payment, paid                               |

---

## 4. Key Views

| View                          | Purpose                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `linkme_order_items_enriched` | Order items joined with selection items + products; provides calculated `affiliate_margin` |
| `linkme_orders_with_margins`  | Orders with total margin aggregated                                                        |
| `linkme_orders_enriched`      | Orders with client/affiliate info                                                          |

---

## 5. TypeScript Pattern: Identifying Product Type

```typescript
const isAffiliateProduct = item.product?.created_by_affiliate !== null;

if (isAffiliateProduct) {
  // INVERSE model: Verone DEDUCTS its commission
  const fraisLinkMe = prixVente * (affiliateCommissionRate / 100);
  const payoutAffilie = prixVente - fraisLinkMe;
} else {
  // STANDARD model: Affiliate EARNS a margin (taux de marque)
  const commission = sellingPriceHt * (marginRate / 100);
}
```

### SQL identification

```sql
-- Catalogue products
SELECT * FROM products WHERE created_by_affiliate IS NULL AND show_on_linkme_globe = true;

-- Affiliate products
SELECT id, name, sku, created_by_affiliate, affiliate_commission_rate, affiliate_payout_ht
FROM products WHERE created_by_affiliate IS NOT NULL;
```

---

## 6. Historical Bugs Fixed (reference)

### Bug 1: Wrong formula used taux de marge instead of taux de marque (2026-01-10)

**Problem**: RPC `create_public_linkme_order` calculated commission on `base_price_ht` instead of `selling_price_ht`.

**Impact**: Underpaid commissions on all catalogue product orders.

**Fix**: `retrocession_amount = selling_price_ht * margin_rate / 100 * quantity`

### Bug 2: Affiliate products had 0 EUR commission (2026-02-13)

**Problem**: Products with `margin_rate = 0%` (affiliate products) produced 0 EUR commission instead of the 15% platform fee.

**Impact**: 8 shipped invoices affected, **1,203.68 EUR in missing commissions** recovered.

**Fix**: Applied `retrocession_amount = selling_price_ht * 0.15 * quantity` for all items where `margin_rate = 0`.

### Bug 3: Commission direction inverted for affiliate products (2026-01-09)

**Problem**: Code ADDED margin instead of DEDUCTING commission for affiliate products (500 EUR + 15% = 575 EUR instead of 500 EUR - 15% = 425 EUR payout).

**Impact**: Pokawa commissions recalculated, **+1,737.83 EUR** recovered.

**Fix**: Migration `20260109_004_recalculate_pokawa_commissions.sql`.

---

## 7. Source-of-Truth: Montant a Verser (total_payout)

### Definition

`total_payout_ht` / `total_payout_ttc` = **montant total du a l'affilie** pour une commande.

```
total_payout = affiliate_commission (catalogue) + encaissement_net_revendeur
encaissement_net_revendeur = revenue_produits_revendeur - commission_linkme_15%
```

### Regle

- **Dashboard et Page Commissions** : TOUJOURS utiliser `total_payout_ttc` pour les KPIs de remuneration
- Quand `total_payout` est NULL (anciennes commandes) : fallback sur `affiliate_commission`
- SQL pattern : `COALESCE(total_payout_ttc, affiliate_commission_ttc)`

### Pourquoi deux colonnes ?

| Colonne                | Contenu                                     | Usage                       |
| ---------------------- | ------------------------------------------- | --------------------------- |
| `affiliate_commission` | Commission catalogue uniquement             | Detail par type de produit  |
| `total_payout_ht/ttc`  | Tout ce qu'on verse (catalogue + revendeur) | KPIs, versements, dashboard |

### Exemple

```
Commande avec 2 produits catalogue (commission 50 EUR) + 1 produit revendeur (500 EUR - 15% = 425 EUR net)
- affiliate_commission = 50 EUR
- total_payout_ht = 50 + 425 = 475 EUR
```

---

## 8. Business Rules (non-negotiable)

1. `margin_rate = 0` for affiliate products -- NEVER modify
2. `affiliate_commission_rate` is mandatory before approving an affiliate product
3. Commission rate at order time is locked -- later rate changes do NOT affect existing orders
4. Changes tracked in `product_commission_history` table (automatic trigger)

---

## 9. Validation Query

```sql
-- Verify all affiliate products have correct 15% platform fee
SELECT
  so.order_number, p.sku, p.name,
  lsi.selling_price_ht, soi.quantity,
  soi.retrocession_amount AS current_commission,
  ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2) AS expected_commission,
  CASE
    WHEN soi.retrocession_amount = ROUND(lsi.selling_price_ht * 0.15 * soi.quantity, 2)
    THEN 'OK' ELSE 'ERROR'
  END AS status
FROM sales_orders so
JOIN sales_order_items soi ON soi.sales_order_id = so.id
JOIN products p ON p.id = soi.product_id
JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
WHERE lsi.margin_rate = 0 AND so.status = 'shipped';
```

---

## 10. Obsolete Tables/Fields

| Item                            | Status             | Replacement            |
| ------------------------------- | ------------------ | ---------------------- |
| `linkme_catalog_products` table | Deleted 2026-01-05 | `channel_pricing`      |
| `linkme_selections.view_count`  | Duplicate          | Use `views_count` only |
