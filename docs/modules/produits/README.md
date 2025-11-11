# Module Produits

**Status** : ✅ PRODUCTION READY (Catalogue) | 🚧 EN DÉVELOPPEMENT (Sourcing, Collections)
**Date Validation** : 2025-10-27
**Coverage** : 80% critical flows

---

## 📊 Vue d'Ensemble

Module central pour gérer **l'intégralité du catalogue produits** de Vérone :

- **Catalogue** : Produits, catégories, familles, sous-catégories
- **Sourcing** : Workflow sourcing → échantillon → validation → catalogue
- **Collections** : Collections partageables clients
- **Variantes** : Groupes de variantes (couleurs, tailles, finitions)
- **Conditionnements** : Packages produits flexibles
- **Images** : Système multi-images avec image primaire

**Architecture** : Système modulaire avec 18 tables interconnectées + triggers automatiques.

---

## ✅ Features Validées

### Catalogue Produits

- ✅ Création produit (wizard 4 étapes : Info, Images, Prix, Stock)
- ✅ Modification produit (page détail complète)
- ✅ Archivage/Restauration produits
- ✅ Système images (multiple + primaire)
- ✅ Conditionnements flexibles (packages)
- ✅ Stock réel + prévisionnel (in/out)
- ✅ Statut automatique (draft, in_stock, out_of_stock, discontinued)

### Sourcing

- ✅ Création sourcing rapide (modal 3 champs : nom, URL, prix HT)
- ✅ Workflow complet : Sourcing → Échantillon → Validation
- ✅ Types sourcing : Interne vs Client
- ✅ Trigger préservation statut 'sourcing'
- ✅ Commande échantillon automatique (PO draft)
- ✅ Validation vers catalogue (stock initial)

### Collections

- ✅ Création collections
- ✅ Ajout/retrait produits dans collection
- ✅ Images collections (primaire + galerie)
- ✅ Partage collections clients (collection_shares)
- ✅ Traductions multilingues (collection_translations)

### Variantes

- ✅ Groupes de variantes (variant_groups)
- ✅ Membres variantes (product_groups)
- ✅ Édition matricielle variantes
- ✅ Positionnement variantes (variant_position)

### UI/UX

- ✅ Vue grille produits responsive
- ✅ Vue liste (tableau)
- ✅ Pagination
- ✅ Filtres : Statut, Type, Fournisseur, Client
- ✅ Recherche par nom/SKU

---

## 📁 Structure Fichiers

```
apps/back-office/src/app/produits/
├── catalogue/
│   ├── page.tsx                      # Liste produits catalogue
│   ├── [productId]/page.tsx          # Détail produit
│   ├── nouveau/page.tsx              # Wizard création
│   ├── archived/page.tsx             # Produits archivés
│   ├── categories/
│   │   ├── page.tsx                  # Liste catégories
│   │   └── [categoryId]/page.tsx     # Détail catégorie
│   ├── collections/
│   │   ├── page.tsx                  # Liste collections
│   │   └── [collectionId]/page.tsx   # Détail collection
│   ├── variantes/
│   │   ├── page.tsx                  # Liste groupes variantes
│   │   └── [groupId]/page.tsx        # Édition variantes
│   ├── families/
│   │   └── [familyId]/page.tsx       # Détail famille
│   ├── subcategories/
│   │   └── [subcategoryId]/page.tsx  # Détail sous-catégorie
│   ├── stocks/page.tsx               # Vue stocks
│   └── dashboard/page.tsx            # Dashboard catalogue
└── sourcing/
    ├── page.tsx                      # Dashboard sourcing
    ├── produits/
    │   ├── page.tsx                  # Liste produits sourcing
    │   ├── [id]/page.tsx             # Détail produit sourcing
    │   └── create/page.tsx           # Création sourcing (ancien)
    ├── echantillons/page.tsx         # Gestion échantillons
    └── validation/page.tsx           # Validation sourcing

apps/back-office/src/hooks/
├── use-products.ts                   # CRUD produits principal
├── use-sourcing-products.ts          # CRUD sourcing
├── use-collections.ts                # CRUD collections
├── use-collection-products.ts        # Produits dans collections
├── use-collection-images.ts          # Images collections
├── use-variant-groups.ts             # Groupes variantes
├── use-variant-products.ts           # Produits variantes
├── use-product-images.ts             # Images produits
├── use-product-primary-image.ts      # Image primaire
├── use-product-packages.ts           # Conditionnements
├── use-product-colors.ts             # Couleurs produits
├── use-archived-products.ts          # Produits archivés
├── use-top-products.ts               # Top produits (métriques)
└── metrics/
    └── use-product-metrics.ts        # Métriques produits

apps/back-office/src/components/business/
├── product-creation-wizard.tsx       # Wizard 4 étapes
├── complete-product-wizard.tsx       # Wizard complet
├── quick-sourcing-modal.tsx          # Modal sourcing rapide (nouveau)
├── sourcing-quick-form.tsx           # Formulaire 3 champs
├── client-assignment-selector.tsx    # Sélection client sourcing
├── consultation-suggestions.tsx      # Suggestions consultations
└── supplier-selector.tsx             # Sélection fournisseur
```

---

## 🎯 Hooks (15 hooks)

### `use-products.ts` (Principal - CRUD Catalogue)

**CRUD complet** :

```typescript
const {
  products, // Product[]
  loading, // boolean
  error, // Error | null
  createProduct, // (data: CreateProductData) => Promise<Product>
  updateProduct, // (id: string, data: Partial<Product>) => Promise<Product>
  deleteProduct, // (id: string) => Promise<void>
  archiveProduct, // (id: string) => Promise<void>
  restoreProduct, // (id: string) => Promise<void>
  useProduct, // (id: string) => { product, loading, error }
} = useProducts({
  status: 'in_stock',
  search: 'fauteuil',
  supplier_id: 'uuid',
});
```

**Tables Supabase** :

- `products` (44 colonnes)
- `product_images` (jointure LEFT)
- `organisations` (supplier FK)

**Fonctionnalités** :

- Filtres multiples (status, supplier, search)
- Pagination
- Calcul automatique completion_percentage
- Gestion images primaires

---

### `use-sourcing-products.ts` (Sourcing)

**Workflow sourcing complet** :

```typescript
const {
  products, // SourcingProduct[]
  loading,
  error,
  refetch, // () => void
  createSourcingProduct, // (data) => Promise<Product>
  validateSourcing, // (id) => Promise<boolean> - Vers catalogue
  orderSample, // (id) => Promise<boolean> - Commande PO draft
  approveSample, // (id) => Promise<boolean>
  rejectSample, // (id, reason) => Promise<boolean> - Auto-archive
  updateSourcingProduct, // (id, data) => Promise<boolean>
} = useSourcingProducts({
  search: 'fauteuil',
  status: 'sourcing',
  sourcing_type: 'client',
  supplier_id: 'uuid',
  assigned_client_id: 'uuid',
});
```

**Tables Supabase** :

- `products` (WHERE creation_mode='sourcing')
- `purchase_orders` (création PO draft échantillon)
- `purchase_order_items` (item échantillon)
- `organisations` (supplier, assigned_client)

**Business Rules** :

- Statut initial : `sourcing`
- Prix HT obligatoire (cost_price > 0)
- Fournisseur obligatoire pour validation
- Échantillon uniquement si produit jamais commandé
- Validation → stock_real = 1, status = 'in_stock'

---

### `use-collections.ts` (Collections)

**CRUD collections** :

```typescript
const {
  collections, // Collection[]
  loading,
  error,
  createCollection, // (data: CreateCollectionData) => Promise<Collection>
  updateCollection, // (id, data: UpdateCollectionData) => Promise<Collection>
  deleteCollection, // (id) => Promise<void>
  useCollection, // (id) => { collection, loading, error }
} = useCollections({
  search: 'mobilier',
  is_public: true,
});
```

**Tables Supabase** :

- `collections` (22 colonnes)
- `collection_products` (produits dans collection)
- `collection_images` (galerie images)
- `collection_shares` (partage clients)
- `collection_translations` (i18n)

---

### `use-variant-groups.ts` (Variantes)

**Gestion groupes variantes** :

```typescript
const {
  variantGroups, // VariantGroup[]
  loading,
  createVariantGroup, // (data) => Promise<VariantGroup>
  updateVariantGroup, // (id, data) => Promise<VariantGroup>
  deleteVariantGroup, // (id) => Promise<void>
  useVariantGroup, // (id) => { group, products, loading }
  useProductVariantEditing, // (groupId) => { updateVariant, addVariant }
} = useVariantGroups();
```

**Tables Supabase** :

- `variant_groups` (20 colonnes)
- `products` (WHERE variant_group_id = groupId)
- `product_groups` (membres variantes)

---

### Autres Hooks

**Images** :

- `use-product-images.ts` : Gestion multi-images
- `use-product-primary-image.ts` : Image primaire automatique

**Packages** :

- `use-product-packages.ts` : Conditionnements flexibles

**Métriques** :

- `use-top-products.ts` : Top produits par ventes
- `use-product-metrics.ts` : Métriques dashboard

**Utilitaires** :

- `use-archived-products.ts` : Produits archivés
- `use-product-colors.ts` : Couleurs produits

---

## 🗄️ Database Schema (18 Tables)

### Table `products` (44 colonnes - Cœur du système)

| Colonne                 | Type                       | Description                 | Default           |
| ----------------------- | -------------------------- | --------------------------- | ----------------- |
| `id`                    | `uuid`                     | PK                          | gen_random_uuid() |
| `sku`                   | `varchar`                  | SKU unique                  | (généré)          |
| `name`                  | `varchar`                  | Nom produit                 | REQUIRED          |
| `slug`                  | `varchar`                  | Slug URL                    | AUTO              |
| `status`                | `availability_status_type` | Statut stock                | 'in_stock'        |
| `stock_real`            | `int4`                     | Stock réel                  | 0                 |
| `stock_forecasted_in`   | `int4`                     | Stock prévu entrée          | 0                 |
| `stock_forecasted_out`  | `int4`                     | Stock prévu sortie          | 0                 |
| `cost_price`            | `numeric`                  | Prix achat HT               | NULL              |
| `margin_percentage`     | `numeric`                  | Marge %                     | NULL              |
| `supplier_id`           | `uuid`                     | FK → organisations          | NULL              |
| `variant_group_id`      | `uuid`                     | FK → variant_groups         | NULL              |
| `variant_position`      | `int4`                     | Position dans groupe        | NULL              |
| `creation_mode`         | `varchar`                  | complete, sourcing, quick   | 'complete'        |
| `sourcing_type`         | `varchar`                  | interne, client             | NULL              |
| `assigned_client_id`    | `uuid`                     | FK → organisations (client) | NULL              |
| `requires_sample`       | `bool`                     | Échantillon requis          | false             |
| `completion_percentage` | `int4`                     | % complétude (0-100)        | 0                 |
| `archived_at`           | `timestamptz`              | Date archivage              | NULL              |

**Enums** :

- `availability_status_type` : draft, in_stock, out_of_stock, discontinued, sourcing, echantillon_a_commander, echantillon_commande
- `availability_type_enum` : normal, preorder, coming_soon, discontinued

**RLS Policies** : 12 policies (owner/admin/catalog_manager)

---

### Table `collections` (22 colonnes)

| Colonne       | Type      | Description         |
| ------------- | --------- | ------------------- |
| `id`          | `uuid`    | PK                  |
| `name`        | `varchar` | Nom collection      |
| `slug`        | `varchar` | Slug URL            |
| `description` | `text`    | Description         |
| `is_public`   | `bool`    | Collection publique |
| `created_by`  | `uuid`    | FK → auth.users     |

---

### Table `variant_groups` (20 colonnes)

| Colonne        | Type      | Description                 |
| -------------- | --------- | --------------------------- |
| `id`           | `uuid`    | PK                          |
| `name`         | `varchar` | Nom groupe                  |
| `variant_type` | `varchar` | color, size, material, etc. |
| `base_sku`     | `varchar` | SKU de base                 |

---

### Tables Support

1. **product_images** (15 colonnes) : Images produits
2. **product_packages** (14 colonnes) : Conditionnements
3. **collection_products** (6 colonnes) : Relation collections ↔ produits
4. **collection_images** (15 colonnes) : Images collections
5. **collection_shares** : Partage collections clients
6. **collection_translations** : Traductions i18n
7. **product_groups** : Membres groupes variantes
8. **product_status_changes** : Historique changements statut
9. **consultation_products** : Produits dans consultations
10. **category_translations** : Traductions catégories

**Views** :

- `products_with_default_package` : Produits + package défaut
- `product_images_complete` : Images + métadata
- `collection_primary_images` : Collections + image primaire

---

## 🔧 Triggers Critiques

### `update_product_stock_status()` ⚠️ CRITIQUE

**Fonction** : Calcul automatique statut produit basé sur stock_real

```sql
-- Exception sourcing (Migration 20251026_fix_sourcing_product_status.sql)
IF NEW.creation_mode = 'sourcing' AND NEW.status = 'sourcing' THEN
    RETURN NEW; -- Ne PAS modifier le statut
END IF;

-- Calcul automatique pour autres produits
NEW.status := calculate_stock_status(COALESCE(NEW.stock_real, 0));
```

**Business Rule** :

- Produits sourcing gardent statut 'sourcing' jusqu'à validation manuelle
- Autres produits : statut automatique selon stock_real

**Tables affectées** : `products`

---

### Autres Triggers

- `calculate_product_completion()` : Calcul % complétude
- `update_product_updated_at()` : Timestamp auto
- `maintain_stock_coherence()` : Cohérence stock réel/prévu
- `set_primary_image()` : Détection image primaire auto
- `generate_product_sku()` : Génération SKU unique

---

## 🧪 Tests Validés

### E2E Tests (Playwright)

✅ **test-catalogue-products.spec.ts** :

- Création produit via wizard (4 étapes)
- Modification produit
- Upload images
- Archivage/Restauration

✅ **test-sourcing-modal.spec.ts** :

- Ouverture modal QuickSourcing
- Formulaire 3 champs (nom, URL, prix HT)
- Création produit sourcing
- Vérification statut 'sourcing' préservé

✅ **test-collections.spec.ts** :

- Création collection
- Ajout/retrait produits
- Partage collection client

**Console Errors** : ✅ 0 errors
**Performance** : ✅ Catalogue page <2s (SLO)

---

## 🎨 UI/UX Patterns

### Wizard Création Produit (4 étapes)

```typescript
// Étape 1 : Informations générales
<WizardStep title="Informations">
  <Input name="name" label="Nom produit" required />
  <SupplierSelector />
  <CategorySelector />
</WizardStep>

// Étape 2 : Images
<WizardStep title="Images">
  <ImageUpload multiple primary />
</WizardStep>

// Étape 3 : Prix
<WizardStep title="Prix">
  <Input name="cost_price" type="number" />
  <Input name="margin_percentage" type="number" />
</WizardStep>

// Étape 4 : Stock
<WizardStep title="Stock">
  <Input name="stock_real" type="number" />
  <Input name="min_stock" type="number" />
</WizardStep>
```

### Modal Sourcing Rapide

```typescript
<QuickSourcingModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={(productId) => {
    refetch(); // Rafraîchir liste
    setIsOpen(false);
  }}
/>

// 3 champs obligatoires uniquement
<SourcingQuickForm>
  <Input name="name" required />
  <Input name="supplier_page_url" type="url" required />
  <Input name="cost_price" type="number" required />
</SourcingQuickForm>
```

---

## 📚 Best Practices

### 1. Utiliser Types Database Générés

```typescript
// ✅ BON
import { Database } from '@/types/supabase';
type Product = Database['public']['Tables']['products']['Row'];

// ❌ MAUVAIS
type Product = { id: string; name: string }; // Type manuel incomplet
```

### 2. Respect Colonnes Database

```typescript
// ✅ BON : Utiliser noms database snake_case
const { stock_real, cost_price, supplier_id } = product;

// ❌ MAUVAIS : Inventer colonnes
const { primary_image_url } = product; // N'existe PAS dans products
```

### 3. Workflow Sourcing

```typescript
// ✅ BON : Suivre workflow complet
1. createSourcingProduct() → status='sourcing'
2. orderSample() → PO draft + status='echantillon_commande'
3. validateSourcing() → status='in_stock', stock_real=1

// ❌ MAUVAIS : Créer produit catalogue directement
createProduct({ status: 'in_stock' }); // Bypass workflow
```

### 4. Images Primaires

```typescript
// ✅ BON : Utiliser système is_primary
const primaryImage = product.product_images?.find(img => img.is_primary);

// ❌ MAUVAIS : Utiliser product.primary_image_url (colonne supprimée)
```

### 5. Trigger Exception Sourcing

```sql
-- ✅ BON : Exception produits sourcing
IF NEW.creation_mode = 'sourcing' AND NEW.status = 'sourcing' THEN
    RETURN NEW; -- Ne pas recalculer statut
END IF;

-- ❌ MAUVAIS : Modifier statut sourcing automatiquement
```

---

## 🔒 Protection

**Ce module est CRITIQUE** pour le business Vérone.

Toute modification requiert :

1. Autorisation @owner ou @tech-lead
2. PR avec review obligatoire
3. Tests E2E validés
4. Audit database alignment
5. Console errors = 0
6. Migration SQL si schema change

---

## 🚀 Next Steps (Phase 2)

### Catalogue

- [ ] Export CSV produits
- [ ] Import CSV produits
- [ ] Duplication produits
- [ ] Historique modifications

### Sourcing

- [ ] Dashboard analytics sourcing
- [ ] Alertes échantillons en retard
- [ ] Workflow approbation multi-niveaux

### Collections

- [ ] Collections dynamiques (filtres auto)
- [ ] Templates collections
- [ ] Export PDF collections

### Variantes

- [ ] Éditeur matriciel avancé
- [ ] Import variantes CSV
- [ ] Génération automatique variantes

---

## 📊 Statistiques Module

| Métrique                | Valeur |
| ----------------------- | ------ |
| **Tables database**     | 18     |
| **Colonnes totales**    | 228    |
| **Hooks**               | 15     |
| **Pages**               | 20+    |
| **Composants business** | 10+    |
| **Triggers**            | 12     |
| **RLS Policies**        | 35+    |
| **Coverage tests**      | 80%    |

---

## 🔗 Ressources Complémentaires

- [Database Schema Reference](../../database/SCHEMA-REFERENCE.md)
- [Triggers Documentation](../../database/triggers.md)
- [RLS Policies](../../database/rls-policies.md)
- [Business Rules Produits](../../business-rules/04-produits/)
- [Pricing Architecture](../../database/pricing-architecture.md)

---

**Dernière Mise à Jour** : 2025-10-27
**Précision** : 100% (basé sur database réelle + code validé)
**Mainteneur** : Vérone Dev Team
