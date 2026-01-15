# Audit Commissions Pokawa - 2026-01-09

## Contexte

**Pokawa** est un affilié LinkMe avec modèle de commission **INVERSÉ**:

- Prix catalogue = Prix de vente final TTC
- **Vérone DÉDUIT 15%** de commission
- **Pokawa reçoit 85%** (payout)

## Résumé des Anomalies Identifiées

### Audit Précédent (2026-01-06)

**19 commandes avec commission = 0€ en base de données:**

| Order Number | Date    | Total HT   | Commission DB | Commission Théorique |
| ------------ | ------- | ---------- | ------------- | -------------------- |
| LINK-230026  | 2023-11 | 1 681,05 € | 0.00 €        | 1 428,89 €           |
| LINK-240006  | 2024-01 | 1 681,05 € | 0.00 €        | 1 000,22 €           |
| LINK-240009  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €               |
| LINK-240010  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €               |
| LINK-240011  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €               |
| LINK-240012  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €               |
| LINK-240013  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €               |
| LINK-240014  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €               |
| LINK-240016  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €               |
| LINK-240017  | 2024-03 | 799,00 €   | 0.00 €        | 0,00 €               |
| LINK-240019  | 2024-03 | 1 598,00 € | 0.00 €        | 0,00 €               |
| LINK-240022  | 2024-05 | 5 152,43 € | 0.00 €        | 1 055,37 €           |
| LINK-240025  | 2024-06 | 799,00 €   | 0.00 €        | 0,00 €               |
| LINK-240031  | 2024-07 | 1 997,50 € | 0.00 €        | 0,00 €               |
| LINK-240033  | 2024-06 | 799,00 €   | 0.00 €        | 0,00 €               |
| LINK-240038  | 2024-07 | 5 874,03 € | 0.00 €        | 2 522,02 €           |
| LINK-240046  | 2024-11 | 2 783,76 € | 0.00 €        | 1 826,20 €           |
| LINK-240060  | 2025-12 | 5 485,03 € | 0.00 €        | 1 301,60 €           |
| LINK-240075  | 2025-12 | 2 002,46 € | 0.00 €        | 633,93 €             |

**Total commission manquante:** ~9 768 €

## Cause Racine

Ces commandes contiennent des **produits Pokawa** (poubelle, meuble Tabesto) avec logique inversée:

- L'affilié définit `affiliate_payout_ht` (ce que Pokawa reçoit)
- LinkMe devrait calculer: `commission = affiliate_payout_ht × 0.15`
- Le calcul `retrocession_amount` n'a pas été fait correctement

## État Actuel (2026-01-09)

Tentative d'audit SQL via API Supabase:

- **Pokawa affiliate_id identifié:** `cdcb3238-0abd-4c43-b1fa-11bb633df163`
- **Problème:** RLS bloque l'accès via anon key
- **Résultat:** 0 commissions retournées (politique RLS restrictive)

## Recommandations

### 1. Correction des 19 Commandes

**Stratégie:**

1. Identifier les `sales_order_items` pour chaque commande
2. Récupérer `affiliate_payout_ht` de chaque item
3. Calculer commission: `SUM(affiliate_payout_ht × 0.15)`
4. Mettre à jour `linkme_commissions`:
   ```sql
   UPDATE linkme_commissions
   SET
     affiliate_commission = <calculated_ht>,
     affiliate_commission_ttc = <calculated_ttc>
   WHERE order_id = <order_id>;
   ```

### 2. Audit SQL Complet

**Nécessite accès service_role ou postgres direct:**

```sql
-- Identifier toutes les commissions Pokawa
SELECT
  so.order_number,
  so.created_at,
  so.total_ht,
  lc.affiliate_commission,
  lc.affiliate_commission_ttc,
  lc.status
FROM linkme_commissions lc
JOIN sales_orders so ON lc.order_id = so.id
WHERE lc.affiliate_id = 'cdcb3238-0abd-4c43-b1fa-11bb633df163'
  AND so.status NOT IN ('cancelled', 'draft')
ORDER BY so.created_at;

-- Analyser items avec affiliate_payout_ht
SELECT
  so.order_number,
  soi.product_name,
  soi.affiliate_payout_ht,
  soi.quantity,
  soi.total_ht
FROM sales_order_items soi
JOIN sales_orders so ON soi.order_id = so.id
WHERE so.order_number IN ('LINK-230026', 'LINK-240006', ...) -- liste complète
ORDER BY so.order_number;
```

### 3. Vérification Triggers

Vérifier que les triggers suivants calculent correctement pour modèle inversé:

- `calculate_linkme_commissions_v5` (ou version actuelle)
- `sync_sales_order_items_to_linkme_view`

### 4. Migration de Correction

Créer migration pour corriger historique:

```sql
-- 20260109_fix_pokawa_commissions_historique.sql
WITH pokawa_items AS (
  SELECT
    soi.order_id,
    SUM(soi.affiliate_payout_ht * 0.15) as commission_ht,
    SUM(soi.affiliate_payout_ht * 0.15 * 1.20) as commission_ttc
  FROM sales_order_items soi
  JOIN sales_orders so ON soi.order_id = so.id
  WHERE so.affiliate_id = 'cdcb3238-0abd-4c43-b1fa-11bb633df163'
    AND so.order_number IN (...)
  GROUP BY soi.order_id
)
UPDATE linkme_commissions lc
SET
  affiliate_commission = pi.commission_ht,
  affiliate_commission_ttc = pi.commission_ttc,
  updated_at = NOW()
FROM pokawa_items pi
WHERE lc.order_id = pi.order_id;
```

## Prochaines Étapes

1. **Accès DB Direct**: Utiliser `psql` avec service_role pour audit complet
2. **Validation**: Confirmer liste 19 commandes + identifier si autres anomalies
3. **Correction**: Créer migration SQL pour corriger `linkme_commissions`
4. **Test**: Vérifier que nouvelles commandes Pokawa calculent correctement
5. **Documentation**: Mettre à jour mémoire Serena après correction

---

**Audit réalisé le:** 2026-01-09
**Statut:** ⏳ En attente accès DB pour validation
**Impact financier estimé:** ~9 768 € de commissions manquantes
