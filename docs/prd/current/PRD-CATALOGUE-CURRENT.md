# PRD Catalogue Produits Current — État Actuel Implémenté

> **Version**: Production 2025-10-10
> **Statut**: ✅ STABLE - EN PRODUCTION
> **Fichier Source**: `src/app/catalogue/page.tsx`
> **SLO Performance**: <3s chargement (✅ ATTEINT - Bundle 10.7 kB)

---

## 🎯 Vue d'Ensemble

### Description Actuelle

Module de gestion catalogue produits avec CRUD complet, gestion variantes, conditionnements flexibles, images multiples, catégories hiérarchiques, et pricing multi-canaux.

### Données Production

- **241+ produits** actifs
- **15 familles** produits
- **39 catégories**
- **85 sous-catégories**
- **5 images max** par produit

---

## 📊 Features Implémentées

### 1. CRUD Produits Complet

- ✅ Création produits (formulaire détaillé)
- ✅ Modification inline + modal
- ✅ Suppression soft (archivage)
- ✅ Duplication produit
- ✅ Statuts workflow: draft, active, inactive, archived

### 2. Gestion Variantes

- ✅ Variantes couleur/taille/matériau
- ✅ SKU unique par variante
- ✅ Stock par variante
- ✅ Images spécifiques par variante
- **Hook**: `use-product-variants.ts`
- **Table**: `product_variants`

### 3. Conditionnements Flexibles

- ✅ Unité (pièce)
- ✅ Carton (quantité par carton)
- ✅ Palette (quantité par palette)
- ✅ Prix différenciés par conditionnement
- **Hook**: `use-product-packages.ts`
- **Table**: `product_packages`

### 4. Images Multiples

- ✅ Upload 5 images max/produit
- ✅ Image principale sélectionnable
- ✅ Ordre drag & drop
- ✅ Validation format/taille (Supabase Storage)
- **Hook**: `use-product-images.ts`
- **Table**: `product_images`

### 5. Catégories Hiérarchiques

- ✅ Famille → Catégorie → Sous-catégorie
- ✅ Filtres arborescence complète
- ✅ Composant `CategoryHierarchyFilterV2`
- **Hooks**: `use-families.ts`, `use-categories.ts`, `use-subcategories.ts`
- **Tables**: `families`, `categories`, `subcategories`

### 6. Pricing Multi-Canaux

- ✅ Prix par canal vente (B2B, B2C, Showroom)
- ✅ Sélecteur canal `ChannelSelector`
- ✅ Affichage prix dynamique selon canal
- **Hook**: `use-pricing.ts`
- **Tables**: `price_lists`, `price_list_items`, `channel_price_lists`
- **Correction**: 2025-10-10 fix `createClient()` hook pricing

### 7. Recherche & Filtres Avancés

- ✅ Recherche texte (nom, SKU, description) debounced 300ms
- ✅ Filtres statut (active, draft, inactive)
- ✅ Filtres sous-catégories multiples
- ✅ Filtres fournisseur
- ✅ Reset filtres rapide

### 8. View Modes

- ✅ Grid view (cards 3 colonnes)
- ✅ List view (table dense)
- ✅ Toggle persistant localStorage

### 9. Tabs Active/Archived

- ✅ Tab produits actifs (default)
- ✅ Tab produits archivés (soft delete)
- ✅ Unarchive product action
- ✅ Delete permanent (admin only)

---

## 🎨 Design System Appliqué

### Composants UI

```typescript
import { ProductCard } from '@/components/business/product-card';
import { CategoryHierarchyFilterV2 } from '@/components/business/category-hierarchy-filter-v2';
import { ChannelSelector } from '@/components/business/channel-selector';
```

### Icons Lucide

- `Package` - Produits
- `Search` - Recherche
- `Filter` - Filtres
- `Grid`/`List` - View modes
- `Plus` - Nouveau produit
- `Zap` - Actions rapides

---

## 🔧 Implémentation Technique

### Hook Principal

```typescript
const {
  products, // Product[] filtrés
  categories, // Categories hiérarchie
  loading, // boolean
  error, // Error | null
  setFilters, // (filters) => void
  resetFilters, // () => void
  loadArchivedProducts,
  archiveProduct, // (id) => Promise
  unarchiveProduct, // (id) => Promise
  deleteProduct, // (id) => Promise (hard delete)
  stats, // { total, active, draft, inactive }
} = useCatalogue();
```

### Hooks Secondaires

- `useFamilies()` - Liste familles produits
- `useCategories()` - Liste catégories
- `useSubcategories()` - Liste sous-catégories
- `useProductImages()` - Gestion images produit
- `usePricing()` - Prix par canal

### Filtres State

```typescript
interface Filters {
  search: string;
  status: string[]; // ['active', 'draft']
  subcategories: string[]; // [uuid1, uuid2]
  supplier: string[]; // ['Fournisseur A']
}
```

### Performance

- **Debounce search**: 300ms
- **Queries optimisées**: Supabase avec indexation
- **Pagination**: Lazy loading (future)
- **Bundle**: 10.7 kB (excellent)
- **SLO**: <3s ✅

---

## 🗄️ Tables BDD Utilisées

### Tables Principales

- `products` (241+ rows)
  - Colonnes: name, sku, description, technical_description, selling_points, status, supplier_id, subcategory_id, base_price
- `product_variants`
  - Variantes couleur/taille/matériau
- `product_characteristics`
  - Caractéristiques dynamiques (largeur, hauteur, matériau, etc.)
- `product_images`
  - Images multiples (5 max, ordre, is_primary)
- `product_packages`
  - Conditionnements (unité, carton, palette, prix)

### Tables Référence

- `families` (15 rows)
- `categories` (39 rows)
- `subcategories` (85 rows)
- `organisations` (fournisseurs)
- `price_lists`, `price_list_items` (pricing multi-canaux)

---

## 📋 Business Rules Appliquées

### Statuts Produits

```typescript
type ProductStatus =
  | 'draft' // Brouillon (non visible catalogue client)
  | 'active' // Actif (visible, vendable)
  | 'inactive' // Inactif (non vendable, visible admin)
  | 'archived'; // Archivé (soft delete)
```

### Validation Images

- Format: JPG, PNG, WEBP
- Taille max: 5 MB par image
- Nombre max: 5 images/produit
- Dimension min: 800x800px recommandé

### Pricing Priority

1. Prix client spécifique (`customer_price_lists`)
2. Prix groupe client (`customer_groups`)
3. Prix canal (`channel_price_lists`)
4. Prix liste défaut (`price_list_items`)

**Business Rules File**: `docs/engineering/business-rules/catalogue.md`

---

## 🚧 Limitations Connues & Roadmap

### Limitations Actuelles

- ❌ Pas de pagination (charge tous produits)
- ❌ Pas d'export Excel/PDF catalogue
- ❌ Pas de duplication en masse
- ❌ Pas de gestion stock dans ce module (voir module Stocks)

### Roadmap 2025-Q4

**Priorité 1** (1 mois):

- [ ] Pagination produits (load 50 par page)
- [ ] Export catalogue Excel/PDF
- [ ] Bulk actions (archive, delete, change status)

**Priorité 2** (3 mois):

- [ ] Import CSV produits
- [ ] Templates produits (duplication rapide)
- [ ] Historique modifications produit (audit trail)

---

## 🔗 Dépendances & Relations

### Modules Liés

- **Stocks** (`/stocks/inventaire`) - Stock par produit/variante
- **Commandes** (`/commandes/clients`) - Sélection produits commande
- **Pricing** (`/admin/pricing`) - Gestion listes prix
- **Organisations** (`/contacts-organisations`) - Fournisseurs

### APIs Externes

- **Supabase Storage**: Upload images produits
- **Google Merchant**: Feed produits automatisé (future)

---

## 🧪 Tests & Validation

### Tests Actuels

- ✅ MCP Playwright Browser: 0 erreur console ✅
- ✅ Filtres fonctionnels
- ✅ CRUD operations validées
- ✅ Pricing multi-canaux testé

### Tests Manquants

- ⏳ Tests E2E complets (creation flow, edit flow)
- ⏳ Tests performance (1000+ produits)
- ⏳ Tests images upload (formats, tailles)

---

## 📚 Documentation Associée

### Fichiers Clés

- **Composant**: `src/app/catalogue/page.tsx`
- **Hooks**: `src/hooks/use-catalogue.ts`, `use-pricing.ts`, `use-product-*.ts`
- **Business Rules**: `docs/engineering/business-rules/catalogue.md`

### Sessions

- `2025-10-10-SESSION-ROLLBACK-HOTFIX-COMPLETE.md` - Fix hook pricing
- `2025-09-15-import-241-produits-complete.md` - Import initial données

---

**Dernière Mise à Jour**: 2025-10-10
**Maintenu Par**: Équipe Vérone
**Next Review**: 2025-10-24 (pagination + export)
