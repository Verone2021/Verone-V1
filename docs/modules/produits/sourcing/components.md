# Composants Sourcing - Documentation

**Module** : Produits → Sourcing
**Date** : 2025-10-27

---

## 📋 Composants Disponibles

```
📦 Composants Sourcing (4 total)
├── QuickSourcingModal - Modal création rapide
├── SourcingQuickForm - Formulaire 3 champs
├── EditSourcingProductModal - Modal édition
└── SourcingProductModal - Modal détail
```

---

## 🎴 `QuickSourcingModal`

Modal wrapper pour création rapide produit sourcing.

### Props TypeScript

```typescript
interface QuickSourcingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### Usage

```typescript
import { QuickSourcingModal } from '@/components/business/quick-sourcing-modal'

export default function SourcingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Nouveau Sourcing
      </button>

      <QuickSourcingModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          toast.success('Produit créé')
          refetch()
          setIsModalOpen(false)
        }}
      />
    </>
  )
}
```

---

## 📝 `SourcingQuickForm`

Formulaire simplifié 3 champs pour création rapide.

### Props TypeScript

```typescript
interface SourcingQuickFormProps {
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  showHeader?: boolean;
}
```

### Champs Formulaire

1. **Nom produit** (REQUIRED)
   - Type : text
   - Validation : min 3 caractères
   - Placeholder : "Ex: Fauteuil vintage bleu"

2. **URL page fournisseur** (REQUIRED)
   - Type : url
   - Validation : format URL valide
   - Placeholder : "https://..."

3. **Prix achat HT** (REQUIRED)
   - Type : number
   - Validation : > 0
   - Format : Devise €

### Validation

```typescript
const schema = z.object({
  name: z.string().min(3, 'Minimum 3 caractères'),
  supplier_page_url: z.string().url('URL invalide'),
  cost_price: z.number().positive('Prix doit être > 0'),
});
```

### Usage

```typescript
import { SourcingQuickForm } from '@/components/business/sourcing-quick-form'

export default function CreateSourcingPage() {
  const handleSuccess = (productId: string) => {
    router.push(`/produits/sourcing/produits/${productId}`)
  }

  return (
    <div>
      <SourcingQuickForm
        onSuccess={handleSuccess}
        onCancel={() => router.back()}
        showHeader={true}
      />
    </div>
  )
}
```

---

## ✏️ `EditSourcingProductModal`

Modal édition complète produit sourcing.

### Props TypeScript

```typescript
interface EditSourcingProductModalProps {
  open: boolean;
  onClose: () => void;
  product: SourcingProduct;
  onUpdate?: () => void;
}
```

### Champs Éditables

- Nom produit
- URL page fournisseur
- Prix achat HT
- Fournisseur (SupplierSelector)
- Type sourcing (radio: interne/client)
- Client assigné (si type=client)
- Marge cible %
- Échantillon requis ? (checkbox)
- Notes internes

### Usage

```typescript
import { EditSourcingProductModal } from '@/components/business/edit-sourcing-product-modal'

export default function SourcingDetailPage({ product }) {
  const [isEditOpen, setIsEditOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsEditOpen(true)}>
        Modifier
      </button>

      <EditSourcingProductModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        product={product}
        onUpdate={() => {
          refetch()
          setIsEditOpen(false)
        }}
      />
    </>
  )
}
```

---

## 📊 `SourcingProductModal`

Modal affichage détails produit sourcing (read-only).

### Props TypeScript

```typescript
interface SourcingProductModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
}
```

### Sections Affichées

- Informations générales
- Fournisseur
- Pricing (coût, marge, prix estimé)
- Type sourcing
- Client assigné (si applicable)
- Échantillon (requis ? commandé ?)
- Images

---

## 🎨 Patterns UX Sourcing

### Pattern 1 : Création Rapide

Modal simplifiée 3 champs → Accès rapide au sourcing.

```typescript
// Bouton déclenche modal
<button onClick={() => setQuickModalOpen(true)}>
  + Nouveau Sourcing
</button>

// Modal wrapper
<QuickSourcingModal
  open={quickModalOpen}
  onClose={() => setQuickModalOpen(false)}
  onSuccess={() => {
    refetch()
    setQuickModalOpen(false)
  }}
/>
```

### Pattern 2 : Actions Produit Sourcing

3 actions principales sur card sourcing :

```typescript
<div className="actions">
  <button onClick={() => validateSourcing(product.id)}>
    ✅ Valider au catalogue
  </button>

  {product.requires_sample && (
    <button onClick={() => orderSample(product.id)}>
      📦 Commander échantillon
    </button>
  )}

  <button onClick={() => setEditModalOpen(true)}>
    ✏️ Modifier
  </button>
</div>
```

---

## 📚 Ressources

- **README Sourcing** : `./README.md`
- **Hooks** : `./hooks.md`
- **Workflows** : `./workflows.md`

---

**Dernière Mise à Jour** : 2025-10-27
