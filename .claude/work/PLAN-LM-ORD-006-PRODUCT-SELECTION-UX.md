# TASK: LM-ORD-006 — Refonte UX Sélection Produits (CreateOrderModal)

**Date**: 2026-01-14
**Statut**: READ1 Investigation + Plan de correction
**Fichiers**: `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

---

## 📊 Analyse Comparative

### Page Publique (`/s/[id]/page.tsx`) ✅ EXCELLENTE UX

**Fichier**: `apps/linkme/src/app/(public)/s/[id]/page.tsx`

| Feature | Implémenté | Lignes | Description |
|---------|-----------|--------|-------------|
| ✅ Barre de recherche | Oui | 408-414 | `ProductFilters` component avec état `searchQuery` |
| ✅ Filtres catégories | Oui | 417-425 | `CategoryTabs` avec extraction automatique des catégories |
| ✅ Grille responsive | Oui | 456-595 | Grid 4 colonnes (xl), 3 (lg), 2 (sm), 1 (mobile) |
| ✅ Pagination | Oui | 242-248, 621-628 | 12 produits/page avec `Pagination` component |
| ✅ Images produits | Oui | 474-541 | Images hover + badges (vedette, stock) |
| ✅ Panier flottant | Oui | 671-683 | Bouton fixe en bas à droite avec total |
| ✅ Modal panier+form | Oui | 686-778 | `OrderFormUnified` avec panier à gauche, formulaire à droite |

**Logique de filtrage** (lignes 212-239):
```typescript
const filteredItems = useMemo(() => {
  let filtered = items;

  // Filter by search
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      item =>
        item.product_name.toLowerCase().includes(query) ||
        item.product_sku.toLowerCase().includes(query)
    );
  }

  // Filter by category
  if (selectedCategory) {
    const categoryName = categories.find(c => c.id === selectedCategory)?.name;
    if (categoryName) {
      filtered = filtered.filter(
        item => (item.category ?? 'Autres') === categoryName
      );
    }
  }

  return filtered;
}, [items, searchQuery, selectedCategory, categories]);
```

**Extraction catégories** (lignes 190-210):
```typescript
const categories: ICategory[] = useMemo(() => {
  const categoryMap = new Map<string, { count: number }>();

  for (const item of items) {
    const cat = item.category ?? 'Autres';
    const existing = categoryMap.get(cat);
    if (existing) {
      existing.count++;
    } else {
      categoryMap.set(cat, { count: 1 });
    }
  }

  return Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);
}, [items]);
```

---

### CreateOrderModal (Utilisateurs authentifiés) ❌ UX INSUFFISANTE

**Fichier**: `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

| Feature | Implémenté | Lignes | Problème |
|---------|-----------|--------|----------|
| ⚠️ Barre de recherche | Basique | 236-242 | Input simple, pas de composant dédié |
| ❌ Filtres catégories | NON | - | **ABSENT** - impossible de filtrer par catégorie |
| ❌ Grille responsive | NON | 920-1002 | Liste verticale basique (pas de grille) |
| ❌ Pagination | NON | - | **ABSENT** - tous les produits affichés en scrollant |
| ✅ Images produits | Oui | 933-941 | Images 12x12 (petites) |
| ✅ Panier | Oui | 1007-1150 | Tableau récapitulatif en dessous (pas côte à côte) |
| ❌ Layout optimal | NON | - | Panier en bas au lieu de côte à côte |

**Code actuel** (ligne 236-242):
```typescript
const filteredProducts = useMemo(() => {
  if (!products) return [];
  if (!searchQuery) return products;
  const query = searchQuery.toLowerCase();
  return products.filter(
    (p: any) =>
      p.productName.toLowerCase().includes(query) ||
      p.productSku.toLowerCase().includes(query)
  );
}, [products, searchQuery]);
```

**Problèmes identifiés**:
1. ❌ Pas de filtres par catégories → difficile de trouver un produit spécifique dans un large catalogue
2. ❌ Pas de pagination → tous les produits chargés en même temps (performance)
3. ❌ Liste verticale → scroll infini, pas de vue d'ensemble
4. ❌ Panier en dessous → l'utilisateur doit scroller pour voir le total
5. ⚠️ Recherche basique → pas de feedback visuel (ex: "12 résultats pour 'chaise'")

---

## 🌐 Best Practices (Web Research 2025)

### Baymard Institute - Product List UX 2025

**Source**: [Product List UX Best Practices 2025 – Baymard Institute](https://baymard.com/blog/current-state-product-list-and-filtering)

**Key Findings**:
- 58% of desktop sites have **mediocre** product filtering implementation
- **Sidebar filtering** preferred over horizontal toolbars
- Display **number of products** for each filter option
- Provide **clear reset** options for filters

### E-Commerce Filter Best Practices

**Source**: [25 Ecommerce Product Filters With UX Design Best Practices](https://thegood.com/insights/ecommerce-product-filters/)

**Essential Filter Types**:
1. **Category filters** (most important for large catalogs)
2. **Price range filters**
3. **Brand filters**
4. **Rating filters**
5. **Availability filters**

**User Experience Features**:
- Display the **number of products** associated with each filter option
- Provide clear options to **reset or adjust filters**
- **Breadcrumb navigation** to show current filter state

### Material-UI Autocomplete (React Components 2025)

**Source**: [React Autocomplete component - Material UI](https://mui.com/material-ui/react-autocomplete/)

**Best Practices**:
- Enhanced text input with **suggested options panel**
- Support for **asynchronous data loading**
- **Custom rendering** for dropdown options
- **Keyboard navigation** support
- **Multi-field search** (title, brand, category, description)

---

## 🎯 Solution Proposée

### Architecture Recommandée

**Layout**: Modal full-screen (comme page publique)

```
┌──────────────────────────────────────────────────────────┐
│ Header: Sélection produits                         [X]   │
├─────────────────────────┬────────────────────────────────┤
│                         │                                │
│  CATALOGUE              │  PANIER                        │
│  (Gauche 60%)           │  (Droite 40%)                  │
│                         │                                │
│  ┌─────────────────┐    │  ┌──────────────────────────┐ │
│  │ 🔍 Recherche    │    │  │ Récapitulatif            │ │
│  └─────────────────┘    │  │ 12 articles              │ │
│                         │  │ Total: 1 245,00 € TTC    │ │
│  [Catégories Tabs]      │  └──────────────────────────┘ │
│  [Tout] [Mobilier]      │                                │
│  [Déco] [Luminaires]    │  [Table produits panier]      │
│                         │                                │
│  [Grille 3x4]           │  [Bouton Valider]             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐   │                                │
│  │  │ │  │ │  │ │  │   │                                │
│  └──┘ └──┘ └──┘ └──┘   │                                │
│  ...                    │                                │
│                         │                                │
│  [Pagination 1 2 3 >]   │                                │
└─────────────────────────┴────────────────────────────────┘
```

### Composants à Créer/Réutiliser

#### 1. Réutiliser de la page publique

**Avantages**: Code déjà testé, UX validée, cohérence visuelle

| Composant | Fichier | Utilisation |
|-----------|---------|-------------|
| `ProductFilters` | `apps/linkme/src/components/public-selection/ProductFilters.tsx` | Barre de recherche |
| `CategoryTabs` | `apps/linkme/src/components/public-selection/CategoryTabs.tsx` | Onglets catégories |
| `Pagination` | `apps/linkme/src/components/public-selection/Pagination.tsx` | Navigation pages |

#### 2. Adapter le layout CreateOrderModal

**Changements**:
- Passer de liste verticale à **grille 3 colonnes** (responsive)
- Diviser le modal en **2 colonnes** : Catalogue (60%) + Panier (40%)
- Ajouter état `selectedCategory` et `currentPage`
- Implémenter logique de filtrage identique à la page publique

---

## 📝 Plan d'Implémentation (pour agent WRITE)

### Phase 1: Extraction Logique de Filtrage (CreateOrderModal)

**Objectif**: Ajouter extraction automatique des catégories depuis les produits

**Fichier**: `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Ligne d'insertion**: Après ligne 236 (après `filteredProducts`)

**Code à ajouter**:

```typescript
// Extract categories from products
const categories = useMemo(() => {
  if (!products) return [];

  const categoryMap = new Map<string, { count: number }>();

  for (const product of products) {
    // Assuming products have a category field (verify schema)
    const cat = product.category ?? 'Autres';
    const existing = categoryMap.get(cat);
    if (existing) {
      existing.count++;
    } else {
      categoryMap.set(cat, { count: 1 });
    }
  }

  return Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);
}, [products]);
```

**État à ajouter** (après ligne 178):

```typescript
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [currentPage, setCurrentPage] = useState(1);
const PRODUCTS_PER_PAGE = 12; // 3 rows × 4 columns
```

**Modifier `filteredProducts`** (ligne 237-243):

```typescript
const filteredProducts = useMemo(() => {
  if (!products) return [];
  let filtered = products;

  // Filter by search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p: any) =>
        p.productName.toLowerCase().includes(query) ||
        p.productSku.toLowerCase().includes(query)
    );
  }

  // Filter by category
  if (selectedCategory) {
    const categoryName = categories.find(c => c.id === selectedCategory)?.name;
    if (categoryName) {
      filtered = filtered.filter(
        (p: any) => (p.category ?? 'Autres') === categoryName
      );
    }
  }

  return filtered;
}, [products, searchQuery, selectedCategory, categories]);
```

**Ajouter pagination**:

```typescript
const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
const paginatedProducts = useMemo(() => {
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  return filteredProducts.slice(startIndex, endIndex);
}, [filteredProducts, currentPage]);

// Reset to page 1 when filters change
useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, selectedCategory]);
```

---

### Phase 2: Import Composants Publics

**Fichier**: `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Ligne 1-40** (imports):

```typescript
import {
  CategoryTabs,
  Pagination,
  ProductFilters,
} from '@/components/public-selection';
```

---

### Phase 3: Refonte Layout Step 4 (Produits) - Flow "Restaurant existant"

**Objectif**: Transformer la liste verticale en grille 2 colonnes (catalogue + panier)

**Localisation**: Lignes 870-1150 (Section "Produits" dans flow "Restaurant existant")

**Remplacer par**:

```typescript
{/* Section 3: Produits */}
<div className="bg-white border rounded-xl shadow-sm overflow-hidden">
  <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
    <div className="flex items-center gap-2">
      <Package className="h-5 w-5 text-blue-500" />
      <h3 className="font-semibold text-gray-900">
        Sélection de produits
      </h3>
    </div>
  </div>

  {/* Layout 2 colonnes : Catalogue + Panier */}
  <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4 p-4">

    {/* COLONNE GAUCHE : CATALOGUE */}
    <div className="space-y-4">

      {/* Barre de recherche */}
      <ProductFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        branding={{
          primary_color: '#3b82f6',
          secondary_color: '#1e40af',
          accent_color: '#60a5fa',
          text_color: '#1f2937',
          background_color: '#ffffff',
          logo_url: null,
        }}
        isSearchOpen={false}
        onSearchOpenChange={() => {}}
      />

      {/* Onglets catégories */}
      {categories.length > 1 && (
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          selectedSubcategory={null}
          onCategoryChange={setSelectedCategory}
          onSubcategoryChange={() => {}}
          branding={{
            primary_color: '#3b82f6',
            secondary_color: '#1e40af',
            accent_color: '#60a5fa',
            text_color: '#1f2937',
            background_color: '#ffffff',
            logo_url: null,
          }}
          totalCount={products?.length ?? 0}
        />
      )}

      {/* Résultats de recherche */}
      {(searchQuery || selectedCategory) && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-600">
            {filteredProducts.length} résultat
            {filteredProducts.length > 1 ? 's' : ''}
            {searchQuery && ` pour "${searchQuery}"`}
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {/* Grille de produits */}
      {productsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedProducts.map((product: any) => {
            const inCart = cart.find(
              item => item.selectionItemId === product.id
            );
            return (
              <div
                key={product.id}
                className={`p-4 border rounded-xl transition-all ${
                  inCart
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.productImage ? (
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-2 text-sm">
                      {product.productName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {product.productSku}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {product.sellingPriceHt.toFixed(2)} €
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                        {product.marginRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  {inCart ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(product.id, -1)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(product.id, 1)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">
            {searchQuery || selectedCategory
              ? 'Aucun produit ne correspond à votre recherche'
              : 'Aucun produit disponible'}
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="mt-4 text-blue-600 hover:underline font-medium"
            >
              Voir tous les produits
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          branding={{
            primary_color: '#3b82f6',
            secondary_color: '#1e40af',
            accent_color: '#60a5fa',
            text_color: '#1f2937',
            background_color: '#ffffff',
            logo_url: null,
          }}
        />
      )}
    </div>

    {/* COLONNE DROITE : PANIER */}
    <div className="space-y-4">
      {cart.length > 0 ? (
        <>
          {/* Résumé panier */}
          <div className="sticky top-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Panier</h4>
            </div>

            <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
              {cart.map(item => (
                <div
                  key={item.selectionItemId}
                  className="flex items-center justify-between bg-white rounded-lg p-3 text-sm"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-medium text-gray-900 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      x{item.quantity} • {item.unitPriceHt.toFixed(2)} €
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {(item.quantity * item.unitPriceHt).toFixed(2)} €
                    </p>
                    <p className="text-xs text-green-600">
                      +{(item.quantity * item.basePriceHt * (item.marginRate / 100)).toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div className="border-t border-blue-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Articles</span>
                <span className="font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HT</span>
                <span className="font-medium">
                  {cartTotals.totalHt.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">TVA</span>
                <span className="font-medium">
                  {cartTotals.totalTva.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-blue-200 pt-2">
                <span className="text-gray-900">Total TTC</span>
                <span className="text-blue-600">
                  {cartTotals.totalTtc.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between text-sm bg-green-50 rounded-lg p-2 border border-green-200">
                <span className="text-green-700 font-medium">Votre commission</span>
                <span className="text-green-700 font-bold">
                  +{cartTotals.totalMargin.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="sticky top-4 bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">Votre panier est vide</p>
          <p className="text-gray-400 text-xs mt-1">
            Ajoutez des produits pour commencer
          </p>
        </div>
      )}
    </div>
  </div>
</div>
```

---

### Phase 4: Répéter pour Flow "Nouveau restaurant" - Step 4

**Localisation**: Lignes 1760-1950 (Step 4 dans flow "Nouveau restaurant")

**Appliquer la même refonte** que Phase 3 (layout 2 colonnes)

---

### Phase 5: Vérification Schema Produits

**Vérifier** que les produits ont bien un champ `category` dans le schema.

**Si absent**, ajouter dans la migration Supabase ou utiliser une logique de catégorisation basée sur le nom/SKU.

**Hook à vérifier**: `useSelectionProducts` (ligne 187)

**RPC function**: Vérifier le retour de `get_selection_products` pour s'assurer que `category` est inclus.

---

## ✅ Acceptance Criteria

### Critères de Succès

- [ ] **AC-1**: Barre de recherche avec feedback visuel ("12 résultats pour 'chaise'")
- [ ] **AC-2**: Onglets de catégories dynamiques basés sur les produits
- [ ] **AC-3**: Grille responsive (3 colonnes sur desktop, 2 sur tablette, 1 sur mobile)
- [ ] **AC-4**: Pagination fonctionnelle (12 produits par page)
- [ ] **AC-5**: Layout 2 colonnes : Catalogue (60%) + Panier sticky (40%)
- [ ] **AC-6**: Panier sticky qui reste visible lors du scroll
- [ ] **AC-7**: Bouton "Effacer les filtres" visible quand filtres actifs
- [ ] **AC-8**: Reset automatique à la page 1 quand filtres changent
- [ ] **AC-9**: Indicateur de chargement pendant fetch produits
- [ ] **AC-10**: Message vide state si aucun produit ne correspond
- [ ] **AC-11**: Cohérence visuelle avec la page publique
- [ ] **AC-12**: Performance : <200ms pour filtrage (useMemo)

### Tests Manuels

**Scénario 1 : Recherche**
1. Taper "chaise" dans la barre de recherche
2. Vérifier : "X résultats pour 'chaise'" affiché
3. Vérifier : Grille filtrée correctement
4. Vérifier : Pagination mise à jour (si >12 résultats)

**Scénario 2 : Filtres Catégories**
1. Cliquer sur onglet "Mobilier"
2. Vérifier : Produits filtrés par catégorie
3. Vérifier : Compteur "12 produits" mis à jour
4. Vérifier : Page réinitialisée à 1

**Scénario 3 : Combinaison Filtres**
1. Sélectionner catégorie "Mobilier"
2. Taper "table" dans la recherche
3. Vérifier : Filtres cumulatifs (ET logique)
4. Cliquer "Effacer les filtres"
5. Vérifier : Tous les produits réaffichés

**Scénario 4 : Ajout au Panier**
1. Ajouter 3 produits différents
2. Vérifier : Panier sticky à droite mis à jour en temps réel
3. Vérifier : Total HT, TVA, TTC corrects
4. Vérifier : Commission affichée en vert
5. Modifier quantités depuis le panier
6. Vérifier : Totaux recalculés immédiatement

**Scénario 5 : Pagination**
1. Catalogue avec >12 produits
2. Vérifier : Pagination affichée (1 2 3 ...)
3. Cliquer sur page 2
4. Vérifier : Scroll automatique en haut
5. Vérifier : Produits 13-24 affichés

---

## 🚀 Priorité & Effort

**Priorité**: 🔥 HAUTE (UX critique pour utilisateurs authentifiés)

**Effort estimé**:
- Phase 1 (Logique filtrage): 1h
- Phase 2 (Import composants): 15min
- Phase 3 (Layout flow existant): 2h
- Phase 4 (Layout flow nouveau): 2h
- Phase 5 (Vérification schema): 30min
- **TOTAL**: ~6h

**Dépendances**:
- ✅ Composants publics déjà existants (`ProductFilters`, `CategoryTabs`, `Pagination`)
- ✅ Hook `useSelectionProducts` déjà fonctionnel
- ⚠️ **Vérifier schema** : champ `category` dans la table `linkme_selection_items` ou `catalog_products`

---

## 📚 Sources & Références

**Web Research**:
- [Product List UX Best Practices 2025 – Baymard Institute](https://baymard.com/blog/current-state-product-list-and-filtering)
- [25 Ecommerce Product Filters With UX Design Best Practices](https://thegood.com/insights/ecommerce-product-filters/)
- [React Autocomplete component - Material UI](https://mui.com/material-ui/react-autocomplete/)
- [Creating a React search bar and content filtering components | Refine](https://refine.dev/blog/react-search-bar-and-filtering/)
- [Modal UX Design for SaaS in 2025 - Best Practices & Examples](https://userpilot.com/blog/modal-ux-design/)

**Fichiers Analysés**:
- `apps/linkme/src/app/(public)/s/[id]/page.tsx` (783 lignes)
- `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx` (2600+ lignes)
- `apps/linkme/src/components/OrderFormUnified.tsx` (2121 lignes)
- `apps/linkme/src/components/public-selection/*.tsx` (ProductFilters, CategoryTabs, Pagination)

**Audits Liés**:
- `.claude/work/AUDIT-LM-ORD-005.md` (Workflow commande - Contact & Facturation)
- `.claude/work/UX-NOTES-ANALYSIS.md` (Analyse UX placement Notes)

---

**Créé par**: READ1 Agent (Investigation Playwright lane-1)
**Pour**: WRITE Agent (Implémentation)
**Date**: 2026-01-14
