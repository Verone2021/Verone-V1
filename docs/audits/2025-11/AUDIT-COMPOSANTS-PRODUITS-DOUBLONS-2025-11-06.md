# AUDIT DÉTAILLÉ COMPOSANTS PRODUITS - Architecture Réutilisable

**Date**: 2025-11-06  
**Objectif**: Identifier doublons et créer architecture `shared/modules/products/` pour 3 apps (backoffice, ecommerce, commissions)  
**Scope**: Composants et hooks liés aux produits  

---

## 📊 STATISTIQUES GLOBALES

### Composants Produits
- **Total composants produits**: 42 fichiers `.tsx` dans `src/components/business/`
- **Total fichiers produits (src)**: 64 fichiers
- **Composants analysés en détail**: 12 composants clés

### Hooks Produits
- **Total hooks produits**: 8 hooks dans `src/hooks/`
- **Lignes de code hooks**: 1,277 lignes au total
  - `use-products.ts`: 557 lignes (hook principal)
  - `use-product-images.ts`: 394 lignes
  - `use-product-variants.ts`: 164 lignes
  - `use-product-packages.ts`: 162 lignes

---

## 🔍 DOUBLONS IDENTIFIÉS (ANALYSE DÉTAILLÉE)

### 1️⃣ ProductCard vs ProductCard-v2 ⚠️ DOUBLON MAJEUR

**Fichiers**:
- `src/components/business/product-card.tsx` (329 lignes)
- `src/components/business/product-card-v2.tsx` (308 lignes)

**Différences clés**:

| Critère | ProductCard (v1) | ProductCard-v2 |
|---------|------------------|----------------|
| **Design** | Card Vérone (border noir) | Rounded corners 2025 (shadow progressive) |
| **Image height** | h-32 (128px) | h-24 (96px) - 25% plus petit |
| **Hover effect** | shadow-lg | shadow-xl + translate-y-1 |
| **Background** | border-b border-black | bg-white rounded-xl |
| **Badge size** | text-[10px] | text-[9px] |
| **Actions layout** | 2 lignes (Archive/Delete + Voir détails) | 1 ligne (Voir détail + Archive icon + Delete icon) |
| **Priority prop** | boolean | boolean + index (dynamic LCP 6 first) |
| **Hover state** | hover: via group | useState isHovered + overlay gradient |

**Fonctionnalités communes**:
- ✅ Affichage image produit (via `useProductImages`)
- ✅ Badges statut (product_status + condition)
- ✅ Badge "nouveau" (30 derniers jours)
- ✅ Stock + Prix d'achat basique
- ✅ Actions: Voir détails, Archiver, Supprimer

**Recommandation**: ✅ **GARDER ProductCard-v2**

**Raisons**:
1. Design moderne 2025 (rounded corners, shadow elevation)
2. Optimisations performance (h-24, dynamic priority, lazy loading)
3. Hover state management plus fluide
4. Actions compactes (1 ligne vs 2)
5. Compatible Design System V2

**Migration**: Renommer `ProductCard-v2` → `ProductCard` et supprimer v1

---

### 2️⃣ ProductSelector (3 versions !) ⚠️ DOUBLON CRITIQUE

**Fichiers**:
1. `src/components/business/product-selector.tsx` (295 lignes) - **VARIANTES**
2. `src/components/forms/ProductSelector.tsx` (296 lignes) - **CONSULTATIONS**
3. `src/components/business/universal-product-selector-v2.tsx` (1181 lignes) - **UNIVERSEL**

**Analyse comparative**:

#### A. product-selector.tsx (Variantes)
- **Contexte**: Ajout produits à un groupe de variantes
- **Features**:
  - Recherche produits disponibles
  - Sélection multiple (Set)
  - Limite 30 produits (Google Merchant)
  - Hook: `useVariantProducts`
  - UI: Dialog + Liste produits + Actions
- **Taille**: 295 lignes
- **Spécificité**: Variantes uniquement

#### B. forms/ProductSelector.tsx (Consultations)
- **Contexte**: Sélection produits pour consultations
- **Features**:
  - Filtres: Catalogue vs Sourcing
  - RPC: `get_consultation_eligible_products`
  - Tabs (Tous/Catalogue/Sourcing)
  - Badge sourcing_type, requires_sample
  - Statistiques (Total, Catalogue, Sourcing)
- **Taille**: 296 lignes
- **Spécificité**: Consultations uniquement

#### C. universal-product-selector-v2.tsx (Universel)
- **Contexte**: Sélection multi-contextes (collections, orders, consultations, variants, samples)
- **Features**:
  - **Layout 2 colonnes** (dual-pane pattern)
  - **Filtres hiérarchiques**: Famille → Catégorie → Sous-catégorie (cascade)
  - **Selection mode**: single | multi
  - **Context-aware**: 5 contextes supportés
  - **Micro-interactions**: hover, scale, shadow
  - **Skeleton loading** professionnel
  - **Empty states** avec illustrations
  - **Responsive** mobile (tabs <768px)
  - Quantity + Pricing optionnels
- **Taille**: 1181 lignes (le plus complet)
- **Spécificité**: **RÉUTILISABLE TOUS CONTEXTES**

**Recommandation**: ✅ **GARDER UniversalProductSelector-v2**

**Raisons**:
1. **Universel** - Couvre TOUS les cas d'usage (5 contextes)
2. **Filtres avancés** - Hiérarchie complète Famille > Catégorie > Sous-catégorie
3. **Design professionnel 2025** - Dual-pane, micro-interactions
4. **Flexible** - Props pour adapter UI (showQuantity, showPricing, showImages)
5. **Production-ready** - Skeleton, empty states, responsive

**Migration**:
- Adapter contextes spécifiques (variants, consultations) pour utiliser UniversalProductSelector-v2
- Props context: 'variants' | 'consultations'
- Supprimer les 2 autres versions

---

### 3️⃣ Images Produits - Gestion Doublons ⚠️ DOUBLON MOYEN

**Fichiers**:
- `product-image-gallery.tsx` (249 lignes) - **Galerie complète avec actions**
- `product-images-modal.tsx` (24 lignes) - **Modal simple**
- `product-photos-modal.tsx` (477 lignes) - **Modal upload complexe**
- `product-image-management.tsx` - **Gestion complète**
- `product-image-viewer-modal.tsx` - **Visualisation fullscreen**
- `product-thumbnail.tsx` (103 lignes) - **Miniature réutilisable**

**Analyse**:

#### ProductThumbnail ✅ À GARDER
- **Usage**: Miniature réutilisable (xs, sm, md, lg, xl)
- **Props**: src, alt, size, priority
- **Optimisation**: Next.js Image, fallback icon
- **Taille**: 103 lignes
- **Réutilisable**: OUI - Parfait pour shared/

#### ProductImageGallery ✅ À GARDER (Adapter)
- **Usage**: Galerie compacte avec image principale + badges
- **Features**: 
  - Image 200x200
  - Badges status
  - Overlay actions (Voir, Définir principale)
  - Bouton "Gérer photos"
  - Hook: `useProductImages`
- **Taille**: 249 lignes
- **Réutilisable**: OUI (avec adaptations)

#### product-photos-modal.tsx ⚠️ ANALYSER FUSION
- **Taille**: 477 lignes - Complexe
- **Features**: Upload multiple, drag & drop, gestion complète
- **Recommandation**: Comparer avec product-image-management

**Recommandation Images**:
1. **Garder ProductThumbnail** (miniatures)
2. **Garder ProductImageGallery** (galerie compacte)
3. **Fusionner** product-photos-modal + product-image-management → **ProductImagesManager**
4. **Garder** product-image-viewer-modal (visualisation fullscreen)

---

### 4️⃣ Création Produits - Modal vs Wizard ⚠️ DOUBLON PARTIEL

**Fichiers**:
- `product-creation-modal.tsx` (333 lignes) - **Modal simple**
- `product-creation-wizard.tsx` (231 lignes) - **Wizard 2 étapes**

**Analyse**:

#### ProductCreationModal (Simple)
- **Usage**: Création rapide produit basique
- **Champs**: Nom, SKU, Prix HT, Description, Min stock
- **Features**:
  - Auto-génération SKU
  - Validation temps réel
  - Calcul TVA automatique
- **Hook**: `useCatalogue.createProduct`
- **Taille**: 333 lignes

#### ProductCreationWizard (Complet)
- **Usage**: Wizard 2 étapes (Type → Formulaire)
- **Types**: Sourcing rapide | Produit complet
- **Features**:
  - Étape 1: Choix type (card UI élégant)
  - Étape 2: CompleteProductWizard (lazy load)
  - Navigation retour
- **Taille**: 231 lignes

**Recommandation**: ✅ **GARDER LES DEUX**

**Raisons**:
1. **Cas d'usage différents**:
   - Modal: Création ultra-rapide inline (5 champs)
   - Wizard: Création guidée complète (type + formulaire)
2. **Non redondants**: Wizard utilise CompleteProductWizard (pas analysé ici)
3. **Complémentaires**: Modal = Quick add, Wizard = Onboarding

**Action**: Renommer pour clarté
- `ProductCreationModal` → `ProductQuickCreateModal`
- `ProductCreationWizard` → `ProductCreationWizard` (OK)

---

## 📦 ARCHITECTURE PROPOSÉE `shared/modules/products/`

### Structure Complète

```typescript
src/shared/modules/products/
├── components/
│   ├── cards/
│   │   ├── ProductCard.tsx              // ✅ V2 (design 2025)
│   │   ├── ProductCardCompact.tsx       // Nouvelle: version mini
│   │   └── ProductCardSkeleton.tsx      // Loading state
│   ├── selectors/
│   │   └── UniversalProductSelector.tsx // ✅ V2 universel
│   ├── images/
│   │   ├── ProductThumbnail.tsx         // ✅ Miniatures réutilisables
│   │   ├── ProductImageGallery.tsx      // ✅ Galerie compacte
│   │   ├── ProductImagesManager.tsx     // Fusion photos-modal + management
│   │   └── ProductImageViewer.tsx       // Fullscreen viewer
│   ├── forms/
│   │   ├── ProductQuickCreateModal.tsx  // Création rapide
│   │   ├── ProductCreationWizard.tsx    // Wizard complet
│   │   ├── ProductForm.tsx              // Formulaire édition complet
│   │   └── ProductFormSections/         // Sections réutilisables
│   │       ├── BasicInfoSection.tsx
│   │       ├── PricingSection.tsx
│   │       ├── StockSection.tsx
│   │       ├── ImagesSection.tsx
│   │       └── VariantsSection.tsx
│   ├── display/
│   │   ├── ProductPrice.tsx             // Affichage prix multi-canaux
│   │   ├── ProductStatus.tsx            // Badges statut
│   │   ├── ProductStockIndicator.tsx    // Indicateur stock
│   │   └── ProductSupplierInfo.tsx      // Info fournisseur
│   └── lists/
│       ├── ProductGrid.tsx              // Grille produits
│       ├── ProductList.tsx              // Liste compacte
│       └── ProductTable.tsx             // Tableau données
├── hooks/
│   ├── use-products.ts                  // ✅ Hook principal (557 lignes)
│   ├── use-product-details.ts           // Extraction détails (from use-products)
│   ├── use-product-images.ts            // ✅ Gestion images (394 lignes)
│   ├── use-product-variants.ts          // ✅ Gestion variantes (164 lignes)
│   ├── use-product-packages.ts          // ✅ Gestion packages (162 lignes)
│   ├── use-product-pricing.ts           // Pricing multi-canaux
│   ├── use-product-stock.ts             // Stock management
│   └── use-product-search.ts            // Recherche & filtres
├── types/
│   ├── product.types.ts                 // Types partagés
│   ├── variant.types.ts                 // Types variantes
│   ├── pricing.types.ts                 // Types pricing
│   └── stock.types.ts                   // Types stock
├── utils/
│   ├── product-formatters.ts            // Formatage (prix, SKU, etc.)
│   ├── product-validators.ts            // Validation formulaires
│   ├── product-filters.ts               // Logique filtres
│   └── product-status-utils.ts          // ✅ Utilitaires statut (existe)
└── constants/
    ├── product-statuses.ts              // Config statuts
    ├── product-conditions.ts            // Conditions produit
    └── product-defaults.ts              // Valeurs par défaut
```

---

## 🎯 COMPOSANTS À EXTRAIRE (Priority Order)

### Phase 1 - Core Components (Semaine 1-2)
1. ✅ **ProductThumbnail** (103 lignes) - READY
2. ✅ **ProductCard-v2** → ProductCard (308 lignes)
3. ✅ **UniversalProductSelector-v2** (1181 lignes)
4. ✅ **use-product-images** (394 lignes)
5. **ProductPrice** (extraire de ProductCard)
6. **ProductStatus** (extraire de ProductCard)

### Phase 2 - Images & Forms (Semaine 3-4)
7. **ProductImageGallery** (249 lignes)
8. **ProductImagesManager** (fusionner 2 fichiers)
9. **ProductQuickCreateModal** (333 lignes)
10. **ProductCreationWizard** (231 lignes)

### Phase 3 - Advanced Features (Semaine 5-6)
11. **use-products** (557 lignes) - Refactoring en modules
12. **use-product-variants** (164 lignes)
13. **use-product-packages** (162 lignes)
14. **ProductGrid** (à créer)
15. **ProductTable** (à créer)

---

## 📊 DÉPENDANCES ENTRE COMPOSANTS

```
ProductCard
  ├─ ProductThumbnail (image)
  ├─ ProductStatus (badges)
  ├─ ProductPrice (prix)
  └─ use-product-images (hook)

UniversalProductSelector
  ├─ ProductCard (liste produits)
  ├─ ProductThumbnail (miniatures)
  └─ use-products (hook recherche)

ProductImageGallery
  ├─ ProductThumbnail (miniatures)
  ├─ ProductImagesManager (modal)
  └─ use-product-images (hook)

ProductCreationWizard
  ├─ ProductForm (formulaire complet)
  ├─ ProductImagesManager (upload images)
  └─ use-products (création)
```

---

## 💡 EXEMPLES USAGE FUTUR (3 Apps)

### 1. Back-Office - Gestion Complète

```tsx
// apps/backoffice/src/app/catalogue/page.tsx
import { ProductGrid } from '@verone/shared/modules/products'
import { UniversalProductSelector } from '@verone/shared/modules/products'
import { ProductCreationWizard } from '@verone/shared/modules/products'

export default function CataloguePage() {
  return (
    <>
      {/* Grille produits avec édition */}
      <ProductGrid
        products={products}
        editable={true}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      {/* Sélecteur universel */}
      <UniversalProductSelector
        mode="multi"
        context="collections"
        onSelect={handleAddToCollection}
      />

      {/* Wizard création */}
      <ProductCreationWizard
        onSuccess={handleProductCreated}
      />
    </>
  )
}
```

### 2. E-Commerce - Catalogue Vitrine

```tsx
// apps/ecommerce/src/app/products/page.tsx
import { ProductGrid } from '@verone/shared/modules/products'
import { ProductCard } from '@verone/shared/modules/products'

export default function ProductsPage() {
  return (
    <>
      {/* Grille vitrine (view only) */}
      <ProductGrid
        products={products}
        viewOnly={true}
        showAddToCart={true}
        onAddToCart={handleAddToCart}
      />

      {/* Card produit avec prix client */}
      <ProductCard
        product={product}
        showActions={false}
        showPricing={true}
        channelId="ecommerce"
        priority={index < 6} // LCP optimization
      />
    </>
  )
}
```

### 3. Commissions - Sélection Produits

```tsx
// apps/commissions/src/app/calculators/page.tsx
import { UniversalProductSelector } from '@verone/shared/modules/products'
import { ProductCard } from '@verone/shared/modules/products'
import { useProducts } from '@verone/shared/modules/products'

export default function CommissionsPage() {
  const { products } = useProducts({ 
    filters: { product_status: 'active' } 
  })

  return (
    <>
      {/* Sélecteur produits pour commissions */}
      <UniversalProductSelector
        mode="multi"
        context="orders"
        showPricing={true}
        onSelect={handleCalculateCommissions}
      />

      {/* Card avec taux commission */}
      <ProductCard
        product={product}
        showCommissionRate={true}
        commissionPercentage={5.5}
      />
    </>
  )
}
```

---

## 🔧 PLAN MIGRATION DÉTAILLÉ

### Étape 1: Setup Monorepo Structure (1 jour)

```bash
# Créer structure shared
mkdir -p src/shared/modules/products/{components,hooks,types,utils,constants}
mkdir -p src/shared/modules/products/components/{cards,selectors,images,forms,display,lists}

# Initialiser package.json pour shared (si monorepo Turbo)
cd src/shared/modules/products
npm init -y
```

### Étape 2: Migration Composants Core (3-4 jours)

#### ProductThumbnail (Priority 1)
```bash
# Copier et adapter
cp src/components/business/product-thumbnail.tsx \
   src/shared/modules/products/components/images/ProductThumbnail.tsx

# Adapter imports
# @/lib/utils → @verone/shared/utils
# @/components/ui → @verone/shared/ui
```

#### ProductCard (Priority 2)
```bash
# Copier v2, renommer v1 → legacy
mv src/components/business/product-card.tsx \
   src/components/business/product-card-legacy.tsx

cp src/components/business/product-card-v2.tsx \
   src/shared/modules/products/components/cards/ProductCard.tsx
```

#### UniversalProductSelector (Priority 3)
```bash
cp src/components/business/universal-product-selector-v2.tsx \
   src/shared/modules/products/components/selectors/UniversalProductSelector.tsx
```

### Étape 3: Migration Hooks (2-3 jours)

```bash
# Copier hooks avec adaptations
cp src/hooks/use-product-images.ts \
   src/shared/modules/products/hooks/use-product-images.ts

cp src/hooks/use-product-variants.ts \
   src/shared/modules/products/hooks/use-product-variants.ts

# Refactoring use-products (557 lignes → modules)
# Extraire: use-product-search, use-product-filters, use-product-mutations
```

### Étape 4: Migration Types (1 jour)

```bash
# Extraire types depuis use-products.ts
# Product, ProductFilters, CreateProductData, UpdateProductData
# → src/shared/modules/products/types/product.types.ts
```

### Étape 5: Tests & Validation (2-3 jours)

```bash
# Tests unitaires pour chaque hook
npm run test:unit -- --filter=products

# Tests E2E pour composants
npm run test:e2e -- --filter=products

# Validation build
npm run build
```

### Étape 6: Documentation (1 jour)

```bash
# Créer README.md avec exemples
# Storybook stories pour composants
# JSDoc pour hooks
```

---

## 📈 ESTIMATION EFFORT TOTAL

| Phase | Durée | Complexité | Risk |
|-------|-------|------------|------|
| Setup Monorepo | 1 jour | Faible | Faible |
| Core Components | 4 jours | Moyenne | Moyenne |
| Hooks Migration | 3 jours | Élevée | Élevée |
| Types & Utils | 1 jour | Faible | Faible |
| Tests & Validation | 3 jours | Moyenne | Moyenne |
| Documentation | 1 jour | Faible | Faible |
| **TOTAL** | **13 jours** | - | - |

**Effort réel avec imprévus**: **15-18 jours** (3-4 semaines)

---

## ✅ RECOMMANDATIONS FINALES

### Doublons à Supprimer
1. ✅ **product-card.tsx** → Garder V2 uniquement
2. ✅ **product-selector.tsx** (variantes) → Remplacer par UniversalProductSelector
3. ✅ **forms/ProductSelector.tsx** (consultations) → Remplacer par UniversalProductSelector

### Composants à Fusionner
1. **product-photos-modal.tsx** + **product-image-management.tsx** → **ProductImagesManager**

### Composants à Renommer
1. **ProductCreationModal** → **ProductQuickCreateModal**
2. **UniversalProductSelector-v2** → **UniversalProductSelector**

### Architecture Cible
- **Monorepo structure**: `src/shared/modules/products/`
- **3 apps consommatrices**: backoffice, ecommerce, commissions
- **Réutilisation maximale**: 80%+ des composants partagés
- **Tests coverage**: >80% pour hooks, >60% pour composants

---

## 📝 NEXT STEPS

1. **Validation architecture** par équipe
2. **Priorisation migration** (core components first)
3. **Setup CI/CD** pour shared modules
4. **Migration progressive** (feature flags)
5. **Documentation** Storybook + JSDoc
6. **Formation équipe** sur nouveaux patterns

---

**Fin du rapport - 2025-11-06**
