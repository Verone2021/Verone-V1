# Hooks Variantes - Documentation

**Module** : Produits → Variantes
**Date** : 2025-10-27

---

## 📋 Hooks Disponibles

1. `useVariantGroups()` - CRUD groupes variantes
2. `useVariantGroup(id)` - Détail groupe + variantes
3. `useProductVariants(variantGroupId)` - Produits d'un groupe

---

## 🎯 `useVariantGroups()`

Hook CRUD groupes variantes.

### Signature

```typescript
interface VariantGroup {
  id: string;
  name: string;
  description: string | null;
  master_product_id: string | null;
  attribute_schema: Record<string, string[]> | null;
  is_active: boolean;
  variants_count?: number;
  created_at: string;
  updated_at: string;
}

function useVariantGroups(): {
  groups: VariantGroup[];
  loading: boolean;
  error: string | null;
  createGroup: (data: CreateGroupData) => Promise<VariantGroup | null>;
  updateGroup: (
    id: string,
    data: UpdateGroupData
  ) => Promise<VariantGroup | null>;
  deleteGroup: (id: string) => Promise<boolean>;
  refetch: () => void;
};
```

### Exemple

```typescript
import { useVariantGroups } from '@/hooks/use-variant-groups'

export default function VariantGroupsPage() {
  const { groups, createGroup } = useVariantGroups()

  const handleCreate = async () => {
    await createGroup({
      name: 'Fauteuil Milo',
      master_product_id: masterProductId,
      attribute_schema: {
        color: ['Vert', 'Bleu', 'Gris'],
        material: ['Velours', 'Lin'],
        width: ['90', '100', '110']
      }
    })
  }

  return (
    <div>
      {groups.map(group => (
        <div key={group.id}>
          <h3>{group.name}</h3>
          <p>{group.variants_count} variantes</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 📄 `useVariantGroup(id)`

Hook détail groupe avec variantes.

### Signature

```typescript
function useVariantGroup(id: string): {
  group: VariantGroup | null;
  variants: Product[];
  loading: boolean;
  error: string | null;
  addVariant: (
    productId: string,
    attributes: Record<string, any>
  ) => Promise<boolean>;
  removeVariant: (productId: string) => Promise<boolean>;
  generateAllCombinations: () => Promise<Product[]>;
};
```

### Exemple

```typescript
const { group, variants, addVariant, generateAllCombinations } =
  useVariantGroup(groupId);

// Ajouter variante existante
await addVariant(productId, {
  color: 'Bleu',
  material: 'Velours',
});

// Générer toutes combinaisons
const newVariants = await generateAllCombinations();
// Crée : Vert/Velours, Vert/Lin, Bleu/Velours, Bleu/Lin, etc.
```

---

## 📦 `useProductVariants(variantGroupId)`

Hook produits d'un groupe variantes.

### Signature

```typescript
function useProductVariants(variantGroupId: string): {
  variants: Product[];
  loading: boolean;
  error: string | null;
  updateVariantAttributes: (
    productId: string,
    attributes: Record<string, any>
  ) => Promise<boolean>;
  getVariantsByAttribute: (attribute: string, value: string) => Product[];
};
```

### Exemple

```typescript
const { variants, updateVariantAttributes, getVariantsByAttribute } =
  useProductVariants(groupId);

// Mettre à jour attributs
await updateVariantAttributes(productId, {
  color: 'Rouge',
  material: 'Cuir',
});

// Filtrer par attribut
const greenVariants = getVariantsByAttribute('color', 'Vert');
const velvetVariants = getVariantsByAttribute('material', 'Velours');
```

---

## 🔗 Pattern Variant Selection

Utilisation des hooks pour sélection variante par attributs :

```typescript
export default function ProductVariantSelector({ variantGroupId }: { variantGroupId: string }) {
  const { group, variants } = useVariantGroup(variantGroupId)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})

  // Filtrer variantes selon attributs sélectionnés
  const filteredVariants = variants.filter(variant => {
    return Object.entries(selectedAttributes).every(([key, value]) =>
      variant.variant_attributes?.[key] === value
    )
  })

  // Valeurs disponibles pour chaque attribut (basé sur sélection)
  const getAvailableValues = (attribute: string) => {
    const schema = group?.attribute_schema || {}
    if (Object.keys(selectedAttributes).length === 0) {
      return schema[attribute] || []
    }

    // Filtrer valeurs disponibles selon autres sélections
    return variants
      .filter(v => {
        return Object.entries(selectedAttributes)
          .filter(([k]) => k !== attribute)
          .every(([key, value]) => v.variant_attributes?.[key] === value)
      })
      .map(v => v.variant_attributes?.[attribute])
      .filter((v, i, arr) => arr.indexOf(v) === i) // Unique
  }

  return (
    <div>
      {/* Sélecteurs attributs */}
      {Object.keys(group?.attribute_schema || {}).map(attr => (
        <div key={attr}>
          <label>{attr}</label>
          <select
            value={selectedAttributes[attr] || ''}
            onChange={(e) => setSelectedAttributes({
              ...selectedAttributes,
              [attr]: e.target.value
            })}
          >
            <option value="">Tous</option>
            {getAvailableValues(attr).map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      ))}

      {/* Variantes correspondantes */}
      <div className="grid grid-cols-3 gap-4">
        {filteredVariants.map(variant => (
          <ProductCard key={variant.id} product={variant} />
        ))}
      </div>
    </div>
  )
}
```

---

## 📚 Ressources

- **README Variantes** : `./README.md`
- **Composants** : `./components.md`

---

**Dernière Mise à Jour** : 2025-10-27
