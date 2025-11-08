# Composants Collections - Documentation

**Module** : Produits → Collections
**Date** : 2025-10-27

---

## 📋 Composants Disponibles

1. `CollectionGrid` - Grille collections
2. `CollectionCreationWizard` - Wizard création
3. `CollectionProductsManagerModal` - Gestion produits
4. `CollectionFormModal` - Formulaire édition
5. `CollectionImageUpload` - Upload image collection

---

## 🎴 `CollectionGrid`

Grille affichage collections avec cards.

### Props

```typescript
interface CollectionGridProps {
  collections: Collection[];
  onSelect?: (collection: Collection) => void;
  showActions?: boolean;
}
```

### Exemple

```typescript
import { CollectionGrid } from '@/components/business/collection-grid'

<CollectionGrid
  collections={collections}
  onSelect={(c) => router.push(`/collections/${c.id}`)}
  showActions={true}
/>
```

---

## 📝 `CollectionCreationWizard`

Wizard création collection.

### Props

```typescript
interface CollectionCreationWizardProps {
  onSuccess?: (collectionId: string) => void;
  onCancel?: () => void;
}
```

### Exemple

```typescript
import { CollectionCreationWizard } from '@/components/business/collection-creation-wizard'

<CollectionCreationWizard
  onSuccess={(id) => router.push(`/collections/${id}`)}
  onCancel={() => router.back()}
/>
```

---

## 🔧 `CollectionProductsManagerModal`

Modal gestion produits collection (ajout, retrait, réorganisation).

### Props

```typescript
interface CollectionProductsManagerModalProps {
  open: boolean;
  onClose: () => void;
  collectionId: string;
  onUpdate?: () => void;
}
```

### Exemple

```typescript
import { CollectionProductsManagerModal } from '@/components/business/collection-products-manager-modal'

const [isOpen, setIsOpen] = useState(false)

<CollectionProductsManagerModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  collectionId={collection.id}
  onUpdate={() => refetch()}
/>
```

---

## 📚 Ressources

- **README Collections** : `./README.md`
- **Hooks** : `./hooks.md`

---

**Dernière Mise à Jour** : 2025-10-27
