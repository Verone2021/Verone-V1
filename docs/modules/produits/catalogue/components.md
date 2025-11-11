# Composants Catalogue - Documentation Complète

**Module** : Produits → Catalogue
**Fichiers** : `apps/back-office/apps/back-office/src/components/business/product-*.tsx`
**Date** : 2025-10-27

---

## 📋 Vue d'Ensemble

Le module Catalogue utilise **28 composants React** pour gérer l'affichage, l'édition et la création de produits. Ces composants suivent les patterns du **Design System V2** avec shadcn/ui.

### Classification Composants

```
📦 Composants Catalogue (28 total)
├── 🎴 Cards & Grilles (3)
│   ├── ProductCard - Card classique
│   ├── ProductCardV2 - Card Design System V2
│   └── ProductVariantGridCard - Card variante
│
├── 📝 Formulaires & Wizards (3)
│   ├── ProductCreationWizard - Wizard 4 étapes
│   ├── SimpleProductForm - Formulaire simple
│   └── ProductSelector - Sélecteur produits
│
├── 🖼️ Images (5)
│   ├── ProductImageGallery - Galerie affichage
│   ├── ProductImageManagement - Gestion upload/delete
│   ├── ProductImagesModal - Modal galerie
│   ├── ProductPhotosModal - Modal photos
│   └── ProductImageViewerModal - Viewer détail
│
├── ✏️ Édition (8)
│   ├── ProductDualMode - Bascule view/edit
│   ├── ProductEditMode - Mode édition
│   ├── ProductViewMode - Mode lecture
│   ├── ProductInfoSection - Section infos
│   ├── ProductNameEditSection - Édition nom
│   ├── ProductDescriptionsEditSection - Édition descriptions
│   ├── ProductDescriptionsModal - Modal descriptions
│   └── ProductDetailAccordion - Accordion détail
│
├── 🎯 Sélecteurs (3)
│   ├── ProductStatusSelector - Sélection statut
│   ├── ProductTypeSelector - Sélection type
│   └── ProductSelectorModal - Modal sélection
│
├── 📊 Variantes & Caractéristiques (4)
│   ├── ProductVariantsSection - Section variantes
│   ├── ProductVariantsGrid - Grille variantes
│   ├── ProductFixedCharacteristics - Caractéristiques fixes
│   └── ProductCharacteristicsModal - Modal caractéristiques
│
└── 📈 Gestion & Historique (2)
    ├── ProductStockHistoryModal - Historique stock
    └── ProductConsultationManager - Gestion consultations
```

---

## 🎴 Composants Cards & Grilles

### `ProductCardV2` ⭐ (Recommandé - Design System V2)

Composant Card produit optimisé avec **Next.js Image**, **lazy loading**, et **LCP prioritaire**.

#### Props TypeScript

```typescript
interface ProductCardProps {
  product: Product;
  className?: string;
  showActions?: boolean;
  priority?: boolean; // LCP optimization pour 6 premiers produits
  index?: number; // Index pour priority dynamique
  onClick?: (product: Product) => void;
  onArchive?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  archived?: boolean;
}
```

#### Features

- ✅ **Next.js Image** avec optimisation automatique
- ✅ **LCP Priority** : `priority={index < 6}` pour 6 premiers produits
- ✅ **Lazy Loading** : Images chargées à la demande
- ✅ **Hover Effects** : Animations micro-interactions
- ✅ **Status Badges** : Couleurs Design System V2
- ✅ **Actions contextuelles** : Voir, Archiver, Supprimer

#### Configuration Statuts

```typescript
const statusConfig = {
  in_stock: {
    label: 'En stock',
    className: 'bg-green-600 text-white',
  },
  out_of_stock: {
    label: 'Rupture',
    className: 'bg-red-600 text-white',
  },
  preorder: {
    label: 'Précommande',
    className: 'bg-blue-600 text-white',
  },
  coming_soon: {
    label: 'Bientôt',
    className: 'bg-blue-600 text-white',
  },
  discontinued: {
    label: 'Arrêté',
    className: 'bg-gray-600 text-white',
  },
};
```

#### Exemple d'Utilisation

```typescript
import { ProductCardV2 } from '@/components/business/product-card-v2'

export default function ProductsGrid({ products }: { products: Product[] }) {
  const handleArchive = async (product: Product) => {
    if (confirm(`Archiver "${product.name}" ?`)) {
      await archiveProduct(product.id)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCardV2
          key={product.id}
          product={product}
          index={index}                      // Pour priority dynamique
          priority={index < 6}                // LCP optimization
          showActions={true}
          onArchive={handleArchive}
          onClick={(p) => router.push(`/catalogue/${p.id}`)}
        />
      ))}
    </div>
  )
}
```

#### Best Practices

1. **LCP Optimization** : Toujours passer `priority` pour les 6 premiers produits

```typescript
priority={index < 6}
```

2. **Memoization** : Le composant est déjà `memo()`, pas besoin de wrapper

```typescript
export const ProductCardV2 = memo(function ProductCardV2({ ... }) { ... })
```

3. **Image Loading** : Utiliser `useProductImages()` hook intégré

```typescript
const { primaryImage, loading: imageLoading } = useProductImages({
  productId: product.id,
  autoFetch: true,
});
```

---

### `ProductCard` (Ancien - Legacy)

**⚠️ Déprécié** : Utiliser `ProductCardV2` pour nouveaux développements.

Différences vs V2 :

- ❌ Pas de Next.js Image (IMG HTML classique)
- ❌ Pas de LCP priority
- ❌ Moins d'animations
- ✅ Même API props (compatible)

---

### `ProductVariantGridCard`

Card spécialisée pour affichage **variantes dans grille**.

```typescript
interface ProductVariantGridCardProps {
  variant: ProductVariant;
  onSelect?: (variant: ProductVariant) => void;
  selected?: boolean;
}
```

Utilisé dans : `/catalogue/[productId]` section variantes

---

## 📝 Composants Formulaires & Wizards

### `ProductCreationWizard` ⭐

Wizard **2 modes** de création produit : Sourcing (rapide) ou Complet (4 étapes).

#### Props TypeScript

```typescript
interface ProductCreationWizardProps {
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export type CreationType = 'sourcing' | 'complete' | null;
```

#### Workflow

```
┌─────────────────────────────────────┐
│   ProductCreationWizard             │
│   ┌─────────────────────────────┐   │
│   │  Choisir Type Création      │   │
│   │  • Sourcing (rapide)        │   │
│   │  • Complet (4 étapes)       │   │
│   └─────────────────────────────┘   │
│              │                       │
│         ┌────┴────┐                  │
│         │         │                  │
│    Sourcing   Complet                │
│         │         │                  │
│         │    ┌────┴────────┐         │
│         │    │ Step 1: Info│         │
│         │    │ Step 2: Images│       │
│         │    │ Step 3: Prix  │       │
│         │    │ Step 4: Stock │       │
│         │    └─────────────┘         │
│         │         │                  │
│         └────┬────┘                  │
│              │                       │
│         onSuccess(productId)         │
│              │                       │
│       Redirect selon type            │
│   • Sourcing → /sourcing/produits    │
│   • Complet → /catalogue/{id}        │
└─────────────────────────────────────┘
```

#### Exemple d'Utilisation

```typescript
import { ProductCreationWizard } from '@/components/business/product-creation-wizard'

export default function CreateProductPage() {
  const router = useRouter()

  const handleSuccess = (productId: string) => {
    console.log('✅ Produit créé:', productId)
    // Le wizard redirige automatiquement
  }

  const handleCancel = () => {
    router.push('/catalogue')
  }

  return (
    <div className="container mx-auto py-8">
      <ProductCreationWizard
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}
```

#### Mode Sourcing (Rapide)

**3 champs obligatoires** :

- Nom produit
- URL page fournisseur
- Prix achat HT

```typescript
// Création automatique avec
creation_mode = 'sourcing'
status = 'sourcing'
completion_percentage = 30 (calculé auto)
```

#### Mode Complet (4 Étapes)

**Étape 1 : Informations Générales**

- Nom (REQUIRED)
- Fournisseur
- Catégorie
- Description
- Points de vente

**Étape 2 : Images**

- Upload multiple
- Drag & drop
- Sélection primaire

**Étape 3 : Prix**

- Prix achat HT
- Marge %
- Prix vente estimé (calculé)

**Étape 4 : Stock**

- Stock réel initial
- Stock minimum
- Point réapprovisionnement

---

### `SimpleProductForm`

Formulaire **ultra-simplifié** avec uniquement les champs essentiels.

```typescript
interface SimpleProductFormProps {
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
}
```

**Champs** :

- Nom produit (REQUIRED)
- Prix achat HT (REQUIRED)
- Description courte

**Usage** : Création rapide depuis modals ou contexts spécifiques.

---

### `ProductSelector`

Composant **sélecteur produits** avec recherche, filtres et pagination.

```typescript
interface ProductSelectorProps {
  onSelect: (product: Product) => void;
  selectedProductId?: string;
  filters?: ProductFilters;
  multiSelect?: boolean;
  excludeIds?: string[];
}
```

#### Features

- ✅ Recherche instantanée (debounced 300ms)
- ✅ Filtres : Statut, Fournisseur, Catégorie
- ✅ Mode single/multi select
- ✅ Exclusion produits (excludeIds)
- ✅ Pagination intégrée

#### Exemple d'Utilisation

```typescript
import { ProductSelector } from '@/components/business/product-selector'

export default function OrderForm() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  const handleSelect = (product: Product) => {
    setSelectedProducts(prev => [...prev, product])
  }

  return (
    <div>
      <h2>Sélectionner produits pour commande</h2>

      <ProductSelector
        onSelect={handleSelect}
        multiSelect={true}
        filters={{ status: 'in_stock' }}
        excludeIds={selectedProducts.map(p => p.id)}
      />

      <div className="mt-4">
        <h3>Produits sélectionnés ({selectedProducts.length})</h3>
        <ul>
          {selectedProducts.map(p => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

---

## 🖼️ Composants Images

### `ProductImageGallery`

Galerie **affichage images** avec navigation, zoom et modal fullscreen.

```typescript
interface ProductImageGalleryProps {
  productId: string;
  productName?: string;
  className?: string;
  showThumbnails?: boolean;
  maxHeight?: string;
}
```

#### Features

- ✅ Carousel images avec navigation
- ✅ Thumbnails (miniatures)
- ✅ Click → Modal fullscreen
- ✅ Keyboard navigation (←/→)
- ✅ Badge statut produit
- ✅ Lazy loading automatique

#### Exemple d'Utilisation

```typescript
import { ProductImageGallery } from '@/components/business/product-image-gallery'

export default function ProductDetailPage({ productId }: { productId: string }) {
  return (
    <div>
      <ProductImageGallery
        productId={productId}
        productName="Fauteuil Vintage"
        showThumbnails={true}
        maxHeight="600px"
      />
    </div>
  )
}
```

---

### `ProductImageManagement`

Composant **gestion complète images** (upload, delete, reorder, primary).

```typescript
interface ProductImageManagementProps {
  productId: string;
  onImagesChange?: () => void;
  allowUpload?: boolean;
  allowDelete?: boolean;
  allowReorder?: boolean;
  maxImages?: number;
}
```

#### Features

- ✅ Upload multiple (drag & drop)
- ✅ Suppression image
- ✅ Réordonnancement (drag & drop)
- ✅ Définir image primaire
- ✅ Validation format/taille
- ✅ Progress upload

#### Exemple d'Utilisation

```typescript
import { ProductImageManagement } from '@/components/business/product-image-management'

export default function ProductEditImages({ productId }: { productId: string }) {
  const handleChange = () => {
    console.log('✅ Images mises à jour')
    // Refetch product data
  }

  return (
    <div>
      <h2>Gestion Images Produit</h2>

      <ProductImageManagement
        productId={productId}
        onImagesChange={handleChange}
        allowUpload={true}
        allowDelete={true}
        allowReorder={true}
        maxImages={10}
      />
    </div>
  )
}
```

#### Validation Images

```typescript
// Validations automatiques intégrées
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 10;
```

---

### `ProductImagesModal`

Modal **galerie images** fullscreen avec navigation.

```typescript
interface ProductImagesModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  initialImageIndex?: number;
}
```

---

## ✏️ Composants Édition

### `ProductDualMode` ⭐

Composant **bascule View/Edit** avec animation transition et raccourcis clavier.

```typescript
interface ProductDualModeProps {
  product: any;
  onUpdate: (updatedProduct: any) => void;
  initialMode?: 'view' | 'edit';
  className?: string;
}
```

#### Features

- ✅ **Bascule fluide** View ↔ Edit avec animation
- ✅ **Raccourci clavier** : `Ctrl/Cmd + E` pour basculer
- ✅ **Mode toggle** : Bouton UI pour switch
- ✅ **Auto-save** : Sauvegarde automatique en mode edit
- ✅ **Animation transition** : 150ms smooth

#### Exemple d'Utilisation

```typescript
import { ProductDualMode } from '@/components/business/product-dual-mode'

export default function ProductDetailPage({ product }: { product: Product }) {
  const [currentProduct, setCurrentProduct] = useState(product)

  const handleUpdate = async (updatedProduct: Product) => {
    // Sauvegarder changements
    await updateProduct(updatedProduct.id, updatedProduct)
    setCurrentProduct(updatedProduct)
    toast.success('✅ Produit mis à jour')
  }

  return (
    <div>
      <ProductDualMode
        product={currentProduct}
        onUpdate={handleUpdate}
        initialMode="view"
      />

      <p className="text-sm text-gray-500 mt-4">
        Raccourci : <kbd>Ctrl+E</kbd> pour basculer view/edit
      </p>
    </div>
  )
}
```

#### Mode View (`ProductViewMode`)

**Affichage lecture seule** avec :

- Labels + Valeurs formatées
- Badges pour statut/type
- Bouton "Modifier" → Switch edit mode

#### Mode Edit (`ProductEditMode`)

**Formulaire édition** avec :

- Inputs pour tous champs
- Validation temps réel
- Boutons "Enregistrer" / "Annuler"
- Auto-save optionnel

---

### `ProductInfoSection`

Section **informations générales** éditable (nom, description, catégorie, etc.).

```typescript
interface ProductInfoSectionProps {
  product: Product;
  onUpdate: (data: Partial<Product>) => void;
  editable?: boolean;
}
```

**Champs** :

- Nom
- SKU (read-only)
- Description
- Catégorie
- Sous-catégorie
- Famille
- Fournisseur

---

### `ProductNameEditSection`

Section **édition nom produit** avec validation.

```typescript
interface ProductNameEditSectionProps {
  product: Product;
  onUpdate: (name: string) => void;
}
```

**Validation** :

- Min 3 caractères
- Max 200 caractères
- Pas de caractères spéciaux (sauf `-`, `_`, espaces)

---

### `ProductDescriptionsEditSection`

Section **édition descriptions** (description + description technique).

```typescript
interface ProductDescriptionsEditSectionProps {
  product: Product;
  onUpdate: (data: {
    description?: string;
    technical_description?: string;
  }) => void;
}
```

**Features** :

- Textarea auto-expand
- Character count
- Markdown preview (optionnel)

---

## 🎯 Composants Sélecteurs

### `ProductStatusSelector`

Sélecteur **statut produit** avec colors Design System V2.

```typescript
interface ProductStatusSelectorProps {
  value: ProductStatus;
  onChange: (status: ProductStatus) => void;
  disabled?: boolean;
}

type ProductStatus =
  | 'in_stock'
  | 'out_of_stock'
  | 'sourcing'
  | 'draft'
  | 'discontinued'
  | 'preorder'
  | 'coming_soon';
```

#### Exemple

```typescript
<ProductStatusSelector
  value={product.status}
  onChange={(status) => updateProduct(product.id, { status })}
/>
```

---

### `ProductTypeSelector`

Sélecteur **type produit**.

```typescript
type ProductType = 'standard' | 'variant' | 'configurable'

<ProductTypeSelector
  value={product.product_type}
  onChange={(type) => updateProduct(product.id, { product_type: type })}
/>
```

---

## 📊 Composants Variantes & Caractéristiques

### `ProductVariantsSection`

Section complète **gestion variantes** avec grille, ajout, suppression.

```typescript
interface ProductVariantsSectionProps {
  productId: string;
  variantGroupId?: string;
  onUpdate?: () => void;
}
```

**Features** :

- Grille variantes
- Ajout variante
- Édition caractéristiques
- Suppression variante
- Génération variantes automatique

---

### `ProductVariantsGrid`

Grille **affichage variantes** avec filtres.

```typescript
interface ProductVariantsGridProps {
  variants: ProductVariant[];
  onSelect?: (variant: ProductVariant) => void;
  filters?: VariantFilters;
}
```

---

### `ProductFixedCharacteristics`

Affichage **caractéristiques fixes** (dimensions, poids, etc.).

```typescript
interface ProductFixedCharacteristicsProps {
  product: Product;
  editable?: boolean;
  onUpdate?: (data: Partial<Product>) => void;
}
```

**Caractéristiques** :

- Dimensions (L × l × H)
- Poids
- Condition (new, used, refurbished)
- GTIN/EAN

---

## 📈 Composants Gestion & Historique

### `ProductStockHistoryModal`

Modal **historique mouvements stock** avec timeline.

```typescript
interface ProductStockHistoryModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
}
```

**Features** :

- Timeline mouvements
- Filtres date
- Export CSV
- Détail mouvement (type, quantité, raison)

---

### `ProductConsultationManager`

Gestionnaire **consultations produits** (demandes clients).

```typescript
interface ProductConsultationManagerProps {
  productId: string;
}
```

---

## 🎨 Patterns UX Communs

### Pattern 1 : Modal avec Confirmation

```typescript
const handleDelete = async (product: Product) => {
  if (!confirm(`Supprimer "${product.name}" ?`)) {
    return;
  }

  try {
    await deleteProduct(product.id);
    toast.success('✅ Produit supprimé');
  } catch (error) {
    toast.error('❌ Erreur suppression');
  }
};
```

### Pattern 2 : Optimistic Update

```typescript
const handleUpdate = async (productId: string, data: Partial<Product>) => {
  // Update UI immédiatement
  setProduct(prev => ({ ...prev, ...data }));

  try {
    // Update backend
    await updateProduct(productId, data);
    toast.success('✅ Mis à jour');
  } catch (error) {
    // Rollback si erreur
    setProduct(originalProduct);
    toast.error('❌ Erreur mise à jour');
  }
};
```

### Pattern 3 : Debounced Search

```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    fetchProducts({ search: debouncedSearch });
  }
}, [debouncedSearch]);
```

---

## 🧪 Tests Composants

### Test `ProductCardV2`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCardV2 } from '@/components/business/product-card-v2'

describe('ProductCardV2', () => {
  const mockProduct = {
    id: '1',
    name: 'Fauteuil Test',
    sku: 'TEST-001',
    status: 'in_stock',
    cost_price: 150
  }

  it('devrait afficher le nom du produit', () => {
    render(<ProductCardV2 product={mockProduct} />)
    expect(screen.getByText('Fauteuil Test')).toBeInTheDocument()
  })

  it('devrait appeler onClick au clic', () => {
    const handleClick = jest.fn()
    render(<ProductCardV2 product={mockProduct} onClick={handleClick} />)

    fireEvent.click(screen.getByRole('article'))
    expect(handleClick).toHaveBeenCalledWith(mockProduct)
  })

  it('devrait afficher le badge statut', () => {
    render(<ProductCardV2 product={mockProduct} />)
    expect(screen.getByText('En stock')).toBeInTheDocument()
  })
})
```

---

## 📚 Ressources

- **shadcn/ui** : https://ui.shadcn.com/
- **Design System V2** : `docs/design-system/`
- **Hooks** : `docs/modules/produits/catalogue/hooks.md`
- **Workflows** : `docs/modules/produits/catalogue/workflows.md`

---

**Dernière Mise à Jour** : 2025-10-27
**Mainteneur** : Vérone Dev Team
