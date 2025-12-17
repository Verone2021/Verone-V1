# Analyse : Éco-taxe au niveau global de la commande

**Date** : 2025-11-06
**Auteur** : Claude Code
**Contexte** : Phase 3.4 - Mouvements de stock + Éco-taxe DEEE

---

## 🎯 OBJECTIF

Analyser si les tables `sales_orders` et `purchase_orders` ont déjà des champs pour stocker l'éco-taxe au niveau global de la commande (en plus de l'éco-taxe par ligne produit existante).

---

## 📊 ÉTAT ACTUEL (2025-11-06)

### ✅ Ce qui existe déjà

#### 1. Éco-taxe au niveau des lignes produits

**Migration** : `20251031_002_add_eco_tax_universal.sql`

```sql
-- Colonnes éco-taxe par ligne (DÉJÀ PRÉSENT)
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS eco_tax NUMERIC(10,2) DEFAULT 0 NOT NULL;

ALTER TABLE sales_order_items
ADD COLUMN IF NOT EXISTS eco_tax NUMERIC(10,2) DEFAULT 0 NOT NULL;

-- Produits : Valeur par défaut indicative
ALTER TABLE products
ADD COLUMN IF NOT EXISTS eco_tax_default NUMERIC(10,2) DEFAULT 0;
```

**Commentaire** :

- Éco-taxe/éco-participation par ligne (ex: éco-mobilier France)
- Prix réel modifiable dans la commande (pattern snapshot)
- Copié depuis `products.eco_tax_default` lors ajout produit mais éditable

#### 2. Calcul automatique des totaux commande

**Triggers actuels** : `recalculate_purchase_order_totals()` et `recalculate_sales_order_totals()`

**Logique de calcul** :

```sql
-- Total HT = Somme de toutes les lignes (INCLUANT éco-taxe)
SELECT COALESCE(SUM(
  (quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100))
  + COALESCE(eco_tax, 0)  -- ⚠️ ÉCO-TAXE DÉJÀ INCLUSE DANS total_ht
), 0)
INTO v_total_ht
FROM purchase_order_items
WHERE purchase_order_id = ...;

-- Mise à jour commande
UPDATE purchase_orders
SET
  total_ht = v_total_ht,
  total_ttc = v_total_ht * 1.20,  -- TVA 20%
  updated_at = NOW()
WHERE id = ...;
```

**Architecture actuelle** :

```
purchase_order_items.eco_tax (par ligne)
     ↓
     ↓ (SOMME via trigger)
     ↓
purchase_orders.total_ht (INCLUT DÉJÀ l'éco-taxe)
     ↓
purchase_orders.total_ttc
```

---

### ❌ Ce qui n'existe PAS

#### 1. Colonne `eco_tax_total` au niveau commande

**Recherche effectuée** :

```bash
grep -rn "eco_tax_total\|deee_total\|eco_participation_total" supabase/migrations/
# Résultat : AUCUN MATCH
```

**Conclusion** : Aucune colonne dédiée pour stocker l'éco-taxe globale de la commande.

#### 2. Structure actuelle des tables commandes

**`purchase_orders`** (depuis migration `20250916_004_create_stock_and_orders_tables.sql`) :

```sql
CREATE TABLE purchase_orders (
  id uuid PRIMARY KEY,
  po_number varchar(50) UNIQUE NOT NULL,
  supplier_id uuid NOT NULL,
  status purchase_order_status NOT NULL DEFAULT 'draft',
  currency varchar(3) NOT NULL DEFAULT 'EUR',
  tax_rate numeric(5,4) NOT NULL DEFAULT 0.2000,
  total_ht numeric(12,2) NOT NULL DEFAULT 0,      -- ⚠️ INCLUT éco-taxe
  total_ttc numeric(12,2) NOT NULL DEFAULT 0,     -- ⚠️ INCLUT éco-taxe
  expected_delivery_date date NULL,
  delivery_address jsonb NULL,
  payment_terms varchar(100) NULL,
  notes text NULL,
  -- ... timestamps ...
);
```

**`sales_orders`** (structure identique) :

```sql
CREATE TABLE sales_orders (
  id uuid PRIMARY KEY,
  order_number varchar(50) UNIQUE NOT NULL,
  customer_id uuid NOT NULL,
  status sales_order_status NOT NULL DEFAULT 'draft',
  currency varchar(3) NOT NULL DEFAULT 'EUR',
  tax_rate numeric(5,4) NOT NULL DEFAULT 0.2000,
  total_ht numeric(12,2) NOT NULL DEFAULT 0,      -- ⚠️ INCLUT éco-taxe
  total_ttc numeric(12,2) NOT NULL DEFAULT 0,     -- ⚠️ INCLUT éco-taxe
  expected_delivery_date date NULL,
  shipping_address jsonb NULL,
  billing_address jsonb NULL,
  payment_terms varchar(100) NULL,
  notes text NULL,
  -- ... timestamps ...
);
```

---

## 🤔 ANALYSE FONCTIONNELLE

### Cas d'usage utilisateur

**Besoin exprimé** : Pouvoir ajouter l'éco-taxe de 2 façons :

1. **✅ Au niveau de chaque ligne produit** (DÉJÀ FAIT)
   - Éditable dans `order_items.eco_tax`
   - Copié depuis `products.eco_tax_default`
   - Modifiable indépendamment pour chaque ligne

2. **❌ Au niveau global de la commande** (NON IMPLÉMENTÉ)
   - Actuellement IMPOSSIBLE sans modifier le schéma
   - L'éco-taxe globale est calculée automatiquement (somme des lignes)

### Problématique identifiée

**Architecture actuelle** : L'éco-taxe est TOUJOURS calculée ligne par ligne, puis sommée automatiquement dans `total_ht`.

**Limitation** : Pas de possibilité d'ajouter une éco-taxe "forfaitaire" au niveau de la commande entière (par exemple : frais de traitement DEEE de 10€ fixes pour toute commande contenant de l'électroménager).

---

## 💡 OPTIONS DE SOLUTION

### Option 1 : Ajouter une colonne `eco_tax_total` (Recommended)

**Principe** : Stocker explicitement l'éco-taxe globale, séparée du prix produits.

**Migration à créer** :

```sql
-- Fichier : supabase/migrations/20251106_XXX_add_eco_tax_total_orders.sql

-- ============================================================================
-- 1. AJOUTER COLONNES ECO_TAX_TOTAL AUX COMMANDES
-- ============================================================================

-- Achats
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS eco_tax_total NUMERIC(10,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN purchase_orders.eco_tax_total IS
  'Éco-taxe totale de la commande (somme automatique des eco_tax lignes).
   Permet affichage séparé prix HT vs éco-taxe dans factures.
   Calculé automatiquement via trigger recalculate_purchase_order_totals.';

-- Ventes
ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS eco_tax_total NUMERIC(10,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN sales_orders.eco_tax_total IS
  'Éco-taxe totale de la commande (somme automatique des eco_tax lignes).
   Permet affichage séparé prix HT vs éco-taxe dans factures.
   Calculé automatiquement via trigger recalculate_sales_order_totals.';

-- ============================================================================
-- 2. ADAPTER TRIGGERS RECALCUL TOTAUX
-- ============================================================================

-- Trigger recalcul ACHATS (séparer prix HT vs éco-taxe)
CREATE OR REPLACE FUNCTION recalculate_purchase_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ht_products NUMERIC(10,2);
  v_eco_tax_total NUMERIC(10,2);
BEGIN
  -- Calculer total_ht SANS éco-taxe
  SELECT COALESCE(SUM(
    quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
  ), 0)
  INTO v_total_ht_products
  FROM purchase_order_items
  WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- Calculer éco-taxe totale séparément
  SELECT COALESCE(SUM(COALESCE(eco_tax, 0)), 0)
  INTO v_eco_tax_total
  FROM purchase_order_items
  WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- Mettre à jour commande
  UPDATE purchase_orders
  SET
    total_ht = v_total_ht_products,           -- Prix produits SEULEMENT
    eco_tax_total = v_eco_tax_total,          -- Éco-taxe séparée
    total_ttc = (v_total_ht_products + v_eco_tax_total) * 1.20,  -- TVA sur tout
    updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger recalcul VENTES (identique)
CREATE OR REPLACE FUNCTION recalculate_sales_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ht_products NUMERIC(10,2);
  v_eco_tax_total NUMERIC(10,2);
BEGIN
  -- Calculer total_ht SANS éco-taxe
  SELECT COALESCE(SUM(
    quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
  ), 0)
  INTO v_total_ht_products
  FROM sales_order_items
  WHERE sales_order_id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  -- Calculer éco-taxe totale séparément
  SELECT COALESCE(SUM(COALESCE(eco_tax, 0)), 0)
  INTO v_eco_tax_total
  FROM sales_order_items
  WHERE sales_order_id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  -- Mettre à jour commande
  UPDATE sales_orders
  SET
    total_ht = v_total_ht_products,           -- Prix produits SEULEMENT
    eco_tax_total = v_eco_tax_total,          -- Éco-taxe séparée
    total_ttc = (v_total_ht_products + v_eco_tax_total) * 1.20,  -- TVA sur tout
    updated_at = NOW()
  WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

**Avantages** :

- ✅ Éco-taxe visible séparément dans factures (conformité légale France)
- ✅ Calcul automatique via triggers (aucune saisie manuelle)
- ✅ Facilite reporting éco-taxe collectée/reversée
- ✅ Compatible avec architecture existante

**Inconvénients** :

- ⚠️ BREAKING CHANGE : `total_ht` ne contient plus l'éco-taxe
- ⚠️ Nécessite migration de données existantes (recalcul rétroactif)
- ⚠️ Tous les composants frontend doivent être mis à jour

---

### Option 2 : Ajouter une colonne `eco_tax_manual` (Alternative)

**Principe** : Permettre une éco-taxe forfaitaire manuelle en plus de l'éco-taxe calculée.

**Migration** :

```sql
-- Éco-taxe forfaitaire MANUELLE (en plus de l'éco-taxe lignes)
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS eco_tax_manual NUMERIC(10,2) DEFAULT 0 NOT NULL;

ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS eco_tax_manual NUMERIC(10,2) DEFAULT 0 NOT NULL;

-- Adapter trigger pour inclure éco-taxe manuelle
CREATE OR REPLACE FUNCTION recalculate_purchase_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ht NUMERIC(10,2);
  v_eco_tax_items NUMERIC(10,2);
  v_eco_tax_manual NUMERIC(10,2);
BEGIN
  -- Total produits
  SELECT COALESCE(SUM(
    quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
  ), 0)
  INTO v_total_ht
  FROM purchase_order_items
  WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- Éco-taxe lignes
  SELECT COALESCE(SUM(COALESCE(eco_tax, 0)), 0)
  INTO v_eco_tax_items
  FROM purchase_order_items
  WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- Éco-taxe manuelle (récupérée depuis la commande)
  SELECT COALESCE(eco_tax_manual, 0)
  INTO v_eco_tax_manual
  FROM purchase_orders
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- Mise à jour avec TOTAL éco-taxe (lignes + manuelle)
  UPDATE purchase_orders
  SET
    total_ht = v_total_ht + v_eco_tax_items + v_eco_tax_manual,
    total_ttc = (v_total_ht + v_eco_tax_items + v_eco_tax_manual) * 1.20,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

**Avantages** :

- ✅ Pas de breaking change (total_ht inclut toujours éco-taxe)
- ✅ Permet éco-taxe forfaitaire en plus de l'éco-taxe par ligne
- ✅ Éditable manuellement si besoin

**Inconvénients** :

- ❌ Éco-taxe toujours incluse dans `total_ht` (pas séparée sur factures)
- ❌ Complexité : 2 sources d'éco-taxe (lignes + manuelle)
- ❌ Risque confusion utilisateur

---

## 🎯 RECOMMANDATION

### Solution Proposée : **Option 1 - Ajouter `eco_tax_total`**

**Justification** :

1. **Conformité légale française** : Les factures doivent afficher séparément l'éco-participation DEEE (Décret 2014-1484)
2. **Transparence** : Client voit distinctement prix produit vs éco-taxe
3. **Reporting** : Facilite le calcul de l'éco-taxe collectée à reverser aux éco-organismes
4. **Best practice** : Séparation claire prix vs taxes/contributions

**Nouvelle architecture** :

```
Facture :
┌────────────────────────────────┐
│ Total HT produits : 1000,00 €  │  ← sales_orders.total_ht
│ Éco-participation :   50,00 €  │  ← sales_orders.eco_tax_total
│ ─────────────────────────────  │
│ Sous-total HT     : 1050,00 €  │  ← total_ht + eco_tax_total
│ TVA 20%           :  210,00 €  │
│ ─────────────────────────────  │
│ TOTAL TTC         : 1260,00 €  │  ← sales_orders.total_ttc
└────────────────────────────────┘
```

---

## 📋 PLAN D'IMPLÉMENTATION

### Phase 1 : Migration Database (15min)

**Fichier** : `supabase/migrations/20251106_XXX_add_eco_tax_total_orders.sql`

**Actions** :

1. ✅ Ajouter colonnes `eco_tax_total` à `purchase_orders` et `sales_orders`
2. ✅ Recalculer rétroactivement éco-taxe pour commandes existantes
3. ✅ Adapter triggers `recalculate_purchase_order_totals()` et `recalculate_sales_order_totals()`
4. ✅ Validation : Comparer total_ht AVANT/APRÈS migration

**Script migration complet fourni dans Option 1 ci-dessus.**

### Phase 2 : Mise à jour Types TypeScript (5min)

**Fichier** : Régénération automatique

```bash
supabase gen types typescript --local > apps/back-office/src/types/supabase.ts
```

**Vérification** :

```typescript
// apps/back-office/src/types/supabase.ts
export interface Database {
  public: {
    Tables: {
      purchase_orders: {
        Row: {
          // ...
          total_ht: number; // Prix produits SEULEMENT
          eco_tax_total: number; // ✅ NOUVEAU
          total_ttc: number; // Prix total TTC
        };
      };
    };
  };
}
```

### Phase 3 : Mise à jour Composants Frontend (30min)

**Fichiers impactés** (estimation) :

1. **Commandes Clients** : `apps/back-office/src/app/commandes/clients/page.tsx`
   - Afficher `eco_tax_total` séparé dans détails commande
   - Adapter calculs totaux (total_ht + eco_tax_total)

2. **Commandes Fournisseurs** : `apps/back-office/src/app/commandes/fournisseurs/page.tsx`
   - Idem

3. **Formulaires édition commandes** :
   - Afficher éco-taxe dans résumé (lecture seule, calculée auto)

4. **Factures** (futur) :
   - Afficher éco-participation séparée

**Exemple modification** :

```typescript
// AVANT
<div>Total HT : {order.total_ht}€</div>
<div>Total TTC : {order.total_ttc}€</div>

// APRÈS
<div>Total HT produits : {order.total_ht}€</div>
<div>Éco-participation : {order.eco_tax_total}€</div>
<div>Sous-total HT : {order.total_ht + order.eco_tax_total}€</div>
<div>Total TTC : {order.total_ttc}€</div>
```

### Phase 4 : Tests (20min)

**Tests critiques** :

1. **Console errors = 0** (RÈGLE SACRÉE)

   ```bash
   mcp__playwright__browser_navigate("http://localhost:3000/commandes/clients")
   mcp__playwright__browser_console_messages()
   ```

2. **Workflow complet création commande** :
   - Créer commande avec produits ayant éco-taxe
   - Vérifier calculs automatiques
   - Vérifier affichage séparé

3. **Migration données existantes** :
   - Vérifier que commandes existantes ont bien `eco_tax_total` recalculé

---

## 🚨 BREAKING CHANGES

### Impacts à anticiper

**1. Changement sémantique `total_ht`**

**AVANT** :

```typescript
total_ht = prix_produits + eco_taxe_lignes;
```

**APRÈS** :

```typescript
total_ht = prix_produits SEULEMENT
eco_tax_total = somme(eco_tax lignes)
total_global = total_ht + eco_tax_total
```

**2. Requêtes SQL existantes à adapter**

Toute requête utilisant `total_ht` pour calculer le montant total doit être mise à jour :

```sql
-- AVANT
SELECT SUM(total_ht) FROM sales_orders;

-- APRÈS
SELECT SUM(total_ht + eco_tax_total) FROM sales_orders;
```

**3. Exports/Rapports à mettre à jour**

- CSV exports commandes
- Rapports comptables
- Dashboards KPI

---

## ✅ VALIDATION FINALE

**Checklist avant déploiement** :

- [ ] Migration SQL testée en local (build + console = 0 errors)
- [ ] Types TypeScript régénérés
- [ ] Composants frontend adaptés (affichage séparé éco-taxe)
- [ ] Tests Playwright passés (workflow création commande)
- [ ] Migration données existantes validée (comparaison AVANT/APRÈS)
- [ ] Documentation business rules mise à jour
- [ ] Changelog mis à jour

---

## 📚 RÉFÉRENCES

**Migrations** :

- `supabase/migrations/20250916_004_create_stock_and_orders_tables.sql` (structure initiale)
- `supabase/migrations/20251031_002_add_eco_tax_universal.sql` (éco-taxe lignes)

**Réglementation** :

- Décret n° 2014-1484 du 11 décembre 2014 (affichage éco-participation DEEE)
- Loi AGEC 2020 (économie circulaire)

**Architecture** :

- Pattern snapshot : Éco-taxe copiée depuis `products.eco_tax_default` mais modifiable dans commande
- Triggers automatiques : Recalcul totaux à chaque modification lignes

---

**Rapport généré le** : 2025-11-06
**Prochaine étape** : Validation approche avec utilisateur avant implémentation migration
