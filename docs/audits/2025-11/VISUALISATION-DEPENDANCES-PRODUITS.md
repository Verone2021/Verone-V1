# VISUALISATION DÉPENDANCES - Modules Produits

**Date**: 2025-11-06  
**Objectif**: Cartographie complète des dépendances entre composants et hooks

---

## 🌳 ARBRE DÉPENDANCES COMPLET

```
ProductCard (Core Component)
├── 📦 ProductThumbnail
│   ├── Next.js Image
│   └── Lucide Icons (Package)
├── 🎨 ProductStatus (à extraire)
│   └── Badge UI
├── 💰 ProductPrice (à extraire)
│   └── Formatters utils
├── 🔌 use-product-images
│   ├── Supabase Client
│   └── SWR (caching)
└── 🔌 use-products
    └── Supabase Client

---

UniversalProductSelector (Complex Component)
├── 📦 ProductCard
│   ├── ProductThumbnail
│   └── use-product-images
├── 📦 ProductThumbnail (direct)
├── 🔌 use-products
│   └── Recherche + Filtres
├── 🎨 UI Components
│   ├── Dialog
│   ├── Tabs
│   ├── Select (filtres)
│   ├── ScrollArea
│   └── Badge
└── 📊 Filtres hiérarchiques
    ├── Famille → Catégorie → Sous-catégorie
    └── Supabase RPC

---

ProductImageGallery
├── 📦 ProductThumbnail
├── 🔌 use-product-images
│   ├── fetchImages()
│   ├── uploadImage()
│   ├── deleteImage()
│   └── setPrimaryImage()
├── 📦 ProductImageViewer (modal)
└── 📦 ProductImagesManager (à créer)
    ├── Upload multiple
    ├── Drag & drop
    └── Display order management

---

ProductCreationWizard
├── 📦 CompleteProductWizard (lazy load)
│   ├── ProductForm (sections multiples)
│   └── ProductImagesManager
├── 🔌 use-products
│   └── createProduct()
└── 🎨 UI Components
    ├── Card (choix type)
    ├── Badge
    └── Navigation

---

ProductQuickCreateModal
├── 🔌 use-catalogue
│   └── createProduct()
├── 🎨 Form Components
│   ├── Input
│   ├── Textarea
│   └── Label
└── Validators
    ├── SKU validation
    └── Price validation

---

use-products (Main Hook)
├── 🔌 use-product-search (à extraire)
│   ├── Recherche fulltext
│   └── Debounce
├── 🔌 use-product-filters (à extraire)
│   ├── Filtres hiérarchiques
│   └── Filtres prix/stock
├── 🔌 use-product-mutations (à extraire)
│   ├── createProduct()
│   ├── updateProduct()
│   ├── deleteProduct()
│   └── archiveProduct()
└── Supabase Client
    ├── Products table
    ├── Suppliers JOIN
    └── Images JOIN

---

use-product-images
├── Supabase Client
│   ├── product_images table
│   └── Storage (bucket)
├── SWR (optional caching)
└── Triggers automatiques
    └── public_url generation

---

use-product-variants
├── Supabase Client
│   ├── variant_groups table
│   └── products relation
└── Business logic
    ├── Limite 30 produits/groupe
    └── Google Merchant compliance

---

use-product-packages
├── Supabase Client
│   └── product_packages table
└── Business logic
    ├── Calculs prix packages
    └── Discounts paliers
```

---

## 📊 MATRICE DÉPENDANCES

| Composant → Dépend de | Thumbnail | Card | Selector | ImageGallery | Hooks |
|----------------------|-----------|------|----------|--------------|-------|
| **ProductCard** | ✅ | - | - | - | images, products |
| **ProductThumbnail** | - | - | - | - | - |
| **UniversalSelector** | ✅ | ✅ | - | - | products |
| **ImageGallery** | ✅ | - | - | - | images |
| **QuickCreateModal** | - | - | - | - | products |
| **CreationWizard** | - | - | - | ✅ | products |

---

## 🔄 ORDRE MIGRATION (Par Niveau Dépendances)

### Niveau 0 - Aucune dépendance interne
```
1. ProductThumbnail (standalone)
2. use-product-images (Supabase only)
3. ProductStatus (UI only)
4. ProductPrice (utils only)
```

### Niveau 1 - Dépend uniquement Niveau 0
```
5. ProductCard (Thumbnail + Hooks)
6. use-product-filters (standalone)
7. use-product-search (standalone)
8. use-product-mutations (standalone)
```

### Niveau 2 - Dépend Niveau 0 + 1
```
9. ProductImageGallery (Thumbnail + use-product-images)
10. use-products (refactored - use search/filters/mutations)
11. ProductQuickCreateModal (Hooks + UI)
```

### Niveau 3 - Dépend Niveau 0 + 1 + 2
```
12. UniversalProductSelector (Card + Thumbnail + use-products)
13. ProductImagesManager (Gallery + Hooks)
14. ProductCreationWizard (Form + ImageManager + Hooks)
```

### Niveau 4 - Composants complexes finaux
```
15. ProductGrid (Card + Selector + Hooks)
16. ProductTable (Card + Hooks + Display components)
```

---

## 📈 GRAPHE COMPLEXITÉ

```
Complexité (lignes code)
│
1200├─────────┐ UniversalProductSelector (1181)
    │         │
1000├─────────│
    │         │
 800├─────────│
    │         │
 600├─────────┤ use-products (557)
    │         │
 400├───┬─────┤ use-product-images (394)
    │   │     │ product-photos-modal (477)
 300├───┼──┬──┤ ProductCard-v2 (308)
    │   │  │  │ ProductCard-v1 (329)
    │   │  │  │ ProductQuickCreateModal (333)
 200├───┼──┼──┼─┬ product-image-gallery (249)
    │   │  │  │ │ ProductCreationWizard (231)
    │   │  │  │ │
 100├───┼──┼──┼─┼── ProductThumbnail (103)
    │   │  │  │ │   use-product-variants (164)
    │   │  │  │ │   use-product-packages (162)
   0└───┴──┴──┴─┴────────────────────────────→ Complexité
```

---

## 🎯 PRIORITÉ MIGRATION (Impact × Réutilisation)

```
Impact Élevé × Réutilisation Élevée (PRIORITÉ 1) ⭐⭐⭐
├── ProductThumbnail (tous composants l'utilisent)
├── ProductCard-v2 (central, très utilisé)
├── use-product-images (critique, 5+ composants)
└── UniversalProductSelector (remplace 3 composants)

Impact Élevé × Réutilisation Moyenne (PRIORITÉ 2) ⭐⭐
├── ProductImageGallery (utilisé édition produits)
├── use-products (hook principal, à refactorer)
└── ProductImagesManager (fusion 2 composants)

Impact Moyen × Réutilisation Élevée (PRIORITÉ 3) ⭐
├── ProductQuickCreateModal (quick add partout)
├── ProductCreationWizard (onboarding standard)
└── use-product-variants (variantes multi-contextes)

Impact Moyen × Réutilisation Faible (PRIORITÉ 4)
├── ProductGrid (à créer - listes futures)
├── ProductTable (admin uniquement)
└── use-product-packages (feature avancée)
```

---

## 🔗 IMPORTS EXTERNES COMMUNS

Tous les composants partagent ces dépendances:

### UI Framework
```typescript
- Next.js Image (optimisation images)
- Next.js Router (navigation)
- React hooks (useState, useEffect, etc.)
```

### UI Components (shadcn/ui)
```typescript
- Button, Badge, Card
- Dialog, Tabs, Select
- Input, Label, Textarea
- ScrollArea
```

### Data & State
```typescript
- Supabase Client (BDD)
- SWR (caching optionnel)
- useToast (notifications)
```

### Utils
```typescript
- cn() (classnames)
- formatPrice() (formatage)
- Zod (validation)
```

### Icons
```typescript
- Lucide React (Package, Search, X, etc.)
```

---

## 📦 PACKAGES NPM REQUIS (shared/)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "next": "^15.x",
    "react": "^18.x",
    "swr": "^2.x",
    "zod": "^3.x",
    "lucide-react": "^0.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "typescript": "^5.x"
  }
}
```

---

## 🧪 STRATÉGIE TESTS

### Tests Unitaires (80%+ coverage)
```typescript
✅ ProductThumbnail
  ├─ Affichage image correcte
  ├─ Fallback si pas d'image
  └─ Props size correctes

✅ use-product-images
  ├─ fetchImages() retourne données
  ├─ uploadImage() upload fichier
  ├─ deleteImage() supprime
  └─ setPrimaryImage() met à jour
```

### Tests Intégration (60%+ coverage)
```typescript
✅ ProductCard
  ├─ Affiche produit complet
  ├─ Actions fonctionnent
  └─ Intégration use-product-images

✅ UniversalProductSelector
  ├─ Recherche fonctionne
  ├─ Filtres hiérarchiques OK
  └─ Sélection multiple/single
```

### Tests E2E (Critical paths)
```typescript
✅ Workflow création produit
  1. Ouvrir wizard
  2. Choisir type
  3. Remplir formulaire
  4. Upload images
  5. Valider création

✅ Workflow sélection produits
  1. Ouvrir selector
  2. Rechercher "Chaise"
  3. Filtrer par famille
  4. Sélectionner 3 produits
  5. Confirmer sélection
```

---

**Dernière mise à jour**: 2025-11-06
