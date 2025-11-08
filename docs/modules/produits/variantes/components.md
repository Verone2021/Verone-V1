# Composants Variantes - Documentation

**Module** : Produits → Variantes
**Date** : 2025-10-27

---

## 📋 Composants Disponibles

1. `ProductVariantsSection` - Section gestion variantes
2. `ProductVariantsGrid` - Grille variantes avec filtres
3. `VariantAttributesEditor` - Éditeur attributs JSON
4. `ProductVariantGridCard` - Card variante

---

## 🎴 `ProductVariantsSection`

Section complète gestion variantes sur page produit.

### Props

```typescript
interface ProductVariantsSectionProps {
  productId: string;
  variantGroupId?: string;
  onUpdate?: () => void;
}
```

### Features

- Affichage groupe variantes actuel
- Créer nouveau groupe
- Ajouter variantes au groupe
- Retirer variantes
- Modifier attributs

### Exemple

```typescript
import { ProductVariantsSection } from '@/components/business/product-variants-section'

<ProductVariantsSection
  productId={product.id}
  variantGroupId={product.variant_group_id}
  onUpdate={() => refetch()}
/>
```

---

## 📊 `ProductVariantsGrid`

Grille affichage variantes avec filtres par attribut.

### Props

```typescript
interface ProductVariantsGridProps {
  variants: Product[];
  onSelect?: (variant: Product) => void;
  filters?: VariantFilters;
  groupBy?: string; // Attribut pour grouper (color, size, etc.)
}
```

### Exemple

```typescript
import { ProductVariantsGrid } from '@/components/business/product-variants-grid'

<ProductVariantsGrid
  variants={variants}
  onSelect={(v) => router.push(`/catalogue/${v.id}`)}
  groupBy="color"  // Groupe par couleur
/>
```

---

## ✏️ `VariantAttributesEditor`

Éditeur attributs variant (JSON editor visuel).

### Props

```typescript
interface VariantAttributesEditorProps {
  attributes: Record<string, any>;
  schema: Record<string, string[]>;
  onChange: (attributes: Record<string, any>) => void;
}
```

### Exemple

```typescript
import { VariantAttributesEditor } from '@/components/business/variant-attributes-editor'

const [attributes, setAttributes] = useState({
  color: 'Vert',
  material: 'Velours',
  width: '90'
})

const schema = {
  color: ['Vert', 'Bleu', 'Gris'],
  material: ['Velours', 'Lin', 'Cuir'],
  width: ['90', '100', '110']
}

<VariantAttributesEditor
  attributes={attributes}
  schema={schema}
  onChange={setAttributes}
/>
```

---

## 📚 Ressources

- **README Variantes** : `./README.md`
- **Hooks** : `./hooks.md`

---

**Dernière Mise à Jour** : 2025-10-27
