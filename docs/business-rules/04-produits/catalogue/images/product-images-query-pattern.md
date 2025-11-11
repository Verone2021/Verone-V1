# 🖼️ Product Images Query Pattern - Règle Technique Validée

**Référence** : BR-TECH-002
**Date validation** : 28 septembre 2025
**Criticité** : BUSINESS CRITICAL
**Type** : Architecture Donnée

---

## 🎯 RÈGLE ABSOLUE

**TOUJOURS utiliser la table `product_images` pour récupérer les images produits.**

❌ **INTERDIT** : Utiliser `products.image_url` (colonne supprimée)
✅ **OBLIGATOIRE** : Jointure avec `product_images` + filtre `is_primary = true`

---

## 🚨 CONTEXTE & PROBLÈME RÉSOLU

### **Erreur Historique**

```typescript
// ❌ ANCIEN CODE (ERREUR)
const { data } = await supabase.from('products').select('id, name, image_url'); // ← Colonne n'existe plus!
```

**Symptôme** : `ERROR: 42703: column "image_url" does not exist`

### **Migration Effectuée**

- **Migration** : `20250916_008_remove_primary_image_url_columns.sql`
- **Action** : Suppression colonne `image_url` de table `products`
- **Raison** : Centralisation images dans table dédiée `product_images`

---

## ✅ PATTERN CORRECT OBLIGATOIRE

### **Pattern 1 : Récupérer Image Primaire**

```typescript
// ✅ CORRECT - Avec Supabase Client
const { data } = await supabase
  .from('products')
  .select(
    `
    id,
    name,
    sku,
    price_ht,
    status,
    product_images!left (
      public_url,
      is_primary
    )
  `
  )
  .eq('product_images.is_primary', true);
```

**Transformation Data** :

```typescript
const products = (data || []).map(product => ({
  ...product,
  primary_image_url: product.product_images?.[0]?.public_url || null,
}));
```

### **Pattern 2 : SQL Direct**

```sql
-- ✅ CORRECT - Jointure SQL
SELECT
  p.id,
  p.name,
  p.sku,
  pi.public_url AS image_url,
  p.price_ht,
  p.status
FROM products p
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
WHERE p.status = 'in_stock'
ORDER BY p.name
```

### **Pattern 3 : Collection Products**

```typescript
// ✅ CORRECT - Via collection_products
const { data: products } = await supabase
  .from('collection_products')
  .select(
    `
    position,
    products:product_id (
      id,
      name,
      price_ht,
      product_images!left (
        public_url,
        is_primary
      )
    )
  `
  )
  .eq('collection_id', collectionId)
  .order('position', { ascending: true });
```

---

## 📋 CAS D'USAGE VALIDÉS

### **1. Product Selector Modal**

- **Fichier** : `apps/back-office/apps/back-office/src/components/business/product-selector-modal.tsx`
- **Pattern** : Jointure `product_images!left` avec transformation data
- **Statut** : ✅ Corrigé (28/09/2025)

### **2. Collections Hook**

- **Fichier** : `apps/back-office/apps/back-office/src/hooks/use-collections.ts`
- **Pattern** : Nested select avec `product_images!left`
- **Statut** : ✅ Corrigé (28/09/2025)

### **3. Cas Futurs Identifiés**

- **Commandes** : Jointure obligatoire pour affichage produits commandés
- **Catalogues** : Idem pour génération PDF/exports
- **Feeds** : Idem pour flux produits partagés
- **Stocks** : Idem pour inventaires avec visuels

---

## 🏗️ ARCHITECTURE BASE DE DONNÉES

### **Table `products`**

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  price_ht NUMERIC(10,2),
  status product_status_enum,
  -- ❌ Plus de colonne image_url
  -- ❌ Plus de colonne primary_image_url
  ...
);
```

### **Table `product_images`**

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,  -- ✅ Clé pour image principale
  image_type image_type_enum,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  file_size BIGINT,
  format TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index critique pour performance
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(is_primary) WHERE is_primary = true;
```

---

## 🔧 CHECKLIST DÉVELOPPEUR

Avant d'écrire une requête produit :

- [ ] ✅ Ai-je besoin d'afficher une image ?
- [ ] ✅ Ai-je inclus la jointure `product_images!left` ?
- [ ] ✅ Ai-je récupéré `public_url` (pas `image_url`) ?
- [ ] ✅ Ai-je transformé les données si nécessaire ?
- [ ] ✅ Ai-je géré le cas `null` (produits sans image) ?

**Si UNE SEULE réponse est "non"** → Code incorrect !

---

## 📊 PERFORMANCE & OPTIMISATION

### **Performance Considerations**

- **Jointure LEFT** : Évite exclusion produits sans images
- **Index `is_primary`** : Accélère filtre image principale
- **Limite résultats** : Toujours utiliser `.limit()` pour listes longues

### **Exemple Optimisé**

```typescript
// ✅ Optimisé avec limite + filtre
const { data } = await supabase
  .from('products')
  .select(
    `
    id,
    name,
    product_images!left (
      public_url
    )
  `
  )
  .eq('status', 'in_stock')
  .limit(50); // ← Limite pour performance
```

---

## 🚀 IMPACT BUSINESS

### **Avant Correction (27/09/2025)**

- ❌ Erreur console bloquante : "Error fetching products: {}"
- ❌ Modale sélection produits non fonctionnelle
- ❌ Collections impossibles à peupler

### **Après Correction (28/09/2025)**

- ✅ Requêtes produits fonctionnelles
- ✅ Images correctement récupérées
- ✅ Collections opérationnelles
- ✅ Pattern documenté pour cas futurs

---

## 🔗 FICHIERS CONCERNÉS

### **Corrigés**

- `/apps/back-office/src/components/business/product-selector-modal.tsx`
- `/apps/back-office/src/hooks/use-collections.ts`

### **À Surveiller (Futurs)**

- Tout nouveau composant affichant des produits avec images
- Routes API retournant des produits
- Exports/PDF incluant visuels produits
- Fonctionnalités commandes/devis

---

## 📚 RÉFÉRENCES

- **Migration** : `/supabase/migrations/20250916_008_remove_primary_image_url_columns.sql`
- **Table Schema** : `/supabase/migrations/20250916_007_create_product_images_table.sql`
- **Documentation Supabase** : [Nested Relations](https://supabase.com/docs/guides/database/joins-and-nesting)

---

**RESPONSABLE** : Équipe Development
**REVIEW** : Obligatoire avant merge de tout code manipulant produits
**MISE À JOUR** : Sur évolution architecture images
