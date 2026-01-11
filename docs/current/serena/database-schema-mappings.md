# Mappings Critiques Base de Donnees Verone

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- packages/@verone/types/src/supabase.ts
- supabase/migrations/
  Owner: Romeo Dos Santos
  Created: 2025-12-01
  Updated: 2026-01-10

---

## Objectif

Eviter les erreurs repetitives sur les noms de colonnes et relations FK.
**CONSULTER AVANT TOUTE REQUETE SUPABASE.**

---

## 1. Table `organisations` (Fournisseurs/Clients)

**ATTENTION** : Cette table stocke TOUS les types d'organisations (fournisseurs, clients B2B, etc.)

| Colonne attendue (FAUX) | Colonne reelle (CORRECT)   |
| ----------------------- | -------------------------- |
| `name`                  | `legal_name`               |
| `suppliers.name`        | `organisations.legal_name` |

**Relation FK depuis `products`** :

```sql
products.supplier_id → organisations.id  -- PAS une table "suppliers" !
```

**PostgREST Query CORRECT** :

```typescript
// CORRECT
supplier: supplier_id(legal_name);

// FAUX - N'existe pas
suppliers: supplier_id(name);
supplier: supplier_id(name);
```

---

## 2. Table `products` - Images

**ATTENTION** : `products` n'a PAS de colonne image directe !

| Colonne attendue (FAUX) | Solution reelle (CORRECT)                           |
| ----------------------- | --------------------------------------------------- |
| `primary_image_url`     | Via table `product_images` avec `is_primary = true` |
| `image_url`             | Via table `product_images.public_url`               |

**Table `product_images`** :

- `id` (uuid)
- `product_id` (uuid FK → products)
- `public_url` (text) - URL publique de l'image
- `is_primary` (boolean) - Image principale
- `display_order` (integer)

**PostgREST Query pour image principale** :

```typescript
// CORRECT - Joindre product_images
products!inner(
  id,
  sku,
  name,
  product_images(public_url, is_primary)
)

// Puis filtrer cote client : images.find(i => i.is_primary)?.public_url
```

---

## 3. Table `subcategories`

**Relation FK depuis `products`** :

```sql
products.subcategory_id → subcategories.id
```

**PostgREST Query CORRECT** :

```typescript
subcategories: subcategory_id(name); // Alias : relation
```

---

## 4. Resume des Relations Products

```typescript
// Query complete CORRECTE pour un produit avec toutes ses relations
const select = `
  id,
  sku,
  name,
  cost_price,
  stock_real,
  product_status,
  subcategories:subcategory_id(name),
  supplier:supplier_id(legal_name),
  product_images(public_url, is_primary, display_order)
`;
```

---

## 5. Checklist Anti-Erreurs

Avant toute requete Supabase sur `products` :

- [ ] `supplier_id` → table `organisations` (pas `suppliers`)
- [ ] Utiliser `legal_name` (pas `name`) pour organisations
- [ ] Images via `product_images` table (pas colonne directe)
- [ ] `public_url` pour URL image (pas `image_url` ou `primary_image_url`)

---

## Regles Absolues

1. **JAMAIS** supposer qu'une colonne existe sans verifier supabase.ts
2. **TOUJOURS** utiliser les alias PostgREST corrects
3. **JAMAIS** chercher une table `suppliers` (c'est `organisations`)

---

## References

- `packages/@verone/types/src/supabase.ts` - Types generes
- `docs/current/database.md` - Documentation DB complete
