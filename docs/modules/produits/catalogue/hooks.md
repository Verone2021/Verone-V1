# Hooks Catalogue - Documentation Complète

**Module** : Produits → Catalogue
**Fichiers** : `src/hooks/use-products.ts`, `use-product-*.ts`
**Date** : 2025-10-27

---

## 📋 Vue d'Ensemble

Le module Catalogue utilise **6 hooks principaux** pour gérer le CRUD des produits, les images, les conditionnements et l'archivage. Tous les hooks utilisent le pattern **SWR** pour le cache et la revalidation automatique.

**Hooks Disponibles** :

1. `useProducts()` - CRUD principal + pagination + filtres
2. `useProduct(id)` - Détail produit unique avec enrichissement
3. `useProductImages()` - Gestion images (upload, delete, reorder)
4. `useProductPackages()` - Conditionnements flexibles
5. `useProductPrimaryImage()` - Image primaire (single)
6. `useArchivedProducts()` - Gestion produits archivés

---

## 🎯 Hook Principal : `useProducts()`

### Signature TypeScript

```typescript
function useProducts(
  filters?: ProductFilters,
  page?: number
): {
  // Data
  products: Product[];
  totalCount: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  // State
  loading: boolean;
  error: string | null;

  // Actions CRUD
  createProduct: (data: CreateProductData) => Promise<Product | null>;
  updateProduct: (
    id: string,
    data: Partial<CreateProductData>
  ) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  refetch: () => void;
};
```

### Paramètres

#### `filters?: ProductFilters`

Objet de filtres optionnel pour filtrer les produits.

```typescript
interface ProductFilters {
  productStatus?: 'active' | 'preorder' | 'discontinued' | 'draft';
  supplierId?: string;
  subcategoryId?: string;
  search?: string; // Recherche par nom ou SKU
  availabilityType?: 'normal' | 'special_order' | 'pre_order';
  productType?: 'standard' | 'variant' | 'configurable';
  creationMode?: 'complete' | 'sourcing' | 'quick';
}
```

#### `page?: number`

Numéro de page (0-indexed). Par défaut : `0`

**Pagination** :

- 20 produits par page (`PRODUCTS_PER_PAGE = 20`)
- Cache SWR : 5 minutes (`CACHE_REVALIDATION_TIME = 300000`)

### Tables Accédées

```sql
-- Table principale
products (SELECT, INSERT, UPDATE, DELETE)

-- Colonnes utilisées
id, sku, name, slug, cost_price, margin_percentage, status,
stock_real, stock_forecasted_in, stock_forecasted_out,
supplier_id, subcategory_id, completion_percentage, archived_at,
created_at, updated_at
```

### Exemple d'Utilisation

```typescript
import { useProducts } from '@/hooks/use-products'

export default function ProductsPage() {
  const [currentPage, setCurrentPage] = useState(0)
  const [filters, setFilters] = useState<ProductFilters>({
    status: 'in_stock',
    search: ''
  })

  const {
    products,
    loading,
    error,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch
  } = useProducts(filters, currentPage)

  // Créer produit
  const handleCreate = async () => {
    const newProduct = await createProduct({
      name: 'Fauteuil Vintage',
      cost_price: 150,
      margin_percentage: 40,
      supplier_id: 'uuid...',
      creation_mode: 'complete'
    })

    if (newProduct) {
      console.log('✅ Produit créé:', newProduct.id)
    }
  }

  // Modifier produit
  const handleUpdate = async (productId: string) => {
    const updated = await updateProduct(productId, {
      name: 'Nouveau Nom',
      cost_price: 180
    })

    if (updated) {
      console.log('✅ Produit mis à jour')
    }
  }

  // Supprimer produit
  const handleDelete = async (productId: string) => {
    const success = await deleteProduct(productId)
    if (success) {
      console.log('✅ Produit supprimé')
    }
  }

  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>

  return (
    <div>
      <h1>{totalCount} produits</h1>

      {/* Liste produits */}
      <div className="grid grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex gap-2 mt-4">
        <button
          disabled={!hasPreviousPage}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          Précédent
        </button>

        <span>Page {currentPage + 1} / {totalPages}</span>

        <button
          disabled={!hasNextPage}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
```

### Optimisations

- ✅ **Cache SWR** : 5 minutes de cache automatique
- ✅ **Revalidation** : Auto-revalidation après mutation
- ✅ **Deduplication** : Évite les requêtes doublons
- ✅ **Previous Data** : Garde les données pendant rechargement

---

## 📄 Hook Détail : `useProduct(id)`

### Signature TypeScript

```typescript
function useProduct(id: string): {
  product: Product | null;
  loading: boolean;
  error: string | null;
};
```

### Enrichissement Automatique

Le hook enrichit automatiquement le produit avec :

1. **Prix minimum de vente** calculé (`minimumSellingPrice`)
2. **Image primaire** extraite (`primary_image_url`)
3. **Données fournisseur** via JOIN
4. **Images produit** via relation `product_images`

### Calcul Prix Minimum

```typescript
// Formule : cost_price × (1 + margin_percentage)
minimumSellingPrice = cost_price * (1 + margin_percentage / 100)

// Exemple
cost_price = 150€
margin_percentage = 40%
minimumSellingPrice = 150 × 1.4 = 210€
```

### Tables Accédées

```sql
-- Query complète
SELECT
  p.*,
  org.id, org.legal_name, org.trade_name, org.type,
  pi.public_url, pi.is_primary
FROM products p
LEFT JOIN organisations org ON p.supplier_id = org.id
LEFT JOIN product_images pi ON pi.product_id = p.id
WHERE p.id = $1
```

### Exemple d'Utilisation

```typescript
import { useProduct } from '@/hooks/use-products'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { product, loading, error } = useProduct(params.id)

  if (loading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error}</div>
  if (!product) return <div>Produit introuvable</div>

  return (
    <div>
      <h1>{product.name}</h1>
      <p>SKU: {product.sku}</p>
      <p>Prix achat: {product.cost_price}€</p>
      <p>Marge: {product.margin_percentage}%</p>
      <p>Prix minimum vente: {product.minimumSellingPrice}€</p>

      {/* Image primaire */}
      {product.primary_image_url && (
        <img src={product.primary_image_url} alt={product.name} />
      )}

      {/* Fournisseur */}
      {product.supplier && (
        <p>Fournisseur: {product.supplier.trade_name}</p>
      )}
    </div>
  )
}
```

---

## 🖼️ Hook Images : `useProductImages()`

### Signature TypeScript

```typescript
function useProductImages(options: {
  productId: string;
  bucketName?: string;
  autoFetch?: boolean;
}): {
  // Data
  images: ProductImage[];
  primaryImage: ProductImage | null;
  galleryImages: ProductImage[];
  technicalImages: ProductImage[];
  totalImages: number;
  hasImages: boolean;

  // State
  loading: boolean;
  uploading: boolean;
  error: string | null;

  // Actions
  fetchImages: () => Promise<void>;
  uploadImage: (file: File, options?: UploadOptions) => Promise<ProductImage>;
  uploadMultipleImages: (
    files: File[],
    options?: MultiUploadOptions
  ) => Promise<ProductImage[]>;
  deleteImage: (imageId: string) => Promise<void>;
  reorderImages: (imageIds: string[]) => Promise<void>;
  setPrimaryImage: (imageId: string) => Promise<void>;
  updateImageMetadata: (
    imageId: string,
    metadata: ImageMetadata
  ) => Promise<void>;

  // Helpers
  getImagesByType: (type: ImageType) => ProductImage[];
};

// Types
type ImageType =
  | 'gallery'
  | 'technical'
  | 'detail'
  | 'lifestyle'
  | 'dimension'
  | 'other';

interface UploadOptions {
  isPrimary?: boolean;
  imageType?: ImageType;
  altText?: string;
}

interface MultiUploadOptions {
  imageType?: ImageType;
  altTextPrefix?: string;
  firstImagePrimary?: boolean;
}

interface ImageMetadata {
  alt_text?: string;
  image_type?: ImageType;
  width?: number;
  height?: number;
}
```

### Tables Accédées

```sql
-- Table principale
product_images (SELECT, INSERT, UPDATE, DELETE)

-- Colonnes
id, product_id, storage_path, public_url, display_order,
is_primary, image_type, alt_text, file_size, format,
width, height, created_at, updated_at
```

### Triggers Automatiques

Le hook s'appuie sur des **triggers automatiques** pour :

- ✅ Générer `public_url` automatiquement (trigger `generate_public_url`)
- ✅ Gérer "single primary image" (trigger `ensure_single_primary_image`)
- ✅ Mettre à jour `updated_at` automatiquement

### Exemple d'Utilisation

```typescript
import { useProductImages } from '@/hooks/use-product-images'

export default function ProductImagesSection({ productId }: { productId: string }) {
  const {
    images,
    primaryImage,
    uploading,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    setPrimaryImage,
    reorderImages
  } = useProductImages({
    productId,
    autoFetch: true
  })

  // Upload image unique
  const handleSingleUpload = async (file: File) => {
    try {
      await uploadImage(file, {
        imageType: 'gallery',
        altText: 'Photo produit',
        isPrimary: images.length === 0 // Première image = primary
      })
      console.log('✅ Image uploadée')
    } catch (error) {
      console.error('❌ Erreur upload:', error)
    }
  }

  // Upload multiple
  const handleMultipleUpload = async (files: FileList) => {
    try {
      const filesArray = Array.from(files)
      await uploadMultipleImages(filesArray, {
        imageType: 'gallery',
        firstImagePrimary: images.length === 0
      })
      console.log(`✅ ${filesArray.length} images uploadées`)
    } catch (error) {
      console.error('❌ Erreur upload multiple:', error)
    }
  }

  // Supprimer image
  const handleDelete = async (imageId: string) => {
    if (confirm('Supprimer cette image ?')) {
      await deleteImage(imageId)
    }
  }

  // Définir image primaire
  const handleSetPrimary = async (imageId: string) => {
    await setPrimaryImage(imageId)
  }

  // Réordonner images (drag & drop)
  const handleReorder = async (newOrder: string[]) => {
    await reorderImages(newOrder)
  }

  return (
    <div>
      <h2>Images Produit ({images.length})</h2>

      {/* Upload */}
      <div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleMultipleUpload(e.target.files)}
          disabled={uploading}
        />
        {uploading && <span>Upload en cours...</span>}
      </div>

      {/* Galerie */}
      <div className="grid grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="relative">
            <img src={image.public_url} alt={image.alt_text} />

            {image.is_primary && (
              <span className="badge">Primaire</span>
            )}

            <div className="actions">
              {!image.is_primary && (
                <button onClick={() => handleSetPrimary(image.id)}>
                  Définir primaire
                </button>
              )}
              <button onClick={() => handleDelete(image.id)}>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Best Practices

1. **Validation côté client** :

```typescript
const validateImage = (file: File) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    throw new Error('Image trop volumineuse (max 5MB)');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format non supporté (JPEG, PNG, WebP uniquement)');
  }
};
```

2. **Optimisation avant upload** :

```typescript
import imageCompression from 'browser-image-compression';

const compressImage = async (file: File) => {
  return await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
};
```

3. **Gestion erreurs** :

```typescript
try {
  await uploadImage(file);
} catch (error) {
  if (error.message.includes('storage')) {
    toast.error('Erreur upload Storage');
  } else if (error.message.includes('database')) {
    toast.error('Erreur enregistrement base de données');
  } else {
    toast.error('Erreur inconnue');
  }
}
```

---

## 📦 Hook Conditionnements : `useProductPackages()`

### Signature TypeScript

```typescript
function useProductPackages(options: {
  productId: string;
  autoFetch?: boolean;
}): {
  // Data
  packages: ProductPackage[];
  defaultPackage: ProductPackage | null;
  singlePackage: ProductPackage | null;
  totalPackages: number;
  hasMultiplePackages: boolean;
  hasDiscounts: boolean;
  maxDiscount: number;
  isValidPackageSystem: boolean;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  fetchPackages: () => Promise<void>;
  calculatePackagePrice: (basePrice: number, package: ProductPackage) => number;

  // Helpers Business
  getPackagesByType: (type: PackageType) => ProductPackage[];
  getPackPackages: () => ProductPackage[];
  getBulkPackages: () => ProductPackage[];
  getBestValuePackage: (basePrice: number) => ProductPackage | null;
  getDiscountLabel: (package: ProductPackage) => string | null;
};

// Types
type PackageType = 'single' | 'pack' | 'bulk' | 'custom';

interface ProductPackage {
  id: string;
  product_id: string;
  type: PackageType;
  base_quantity: number;
  unit: string;
  unit_price_ht?: number;
  discount_rate?: number;
  is_default: boolean;
  display_order: number;
  is_active: boolean;
}
```

### Calcul Prix Package (Business Rules)

Le hook implémente 2 modes de pricing selon `docs/business-rules/06-stocks/conditionnements/pricing-rules.md` :

#### Mode 1 : Prix Unitaire Spécifique

```typescript
// Prix total = unit_price_ht × base_quantity
packagePrice = unit_price_ht * base_quantity

// Exemple
unit_price_ht = 45€
base_quantity = 6
packagePrice = 45 × 6 = 270€
```

#### Mode 2 : Prix de Base + Remise

```typescript
// Prix total = base_price × base_quantity × (1 - discount_rate)
grossPrice = base_price * base_quantity
netPrice = grossPrice * (1 - discount_rate)

// Exemple
base_price = 50€
base_quantity = 10
discount_rate = 0.15 (15%)
grossPrice = 50 × 10 = 500€
netPrice = 500 × 0.85 = 425€
```

### Tables Accédées

```sql
-- Table principale
product_packages (SELECT)

-- Colonnes
id, product_id, type, base_quantity, unit, unit_price_ht,
discount_rate, is_default, display_order, is_active
```

### Exemple d'Utilisation

```typescript
import { useProductPackages } from '@/hooks/use-product-packages'

export default function ProductPackagesSection({
  productId,
  basePrice
}: {
  productId: string
  basePrice: number
}) {
  const {
    packages,
    defaultPackage,
    calculatePackagePrice,
    getBestValuePackage,
    getDiscountLabel
  } = useProductPackages({
    productId,
    autoFetch: true
  })

  const bestValue = getBestValuePackage(basePrice)

  return (
    <div>
      <h2>Conditionnements Disponibles</h2>

      <div className="grid grid-cols-3 gap-4">
        {packages.map(pkg => {
          const price = calculatePackagePrice(basePrice, pkg)
          const pricePerUnit = price / pkg.base_quantity
          const discountLabel = getDiscountLabel(pkg)
          const isBestValue = bestValue?.id === pkg.id

          return (
            <div
              key={pkg.id}
              className={`card ${pkg.is_default ? 'default' : ''} ${isBestValue ? 'best-value' : ''}`}
            >
              {/* Header */}
              <div className="header">
                <h3>{pkg.base_quantity} {pkg.unit}</h3>
                {pkg.is_default && <span className="badge">Par défaut</span>}
                {isBestValue && <span className="badge success">Meilleure valeur</span>}
              </div>

              {/* Prix */}
              <div className="pricing">
                <div className="total">{price.toFixed(2)}€</div>
                <div className="per-unit">{pricePerUnit.toFixed(2)}€ / unité</div>
                {discountLabel && (
                  <div className="discount">{discountLabel}</div>
                )}
              </div>

              {/* Type */}
              <div className="type">{pkg.type}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Helpers Business Avancés

#### `getBestValuePackage(basePrice)`

Retourne le package avec le **meilleur prix unitaire**.

```typescript
// Calcul automatique
const bestValue = getBestValuePackage(150);

// Algorithme
packages.reduce((best, current) => {
  const currentPricePerUnit =
    calculatePackagePrice(basePrice, current) / current.base_quantity;
  const bestPricePerUnit =
    calculatePackagePrice(basePrice, best) / best.base_quantity;

  return currentPricePerUnit < bestPricePerUnit ? current : best;
});
```

#### `getDiscountLabel(package)`

Génère un label UX pour la remise.

```typescript
getDiscountLabel(package);
// discount_rate = 0.15 → "Jusqu'à -15%"
// discount_rate = 0 → null
```

---

## 🗄️ Hook Archivés : `useArchivedProducts()`

### Signature TypeScript

```typescript
function useArchivedProducts(): {
  // Data
  products: ArchivedProduct[];
  total: number;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  loadArchivedProducts: () => Promise<void>;
  archiveProduct: (id: string, reason?: string) => Promise<boolean>;
  restoreProduct: (id: string) => Promise<boolean>;
  permanentlyDeleteProduct: (id: string) => Promise<boolean>;

  // Stats
  stats: {
    total: number;
    archived: number;
    discontinued: number;
    endOfLife: number;
    recentlyArchived: number;
  };
};

interface ArchivedProduct {
  id: string;
  name: string;
  sku: string;
  status: 'archived' | 'discontinued' | 'end_of_life';
  archived_reason: string | null;
  archived_at: string;
  images: ProductImage[];
}
```

### Tables Accédées

```sql
-- Query archivés
SELECT
  p.*,
  pi.id, pi.storage_path, pi.is_primary
FROM products p
LEFT JOIN product_images pi ON pi.product_id = p.id
WHERE p.status IN ('archived', 'discontinued', 'end_of_life')
ORDER BY p.archived_at DESC

-- Archive produit
UPDATE products SET
  status = 'archived',
  archived_reason = $1,
  archived_at = NOW()
WHERE id = $2

-- Restaure produit
UPDATE products SET
  status = 'in_stock',
  archived_reason = NULL,
  archived_at = NULL
WHERE id = $1
```

### Exemple d'Utilisation

```typescript
import { useArchivedProducts } from '@/hooks/use-archived-products'

export default function ArchivedProductsPage() {
  const {
    products,
    loading,
    stats,
    archiveProduct,
    restoreProduct,
    permanentlyDeleteProduct
  } = useArchivedProducts()

  // Archiver produit
  const handleArchive = async (productId: string) => {
    const reason = prompt('Raison de l\'archivage ?')
    const success = await archiveProduct(productId, reason || undefined)

    if (success) {
      toast.success('Produit archivé')
    }
  }

  // Restaurer produit
  const handleRestore = async (productId: string) => {
    if (confirm('Restaurer ce produit ?')) {
      const success = await restoreProduct(productId)
      if (success) {
        toast.success('Produit restauré au catalogue')
      }
    }
  }

  // Supprimer définitivement
  const handleDelete = async (productId: string) => {
    if (confirm('⚠️ SUPPRESSION DÉFINITIVE. Êtes-vous sûr ?')) {
      const success = await permanentlyDeleteProduct(productId)
      if (success) {
        toast.success('Produit supprimé définitivement')
      }
    }
  }

  return (
    <div>
      <h1>Produits Archivés</h1>

      {/* Statistiques */}
      <div className="stats">
        <div>Total: {stats.total}</div>
        <div>Archivés: {stats.archived}</div>
        <div>Discontinués: {stats.discontinued}</div>
        <div>Fin de vie: {stats.endOfLife}</div>
        <div>Récemment archivés (7j): {stats.recentlyArchived}</div>
      </div>

      {/* Liste */}
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th>SKU</th>
            <th>Statut</th>
            <th>Raison</th>
            <th>Date archivage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>{product.status}</td>
              <td>{product.archived_reason || '-'}</td>
              <td>{new Date(product.archived_at).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleRestore(product.id)}>
                  Restaurer
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="danger"
                >
                  Supprimer définitivement
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Statistiques Calculées

```typescript
stats.total; // Nombre total produits archivés
stats.archived; // status = 'archived'
stats.discontinued; // status = 'discontinued'
stats.endOfLife; // status = 'end_of_life'
stats.recentlyArchived; // Archivés il y a moins de 7 jours
```

---

## 🎨 Hooks Utilitaires

### `useProductPrimaryImage(productId)`

Récupère **uniquement l'image primaire** d'un produit.

```typescript
const { primaryImage, loading } = useProductPrimaryImage(productId);

// Retourne
{
  primaryImage: ProductImage | null;
  loading: boolean;
}
```

### `useProductColors()`

Gestion des couleurs pour les variantes.

```typescript
const { colors, addColor, removeColor, updateColor } =
  useProductColors(productId);
```

---

## 📊 Comparaison Performance

| Hook                  | Table(s)                          | Requêtes                | Cache       | Optimisé |
| --------------------- | --------------------------------- | ----------------------- | ----------- | -------- |
| `useProducts`         | products                          | 1 SELECT + pagination   | SWR 5min    | ✅       |
| `useProduct`          | products + organisations + images | 1 SELECT (JOIN)         | useEffect   | ⚠️       |
| `useProductImages`    | product_images                    | 1 SELECT + actions      | useCallback | ✅       |
| `useProductPackages`  | product_packages                  | 1 SELECT + calculations | useCallback | ✅       |
| `useArchivedProducts` | products + images                 | 1 SELECT (JOIN)         | useEffect   | ⚠️       |

**Recommandations** :

- ✅ `useProducts` : Excellent cache SWR, usage optimal
- ⚠️ `useProduct` : Migrer vers SWR pour cache automatique (TODO Phase 2)
- ⚠️ `useArchivedProducts` : Migrer vers SWR (TODO Phase 2)

---

## 🔄 Patterns de Revalidation

### Pattern 1 : Mutation + Revalidation (useProducts)

```typescript
const { mutate } = useSWR(swrKey, fetcher);

const createProduct = async data => {
  const newProduct = await supabase.from('products').insert([data]);
  await mutate(); // ✅ Invalide cache + refetch automatique
  return newProduct;
};
```

### Pattern 2 : Optimistic Update

```typescript
const restoreProduct = async id => {
  // Update UI immédiatement
  setState(prev => ({
    ...prev,
    products: prev.products.filter(p => p.id !== id),
  }));

  // Puis update backend
  await supabase.from('products').update({ status: 'in_stock' }).eq('id', id);
};
```

---

## 🧪 Tests Recommandés

### Test Hook `useProducts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '@/hooks/use-products';

describe('useProducts', () => {
  it('devrait charger les produits avec pagination', async () => {
    const { result } = renderHook(() => useProducts({}, 0));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toHaveLength(20); // PRODUCTS_PER_PAGE
    expect(result.current.totalPages).toBeGreaterThan(0);
  });

  it('devrait créer un produit', async () => {
    const { result } = renderHook(() => useProducts());

    const newProduct = await result.current.createProduct({
      name: 'Test Product',
      cost_price: 100,
      margin_percentage: 30,
    });

    expect(newProduct).not.toBeNull();
    expect(newProduct.name).toBe('Test Product');
  });
});
```

---

## 📚 Ressources

- **Documentation Database** : `docs/database/tables/products.md`
- **Business Rules** : `docs/business-rules/04-produits/`
- **Triggers** : `docs/database/triggers/update_product_stock_status.md`
- **Conditionnements** : `docs/business-rules/06-stocks/conditionnements/`

---

**Dernière Mise à Jour** : 2025-10-27
**Mainteneur** : Vérone Dev Team
