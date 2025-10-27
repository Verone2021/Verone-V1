# Variantes Produits

**Module** : Produits → Variantes
**Status** : ✅ PRODUCTION READY
**Date Validation** : 2025-10-27

---

## 📊 Vue d'Ensemble

Le module **Variantes** permet de gérer des produits avec variations (couleur, taille, matière, etc.) de manière structurée.

**Concepts clés** :
- **Variant Group** : Groupe de variantes (ex: "Fauteuil Milo")
- **Variant Attributes** : Attributs variant (couleur, taille, matière)
- **Variants** : Produits individuels dans le groupe

**Exemple** :
```
Variant Group: "Fauteuil Milo"
├── Variant 1: Fauteuil Milo - Vert / Velours / L90
│   └── Attributes: {color: 'Vert', material: 'Velours', width: 90}
├── Variant 2: Fauteuil Milo - Bleu / Velours / L90
│   └── Attributes: {color: 'Bleu', material: 'Velours', width: 90}
└── Variant 3: Fauteuil Milo - Vert / Lin / L90
    └── Attributes: {color: 'Vert', material: 'Lin', width: 90}
```

---

## ✅ Features Validées

### Gestion Groupes Variantes

- ✅ **Création groupe** : Nom, description, master product
- ✅ **Ajout variantes** : Sélection produits existants
- ✅ **Génération automatique** : Créer toutes combinaisons
- ✅ **Retrait variantes** : Suppression de variantes du groupe

### Attributs Variantes

- ✅ **Attributs dynamiques** : JSON flexible (color, size, material, etc.)
- ✅ **Validation** : Attributs cohérents dans le groupe
- ✅ **Affichage** : Grid avec filtres par attribut

### Master Product

- ✅ **Master variant** : 1 produit principal du groupe
- ✅ **Fallback** : Si master supprimé, sélection nouveau master
- ✅ **Inheritance** : Variantes héritent catégorie, fournisseur

---

## 📁 Database

### Table `variant_groups`

```sql
CREATE TABLE variant_groups (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  master_product_id UUID REFERENCES products(id),
  attribute_schema JSONB,  -- Schema des attributs possibles
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Colonnes clés** :
- `master_product_id` : Produit principal (référence)
- `attribute_schema` : Définition attributs (ex: `{color: ['Vert', 'Bleu'], material: ['Velours', 'Lin']}`)
- `is_active` : Groupe actif/inactif

### Relation `products.variant_group_id`

```sql
ALTER TABLE products
ADD COLUMN variant_group_id UUID REFERENCES variant_groups(id);

ADD COLUMN variant_attributes JSONB;  -- Valeurs attributs (ex: {color: 'Vert', material: 'Velours'})
```

**Queries variantes** :
```sql
-- Tous produits d'un groupe
SELECT * FROM products
WHERE variant_group_id = $1
ORDER BY variant_attributes->>'color';

-- Master product
SELECT * FROM products p
JOIN variant_groups vg ON p.id = vg.master_product_id
WHERE vg.id = $1;
```

---

## 🎯 Hooks Variantes

### `useVariantGroups()`

Hook CRUD groupes variantes.

```typescript
function useVariantGroups(): {
  groups: VariantGroup[]
  loading: boolean
  createGroup: (data: CreateGroupData) => Promise<VariantGroup | null>
  updateGroup: (id: string, data: UpdateGroupData) => Promise<VariantGroup | null>
  deleteGroup: (id: string) => Promise<boolean>
}
```

### `useProductVariants(variantGroupId)`

Hook produits d'un groupe variantes.

```typescript
function useProductVariants(variantGroupId: string): {
  variants: Product[]
  loading: boolean
  addVariant: (productId: string, attributes: Record<string, any>) => Promise<boolean>
  removeVariant: (productId: string) => Promise<boolean>
  updateVariantAttributes: (productId: string, attributes: Record<string, any>) => Promise<boolean>
}
```

---

## 🧩 Composants Variantes

### `ProductVariantsSection`

Section gestion variantes sur page produit.

```typescript
interface ProductVariantsSectionProps {
  productId: string
  variantGroupId?: string
  onUpdate?: () => void
}
```

### `ProductVariantsGrid`

Grille affichage variantes avec filtres par attribut.

```typescript
interface ProductVariantsGridProps {
  variants: Product[]
  onSelect?: (variant: Product) => void
  filters?: VariantFilters
}
```

### `VariantAttributesEditor`

Éditeur attributs variant (JSON editor).

```typescript
interface VariantAttributesEditorProps {
  attributes: Record<string, any>
  schema: Record<string, string[]>
  onChange: (attributes: Record<string, any>) => void
}
```

---

## 🔄 Workflows

### Workflow 1 : Création Groupe Variantes

```
1. Page produit master
2. Clic "Créer groupe variantes"
3. Formulaire :
   • Nom groupe
   • Attributs possibles (color, size, material)
   • Valeurs possibles par attribut
4. INSERT variant_groups
5. UPDATE products SET variant_group_id WHERE id = master_id
6. Page gestion variantes
```

### Workflow 2 : Ajout Variante au Groupe

```
1. Page groupe variantes
2. Clic "Ajouter variante"
3. Modal sélection produit
4. Définir attributs variante (color: Bleu, etc.)
5. UPDATE products SET
     variant_group_id = $group_id,
     variant_attributes = $attributes
   WHERE id = $product_id
6. Refresh grid variantes
```

### Workflow 3 : Génération Automatique Variantes

```
1. Page groupe variantes
2. Clic "Générer toutes combinaisons"
3. Confirmation :
   • 2 couleurs × 3 tailles = 6 variantes
4. Boucle création :
   FOR EACH combinaison
     INSERT products (nom + attributs)
     SET variant_group_id
5. 6 nouveaux produits créés ✅
```

---

## 📊 Queries Variantes

### Groupes avec Stats

```sql
SELECT
  vg.id,
  vg.name,
  vg.master_product_id,
  COUNT(p.id) as variants_count,
  p_master.name as master_name
FROM variant_groups vg
LEFT JOIN products p ON p.variant_group_id = vg.id
LEFT JOIN products p_master ON p_master.id = vg.master_product_id
GROUP BY vg.id, p_master.name;
```

### Variantes par Attribut

```sql
-- Variantes par couleur
SELECT
  variant_attributes->>'color' as color,
  COUNT(*) as count
FROM products
WHERE variant_group_id = $1
GROUP BY variant_attributes->>'color';
```

---

## 📚 Ressources

- **Hooks** : `./hooks.md`
- **Composants** : `./components.md`
- **Database** : `docs/database/tables/variant_groups.md`

---

**Dernière Mise à Jour** : 2025-10-27
**Mainteneur** : Vérone Dev Team
