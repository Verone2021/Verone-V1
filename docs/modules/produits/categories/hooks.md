# Hooks Catégories - Documentation

**Module** : Produits → Catégories
**Date** : 2025-10-27

---

## 📋 Hooks Disponibles

1. `useCategories()` - Niveau 1 (catégories)
2. `useSubcategories(categoryId?)` - Niveau 2 (sous-catégories)
3. `useFamilies(subcategoryId?)` - Niveau 3 (familles)

---

## 🎯 `useCategories()`

Hook CRUD catégories niveau 1.

### Signature

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  subcategories_count?: number;
  products_count?: number;
}

function useCategories(): {
  categories: Category[];
  loading: boolean;
  error: string | null;
  createCategory: (data: CreateCategoryData) => Promise<Category | null>;
  updateCategory: (
    id: string,
    data: UpdateCategoryData
  ) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  refetch: () => void;
};
```

### Exemple

```typescript
import { useCategories } from '@/hooks/use-categories'

export default function CategoriesManagementPage() {
  const {
    categories,
    loading,
    createCategory,
    updateCategory
  } = useCategories()

  const handleCreate = async () => {
    await createCategory({
      name: 'Mobilier',
      description: 'Meubles pour la maison',
      icon: 'Sofa',
      display_order: 0
    })
  }

  return (
    <div>
      {categories.map(cat => (
        <div key={cat.id}>
          <h3>{cat.name}</h3>
          <p>{cat.subcategories_count} sous-catégories</p>
          <p>{cat.products_count} produits</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 📂 `useSubcategories(categoryId?)`

Hook sous-catégories niveau 2.

### Signature

```typescript
interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  families_count?: number;
  products_count?: number;
}

function useSubcategories(categoryId?: string): {
  subcategories: Subcategory[];
  loading: boolean;
  error: string | null;
  createSubcategory: (
    data: CreateSubcategoryData
  ) => Promise<Subcategory | null>;
  updateSubcategory: (
    id: string,
    data: UpdateSubcategoryData
  ) => Promise<Subcategory | null>;
  refetch: () => void;
};
```

### Exemple

```typescript
const { subcategories } = useSubcategories(selectedCategoryId)

// Filtrées automatiquement par categoryId
subcategories.map(sub => (
  <div key={sub.id}>{sub.name}</div>
))
```

---

## 📁 `useFamilies(subcategoryId?)`

Hook familles niveau 3.

### Signature

```typescript
interface Family {
  id: string;
  subcategory_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  products_count?: number;
}

function useFamilies(subcategoryId?: string): {
  families: Family[];
  loading: boolean;
  error: string | null;
  createFamily: (data: CreateFamilyData) => Promise<Family | null>;
  refetch: () => void;
};
```

### Exemple

```typescript
const { families } = useFamilies(selectedSubcategoryId)

families.map(family => (
  <option key={family.id} value={family.id}>
    {family.name} ({family.products_count})
  </option>
))
```

---

## 🔗 Pattern Cascade

Utilisation des 3 hooks en cascade pour sélection hiérarchique :

```typescript
export default function ProductCategoryForm() {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)

  const { categories } = useCategories()
  const { subcategories } = useSubcategories(categoryId || undefined)
  const { families } = useFamilies(subcategoryId || undefined)

  return (
    <div>
      {/* Niveau 1 : Catégorie */}
      <select
        value={categoryId || ''}
        onChange={(e) => {
          setCategoryId(e.target.value)
          setSubcategoryId(null)
          setFamilyId(null)
        }}
      >
        <option value="">Sélectionner catégorie</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      {/* Niveau 2 : Sous-catégorie */}
      {categoryId && (
        <select
          value={subcategoryId || ''}
          onChange={(e) => {
            setSubcategoryId(e.target.value)
            setFamilyId(null)
          }}
        >
          <option value="">Sélectionner sous-catégorie</option>
          {subcategories.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>
      )}

      {/* Niveau 3 : Famille (optionnel) */}
      {subcategoryId && (
        <select
          value={familyId || ''}
          onChange={(e) => setFamilyId(e.target.value)}
        >
          <option value="">Sélectionner famille (optionnel)</option>
          {families.map(fam => (
            <option key={fam.id} value={fam.id}>{fam.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
```

---

## 📚 Ressources

- **README Catégories** : `./README.md`
- **Database** : `docs/database/tables/categories.md`

---

**Dernière Mise à Jour** : 2025-10-27
