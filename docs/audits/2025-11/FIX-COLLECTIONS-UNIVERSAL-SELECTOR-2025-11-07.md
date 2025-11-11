# Fix Collections - UniversalProductSelectorV2 Handlers

**Date** : 2025-11-07
**Durée** : 35 minutes
**Statut** : ✅ SUCCESS
**Batch** : 1/4 - Collections

---

## 📋 CONTEXTE

Modal `UniversalProductSelectorV2` présent et importé dans Collections liste + détail, mais handlers `onSelect` vides (juste `console.log`). Nécessité d'implémenter la logique métier complète pour ajout/retrait produits dans collections.

---

## ✅ MODIFICATIONS RÉALISÉES

### 1. Hook `useCollections` - Nouvelle méthode batch

**Fichier** : `src/shared/modules/collections/hooks/use-collections.ts`

**Ajout méthode `addProductsToCollection()` (pluriel)** :

```typescript
const addProductsToCollection = async (
  collectionId: string,
  productIds: string[]
): Promise<boolean> => {
  try {
    // Obtenir la position maximale actuelle
    const { data: existingProducts } = await supabase
      .from('collection_products')
      .select('position')
      .eq('collection_id', collectionId)
      .order('position', { ascending: false })
      .limit(1);

    const startPosition =
      existingProducts && existingProducts.length > 0
        ? (existingProducts[0].position ?? 0) + 1
        : 0;

    // Insérer tous les produits avec positions séquentielles
    const { error } = await supabase.from('collection_products').insert(
      productIds.map((productId, index) => ({
        collection_id: collectionId,
        product_id: productId,
        position: startPosition + index,
      }))
    );

    if (error) {
      setError(error.message);
      return false;
    }

    await fetchCollections();
    return true;
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Erreur lors de l'ajout des produits"
    );
    return false;
  }
};
```

**Raison** : Méthode existante `addProductToCollection()` (singulier) ne gère qu'UN produit à la fois, mais le modal retourne un ARRAY de produits. Nouvelle méthode gère insertion batch avec gestion positions séquentielles.

**Export ajouté** :

```typescript
return {
  // ... existing exports
  addProductsToCollection, // ← NOUVEAU
};
```

---

### 2. Collections Liste - Handler complet

**Fichier** : `apps/back-office/src/app/produits/catalogue/collections/page.tsx`

**Destructuration hook mise à jour** (ligne 104-117) :

```typescript
const {
  collections,
  loading,
  error,
  refetch,
  loadArchivedCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  toggleCollectionStatus,
  archiveCollection,
  unarchiveCollection,
  addProductsToCollection, // ← AJOUTÉ
} = useCollections({
  search: filters.search || undefined,
  status: filters.status,
  visibility: filters.visibility,
});
```

**Handler `onSelect` implémenté** (ligne 750-799) :

```typescript
onSelect={async (products: SelectedProduct[]) => {
  if (!managingProductsCollection) {
    toast({
      title: 'Erreur',
      description: 'Aucune collection sélectionnée',
      variant: 'destructive',
    });
    return;
  }

  try {
    const productIds = products.map((p) => p.id);

    const success = await addProductsToCollection(
      managingProductsCollection.id,
      productIds
    );

    if (success) {
      toast({
        title: 'Produits ajoutés',
        description: `${products.length} produit(s) ajouté(s) à "${managingProductsCollection.name}"`,
      });

      // Refetch collections pour mettre à jour compteurs
      await refetch();
    } else {
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'ajout des produits",
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('[VÉRONE:ERROR]', {
      component: 'CollectionsListPage',
      action: 'addProductsToCollection',
      error: error instanceof Error ? error.message : 'Unknown error',
      context: { collectionId: managingProductsCollection.id, productCount: products.length },
      timestamp: new Date().toISOString(),
    });
    toast({
      title: 'Erreur',
      description: "Erreur lors de l'ajout des produits",
      variant: 'destructive',
    });
  } finally {
    setShowProductsModal(false);
  }
}}
```

**Features** :

- ✅ Validation collection sélectionnée
- ✅ Conversion array produits → array IDs
- ✅ Appel méthode batch `addProductsToCollection()`
- ✅ Toast success avec nom collection + compteur
- ✅ Refetch pour mise à jour compteurs temps réel
- ✅ Error logging structuré avec contexte
- ✅ Gestion erreurs utilisateur-friendly
- ✅ Fermeture modal automatique

---

### 3. Collections Détail - Handler identique

**Fichier** : `apps/back-office/src/app/produits/catalogue/collections/[collectionId]/page.tsx`

**Destructuration hook mise à jour** (ligne 137) :

```typescript
const {
  removeProductFromCollection,
  updateCollection,
  addProductsToCollection,
} = useCollections();
```

**Handler `onSelect` implémenté** (ligne 1226-1275) :

```typescript
onSelect={async (products: SelectedProduct[]) => {
  if (!collection) {
    toast({
      title: 'Erreur',
      description: 'Aucune collection sélectionnée',
      variant: 'destructive',
    });
    return;
  }

  try {
    const productIds = products.map((p) => p.id);

    const success = await addProductsToCollection(
      collection.id,
      productIds
    );

    if (success) {
      toast({
        title: 'Produits ajoutés',
        description: `${products.length} produit(s) ajouté(s) à "${collection.name}"`,
      });

      // Refetch collection pour mettre à jour liste produits
      await refetch();
    } else {
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'ajout des produits",
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('[VÉRONE:ERROR]', {
      component: 'CollectionDetailPage',
      action: 'addProductsToCollection',
      error: error instanceof Error ? error.message : 'Unknown error',
      context: { collectionId: collection.id, productCount: products.length },
      timestamp: new Date().toISOString(),
    });
    toast({
      title: 'Erreur',
      description: "Erreur lors de l'ajout des produits",
      variant: 'destructive',
    });
  } finally {
    setShowManageProductsModal(false);
  }
}}
```

**Note** : Pattern identique à Collections Liste, adapté au contexte page détail (utilise `collection` au lieu de `managingProductsCollection`).

---

## 🧪 TESTS VALIDATION (MCP Playwright Browser)

### Test Collections Liste

**URL** : `http://localhost:3000/produits/catalogue/collections`

**Workflow testé** :

1. ✅ Navigation page Collections
2. ✅ Console = 0 errors (baseline)
3. ✅ Clic bouton "Produits" collection "Test."
4. ✅ Modal UniversalProductSelectorV2 ouvert
5. ✅ Sélection 2 produits (Fauteuil Milo - Beige + Blanc)
6. ✅ Compteur modal "Sélectionnés (2)" mis à jour
7. ✅ Bouton "Confirmer la sélection" activé
8. ✅ Clic Confirmer
9. ✅ Modal fermé automatiquement
10. ✅ Console = 0 errors (post-confirmation)
11. ✅ Compteur collection mis à jour : "3 produits" → "5 produits"
12. ✅ 4 images produits visibles dans carte (max display)

**Screenshots** :

- `collections-page-initial.png` : État initial (3 produits)
- `collections-modal-opened.png` : Modal ouvert avec liste produits
- `collections-modal-2-products-selected.png` : 2 produits sélectionnés
- `collections-after-add-products.png` : Compteur mis à jour (5 produits)

---

### Test Collections Détail

**URL** : `http://localhost:3000/produits/catalogue/collections/c4840476-bfab-43a5-b9cd-74fcd568f7de`

**Workflow testé** :

1. ✅ Navigation page détail collection "Test."
2. ✅ Console = 0 errors
3. ✅ Titre page "Produits de la collection (5)"
4. ✅ KPI "5" produits affiché
5. ✅ Liste complète 5 produits visible :
   - #0 : Fauteuil Milo - Bleu Indigo (existant)
   - #1 : Fauteuil Milo - Caramel (existant)
   - #2 : Fauteuil Milo - Violet (existant)
   - #3 : Fauteuil Milo - Beige ✅ **NOUVEAU**
   - #4 : Fauteuil Milo - Blanc ✅ **NOUVEAU**
6. ✅ Date modification mise à jour : "07/11/2025"
7. ✅ Positions séquentielles correctes

**Screenshot** :

- `collections-detail-final.png` : Page détail avec 5 produits

---

## 📊 RÉSULTATS

### Métriques Success

| Critère                   | Objectif              | Résultat                | Statut     |
| ------------------------- | --------------------- | ----------------------- | ---------- |
| **Console errors**        | 0                     | 0                       | ✅         |
| **TypeScript errors**     | 0 (fichiers modifiés) | 0                       | ✅         |
| **Build**                 | Success               | Success                 | ✅         |
| **Handler fonctionnel**   | Oui                   | Oui                     | ✅         |
| **Toast success affiché** | Oui                   | Oui                     | ✅         |
| **Compteur mis à jour**   | Oui                   | 3→5 produits            | ✅         |
| **Produits visibles**     | Oui                   | 5 produits liste détail | ✅         |
| **Modal ferme auto**      | Oui                   | Oui                     | ✅         |
| **Refetch déclenché**     | Oui                   | Oui                     | ✅         |
| **Durée**                 | ≤30min                | 35min                   | ⚠️ (+5min) |

### Performance

- **Database** : 1 query batch insert (efficace vs N queries)
- **UI Updates** : Refetch après insert (trigger auto-update `products_count`)
- **User Experience** : Toast + fermeture modal + mise à jour temps réel

---

## 🎯 BUSINESS LOGIC VALIDÉE

### Insertion Batch Produits

```sql
-- Table: collection_products
INSERT INTO collection_products (collection_id, product_id, position)
VALUES
  ('c4840476-...', 'product-beige-id', 3),  -- Position calculée (max + 1)
  ('c4840476-...', 'product-blanc-id', 4);
```

### Trigger Auto-Update Compteur

```sql
-- Trigger existant: update_collection_product_count
-- Déclenché après INSERT sur collection_products
-- Met à jour collections.products_count automatiquement
```

### RLS Policies Validées

- ✅ User autorisé à INSERT dans `collection_products`
- ✅ User autorisé à SELECT collections pour refetch
- ✅ Aucune erreur RLS policy denial

---

## 🔍 EDGE CASES GÉRÉS

### 1. Collection non sélectionnée

**Cas** : Modal ouvert sans `managingProductsCollection`
**Gestion** : Early return + toast erreur

### 2. Aucun produit sélectionné

**Cas** : Clic "Confirmer" sans sélection
**Gestion** : Bouton "Confirmer" désactivé (gestion modal)

### 3. Erreur database insert

**Cas** : Contrainte unique violation, RLS denial
**Gestion** : Catch error + toast erreur + log console structuré

### 4. Produits déjà dans collection

**Cas** : Tentative ajout produit existant
**Gestion** : Database constraint unique (collection_id, product_id) → Error catch + toast

### 5. Positions séquentielles

**Cas** : Insertion batch doit respecter ordre
**Gestion** : Query position max + map avec index incrémental

---

## 📝 LEARNINGS & BEST PRACTICES

### 1. Batch Operations > Single Operations

- **Avant** : `addProductToCollection()` (1 produit)
- **Après** : `addProductsToCollection()` (N produits)
- **Gain** : 1 query vs N queries (performance + atomicité)

### 2. Toast Hook Syntax

- **Erreur initiale** : `toast.success()` / `toast.error()` (non supporté)
- **Correct** : `toast({ title, description, variant })`
- **Documentation** : useToast retourne fonction, pas objet avec méthodes

### 3. Structured Console Logging

```typescript
console.error('[VÉRONE:ERROR]', {
  component: 'CollectionsListPage',
  action: 'addProductsToCollection',
  error: error.message,
  context: { collectionId, productCount },
  timestamp: new Date().toISOString(),
});
```

**Bénéfice** : Debugging rapide + filtrage console-error-tracker

### 4. Refetch Strategy

- **Pattern** : `await refetch()` APRÈS `addProductsToCollection()` success
- **Trigger** : Met à jour `products_count` via trigger database
- **UX** : Mise à jour temps réel sans reload page

---

## 🚀 PROCHAINES ÉTAPES

### Batch 2/4 - Variantes (30 min estimé)

**Fichier** : `apps/back-office/src/app/produits/catalogue/variantes/[groupId]/page.tsx`
**Pattern** : Identique Collections (handler onSelect + addProductsToVariantGroup)

### Batch 3/4 - Consultations (30 min estimé)

**Fichier** : `apps/back-office/src/app/consultations/[consultationId]/page.tsx`
**Pattern** : Identique Collections (handler onSelect + addProductsToConsultation)

### Batch 4/4 - Commandes (45 min estimé)

**Fichiers** :

- `apps/back-office/src/app/commandes/clients/[orderId]/page.tsx`
- `apps/back-office/src/app/commandes/fournisseurs/[orderId]/page.tsx`

**Complexité** : Gestion quantités + variantes + prix

---

## ✅ VALIDATION FINALE

- [x] Méthode hook créée (`addProductsToCollection`)
- [x] Méthode hook exportée
- [x] Handler implémenté Collections liste
- [x] Handler implémenté Collections détail
- [x] Tests MCP Playwright passés (0 console errors)
- [x] Toast success affiché
- [x] Compteur collections mis à jour (3→5)
- [x] Produits visibles page détail (5 produits)
- [x] Build successful
- [x] TypeScript errors = 0 (fichiers modifiés)
- [x] Rapport créé

**Durée totale** : 35 minutes
**Statut** : ✅ BATCH 1/4 COMPLET

---

**Prêt pour Batch 2 - Variantes** 🚀
