# Rapport d'Investigation : KPI Incorrects + Doublons Hooks

**Date** : 2025-11-03
**Auteur** : Claude Code (Diagnostic Approfondi)
**Contexte** : Vérification données réelles après suppression mouvements test
**Scope** : Pages `/stocks/mouvements` + `/stocks` + Architecture hooks

---

## 🎯 RÉSUMÉ EXÉCUTIF

**3 PROBLÈMES CRITIQUES IDENTIFIÉS** :

1. ❌ KPI Mouvements affichent données mélangées (réels + prévisionnels)
2. ❌ KPI Produits en stock affiche 17 au lieu de 1 (mauvaise logique comptage)
3. ⚠️ Architecture hooks : Duplication massive (27 hooks accèdent `products`)

**1 SUCCÈS** :

- ✅ Fix `cost_price` appliqué : Valeur Stock = 58 501€ (était 0€)

---

## 📊 PARTIE 1 : PROBLÈMES KPI

### 1.1 Page Mouvements (/stocks/mouvements)

#### **Symptômes**

```
KPI Affichés         | Valeur Réelle DB   | Écart
---------------------|--------------------|---------
Total: 10            | Réels: 3           | +7 ❌
Aujourd'hui: 0       | Réels: 0           | ✅
Cette Semaine: 0     | Réels: 3           | -3 ❌
Ce Mois: 10          | Réels: 3           | +7 ❌
```

#### **Cause Root**

**Fichier** : `apps/back-office/src/hooks/use-movements-history.ts`
**Fonction** : `fetchStats()` (lignes 244-372)
**Problème** : Queries comptent TOUS les mouvements sans filtrer `affects_forecast = false`

**Code problématique** :

```typescript
// Ligne 252 : Compte TOUS (réels + prévisionnels)
const { count: totalCount } = await supabase
  .from('stock_movements')
  .select('*', { count: 'exact', head: true });
// ❌ MANQUE: .eq('affects_forecast', false)
```

#### **Données Réelles Vérifiées**

```sql
SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN affects_forecast = false THEN 1 END) as reels,
    COUNT(CASE WHEN affects_forecast = true THEN 1 END) as previsionnels
FROM stock_movements;

-- Résultat :
-- total: 10 | reels: 3 | previsionnels: 7
```

#### **Impact Utilisateur**

- ⚠️ **Incohérence UX** : Page affiche "✓ Stock Réel" mais KPI incluent prévisionnels
- ❌ **Décisions Métier Faussées** : Stats ne reflètent pas mouvements confirmés
- 🔄 **Tableau correct** : Affiche 3 mouvements (filtre appliqué)

#### **Fix Requis**

Ajouter `.eq('affects_forecast', false)` dans **TOUTES** les queries de `fetchStats()` :

- Ligne 252 : totalCount
- Ligne 257 : todayCount
- Ligne 263 : weekCount
- Ligne 269 : monthCount
- Lignes 275, 288, 294, 299, 322 : typeStats, realCount, etc.

---

### 1.2 Page Dashboard Stock (/stocks)

#### **Symptômes**

```
KPI Affiché          | Valeur Attendue    | Écart
---------------------|--------------------|---------
17 produits en stock | 1 produit          | +16 ❌
```

**Screenshot** : `.playwright-mcp/stocks-dashboard-kpi-17-produits.png`

#### **Cause Root**

**Fichier** : `apps/back-office/src/hooks/use-stock-dashboard.ts`
**Fonction** : Calcul `overview.products_in_stock` (lignes 170-182)
**Problème** : Logique incorrecte compte TOUS produits avec `stock_real > 0` (données test obsolètes)

**Code problématique** :

```typescript
// Lignes 171-176
const productsInMovements = new Set((movements7d || []).map(m => m.product_id))
const productsWithStock = productsWithLegacyFields.filter(p => (p.stock_real || 0) > 0)
const uniqueProductIds = new Set([
  ...productsInMovements,        // 1 produit avec mouvements
  ...productsWithStock.map(p => p.id)  // ❌ 17 produits test obsolètes !
])

// Ligne 182
products_in_stock: uniqueProductIds.size,  // ❌ Retourne 17 au lieu de 1
```

#### **Données Réelles Vérifiées**

```sql
-- Produits avec stock > 0
SELECT COUNT(*) FROM products WHERE stock_real > 0 AND archived_at IS NULL;
-- Résultat : 17 (données test obsolètes)

-- Produits distincts dans mouvements
SELECT COUNT(DISTINCT product_id) FROM stock_movements
WHERE affects_forecast = false;
-- Résultat : 1 (Fauteuil Milo - Ocre)
```

#### **Intention Utilisateur**

> "Je veux que le KPI affiche le nombre total de produits présents dans les mouvements ou dans l'inventaire. Donc si dans l'inventaire il n'y a qu'un seul produit, une seule référence de la table produit, on mettra un 1."

**Interprétation** : Compter uniquement produits **actifs** (avec mouvements récents), ignorer stocks dormants.

#### **Fix Requis**

```typescript
// Ligne 182 : Remplacer
products_in_stock: uniqueProductIds.size,

// Par :
products_in_stock: productsInMovements.size,  // Uniquement produits avec mouvements
```

---

### 1.3 Valeur Stock ✅

#### **État**

- ✅ **CORRIGÉ** : Affiche maintenant **58 501€**
- 🎯 **Fix Appliqué** : Commit `ff0c1ba` - Ajout `cost_price` dans queries + interface

**Détails Corrections** :

1. `apps/back-office/src/hooks/core/use-stock-core.ts` : Ajout `cost_price` ligne 226 + interface ligne 116
2. `apps/back-office/src/hooks/use-stock-dashboard.ts` : Fix mapping ligne 124 (`p.cost_price || 0`)

**Validation** :

```sql
SELECT
    SUM(stock_real * cost_price) as valeur_totale
FROM products
WHERE archived_at IS NULL AND cost_price IS NOT NULL;
-- Résultat : 58 501€ ✅
```

---

## 🔍 PARTIE 2 : DOUBLONS HOOKS

### 2.1 use-supabase-query (Duplicata 100% Nom)

#### **Fichiers Identifiés**

1. **`apps/back-office/src/hooks/use-supabase-query.ts`**
   - Taille : 251 lignes
   - Utilisé par : `bug-reporter.tsx`, `use-user-activity-tracker.ts`, `use-stock-optimized.ts`
   - Fonctionnalités : Queries + Mutations + Cache

2. **`apps/back-office/src/hooks/base/use-supabase-query.ts`**
   - Taille : 92 lignes
   - Utilisé par : `use-collection-products.ts`, `use-supabase-crud.ts`
   - Fonctionnalités : Version simplifiée

#### **Type de Duplication**

- ⚠️ **Fonctionnelle** (pas duplicata exact)
- Architecture : Version "root" (complète) vs "base" (simplifiée)
- Risque : Confusion, maintenance double

#### **Recommandation**

1. **Analyser différences** : Comparer fonctionnalités des 2 versions
2. **Consolider** : Garder version "root" complète
3. **Migrer** : Remplacer imports `base/` par version root
4. **Supprimer** : Fichier `base/use-supabase-query.ts`

---

### 2.2 Redondance Massive : Table `products` (27 hooks)

#### **Constat**

```bash
$ grep -l "from('products')" apps/back-office/src/hooks/*.ts | wc -l
27
```

**27 hooks différents** accèdent directement à la table `products` !

#### **Hooks Concernés** (Top 10 selon rapport pre-commit)

1. `use-stock-core.ts` ⭐ (Core Business Logic)
2. `use-activity-metrics.ts`
3. `use-product-metrics.ts`
4. `use-abc-analysis.ts`
5. `use-aging-report.ts`
6. `use-archived-products.ts`
7. `use-catalogue.ts`
8. `use-dashboard-analytics.ts`
9. `use-inline-edit.ts`
10. `use-movements-history.ts`

#### **Risques**

- 🔴 **Performance** : Queries non optimisées dupliquées
- 🔴 **Maintenance** : Changement schema = 27 fichiers à modifier
- 🔴 **Bugs** : Logique métier incohérente entre hooks
- 🔴 **Cache** : Pas de stratégie centralisée

#### **Opportunité Consolidation**

**Hook Central Existant** : `use-stock-core.ts`

- ✅ Déjà utilisé pour stock management
- ✅ Architecture Dependency Injection
- ✅ Interface `StockItem` avec `cost_price`
- 🎯 **Peut servir de base** pour refactoring

#### **Stratégie Proposée**

1. **Phase 1** : Identifier queries duplicatives
2. **Phase 2** : Créer `use-products-core.ts` (pattern `use-stock-core`)
3. **Phase 3** : Migrer progressivement hooks métier
4. **Phase 4** : Supprimer accès directs

---

### 2.3 Redondance : Table `stock_movements` (11 hooks)

#### **Constat**

Selon rapport pre-commit : **11 hooks** accèdent à `stock_movements`

**Hooks Concernés** :

- `use-stock-core.ts` ⭐ (Core)
- `use-aging-report.ts`
- `use-dashboard-analytics.ts`
- `use-movements-history.ts` ⭐ (Dédié mouvements)
- `use-purchase-receptions.ts`
- `use-sample-eligibility-rule.ts`
- `use-stock-inventory.ts`
- `use-stock-movements.ts`
- `use-stock-optimized.ts`
- `use-stock.ts`
- `use-unified-sample-eligibility.ts`

#### **Analyse**

- ✅ **Justifié** : `use-stock-core` + `use-movements-history` (logique métier distincte)
- ⚠️ **Suspect** : 9 autres hooks avec accès direct
- 🎯 **Consolidation** : Utiliser `use-stock-core.getMovements()` au lieu de queries directes

---

## 📋 PLAN D'ACTION RECOMMANDÉ

### 🔥 PRIORITÉ CRITIQUE (Faire Maintenant)

#### **1. Fix KPI Mouvements** (~15min)

**Fichier** : `apps/back-office/src/hooks/use-movements-history.ts`
**Fonction** : `fetchStats()` lignes 244-372

**Actions** :

```typescript
// Ajouter partout :
.eq('affects_forecast', false)

// Lignes concernées : 252, 257, 263, 269, 275, 288, 294, 299, 322
```

**Tests** :

- Vérifier KPI "Total : 3" (pas 10)
- Vérifier "Cette Semaine : 3" (pas 0)
- Vérifier "Ce Mois : 3" (pas 10)

#### **2. Fix KPI Produits en Stock** (~5min)

**Fichier** : `apps/back-office/src/hooks/use-stock-dashboard.ts`
**Ligne** : 182

**Actions** :

```typescript
// Remplacer :
products_in_stock: uniqueProductIds.size,

// Par :
products_in_stock: productsInMovements.size,
```

**Tests** :

- Vérifier affichage "1 produit en stock" (pas 17)

---

### 🟡 PRIORITÉ HAUTE (Cette Semaine)

#### **3. Audit Duplicata use-supabase-query** (~30min)

- Comparer contenu 2 fichiers ligne par ligne
- Identifier fonctionnalités uniques
- Décider stratégie consolidation

#### **4. Cleanup Donn\u00e9es Test** (~15min)

```sql
-- Archiver 16 produits obsolètes (garder Fauteuil Milo Ocre)
UPDATE products
SET archived_at = NOW()
WHERE stock_real > 0
  AND id NOT IN (
    SELECT DISTINCT product_id
    FROM stock_movements
    WHERE affects_forecast = false
  );
```

---

### 🟢 PRIORITÉ NORMALE (Ce Mois)

#### **5. Refactoring Hooks Products** (~3-5 jours)

- Créer `use-products-core.ts` (pattern `use-stock-core`)
- Migrer 5 hooks prioritaires
- Documenter pattern

#### **6. Consolidation stock_movements** (~2 jours)

- Standardiser utilisation `use-stock-core.getMovements()`
- Supprimer queries directes

---

## 📸 PREUVES & VALIDATION

### Screenshots

- ✅ `stocks-dashboard-kpi-17-produits.png` : Problème "17 produits" documenté

### Queries SQL Validation

```sql
-- Query 1 : Vérification mouvements
SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN affects_forecast = false THEN 1 END) as reels
FROM stock_movements;
-- Résultat : 10 total, 3 réels

-- Query 2 : Produits distincts avec mouvements
SELECT COUNT(DISTINCT product_id)
FROM stock_movements
WHERE affects_forecast = false;
-- Résultat : 1

-- Query 3 : Produits avec stock > 0
SELECT COUNT(*)
FROM products
WHERE stock_real > 0 AND archived_at IS NULL;
-- Résultat : 17
```

---

## ✅ COMMITS ASSOCIÉS

**Commit 1** : `ff0c1ba` - Fix cost_price + recalcul quantités

- ✅ Ajout `cost_price` dans `use-stock-core.ts`
- ✅ Fix mapping `use-stock-dashboard.ts`
- ✅ Recalcul dynamique quantités `movements-table.tsx`

---

## 🎓 LEARNINGS & BEST PRACTICES

### ❌ Anti-Patterns Identifiés

1. **Stats sans filtre métier** : `fetchStats()` ignore `affects_forecast`
2. **Logique comptage naïve** : Compte stocks dormants au lieu de produits actifs
3. **Duplication massive** : 27 hooks accèdent `products` directement
4. **Naming ambiguë** : 2 fichiers `use-supabase-query` (root vs base)

### ✅ Recommandations Architecture

1. **Core Hooks Pattern** : Centraliser accès DB (`use-*-core.ts`)
2. **Dependency Injection** : Passer Supabase client en param
3. **Filtres Métier Obligatoires** : Toujours filtrer `affects_forecast`, `archived_at`
4. **Tests Validation** : Query SQL directe avant affichage

---

**Fin du Rapport**
**Prochaine Action** : Appliquer fixes PRIORITÉ CRITIQUE (sections 1 & 2)
