# Collections Produits

**Module** : Produits → Collections
**Status** : ✅ PRODUCTION READY
**Date Validation** : 2025-10-27

---

## 📊 Vue d'Ensemble

Le module **Collections** permet de regrouper des produits dans des collections thématiques pour faciliter la présentation et la vente groupée.

**Use cases** :
- Collections saisonnières (Été 2025, Noël, etc.)
- Collections par style (Vintage, Moderne, Scandinave)
- Collections par pièce (Salon, Chambre, Bureau)
- Promotions et offres spéciales

---

## ✅ Features Validées

### CRUD Collections

- ✅ **Création collection** : Wizard avec image principale
- ✅ **Modification** : Nom, description, image, statut
- ✅ **Suppression** : Soft delete (archived_at)
- ✅ **Activation/Désactivation** : is_active flag

### Gestion Produits

- ✅ **Ajout produits** : Modal sélecteur avec filtres
- ✅ **Retrait produits** : Suppression relation
- ✅ **Ordre personnalisé** : display_order pour chaque produit
- ✅ **Réorganisation** : Drag & drop pour réordonner

### Images Collection

- ✅ **Image principale** : 1 image représentative
- ✅ **Galerie** : Images additionnelles (optionnel)
- ✅ **Upload** : Supabase Storage (collection-images bucket)

### Affichage

- ✅ **Grille collections** : Cards avec image + stats
- ✅ **Page détail** : Produits de la collection en grille
- ✅ **Filtres** : Actives/Inactives, Recherche

---

## 📁 Database

### Table `collections`

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Colonnes clés** :
- `name` : Nom collection (unique)
- `slug` : URL-friendly identifier
- `image_url` : Image principale collection
- `is_active` : Actif/Inactif (affichage front)
- `display_order` : Ordre affichage dans liste

### Table `collection_products`

```sql
CREATE TABLE collection_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, product_id)
);
```

**Colonnes clés** :
- `collection_id` : FK vers collections
- `product_id` : FK vers products
- `display_order` : Ordre produit dans collection
- `UNIQUE` : 1 produit 1 seule fois par collection

---

## 🎯 Hooks Collections

### `useCollections(filters?)`

Hook principal CRUD collections avec filtres.

```typescript
interface CollectionFilters {
  search?: string
  is_active?: boolean
  archived?: boolean
}

function useCollections(filters?: CollectionFilters): {
  collections: Collection[]
  loading: boolean
  error: string | null
  createCollection: (data: CreateCollectionData) => Promise<Collection | null>
  updateCollection: (id: string, data: UpdateCollectionData) => Promise<Collection | null>
  deleteCollection: (id: string) => Promise<boolean>
  refetch: () => void
}
```

### `useCollection(id)`

Hook détail collection unique avec produits.

```typescript
function useCollection(id: string): {
  collection: Collection | null
  products: Product[]
  loading: boolean
  error: string | null
  addProduct: (productId: string) => Promise<boolean>
  removeProduct: (productId: string) => Promise<boolean>
  reorderProducts: (productIds: string[]) => Promise<boolean>
}
```

### `useCollectionProducts(collectionId)`

Hook gestion produits d'une collection.

```typescript
function useCollectionProducts(collectionId: string): {
  products: Product[]
  loading: boolean
  addProducts: (productIds: string[]) => Promise<boolean>
  removeProduct: (productId: string) => Promise<boolean>
  updateDisplayOrder: (productId: string, order: number) => Promise<boolean>
}
```

---

## 🧩 Composants Collections

### `CollectionGrid`

Grille affichage collections avec cards.

```typescript
interface CollectionGridProps {
  collections: Collection[]
  onSelect?: (collection: Collection) => void
}
```

### `CollectionCreationWizard`

Wizard création collection (nom, description, image).

```typescript
interface CollectionCreationWizardProps {
  onSuccess?: (collectionId: string) => void
  onCancel?: () => void
}
```

### `CollectionProductsManagerModal`

Modal gestion produits dans collection (ajout, retrait, réorganisation).

```typescript
interface CollectionProductsManagerModalProps {
  open: boolean
  onClose: () => void
  collectionId: string
}
```

---

## 🔄 Workflows

### Workflow 1 : Création Collection

```
1. Wizard création
   • Nom collection (REQUIRED)
   • Description
   • Image principale (upload)

2. INSERT collections

3. Redirection → /collections/[id]

4. Ajout produits
   • Modal sélecteur
   • Multi-select produits
   • INSERT collection_products

5. Collection prête ✅
```

### Workflow 2 : Gestion Produits Collection

```
1. Page détail collection
2. Clic "Gérer produits"
3. Modal :
   • Liste produits actuels
   • Bouton "Ajouter produits"
   • Drag & drop pour réordonner
   • Bouton retirer par produit
4. Sauvegarde → Refresh grille
```

---

## 📚 Ressources

- **Hooks** : `./hooks.md`
- **Composants** : `./components.md`
- **Database** : `docs/database/tables/collections.md`

---

**Dernière Mise à Jour** : 2025-10-27
**Mainteneur** : Vérone Dev Team
