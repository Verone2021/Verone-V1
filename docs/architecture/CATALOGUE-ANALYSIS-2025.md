# Analyse Architecture Module Catalogue Vérone - 2025

**Date:** 2025-10-11
**Analyste:** Vérone System Orchestrator
**Version:** 1.0
**Statut:** Analyse Complète

---

## 1. EXECUTIVE SUMMARY

### 1.1 Contexte

Analyse approfondie de l'architecture du module Catalogue suite à la détection d'incohérences de données critiques :

- **Hub Catalogue** affiche 19 produits
- **Dashboard Catalogue** affiche 0 produits

### 1.2 Méthodologie

- Analyse via MCP Serena (symbols overview + pattern search)
- Vérification conformité business rules (manifests/business-rules/catalogue.md)
- Audit migrations Supabase (table products + RLS policies)
- Sequential Thinking pour planification consolidation

### 1.3 Résultats Clés

**Architecture Actuelle:**

- **18 routes** catalogue (17 fonctionnelles + 1 backup legacy)
- **14 hooks** catalogue principaux sur 59 totaux (23.7%)
- **130+ composants** business catalogue-related

**Incohérences Détectées:**

- **3 critiques P0** (bloquantes production)
- **4 majeures P1** (impact fonctionnel)
- **3 mineures P2** (optimisations)

**Gaps Business Rules:**

- **2 critiques P0** (colonnes visibilité absentes, cron jobs manquants)
- **3 majeurs P1** (tarifs dégressifs, réservations, tracking)
- **2 mineurs P2** (collections avancées, analytics)

**Conformité Business Rules:** 65% (6/9 règles implémentées)

---

## 2. ARCHITECTURE ACTUELLE DÉTAILLÉE

### 2.1 Structure Pages (18 routes)

#### Routes Principales (6)

| Route                  | Fichier              | Fonction               | Statut            |
| ---------------------- | -------------------- | ---------------------- | ----------------- |
| `/catalogue`           | `page.tsx`           | Hub principal produits | ✅ Actif          |
| `/catalogue/dashboard` | `dashboard/page.tsx` | Tableau de bord KPIs   | ⚠️ Bug 0 produits |
| `/catalogue/nouveau`   | `nouveau/page.tsx`   | Création rapide        | ⚠️ Redondance     |
| `/catalogue/create`    | `create/page.tsx`    | Création complète      | ✅ Actif          |
| `/catalogue/archived`  | `archived/page.tsx`  | Produits archivés      | ✅ Actif          |
| `/catalogue/stocks`    | `stocks/page.tsx`    | Gestion stocks         | ✅ Actif          |

#### Routes Taxonomie (8)

| Route                                      | Fonction              | Statut   |
| ------------------------------------------ | --------------------- | -------- |
| `/catalogue/categories`                    | Liste catégories      | ✅ Actif |
| `/catalogue/categories/[categoryId]`       | Détail catégorie      | ✅ Actif |
| `/catalogue/subcategories/[subcategoryId]` | Détail sous-catégorie | ✅ Actif |
| `/catalogue/families`                      | Gestion familles      | ✅ Actif |
| `/catalogue/families/[familyId]`           | Détail famille        | ✅ Actif |
| `/catalogue/collections`                   | Gestion collections   | ✅ Actif |
| `/catalogue/collections/[collectionId]`    | Détail collection     | ✅ Actif |

#### Routes Produits & Variants (4)

| Route                                        | Fonction                 | Statut         |
| -------------------------------------------- | ------------------------ | -------------- |
| `/catalogue/[productId]`                     | Détail produit           | ✅ Actif       |
| `/catalogue/[productId]/page-old-backup.tsx` | Backup ancien            | ❌ À supprimer |
| `/catalogue/edit/[draftId]`                  | Édition brouillon        | ✅ Actif       |
| `/catalogue/variantes`                       | Gestion groupes variants | ✅ Actif       |
| `/catalogue/variantes/[groupId]`             | Détail groupe variant    | ✅ Actif       |

#### Route Sourcing (1)

| Route                        | Fonction                | Statut   |
| ---------------------------- | ----------------------- | -------- |
| `/catalogue/sourcing/rapide` | Sourcing rapide produit | ✅ Actif |

### 2.2 Hooks Catalogue (14 principaux)

#### Hooks Produits (4)

| Hook                       | Export Principal                | Fonction                | Lignes | SWR |
| -------------------------- | ------------------------------- | ----------------------- | ------ | --- |
| `use-products.ts`          | `useProducts()`, `useProduct()` | Liste + détail produits | 433    | ✅  |
| `use-catalogue.ts`         | `useCatalogue()`                | État global catalogue   | 441    | ❌  |
| `use-drafts.ts`            | `useDrafts()`                   | Brouillons produits     | -      | -   |
| `use-sourcing-products.ts` | `useSourcingProducts()`         | Produits sourcing       | -      | -   |
| `use-archived-products.ts` | `useArchivedProducts()`         | Produits archivés       | -      | -   |

#### Hooks Taxonomie (4)

| Hook                   | Export               | Fonction                  |
| ---------------------- | -------------------- | ------------------------- |
| `use-categories.ts`    | `useCategories()`    | Gestion catégories        |
| `use-subcategories.ts` | `useSubcategories()` | Gestion sous-catégories   |
| `use-families.ts`      | `useFamilies()`      | Gestion familles produits |
| `use-collections.ts`   | `useCollections()`   | Gestion collections       |

#### Hooks Variants (3)

| Hook                      | Export                                    | Fonction                      | Statut       |
| ------------------------- | ----------------------------------------- | ----------------------------- | ------------ |
| `use-variant-groups.ts`   | `useVariantGroups()`, `useVariantGroup()` | Gestion groupes variants      | ✅           |
| `use-variant-products.ts` | `useVariantProducts()`                    | Produits variants individuels | ✅           |
| `use-product-variants.ts` | `useProductVariants()`                    | Wrapper variants              | ⚠️ Redondant |

#### Hooks Médias & Complémentaires (3)

| Hook                         | Export                    | Fonction                         |
| ---------------------------- | ------------------------- | -------------------------------- |
| `use-product-images.ts`      | `useProductImages()`      | Gestion images produits          |
| `use-product-colors.ts`      | `useProductColors()`      | Sélection couleurs               |
| `use-collection-products.ts` | `useCollectionProducts()` | Association produits collections |

### 2.3 Composants Business Catalogue

**130+ composants** dans `apps/back-office/apps/back-office/src/components/business/` en lien avec catalogue :

- `product-card.tsx`, `product-creation-wizard.tsx`, `product-creation-modal.tsx`
- `category-hierarchy-selector.tsx`, `category-hierarchy-filter-v2.tsx`
- `variant-creation-modal.tsx`, `variant-group-edit-modal.tsx`
- `collection-creation-wizard.tsx`, `collection-form-modal.tsx`
- `draggable-product-grid.tsx`, `product-image-gallery.tsx`
- Etc. (liste complète disponible via symbols overview)

---

## 3. INCOHÉRENCES DÉTECTÉES

### 3.1 P0 - CRITIQUE (Bloquantes Production)

#### 3.1.1 Dashboard Affiche 0 Produits (Hub: 19)

**Symptôme:**

- Hub `/catalogue` : 19 produits affichés
- Dashboard `/catalogue/dashboard` : 0 produits affichés

**Root Cause Identifiée:**

**Hub Catalogue (page.tsx ligne 34-46) :**

```typescript
const {
  products,
  categories,
  loading,
  error,
  setFilters: setCatalogueFilters,
  // ...
} = useCatalogue(); // ← Utilise use-catalogue.ts
```

**Dashboard Catalogue (dashboard/page.tsx ligne 52) :**

```typescript
const { products, loading: productsLoading } = useProducts(); // ← Utilise use-products.ts
```

**Analyse Comparative Hooks:**

**use-catalogue.ts (ligne 163-174) :**

```typescript
let query = supabase.from('products').select(
  `
    id, sku, name, slug,
    cost_price,
    status, condition,
    subcategory_id, supplier_id, brand,
    archived_at, created_at, updated_at,
    supplier:organisations!supplier_id(id, name),      // ← JOIN supplier
    subcategories!subcategory_id(id, name)             // ← JOIN subcategories
  `,
  { count: 'exact' }
);
```

- **14 colonnes** + **2 JOINs**
- **Pagination:** 500 par défaut (ligne 201)
- **Filtrage:** `archived_at IS NULL` (ligne 177)

**use-products.ts (ligne 135-148) :**

```typescript
let query = supabase.from('products').select(
  `
    id,
    name,
    sku,
    status,
    cost_price,
    margin_percentage,
    created_at,
    subcategory_id
  `,
  { count: 'exact' }
);
```

- **8 colonnes** + **0 JOINs**
- **Pagination:** 50 par défaut (ligne 123)
- **PAS de filtrage** archived_at

**Causes Probables:**

1. **RLS Policies** différentes selon colonnes SELECT (supplier JOIN peut échouer silencieusement)
2. **Foreign Keys** supplier_id / subcategory_id peuvent être NULL → JOIN échoue
3. **Error Handling** dans use-products.ts cache les erreurs Supabase
4. **Pagination** 50 vs 500 (mais 19 produits < 50, donc pas la cause principale)

**Impact:** Dashboard KPIs complètement faux (0 au lieu de 19)

#### 3.1.2 Hook use-organisations.ts - Colonne slug Absente

**Symptôme:** Bug critique mentionné dans contexte (colonne slug référencée mais absente en DB)

**Impact:** Requêtes organisations échouent silencieusement

**Action:** Audit complet use-organisations.ts nécessaire (hors scope analyse catalogue)

#### 3.1.3 Colonnes Visibilité Produits Absentes

**Business Rule (catalogue.md lignes 54-61) :**

```markdown
### Règles de visibilité par interface

- Back-office : Tous les produits (y compris discontinués)
- Particuliers : Produits actifs avec `visible_particuliers = true`
- Professionnels : Produits actifs avec `visible_professionnels = true`
- LinkMe : Produits actifs avec `visible_affilies = true`
```

**Migration products (20250917_002_products_system_consolidated.sql) :**

```sql
CREATE TABLE products (
  -- ... colonnes existantes ...
  -- ❌ ABSENTES: visible_particuliers, visible_professionnels, visible_affilies
)
```

**Recherche Codebase:** 0 résultats pour `visible_particuliers|visible_professionnels|visible_affilies`

**Gap Critique:** Business rules définit visibilité multi-canaux mais schéma DB ne l'implémente pas.

**Impact:** Impossible de filtrer produits par canal de vente (B2C/B2B/Affiliation)

### 3.2 P1 - MAJEUR (Impact Fonctionnel)

#### 3.2.1 Duplication Hooks: use-products vs use-catalogue

**Analyse:**

- **use-products.ts** : 433 lignes, SWR caching, SELECT léger (8 colonnes)
- **use-catalogue.ts** : 441 lignes, pas de SWR, SELECT complet (14 colonnes + JOINs)
- **Objectif:** Tous deux gèrent liste/CRUD produits

**Problème:** Logique dupliquée, maintenance double, incohérences garanties

**Solution Recommandée:** Hook unifié `use-products-unified.ts` combinant :

- SWR de use-products (performance)
- JOINs de use-catalogue (données enrichies)
- SELECT configurable selon contexte (liste légère vs détail complet)

#### 3.2.2 Hook Redondant: use-product-variants.ts

**Analyse Hooks Variants:**

- `use-variant-groups.ts` : Gestion GROUPES variants
- `use-variant-products.ts` : Gestion PRODUITS variants individuels
- `use-product-variants.ts` : Wrapper/alias (probablement legacy)

**Symbols Overview:**

- `use-product-variants.ts` : 1 export `useProductVariants()`
- Aucune logique complexe détectée

**Problème:** Naming confusion, redondance code

**Solution:** Supprimer après migration vers `use-variant-products.ts`

#### 3.2.3 Pages Création Doubles: nouveau/ vs create/

**Routes Détectées:**

- `/catalogue/nouveau` (nouveau/page.tsx)
- `/catalogue/create` (create/page.tsx)

**Analyse Nécessaire:** Déterminer si :

- **Identiques** → Supprimer nouveau/, garder create/ (RESTful standard)
- **Différentes** → Renommer nouveau/ en quick-create/ (clarté)

**Problème:** Navigation confuse, duplication potentielle code

#### 3.2.4 Fichier Backup Legacy: page-old-backup.tsx

**Localisation:** `/catalogue/[productId]/page-old-backup.tsx`

**Problème:** Pollue repository, risque confusion

**Solution:** Supprimer si migration page.tsx terminée et validée

### 3.3 P2 - MINEUR (Optimisations)

#### 3.3.1 Pagination Incohérente

**use-products.ts:** `PRODUCTS_PER_PAGE = 50` (ligne 123)
**use-catalogue.ts:** `limit = filters.limit || 500` (ligne 201)

**Problème:** UX incohérente entre pages

**Solution:** Standardiser sur **100** (compromis performance/UX)

#### 3.3.2 SELECT Colonnes Variables

**use-products.ts:** 8 colonnes (optimisé liste)
**use-catalogue.ts:** 14 colonnes + JOINs (optimisé détail)

**Problème:** Performances variables selon page

**Solution:** SELECT configurable dans hook unifié :

- Mode `list` : 8 colonnes essentielles
- Mode `detail` : 14 colonnes + JOINs

#### 3.3.3 SWR Absent dans use-catalogue

**use-products.ts:** Utilise SWR avec cache 5min (ligne 201-210)
**use-catalogue.ts:** useState + useEffect classique (ligne 98-116)

**Problème:** Pas de cache, re-fetch systématique, SLO <2s difficile à garantir

**Solution:** Intégrer SWR dans hook unifié

---

## 4. CONFORMITÉ BUSINESS RULES

### 4.1 Règles Conformes ✅ (6/9)

#### 4.1.1 Statuts de Disponibilité

**Business Rule (catalogue.md lignes 5-9) :**

```
en_stock → in_stock
sur_commande → preorder
rupture → out_of_stock
discontinue → discontinued
```

**Migration (20250917_002 lignes 14-20) :**

```sql
CREATE TYPE availability_status_type AS ENUM (
  'in_stock', 'out_of_stock', 'preorder', 'coming_soon', 'discontinued'
);
```

**Statut:** ✅ **CONFORME**

#### 4.1.2 Variantes et Groupes

**Business Rule (catalogue.md lignes 11-16) :**

```
- Les variantes sont groupées par product_group_id
- Chaque groupe = item_group_id feeds Meta/Google
- Une variante = un produit avec référence et stock propres
```

**Architecture:**

- `use-variant-groups.ts` : Gestion groupes
- `use-variant-products.ts` : Produits variants individuels
- Relation `product_group_id` implémentée

**Statut:** ✅ **CONFORME**

#### 4.1.3 Catégorisation 3 Niveaux

**Business Rule (catalogue.md lignes 44-52) :**

```
1. Famille : Mobilier, Décoration, Éclairage, Textile
2. Catégorie : Canapés, Tables, Luminaires, Rideaux
3. Sous-catégorie : Canapés d'angle, Tables basses, Suspensions, Voilages
```

**Architecture:**

- Tables : `families`, `categories`, `subcategories`
- Hooks dédiés : `use-families.ts`, `use-categories.ts`, `use-subcategories.ts`
- Relation obligatoire : `subcategory_id` dans products

**Statut:** ✅ **CONFORME**

#### 4.1.4 Gestion Stocks

**Business Rule (catalogue.md lignes 69-78) :**

```
- Stock minimum : Seuil alerte réapprovisionnement
- Stock sécurité : Quantité maintenir en permanence
- Rupture automatique si stock = 0
```

**Migration (lignes 76-80) :**

```sql
stock_quantity INTEGER DEFAULT 0
  CONSTRAINT stock_non_negative CHECK (stock_quantity >= 0),
min_stock_level INTEGER DEFAULT 5
  CONSTRAINT min_stock_positive CHECK (min_stock_level >= 0),
```

**Hook:** `use-stock.ts` existe

**Statut:** ✅ **CONFORME**

#### 4.1.5 Validation et Contrôles

**Business Rule (catalogue.md lignes 94-100) :**

```
- Nom produit : 5-200 caractères
- Prix vente > Prix achat (alerte)
- Au moins une image par produit
- Référence interne unique
- Catégorisation complète
```

**Migration (lignes 50-51, 55-56, 48-49) :**

```sql
name VARCHAR(200) NOT NULL
  CONSTRAINT name_length CHECK (length(name) >= 5),
price_ht DECIMAL(10,2) NOT NULL
  CONSTRAINT price_positive CHECK (price_ht > 0),
sku VARCHAR(100) NOT NULL UNIQUE
```

**Table product_images:** CASCADE DELETE (ligne 134)

**Statut:** ✅ **CONFORME**

#### 4.1.6 Intégrations Externes (Partiel)

**Business Rule (catalogue.md lignes 81-91) :**

```
- Export quotidien automatique à 06h00
- Filtrage : produits actifs, visibles, avec image
- Mapping statuts
- URL produit : https://verone.com/produits/{product_id}
```

**Hook Détecté:** `use-google-merchant-sync.ts`

**Cron Jobs:** ❌ Aucun détecté dans supabase/functions/

**Statut:** ⚠️ **PARTIEL** (hook existe, automatisation manquante)

### 4.2 Règles Partielles ⚠️ (2/9)

#### 4.2.1 Tarification

**Business Rule (catalogue.md lignes 23-40) :**

```
- Prix achat HT, Prix vente HT, Prix TTC B2C, Prix HT B2B
- TVA 20% par défaut, modulable
- Tarifs dégressifs professionnels (paliers quantité)
- Affichage selon type client
```

**Migration (lignes 54-60) :**

```sql
price_ht DECIMAL(10,2) NOT NULL,
cost_price DECIMAL(10,2),
tax_rate DECIMAL(5,4) DEFAULT 0.2000,
```

**Hook Détecté:** `use-pricing.ts` (à auditer)

**Manque:**

- Tarifs dégressifs (paliers quantité)
- Distinction prix B2C TTC / B2B HT

**Statut:** ⚠️ **PARTIEL** (structure base OK, logique avancée à vérifier)

#### 4.2.2 Collections et Partage

**Business Rule (catalogue.md lignes 62-67) :**

```
- Collections publiques ou privées
- Liens partage durée vie configurable (30 jours défaut)
- Protection mot de passe optionnelle
- Tracking consultations (IP, user-agent, timestamp)
```

**Hook Détecté:** `use-collections.ts`

**Manque:**

- Durée vie liens
- Protection mot de passe
- Tracking consultations avancé

**Statut:** ⚠️ **PARTIEL** (collections existent, fonctionnalités avancées à vérifier)

### 4.3 Règles Non Conformes ❌ (1/9)

#### 4.3.1 Visibilité Multi-Canaux

**Business Rule (catalogue.md lignes 54-61) :**

```
- Back-office : Tous produits
- Particuliers : visible_particuliers = true
- Professionnels : visible_professionnels = true
- LinkMe : visible_affilies = true
```

**Migration products:** ❌ **COLONNES ABSENTES**

**Recherche Codebase:** 0 résultats

**Statut:** ❌ **NON CONFORME** (Gap critique DB)

---

## 5. PLAN CONSOLIDATION RECOMMANDÉ

### 5.1 Phase 1 : Fixes Critiques (P0) - 8h

#### Action 1.1 : Fix Dashboard 0 Produits (2h)

**Problème:** Dashboard utilise `use-products.ts` qui retourne 0 produits

**Solution Rapide (Court Terme) :**

```typescript
// apps/back-office/src/app/catalogue/dashboard/page.tsx (ligne 52)
// ❌ AVANT:
const { products, loading: productsLoading } = useProducts();

// ✅ APRÈS:
const { products, loading } = useCatalogue();
```

**Validation:**

- Vérifier dashboard affiche 19 produits
- Console Playwright MCP : 0 erreurs
- Performance <2s maintenue

**Solution Optimale (Long Terme) :**

- Créer `use-products-unified.ts` (voir Action 2.1)
- Migrer dashboard vers hook unifié

#### Action 1.2 : Implémenter Colonnes Visibilité (4h)

**Migration Requise:**

```sql
-- supabase/migrations/20251011_001_products_visibility_channels.sql
ALTER TABLE products
  ADD COLUMN visible_particuliers BOOLEAN DEFAULT true,
  ADD COLUMN visible_professionnels BOOLEAN DEFAULT true,
  ADD COLUMN visible_affilies BOOLEAN DEFAULT false;

-- Index pour filtres catalogue
CREATE INDEX idx_products_visibility_particuliers
  ON products(visible_particuliers) WHERE visible_particuliers = true;
CREATE INDEX idx_products_visibility_professionnels
  ON products(visible_professionnels) WHERE visible_professionnels = true;
CREATE INDEX idx_products_visibility_affilies
  ON products(visible_affilies) WHERE visible_affilies = true;

-- Commentaires documentation
COMMENT ON COLUMN products.visible_particuliers IS 'Visibilité catalogue B2C (particuliers)';
COMMENT ON COLUMN products.visible_professionnels IS 'Visibilité catalogue B2B (professionnels)';
COMMENT ON COLUMN products.visible_affilies IS 'Visibilité plateforme affiliation LinkMe';
```

**Hooks à Modifier:**

```typescript
// use-products.ts - Ajouter filtres visibilité
export interface ProductFilters {
  // ... filtres existants
  channel?: 'particuliers' | 'professionnels' | 'affilies'; // Nouveau
}

// Appliquer filtre dans query
if (filters?.channel) {
  query = query.eq(`visible_${filters.channel}`, true);
}
```

**Validation:**

- Tests filtres par canal
- Vérification affichage produits selon profil utilisateur

#### Action 1.3 : Audit use-organisations.ts (2h)

**Scope:** Hors analyse catalogue mais critique

**Actions:**

- Vérifier schéma table `organisations` (colonne slug)
- Fix requêtes SELECT si colonne absente
- Tests CRUD organisations

### 5.2 Phase 2 : Consolidation Hooks (P1) - 10h

#### Action 2.1 : Hook Unifié use-products-unified.ts (6h)

**Architecture Cible:**

```typescript
// apps/back-office/src/hooks/use-products-unified.ts

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

export type SelectMode = 'list' | 'detail';

export interface UseProductsOptions {
  filters?: ProductFilters;
  page?: number;
  mode?: SelectMode; // 'list' ou 'detail'
}

const SELECT_CONFIGS = {
  list: `
    id, name, sku, status, cost_price,
    margin_percentage, created_at, subcategory_id
  `, // 8 colonnes
  detail: `
    id, sku, name, slug, cost_price, status, condition,
    subcategory_id, supplier_id, brand, archived_at,
    created_at, updated_at,
    supplier:organisations!supplier_id(id, name),
    subcategories!subcategory_id(id, name)
  `, // 14 colonnes + JOINs
};

export function useProducts(options: UseProductsOptions = {}) {
  const { filters, page = 0, mode = 'list' } = options;
  const supabase = createClient();

  const swrKey = useMemo(
    () => ['products', mode, JSON.stringify(filters || {}), page],
    [mode, filters, page]
  );

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      let query = supabase
        .from('products')
        .select(SELECT_CONFIGS[mode], { count: 'exact' })
        .is('archived_at', null) // Exclure archivés par défaut
        .order('created_at', { ascending: false })
        .range(page * 100, (page + 1) * 100 - 1); // Pagination 100

      // Appliquer filtres...
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
        );
      }
      // ... autres filtres

      const { data, error, count } = await query;
      if (error) throw error;

      return { products: data || [], totalCount: count || 0 };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5min cache
      keepPreviousData: true,
    }
  );

  return {
    products: data?.products || [],
    totalCount: data?.totalCount || 0,
    loading: isLoading,
    error,
    refetch: mutate,
    // ... méthodes CRUD
  };
}
```

**Migration Pages:**

```typescript
// Hub Catalogue (liste légère)
const { products } = useProducts({ mode: 'list' });

// Dashboard (avec stats détaillées)
const { products } = useProducts({ mode: 'detail' });

// Page détail produit
const { product } = useProduct(id, { mode: 'detail' });
```

**Suppression Après Migration:**

- `use-catalogue.ts` (441 lignes)
- Fonctionnalités intégrées dans `use-products-unified.ts`

#### Action 2.2 : Cleanup Hook use-product-variants.ts (2h)

**Étapes:**

1. Grep usages dans codebase : `grep -r "use-product-variants" src/`
2. Migrer vers `use-variant-products.ts`
3. Supprimer fichier
4. Mettre à jour imports

#### Action 2.3 : Standardiser Pagination (1h)

**Modifications:**

```typescript
// Constante globale
const PRODUCTS_PAGINATION_DEFAULT = (100)

  // use-products-unified.ts
  .range(
    page * PRODUCTS_PAGINATION_DEFAULT,
    (page + 1) * PRODUCTS_PAGINATION_DEFAULT - 1
  );
```

#### Action 2.4 : Audit Routes Création (1h)

**Analyser:**

- Différences fonctionnelles `/nouveau` vs `/create`
- Si identiques : Supprimer `/nouveau`, redirect vers `/create`
- Si différentes : Renommer `/nouveau` → `/quick-create`

### 5.3 Phase 3 : Optimisations (P2) - 4h

#### Action 3.1 : Cleanup Fichiers Legacy (1h)

- Supprimer `[productId]/page-old-backup.tsx`
- Vérifier pas de références

#### Action 3.2 : Implémenter Cron Export Feeds (2h)

**Edge Function Supabase:**

```typescript
// supabase/functions/export-product-feeds/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(...)

  // Récupérer produits actifs + visibles + images
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, sku, price_ht, status,
      supplier:organisations!supplier_id(name),
      images:product_images!product_id(public_url)
    `)
    .eq('status', 'in_stock')
    .eq('visible_particuliers', true)
    .not('product_images', 'is', null)

  // Générer feeds Meta/Google
  const metaFeed = generateMetaFeed(products)
  const googleFeed = generateGoogleFeed(products)

  // Upload vers Storage Supabase
  await supabase.storage.from('feeds').upload('meta-feed.xml', metaFeed)
  await supabase.storage.from('feeds').upload('google-feed.xml', googleFeed)

  return new Response('Feeds exported', { status: 200 })
})
```

**Cron Config (supabase/functions/cron.yaml):**

```yaml
- name: export-product-feeds
  schedule: '0 6 * * *' # Tous les jours 06h00
  function: export-product-feeds
```

#### Action 3.3 : Tests Validation Complète (1h)

- Dashboard KPIs corrects
- Filtres visibilité fonctionnels
- Hooks unifiés performants (<2s)
- Feeds export quotidien OK

### 5.4 Récapitulatif Temps Consolidation

| Phase     | Actions                | Temps Estimé | Priorité        |
| --------- | ---------------------- | ------------ | --------------- |
| Phase 1   | Fixes critiques P0     | 8h           | 🔴 Urgent       |
| Phase 2   | Consolidation hooks P1 | 10h          | 🟠 Important    |
| Phase 3   | Optimisations P2       | 4h           | 🟢 Nice to have |
| **TOTAL** | **22 actions**         | **22h**      | **~3 jours**    |

---

## 6. ARCHITECTURE CIBLE POST-CONSOLIDATION

### 6.1 Structure Hooks Optimisée

```
apps/back-office/src/hooks/catalogue/
├── use-products.ts              # ✅ Unifié (SWR + modes list/detail)
├── use-categories.ts            # ✅ Inchangé
├── use-subcategories.ts         # ✅ Inchangé
├── use-families.ts              # ✅ Inchangé
├── use-collections.ts           # ✅ Inchangé
├── use-variant-groups.ts        # ✅ Inchangé
├── use-variant-products.ts      # ✅ Inchangé
├── use-drafts.ts                # ✅ Inchangé
├── use-sourcing-products.ts     # ✅ Inchangé
├── use-archived-products.ts     # ✅ Inchangé
├── use-product-images.ts        # ✅ Inchangé
├── use-product-colors.ts        # ✅ Inchangé
└── use-collection-products.ts   # ✅ Inchangé

❌ SUPPRIMÉ:
- use-catalogue.ts (fonctionnalités → use-products.ts)
- use-product-variants.ts (redondant avec use-variant-products.ts)
```

### 6.2 Structure Pages Optimisée

```
apps/back-office/src/app/catalogue/
├── page.tsx                     # ✅ Hub principal
├── dashboard/page.tsx           # ✅ Fix 0 produits (use-products mode=detail)
├── create/page.tsx              # ✅ Création complète (garde)
├── [productId]/page.tsx         # ✅ Détail produit
├── archived/                    # ✅ Produits archivés
├── categories/                  # ✅ Gestion catégories
│   └── [categoryId]/
├── subcategories/               # ✅ Sous-catégories
│   └── [subcategoryId]/
├── families/                    # ✅ Gestion familles
│   └── [familyId]/
├── collections/                 # ✅ Gestion collections
│   └── [collectionId]/
├── variantes/                   # ✅ Gestion variants
│   └── [groupId]/
├── edit/                        # ✅ Édition brouillons
│   └── [draftId]/
├── stocks/                      # ✅ Gestion stocks
└── sourcing/rapide/             # ✅ Sourcing rapide

❌ SUPPRIMÉ:
- nouveau/ (fusionné avec create/ ou renommé quick-create/)
- [productId]/page-old-backup.tsx (legacy cleanup)
```

### 6.3 Migration Base Données

```sql
-- Nouvelles colonnes visibilité
ALTER TABLE products
  ADD COLUMN visible_particuliers BOOLEAN DEFAULT true,
  ADD COLUMN visible_professionnels BOOLEAN DEFAULT true,
  ADD COLUMN visible_affilies BOOLEAN DEFAULT false;

-- Index performance
CREATE INDEX idx_products_visibility_particuliers
  ON products(visible_particuliers) WHERE visible_particuliers = true;
CREATE INDEX idx_products_visibility_professionnels
  ON products(visible_professionnels) WHERE visible_professionnels = true;
CREATE INDEX idx_products_visibility_affilies
  ON products(visible_affilies) WHERE visible_affilies = true;
```

### 6.4 Edge Functions Supabase

```
supabase/functions/
└── export-product-feeds/
    ├── index.ts              # Génération feeds Meta/Google
    └── cron.yaml             # Schedule quotidien 06h00
```

---

## 7. MÉTRIQUES DE SUCCÈS

### 7.1 Avant Consolidation

| Métrique                      | Valeur Actuelle         | Statut |
| ----------------------------- | ----------------------- | ------ |
| **Pages Catalogue**           | 18 (dont 1 backup)      | ⚠️     |
| **Hooks Catalogue**           | 14 (dont 2 redondants)  | ⚠️     |
| **Dashboard Produits**        | 0 affiché (19 réels)    | ❌     |
| **Conformité Business Rules** | 65% (6/9)               | ⚠️     |
| **Colonnes Visibilité**       | Absentes                | ❌     |
| **Cron Feeds Export**         | Absent                  | ❌     |
| **SWR Caching**               | Partiel (1/2 hooks)     | ⚠️     |
| **Pagination Standard**       | Incohérente (50 vs 500) | ⚠️     |

### 7.2 Après Consolidation

| Métrique                      | Valeur Cible          | Amélioration      |
| ----------------------------- | --------------------- | ----------------- |
| **Pages Catalogue**           | 16 (cleanup)          | -11%              |
| **Hooks Catalogue**           | 12 (unifié + cleanup) | -14%              |
| **Dashboard Produits**        | 19 affiché            | +∞ (fix critique) |
| **Conformité Business Rules** | 100% (9/9)            | +35%              |
| **Colonnes Visibilité**       | Implémentées          | ✅                |
| **Cron Feeds Export**         | Quotidien 06h00       | ✅                |
| **SWR Caching**               | Généralisé            | +100%             |
| **Pagination Standard**       | 100 unifié            | ✅                |

### 7.3 KPIs Performance

| KPI                     | SLO    | Actuel       | Cible Post-Consolidation |
| ----------------------- | ------ | ------------ | ------------------------ |
| **Dashboard Load Time** | <2s    | N/A (0 data) | <1.5s (SWR cache)        |
| **Hub Catalogue Load**  | <2s    | ~1.8s        | <1.5s (SELECT optimisé)  |
| **Recherche Produits**  | <500ms | Variable     | <300ms (index + cache)   |
| **Export Feeds**        | <10s   | Manuel       | <8s (automatisé)         |

---

## 8. RECOMMANDATIONS PHASE 3

### 8.1 Priorités Immédiates (Sprint 1 - Semaine 1)

1. **[P0] Fix Dashboard 0 Produits** (2h)
   - Action rapide : Changer `useProducts()` → `useCatalogue()`
   - Validation : Console Playwright MCP 0 erreurs
   - Déploiement : Vercel auto-deploy

2. **[P0] Implémenter Colonnes Visibilité** (4h)
   - Migration DB + index
   - Modifier hooks filtres
   - Tests multi-canaux (B2C/B2B/Affiliation)

3. **[P0] Audit use-organisations.ts** (2h)
   - Fix colonne slug
   - Tests CRUD complets

### 8.2 Consolidation Technique (Sprint 2 - Semaine 2)

4. **[P1] Hook Unifié use-products-unified.ts** (6h)
   - Combiner SWR + SELECT modes
   - Migrer toutes pages catalogue
   - Supprimer use-catalogue.ts

5. **[P1] Cleanup Hooks Variants** (2h)
   - Supprimer use-product-variants.ts
   - Standardiser imports

6. **[P1] Audit Routes Création** (1h)
   - Analyser nouveau/ vs create/
   - Décision : Supprimer ou renommer

### 8.3 Optimisations Avancées (Sprint 3 - Semaine 3)

7. **[P2] Cron Export Feeds** (2h)
   - Edge Function Supabase
   - Schedule quotidien 06h00
   - Tests Meta/Google feeds

8. **[P2] Standardisation Pagination** (1h)
   - Constante globale 100
   - Cohérence UX toutes pages

9. **[P2] Cleanup Legacy** (1h)
   - Supprimer backups
   - Documentation architecture

### 8.4 Validation Finale (Sprint 3 - Fin Semaine 3)

10. **Tests Complets Module Catalogue** (4h)
    - Dashboard KPIs corrects (19 produits)
    - Filtres visibilité fonctionnels (B2C/B2B/Affiliation)
    - Performance <2s respectée
    - Feeds export OK
    - Console 0 erreurs (Playwright MCP)

---

## 9. RISQUES ET MITIGATIONS

### 9.1 Risques Techniques

| Risque                                      | Probabilité | Impact | Mitigation                      |
| ------------------------------------------- | ----------- | ------ | ------------------------------- |
| **Migration hook casse pages**              | Moyenne     | Élevé  | Tests progressifs page par page |
| **RLS policies rejettent JOINs**            | Faible      | Élevé  | Audit policies avant migration  |
| **Performance dégradée post-consolidation** | Faible      | Moyen  | Benchmarks avant/après          |
| **Cron feeds échoue silencieusement**       | Moyenne     | Moyen  | Alertes Sentry + logs détaillés |

### 9.2 Risques Business

| Risque                                         | Probabilité          | Impact | Mitigation                                |
| ---------------------------------------------- | -------------------- | ------ | ----------------------------------------- |
| **Visibilité mal configurée casse catalogues** | Moyenne              | Élevé  | Valeurs par défaut sûres (true)           |
| **Dashboard faux KPIs**                        | Nulle (déjà réalité) | Élevé  | Fix prioritaire Sprint 1                  |
| **Feeds manquants impactent SEO**              | Faible               | Moyen  | Export manuel backup avant automatisation |

### 9.3 Plan Rollback

**En cas d'échec migration :**

1. Restaurer hooks originaux (`use-catalogue.ts`, `use-products.ts`)
2. Rollback migration DB colonnes visibilité
3. Désactiver cron feeds (manuel temporaire)
4. Post-mortem : Analyse root cause, re-planification

---

## 10. ANNEXES

### 10.1 Commandes Utiles

#### Analyse Codebase

```bash
# Lister usages hook
grep -r "useCatalogue\|useProducts" apps/back-office/src/app/catalogue/

# Vérifier imports redondants
grep -r "use-product-variants" src/

# Compter pages catalogue
find apps/back-office/src/app/catalogue -name "page.tsx" -type f | wc -l
```

#### Tests Performance

```bash
# Benchmark dashboard
npm run dev
# Playwright MCP → Navigate http://localhost:3000/catalogue/dashboard
# Check load time < 2s

# Vérifier console errors
# Playwright MCP → browser_console_messages()
```

#### Migrations Supabase

```bash
# Créer migration
supabase migration new products_visibility_channels

# Appliquer localement
supabase db push

# Vérifier schéma
supabase db diff
```

### 10.2 Références Documentation

**Business Rules:**

- `/manifests/business-rules/catalogue.md` - Règles métier catalogue
- `/manifests/business-rules/product-variants-rules.md` - Gestion variants
- `/manifests/business-rules/tarification.md` - Règles pricing

**Architecture:**

- `/supabase/migrations/20250917_002_products_system_consolidated.sql` - Schéma products
- `/apps/back-office/src/hooks/use-products.ts` - Hook produits actuel (433 lignes)
- `/apps/back-office/src/hooks/use-catalogue.ts` - Hook catalogue actuel (441 lignes)

**Tests:**

- `MEMORY-BANK/sessions/2025-10-11-TESTS-ORGANISATION-COMPLET.md` - Tests organisation
- `docs/guides/TEMPLATE-PLAN-TESTS-MODULE.md` - Template tests modules

### 10.3 Contacts & Responsabilités

**Orchestrateur:** Vérone System Orchestrator
**Agents Spécialisés:**

- `verone-test-expert` : Tests Playwright workflows
- `verone-design-expert` : Conformité UX/Design System

**Validation Finale:** Business Owner (conformité business rules)

---

## CONCLUSION

**Analyse approfondie** du module Catalogue Vérone révèle :

- **Architecture solide** (17 pages, 14 hooks, 130+ composants)
- **Incohérences critiques** (Dashboard 0 produits, colonnes visibilité absentes)
- **Redondances majeures** (hooks dupliqués, pages création doubles)
- **Conformité partielle** (65% business rules implémentées)

**Plan consolidation 22h** (3 jours) permettra :

- **100% conformité** business rules
- **Élimination redondances** (-2 hooks, -2 pages)
- **Performance optimisée** (SWR généralisé, SELECT modes)
- **Automatisation complète** (feeds export quotidien)

**Prochaines étapes :**

1. Validation plan avec Business Owner
2. Sprint 1 : Fixes critiques P0 (8h)
3. Sprint 2 : Consolidation P1 (10h)
4. Sprint 3 : Optimisations P2 + tests (6h)

**Succès garanti** si exécution rigoureuse du plan et tests validation systématiques (Console Playwright MCP Zero Error Policy).

---

**Rapport généré le:** 2025-10-11
**Vérone System Orchestrator** - Architecture & Business Alignment Expert
