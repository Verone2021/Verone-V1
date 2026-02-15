# LinkMe Invoice Verification Workflow

**Version** : 1.0.0
**Date** : 2026-02-13
**Status** : DOCUMENTATION CANONIQUE (à lire après auto-compact)

---

## Contexte

Vérification factures LinkMe pour aligner Bubble (source de vérité) avec Supabase (base de données).

**Règle absolue** : On ne passe à la facture suivante QUE si commission DB = commission Bubble (au centime près).

---

## Workflow (5 Étapes NON NÉGOCIABLES)

### Étape 1 : Lire Facture Bubble

**Ouvrir PDF Bubble** via Playwright (MCP):

```typescript
mcp__playwright-lane-1__browser_tabs({ action: "select", index: N })
mcp__playwright-lane-1__browser_take_screenshot({
  filename: ".playwright-mcp/screenshots/link-NNNNNN-pdf-20260213.png"
})
```

**Noter LIGNE PAR LIGNE** :

- Code produit (ex: LINK2, LINK6, etc.)
- Désignation
- Quantité
- **Prix unitaire HT** (ex: 56.12)
- Total ligne HT

**Noter TOTAL COMMANDE** :

- Total HT (ex: 2 559.53)
- **Commission attendue** (fournie par Romeo, ex: 316.40)

---

### Étape 2 : Comparer avec DB - `linkme_selection_items`

**CRITIQUE** : Comparer avec `linkme_selection_items.selling_price_ht`, **PAS** `sales_order_items.unit_price_ht`.

```sql
SELECT
  p.sku,
  p.name as produit,
  soi.quantity as qty,
  lsi.selling_price_ht as prix_db,
  CASE p.sku
    WHEN 'COU-0008' THEN 56.12  -- Prix Bubble pour Coussin bleu
    WHEN 'COU-0009' THEN 61.16  -- Prix Bubble pour Coussin Beige
    -- ... autres produits
  END as prix_bubble,
  lsi.base_price_ht,
  lsi.margin_rate
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
JOIN products p ON p.id = soi.product_id
LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
WHERE so.order_number = 'LINK-230006'
ORDER BY p.sku;
```

**Identifier produits divergents** : `prix_db ≠ prix_bubble`

---

### Étape 3 : Corriger Prix SOURCE (channel_pricing)

**Pour CHAQUE produit divergent** :

#### 3.1. Calculer Prix d'Achat Cible

**Formule inverse** :

```
base_price_ht_cible = prix_bubble × (1 - margin_rate/100)
```

**Exemple** : Suspension paille

- Prix Bubble : 98.69
- Taux marge : 15%
- **base_price_ht_cible** = 98.69 × 0.85 = **83.89**

#### 3.2. Vérifier Prix Actuel dans channel_pricing

```sql
SELECT
  p.sku,
  p.name,
  cp.public_price_ht as prix_actuel,
  83.89 as prix_cible,  -- Remplacer par calcul
  83.89 - cp.public_price_ht as ecart
FROM products p
JOIN channel_pricing cp ON cp.product_id = p.id
JOIN sales_channels sc ON sc.id = cp.channel_id
WHERE p.sku = 'SUS-0003'
  AND sc.name = 'LinkMe';
```

#### 3.3. Modifier Prix SOURCE

**SEULEMENT si `prix_actuel ≠ prix_cible`** :

```sql
UPDATE channel_pricing
SET public_price_ht = 83.89  -- base_price_ht_cible
WHERE product_id = (SELECT id FROM products WHERE sku = 'SUS-0003')
  AND channel_id = (SELECT id FROM sales_channels WHERE name = 'LinkMe');
```

#### 3.4. Vérifier Propagation Automatique

**Le trigger DOIT propager automatiquement** :

- `channel_pricing.public_price_ht` → `linkme_selection_items.base_price_ht`
- `linkme_selection_items.selling_price_ht` = **GENERATED COLUMN** : `base_price_ht / (1 - margin_rate/100)`

```sql
-- Vérifier après UPDATE channel_pricing
SELECT
  p.sku,
  lsi.base_price_ht,  -- Doit = 83.89
  lsi.selling_price_ht,  -- Doit = 98.69 (généré automatiquement)
  lsi.margin_rate
FROM linkme_selection_items lsi
JOIN products p ON p.id = lsi.product_id
WHERE p.sku = 'SUS-0003'
  AND lsi.selection_id = (SELECT linkme_selection_id FROM sales_orders WHERE order_number = 'LINK-230006');
```

**Si trigger ne propage PAS** → INVESTIGUER (peut-être trigger désactivé ou condition WHERE incorrecte).

---

### Étape 4 : Recalculer Commission

**Formule commission** :

```
commission = (selling_price_ht - base_price_ht) × quantity
```

**Vérification globale** :

```sql
WITH commission_calculee AS (
  SELECT
    so.order_number,
    SUM(
      CASE
        WHEN soi.linkme_selection_item_id IS NOT NULL
        THEN ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
        ELSE 0
      END
    ) as commission_db
  FROM sales_order_items soi
  JOIN sales_orders so ON so.id = soi.sales_order_id
  LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
  WHERE so.order_number = 'LINK-230006'
  GROUP BY so.order_number
)
SELECT
  order_number,
  commission_db,
  316.40 as commission_bubble,
  316.40 - commission_db as ecart
FROM commission_calculee;
```

**RÈGLE** : `ecart` DOIT = 0.00 (au centime près).

**Si `ecart ≠ 0`** :

1. Vérifier items orphelins (`linkme_selection_item_id IS NULL`)
2. Comparer LIGNE PAR LIGNE commission calculée vs attendue
3. Identifier produits avec prix encore divergents
4. **RETOUR Étape 2** : Recomparer avec Bubble

---

### Étape 5 : Recalculer `retrocession_amount` dans sales_order_items

**SEULEMENT après Étape 4 validée** (`ecart = 0.00`) :

```sql
UPDATE sales_order_items soi
SET retrocession_amount = ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)
FROM linkme_selection_items lsi
WHERE lsi.id = soi.linkme_selection_item_id
  AND soi.sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'LINK-230006');
```

**Vérification finale** :

```sql
SELECT SUM(retrocession_amount)
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
WHERE so.order_number = 'LINK-230006';
-- Doit retourner 316.40
```

---

## Protection : Price Locking

### Contexte

**Migrations 008-010** : Mécanisme de price locking pour protéger factures shipped.

**Colonnes** :

- `sales_order_items.base_price_ht_locked`
- `sales_order_items.selling_price_ht_locked`

**Triggers automatiques** :

- Sur `status → validated` : copie prix actuels dans `_locked`
- Sur `status → shipped` : idem

**PROBLÈME HISTORIQUE** : 118/121 commandes shipped créées AVANT migrations → `_locked` = NULL.

---

### Locking Rétroactif (OBLIGATOIRE avant corrections)

**Migration à appliquer UNE SEULE FOIS** :

```sql
-- Lock rétroactif des 118 commandes shipped non-lockées
UPDATE sales_order_items soi
SET
  base_price_ht_locked = COALESCE(lsi.base_price_ht, soi.unit_price_ht),
  selling_price_ht_locked = soi.unit_price_ht
FROM sales_orders so
LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
WHERE so.id = soi.sales_order_id
  AND so.status = 'shipped'
  AND soi.base_price_ht_locked IS NULL;
```

**Vérification** :

```sql
SELECT COUNT(*) as commandes_non_lockees
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
WHERE so.status = 'shipped'
  AND soi.base_price_ht_locked IS NULL;
-- Doit retourner 0
```

**Garantie** : Modifier `channel_pricing` après locking n'impacte PAS les factures shipped passées.

---

## Cas Spéciaux

### Items Orphelins (linkme_selection_item_id = NULL)

**Exemple** : SUS-0009 (Suspension frange n°3) dans LINK-230006/008.

**Symptôme** :

- `retrocession_amount = 0.00`
- Impossible de recalculer automatiquement (pas de lien vers `linkme_selection_items`)

**Solution** :

1. **Vérifier si produit existe dans sélection** :

   ```sql
   SELECT * FROM linkme_selection_items lsi
   JOIN products p ON p.id = lsi.product_id
   WHERE p.sku = 'SUS-0009'
     AND lsi.selection_id = (SELECT linkme_selection_id FROM sales_orders WHERE order_number = 'LINK-230006');
   ```

2. **Si produit N'EXISTE PAS** → Créer entrée manquante :

   ```sql
   INSERT INTO linkme_selection_items (selection_id, product_id, base_price_ht, margin_rate)
   VALUES (
     (SELECT linkme_selection_id FROM sales_orders WHERE order_number = 'LINK-230006'),
     (SELECT id FROM products WHERE sku = 'SUS-0009'),
     55.32,  -- Calculé : 65.08 × 0.85
     15.00
   );
   ```

3. **Lier item orphelin** :

   ```sql
   UPDATE sales_order_items soi
   SET linkme_selection_item_id = lsi.id
   FROM linkme_selection_items lsi
   JOIN products p ON p.id = lsi.product_id
   WHERE p.id = soi.product_id
     AND p.sku = 'SUS-0009'
     AND lsi.selection_id = (SELECT linkme_selection_id FROM sales_orders WHERE order_number = 'LINK-230006')
     AND soi.sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'LINK-230006');
   ```

4. **Recalculer commission** (retour Étape 5).

---

## Checklist Facture

Pour CHAQUE facture divergente :

- [ ] **Étape 1** : PDF Bubble lu ligne par ligne (screenshot sauvegardé)
- [ ] **Étape 2** : Comparaison `linkme_selection_items.selling_price_ht` vs Bubble
- [ ] **Étape 3** : Prix divergents corrigés dans `channel_pricing`
- [ ] **Étape 4** : Commission calculée = commission Bubble (écart 0.00)
- [ ] **Étape 5** : `retrocession_amount` recalculé dans `sales_order_items`
- [ ] **Vérification finale** : `SUM(retrocession_amount) = commission_bubble`

**NE PAS PASSER à facture suivante si checklist incomplète.**

---

## Fichiers Critiques

- `channel_pricing` : Prix publics catalogue (source de vérité prix)
- `linkme_selection_items` : Prix avec marge (`selling_price_ht` = GENERATED)
- `sales_order_items` : Lignes commandes (colonnes `_locked` pour protection)
- `sales_orders` : Commandes (`linkme_selection_id` pour lier sélection)

---

## À Lire APRÈS Auto-Compact

**Fichier** : `docs/linkme-invoice-verification-workflow.md`

**Commande Romeo** : "Lis `docs/linkme-invoice-verification-workflow.md` avant de continuer"

**Pourquoi** : Ce workflow est critique. L'oublier = corruption données factures.
