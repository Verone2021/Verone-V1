# 🚀 Guide Migration Logger - Hooks Restants (61 console.log)

**Objectif** : Terminer la migration des 61 console.log restants dans 3 hooks critiques
**Temps estimé** : 2 heures
**Statut** : use-contacts.ts ✅ TERMINÉ (18/18 migrés)

---

## 📋 PLAN D'EXÉCUTION

### Étape 1️⃣ : use-product-images.ts (15 console.log - 30 min)

**Fichier** : `src/hooks/use-product-images.ts` (343 lignes)

#### 1. Ajouter import logger
```typescript
// Ligne 4 - Après imports existants
import logger from '@/lib/logger'
```

#### 2. Patterns de remplacement (15 occurrences)

**Pattern Upload Success** :
```typescript
// AVANT
console.log('✅ Image uploaded:', {
  storagePath,
  publicUrl,
  productId
})

// APRÈS
logger.info('Image produit uploadée', {
  operation: 'upload_product_image',
  resource: 'product_images',
  productId,
  imageId: data?.id
})
```

**Pattern Upload Error** :
```typescript
// AVANT
console.error('❌ Upload failed:', error)

// APRÈS
logger.error('Erreur upload image produit', error instanceof Error ? error : new Error(String(error)), {
  operation: 'upload_product_image_failed',
  resource: 'product_images',
  productId
})
```

**Pattern Delete Success** :
```typescript
// AVANT
console.log('✅ Image deleted:', { imageId, storagePath })

// APRÈS
logger.info('Image produit supprimée', {
  operation: 'delete_product_image',
  resource: 'product_images',
  imageId
})
```

**Pattern Fetch Error** :
```typescript
// AVANT
console.error('Erreur fetch images:', error)

// APRÈS
logger.error('Erreur récupération images produit', error instanceof Error ? error : new Error(String(error)), {
  operation: 'fetch_product_images',
  resource: 'product_images',
  productId
})
```

#### 3. Commandes vérification
```bash
# Vérifier restants
grep -n "console\." src/hooks/use-product-images.ts

# Après migration → doit retourner 0
grep -c "console\." src/hooks/use-product-images.ts  # → 0

# Build validation
npm run build
```

---

### Étape 2️⃣ : use-collection-images.ts (15 console.log - 30 min)

**Fichier** : `src/hooks/use-collection-images.ts` (359 lignes)

#### Patterns identiques à use-product-images.ts

**Remplacements** :
- `productId` → `collectionId`
- `product_images` → `collection_images`
- `upload_product_image` → `upload_collection_image`

**Exemple** :
```typescript
// AVANT
console.log('✅ Image uploaded:', {
  storagePath,
  publicUrl,
  collectionId
})

// APRÈS
logger.info('Image collection uploadée', {
  operation: 'upload_collection_image',
  resource: 'collection_images',
  collectionId,
  imageId: data?.id
})
```

#### Commandes vérification
```bash
grep -c "console\." src/hooks/use-collection-images.ts  # → 0
npm run build
```

---

### Étape 3️⃣ : use-variant-groups.ts (31 console.log - 90 min) ⚠️ PRUDENCE

**Fichier** : `src/hooks/use-variant-groups.ts` (1255 lignes)

#### Stratégie : Migration par blocs fonctionnels

##### Bloc 1 : Fetch & Load (3 console.log)
```typescript
// Ligne 70
console.error('Erreur fetch variant groups:', fetchError)
→ logger.error('Erreur fetch variant groups', fetchError instanceof Error ? fetchError : new Error(String(fetchError)), {
  operation: 'fetch_variant_groups',
  resource: 'variant_groups'
})

// Ligne 118
console.error('Erreur:', err)
→ logger.error('Erreur chargement groupes variantes', err instanceof Error ? err : new Error(String(err)), {
  operation: 'fetch_variant_groups_failed',
  resource: 'variant_groups'
})
```

**Validation** : `npm run build` après ce bloc

##### Bloc 2 : Create Group (1 console.log)
```typescript
// Ligne 173
console.error('Erreur création groupe:', err)
→ logger.error('Erreur création groupe variantes', err instanceof Error ? err : new Error(String(err)), {
  operation: 'create_variant_group',
  resource: 'variant_groups'
})
```

**Validation** : `npm run build`

##### Bloc 3 : Add Products to Group (3 console.log)
```typescript
// Ligne 283
console.error('Erreur update produit:', updateError)
→ logger.error('Erreur mise à jour produit', updateError instanceof Error ? updateError : new Error(String(updateError)), {
  operation: 'add_products_to_group',
  resource: 'products',
  productId: update.id
})

// Ligne 303
console.error('Erreur update count:', countError)
→ logger.error('Erreur mise à jour compteur groupe', countError instanceof Error ? countError : new Error(String(countError)), {
  operation: 'update_group_count',
  resource: 'variant_groups',
  variantGroupId: data.variant_group_id
})

// Ligne 314
console.error('Erreur ajout produits:', err)
→ logger.error('Erreur ajout produits au groupe', err instanceof Error ? err : new Error(String(err)), {
  operation: 'add_products_to_group_failed',
  resource: 'variant_groups',
  variantGroupId: data.variant_group_id
})
```

**Validation** : `npm run build`

##### Bloc 4 : Create Product in Group (5 console.log)
```typescript
// Ligne 405 - ❌ DONNÉES SENSIBLES (supplier_id)
console.log('🔄 Creating product in group with data:', {
  productName,
  groupId,
  hasCommonSupplier,
  supplierId,  // ❌ Ne pas logger
  willInheritSupplier
})
→ logger.info('Création produit dans groupe', {
  operation: 'create_product_in_group',
  resource: 'products',
  groupId,
  hasCommonSupplier
  // ❌ JAMAIS : supplierId, productName complet
})

// Ligne 419
console.error('❌ Erreur création produit:', createError)
→ logger.error('Erreur création produit dans groupe', createError instanceof Error ? createError : new Error(String(createError)), {
  operation: 'create_product_in_group_failed',
  resource: 'products',
  groupId
})

// Ligne 423
console.log('✅ Product created successfully:', createdProduct)
→ logger.info('Produit créé avec succès dans groupe', {
  operation: 'create_product_in_group_success',
  resource: 'products',
  productId: createdProduct?.[0]?.id,
  groupId
})

// Ligne 435
console.error('Erreur mise à jour compteur:', updateError)
→ logger.error('Erreur mise à jour compteur groupe', updateError instanceof Error ? updateError : new Error(String(updateError)), {
  operation: 'update_group_count',
  resource: 'variant_groups',
  groupId
})

// Ligne 445
console.error('Erreur createProductInGroup:', err)
→ logger.error('Erreur création produit dans groupe', err instanceof Error ? err : new Error(String(err)), {
  operation: 'create_product_in_group_exception',
  resource: 'products',
  groupId
})
```

**Validation** : `npm run build`

##### Bloc 5 : Update Product in Group (2 console.log)
```typescript
// Ligne 507
console.error('Erreur mise à jour produit:', updateError)
→ logger.error('Erreur mise à jour produit dans groupe', updateError instanceof Error ? updateError : new Error(String(updateError)), {
  operation: 'update_product_in_group',
  resource: 'products',
  productId
})

// Ligne 523
console.error('Erreur updateProductInGroup:', err)
→ logger.error('Erreur mise à jour produit dans groupe', err instanceof Error ? err : new Error(String(err)), {
  operation: 'update_product_in_group_failed',
  resource: 'products',
  productId
})
```

**Validation** : `npm run build`

##### Bloc 6 : Remove Product from Group (2 console.log)
```typescript
// Ligne 596
console.error('Erreur update count:', countError)
→ logger.error('Erreur mise à jour compteur après retrait', countError instanceof Error ? countError : new Error(String(countError)), {
  operation: 'remove_product_count_update',
  resource: 'variant_groups'
})

// Ligne 610
console.error('Erreur retrait produit:', err)
→ logger.error('Erreur retrait produit du groupe', err instanceof Error ? err : new Error(String(err)), {
  operation: 'remove_product_from_group_failed',
  resource: 'products',
  productId
})
```

**Validation** : `npm run build`

##### Bloc 7 : Delete Group (1 console.log)
```typescript
// Ligne 664
console.error('Erreur suppression groupe:', err)
→ logger.error('Erreur suppression groupe variantes', err instanceof Error ? err : new Error(String(err)), {
  operation: 'delete_variant_group',
  resource: 'variant_groups',
  groupId
})
```

**Validation** : `npm run build`

##### Bloc 8 : Update Variant Group (8 console.log) ⚠️ SENSIBLE
```typescript
// Ligne 701 - ❌ DONNÉES BUSINESS SENSIBLES (updateData)
console.log('🔄 Updating variant group with data:', {
  groupId,
  updateData  // ❌ Contient prix, fournisseurs, dimensions
})
→ logger.info('Mise à jour groupe variantes', {
  operation: 'update_variant_group',
  resource: 'variant_groups',
  groupId
  // ❌ JAMAIS : updateData complet (prix, fournisseurs)
})

// Ligne 714 - ❌ ERREUR SUPABASE SENSIBLE
console.error('❌ Supabase update error:', {
  message: updateError.message,
  details: updateError.details,
  hint: updateError.hint,
  code: updateError.code,
  updateData  // ❌ Ne pas logger
})
→ logger.error('Erreur mise à jour groupe variantes', new Error(updateError.message), {
  operation: 'update_variant_group_failed',
  resource: 'variant_groups',
  groupId,
  errorCode: updateError.code
  // ❌ JAMAIS : updateData, details complets
})

// Ligne 729
console.log('✅ Variant group updated successfully:', updatedGroup)
→ logger.info('Groupe variantes mis à jour', {
  operation: 'update_variant_group_success',
  resource: 'variant_groups',
  groupId: updatedGroup?.[0]?.id
})

// Ligne 735 - ❌ SUPPLIER_ID SENSIBLE
console.log('🔄 Propagating supplier to products:', {
  groupId,
  supplierId  // ❌ Ne pas logger
})
→ logger.info('Propagation fournisseur aux produits', {
  operation: 'propagate_supplier_to_products',
  resource: 'products',
  groupId
  // ❌ JAMAIS : supplierId
})

// Ligne 746
console.error('❌ Erreur propagation fournisseur aux produits:', supplierPropagationError)
→ logger.error('Erreur propagation fournisseur', supplierPropagationError instanceof Error ? supplierPropagationError : new Error(String(supplierPropagationError)), {
  operation: 'propagate_supplier_failed',
  resource: 'products',
  groupId
})

// Ligne 748
console.log('✅ Supplier propagated to products')
→ logger.info('Fournisseur propagé aux produits', {
  operation: 'propagate_supplier_success',
  resource: 'products',
  groupId
})

// Ligne 816
console.error('Erreur propagation dimensions aux produits:', productsError)
→ logger.error('Erreur propagation dimensions', productsError instanceof Error ? productsError : new Error(String(productsError)), {
  operation: 'propagate_dimensions_failed',
  resource: 'products',
  groupId
})

// Ligne 830
console.error('❌ Exception during variant group update:', err)
→ logger.error('Exception mise à jour groupe variantes', err instanceof Error ? err : new Error(String(err)), {
  operation: 'update_variant_group_exception',
  resource: 'variant_groups',
  groupId
})
```

**Validation** : `npm run build` (CRITIQUE après ce bloc)

##### Bloc 9 : Available Products (1 console.log)
```typescript
// Ligne 857
console.error('Erreur fetch produits disponibles:', error)
→ logger.error('Erreur fetch produits disponibles', error instanceof Error ? error : new Error(String(error)), {
  operation: 'get_available_products',
  resource: 'products'
})
```

**Validation** : `npm run build`

##### Bloc 10 : Archive/Restore (4 console.log)
```typescript
// Ligne 913
console.error('Erreur archivage groupe:', err)
→ logger.error('Erreur archivage groupe variantes', err instanceof Error ? err : new Error(String(err)), {
  operation: 'archive_variant_group',
  resource: 'variant_groups',
  groupId
})

// Ligne 987
console.error('Erreur restauration groupe:', err)
→ logger.error('Erreur restauration groupe variantes', err instanceof Error ? err : new Error(String(err)), {
  operation: 'unarchive_variant_group',
  resource: 'variant_groups',
  groupId
})

// Ligne 1007
console.error('Erreur chargement groupes archivés:', fetchError)
→ logger.error('Erreur chargement groupes archivés', fetchError instanceof Error ? fetchError : new Error(String(fetchError)), {
  operation: 'load_archived_variant_groups',
  resource: 'variant_groups'
})

// Ligne 1054
console.error('Erreur:', err)
→ logger.error('Erreur chargement groupes archivés', err instanceof Error ? err : new Error(String(err)), {
  operation: 'load_archived_variant_groups_failed',
  resource: 'variant_groups'
})
```

**Validation** : `npm run build`

##### Bloc 11 : Product Variant Editing (2 console.log)
```typescript
// Ligne 1110
console.error('Erreur mise à jour prix:', err)
→ logger.error('Erreur mise à jour prix produit', err instanceof Error ? err : new Error(String(err)), {
  operation: 'update_product_price',
  resource: 'products',
  productId
})

// Ligne 1200
console.error('Erreur mise à jour attribut:', err)
→ logger.error('Erreur mise à jour attribut variante', err instanceof Error ? err : new Error(String(err)), {
  operation: 'update_product_variant_attribute',
  resource: 'products',
  productId,
  attributeKey
})
```

**Validation** : `npm run build`

---

## ✅ VALIDATION FINALE

### 1. Vérification console.log = 0
```bash
# use-contacts.ts
grep -c "console\." src/hooks/use-contacts.ts
# → 0 ✅

# use-product-images.ts
grep -c "console\." src/hooks/use-product-images.ts
# → 0

# use-collection-images.ts
grep -c "console\." src/hooks/use-collection-images.ts
# → 0

# use-variant-groups.ts
grep -c "console\." src/hooks/use-variant-groups.ts
# → 0

# GLOBAL CHECK
grep -r "console\." src/hooks/use-contacts.ts src/hooks/use-variant-groups.ts src/hooks/use-product-images.ts src/hooks/use-collection-images.ts
# → Aucun résultat ✅
```

### 2. Build Production
```bash
npm run build
# → ✅ SUCCESS (0 erreurs TypeScript)
```

### 3. Test Manuel Dashboard
```bash
# Démarrer dev server
npm run dev

# Tester opérations critiques :
# 1. Créer un contact → Vérifier logger.info dans terminal
# 2. Upload image produit → Vérifier logger.info
# 3. Créer groupe variantes → Vérifier logger.info
# 4. Vérifier AUCUNE donnée PII/Business dans logs
```

---

## 🚨 RÈGLES ABSOLUES

### ❌ JAMAIS LOGGER
- `email`, `phone`, `mobile`, `secondary_email`, `direct_line`
- `cost_price`, `price`, `product.price`
- `supplier_id` (valeur), `supplier.name`
- `storage_path`, `public_url` (URLs complètes)
- `updateData` (objets complets avec données business)
- `variant_attributes` (attributs sensibles)

### ✅ TOUJOURS LOGGER
- IDs uniquement (`productId`, `contactId`, `groupId`, `imageId`)
- Noms d'opérations (`operation: 'create_contact'`)
- Resources (`resource: 'contacts'`)
- Status (`success: true/false`)
- Error codes (`errorCode: error.code`)

---

## 📊 CHECKLIST FINALE

- [ ] use-contacts.ts : 0 console.log (✅ DÉJÀ FAIT)
- [ ] use-product-images.ts : 0 console.log
- [ ] use-collection-images.ts : 0 console.log
- [ ] use-variant-groups.ts : 0 console.log
- [ ] `npm run build` : 0 erreurs
- [ ] Tests manuels : logger.info visible, AUCUNE donnée PII
- [ ] Commit : "🔒 SEC: Migration logger.ts 79 console.log → 0 PII exposées"
- [ ] Déploiement production avec logger.ts actif

---

**Auteur** : Vérone Security Auditor
**Date** : 8 Octobre 2025
**Prochaine étape** : use-product-images.ts (15 console.log - 30 min)
