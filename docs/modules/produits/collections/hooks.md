# Hooks Collections - Documentation

**Module** : Produits → Collections
**Date** : 2025-10-27

---

## 📋 Hooks Disponibles

1. `useCollections(filters?)` - CRUD collections
2. `useCollection(id)` - Détail collection + produits
3. `useCollectionProducts(collectionId)` - Gestion produits collection
4. `useCollectionImages(collectionId)` - Gestion images collection

---

## 🎯 `useCollections(filters?)`

Hook principal CRUD collections avec filtres.

### Signature

```typescript
interface CollectionFilters {
  search?: string;
  is_active?: boolean;
  archived?: boolean;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

function useCollections(filters?: CollectionFilters): {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  createCollection: (data: CreateCollectionData) => Promise<Collection | null>;
  updateCollection: (
    id: string,
    data: UpdateCollectionData
  ) => Promise<Collection | null>;
  deleteCollection: (id: string) => Promise<boolean>;
  toggleActive: (id: string) => Promise<boolean>;
  refetch: () => void;
};
```

### Exemple

```typescript
import { useCollections } from '@/hooks/use-collections'

export default function CollectionsPage() {
  const {
    collections,
    loading,
    createCollection,
    toggleActive
  } = useCollections({ is_active: true })

  const handleCreate = async () => {
    await createCollection({
      name: 'Collection Été 2025',
      description: 'Mobilier outdoor',
      is_active: true
    })
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {collections.map(collection => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          onToggleActive={() => toggleActive(collection.id)}
        />
      ))}
    </div>
  )
}
```

---

## 📄 `useCollection(id)`

Hook détail collection avec produits associés.

### Signature

```typescript
function useCollection(id: string): {
  collection: Collection | null;
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (productId: string) => Promise<boolean>;
  removeProduct: (productId: string) => Promise<boolean>;
  reorderProducts: (productIds: string[]) => Promise<boolean>;
};
```

### Exemple

```typescript
import { useCollection } from '@/hooks/use-collections'

export default function CollectionDetailPage({ id }: { id: string }) {
  const {
    collection,
    products,
    loading,
    removeProduct,
    reorderProducts
  } = useCollection(id)

  const handleReorder = async (newOrder: string[]) => {
    await reorderProducts(newOrder)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1>{collection?.name}</h1>
      <p>{products.length} produits</p>

      <DraggableProductGrid
        products={products}
        onReorder={handleReorder}
        onRemove={removeProduct}
      />
    </div>
  )
}
```

---

## 📦 `useCollectionProducts(collectionId)`

Hook spécialisé gestion produits collection.

### Signature

```typescript
function useCollectionProducts(collectionId: string): {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProducts: (productIds: string[]) => Promise<boolean>;
  removeProduct: (productId: string) => Promise<boolean>;
  updateDisplayOrder: (productId: string, order: number) => Promise<boolean>;
};
```

### Exemple

```typescript
const { products, addProducts, removeProduct } =
  useCollectionProducts(collectionId);

// Ajouter plusieurs produits
const handleAddProducts = async (selectedIds: string[]) => {
  await addProducts(selectedIds);
  toast.success(`${selectedIds.length} produits ajoutés`);
};

// Retirer 1 produit
const handleRemove = async (productId: string) => {
  if (!confirm('Retirer ce produit ?')) return;
  await removeProduct(productId);
};
```

---

## 📚 Ressources

- **README Collections** : `./README.md`
- **Composants** : `./components.md`

---

**Dernière Mise à Jour** : 2025-10-27
