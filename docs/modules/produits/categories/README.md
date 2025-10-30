# Catégories & Taxonomie Produits

**Module** : Produits → Catégories
**Status** : ✅ PRODUCTION READY
**Date Validation** : 2025-10-27

---

## 📊 Vue d'Ensemble

Le module **Catégories** gère la taxonomie hiérarchique des produits en 3 niveaux :
1. **Catégories** (niveau 1) - Ex: Mobilier, Décoration
2. **Sous-catégories** (niveau 2) - Ex: Salon, Chambre
3. **Familles** (niveau 3) - Ex: Fauteuils, Tables basses

**Structure hiérarchique** :
```
Catégorie
└── Sous-catégorie
    └── Famille
        └── Produits
```

---

## ✅ Features Validées

### Structure Hiérarchique

- ✅ **3 niveaux** : Category → Subcategory → Family
- ✅ **Relations** : Foreign keys avec CASCADE DELETE
- ✅ **Slugs** : URL-friendly identifiers uniques
- ✅ **Icônes** : Icon name pour affichage UI

### CRUD

- ✅ **Création** : Catégorie, Sous-catégorie, Famille
- ✅ **Modification** : Nom, description, icon, parent
- ✅ **Suppression** : Soft delete (archived_at)
- ✅ **Réorganisation** : display_order

### Sélecteurs

- ✅ **CategorySelector** : Dropdown hiérarchique
- ✅ **SubcategorySelector** : Filtré par catégorie
- ✅ **FamilySelector** : Filtré par sous-catégorie

---

## 📁 Database

### Table `categories`

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemples** :
- Mobilier (icon: 'Sofa')
- Décoration (icon: 'Palette')
- Luminaires (icon: 'Lightbulb')
- Textiles (icon: 'Shirt')

### Table `subcategories`

```sql
CREATE TABLE subcategories (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  archived_at TIMESTAMPTZ,
  UNIQUE(category_id, name)
);
```

**Exemples (Mobilier)** :
- Salon (Canapés, Fauteuils, Tables basses)
- Chambre (Lits, Commodes, Tables de chevet)
- Bureau (Bureaux, Chaises, Rangements)

### Table `families`

```sql
CREATE TABLE families (
  id UUID PRIMARY KEY,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  archived_at TIMESTAMPTZ,
  UNIQUE(subcategory_id, name)
);
```

**Exemples (Salon)** :
- Fauteuils
- Canapés 2 places
- Canapés 3 places
- Tables basses rondes
- Tables basses rectangulaires

---

## 🎯 Hooks Catégories

### `useCategories()`

Hook CRUD catégories niveau 1.

```typescript
function useCategories(): {
  categories: Category[]
  loading: boolean
  error: string | null
  createCategory: (data: CreateCategoryData) => Promise<Category | null>
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<Category | null>
  deleteCategory: (id: string) => Promise<boolean>
}
```

### `useSubcategories(categoryId?)`

Hook sous-catégories niveau 2.

```typescript
function useSubcategories(categoryId?: string): {
  subcategories: Subcategory[]
  loading: boolean
  createSubcategory: (data: CreateSubcategoryData) => Promise<Subcategory | null>
  updateSubcategory: (id: string, data: UpdateSubcategoryData) => Promise<Subcategory | null>
}
```

### `useFamilies(subcategoryId?)`

Hook familles niveau 3.

```typescript
function useFamilies(subcategoryId?: string): {
  families: Family[]
  loading: boolean
  createFamily: (data: CreateFamilyData) => Promise<Family | null>
}
```

---

## 🧩 Composants Catégories

### `CategorySelector`

Dropdown sélection catégorie niveau 1.

```typescript
interface CategorySelectorProps {
  value: string | null
  onChange: (categoryId: string) => void
  placeholder?: string
}
```

### `SubcategorySelector`

Dropdown sous-catégorie (filtré par catégorie).

```typescript
interface SubcategorySelectorProps {
  categoryId: string | null
  value: string | null
  onChange: (subcategoryId: string) => void
}
```

### `FamilySelector`

Dropdown famille (filtré par sous-catégorie).

```typescript
interface FamilySelectorProps {
  subcategoryId: string | null
  value: string | null
  onChange: (familyId: string) => void
}
```

---

## 🔄 Workflow Sélection Hiérarchique

```
Produit Form
    │
    ├─ 1. Sélectionner Catégorie
    │     └─ Charge sous-catégories
    │
    ├─ 2. Sélectionner Sous-catégorie
    │     └─ Charge familles
    │
    └─ 3. Sélectionner Famille (optionnel)
          └─ Sauvegarde product.family_id
```

### Exemple Code

```typescript
const [categoryId, setCategoryId] = useState<string | null>(null)
const [subcategoryId, setSubcategoryId] = useState<string | null>(null)
const [familyId, setFamilyId] = useState<string | null>(null)

<CategorySelector
  value={categoryId}
  onChange={(id) => {
    setCategoryId(id)
    setSubcategoryId(null) // Reset enfants
    setFamilyId(null)
  }}
/>

<SubcategorySelector
  categoryId={categoryId}
  value={subcategoryId}
  onChange={(id) => {
    setSubcategoryId(id)
    setFamilyId(null) // Reset enfant
  }}
/>

<FamilySelector
  subcategoryId={subcategoryId}
  value={familyId}
  onChange={setFamilyId}
/>
```

---

## 📊 Statistiques Taxonomie

### Queries Utiles

```sql
-- Nombre produits par catégorie
SELECT
  c.name,
  COUNT(p.id) as products_count
FROM categories c
LEFT JOIN subcategories sc ON sc.category_id = c.id
LEFT JOIN products p ON p.subcategory_id = sc.id
GROUP BY c.id, c.name
ORDER BY products_count DESC;

-- Catégories sans produits
SELECT c.name
FROM categories c
WHERE NOT EXISTS (
  SELECT 1 FROM subcategories sc
  JOIN products p ON p.subcategory_id = sc.id
  WHERE sc.category_id = c.id
);
```

---

## 📚 Ressources

- **Hooks** : `./hooks.md`
- **Database** : `docs/database/tables/categories.md`

---

**Dernière Mise à Jour** : 2025-10-27
**Mainteneur** : Vérone Dev Team
