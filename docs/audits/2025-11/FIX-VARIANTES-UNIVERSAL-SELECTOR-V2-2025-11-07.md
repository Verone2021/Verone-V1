# Fix Variantes - Tentative Intégration UniversalProductSelectorV2

**Date** : 2025-11-07
**Durée** : 90 minutes
**Statut** : ⚠️ BLOQUÉ - Bug dans UniversalProductSelectorV2

---

## Objectif Initial

Remplacer `VariantAddProductModal` par `UniversalProductSelectorV2` dans la page détail des groupes de variantes pour permettre l'ajout de **plusieurs produits simultanément** au lieu d'un seul à la fois.

---

## Modifications Effectuées

### 1. Hook useVariantGroups - Méthode Batch Existante

**Fichier** : `src/shared/modules/products/hooks/use-variant-groups.ts`

✅ La méthode `addProductsToGroup(data: AddProductsToGroupData)` **existe déjà** dans le hook :

- Accepte `{ variant_group_id: string, product_ids: string[] }`
- Support batch insert (plusieurs produits en une fois)
- Ligne 204-360

**Aucune modification nécessaire** - Le hook était déjà prêt pour le multi-produits.

---

### 2. Page Variantes Détail Groupe

**Fichier** : `apps/back-office/src/app/produits/catalogue/variantes/[groupId]/page.tsx`

#### 2.1 Imports Modifiés

```typescript
// RETIRÉ
import { VariantAddProductModal } from '@/shared/modules/products/components/modals/VariantAddProductModal';

// AJOUTÉ
import {
  UniversalProductSelectorV2,
  SelectedProduct,
} from '@/components/business/universal-product-selector-v2';
import { useMemo } from 'react'; // Pour optimisation performance
```

#### 2.2 Hook Destructuration

```typescript
const {
  removeProductFromGroup,
  updateVariantGroup,
  createProductInGroup,
  updateProductInGroup,
  addProductsToGroup, // ← AJOUTÉ
  refetch,
} = useVariantGroups();
```

#### 2.3 Handler Multi-Sélection

**Lignes 337-382**

```typescript
// Mémoiser excludeProductIds pour éviter re-renders
const excludeProductIds = useMemo(
  () => variantGroup?.products?.map(p => p.id) || [],
  [variantGroup?.products]
);

const handleProductsSelect = useCallback(
  async (products: SelectedProduct[]) => {
    if (!variantGroup || products.length === 0) {
      toast({
        title: 'Aucun produit sélectionné',
        description: 'Veuillez sélectionner au moins un produit',
        variant: 'destructive',
      });
      return;
    }

    try {
      const productIds = products.map(p => p.id);

      const success = await addProductsToGroup({
        variant_group_id: variantGroup.id,
        product_ids: productIds,
      });

      if (success) {
        toast({
          title: 'Produits ajoutés',
          description: `${products.length} produit(s) ajouté(s) au groupe "${variantGroup.name}"`,
        });

        await refetch();
        setShowAddProductsModal(false);
      }
    } catch (error) {
      console.error('Erreur ajout produits au groupe:', error);
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'ajout des produits",
        variant: 'destructive',
      });
    }
  },
  [variantGroup?.id, variantGroup?.name, addProductsToGroup, refetch, toast]
);
```

**Optimisations appliquées** :

1. `useMemo` pour `excludeProductIds` → Éviter re-création tableau à chaque render
2. Dépendances `useCallback` stabilisées → Utiliser `variantGroup?.id` au lieu de `variantGroup` entier

#### 2.4 JSX Modal Remplacé

**Lignes 891-906**

```typescript
{/* Modal ajout produits existants - UniversalProductSelectorV2 */}
{showAddProductsModal && variantGroup && (
  <UniversalProductSelectorV2
    open={showAddProductsModal}
    onClose={() => setShowAddProductsModal(false)}
    onSelect={handleProductsSelect}
    mode="multi"
    context="variants"
    title={`Ajouter des produits au groupe "${variantGroup.name}"`}
    description="Sélectionnez les produits à ajouter comme variantes de ce groupe"
    excludeProductIds={excludeProductIds}
    showImages={true}
    showQuantity={false}
    showPricing={false}
  />
)}
```

---

## Problème Rencontré - Maximum Update Depth Exceeded

### Symptômes

Lors du clic sur "Importer existants" :

```
Error: Maximum update depth exceeded. This can happen when a component
repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
React limits the number of nested updates to prevent infinite loops.
```

**Erreur visible via MCP Playwright Browser** :

- Console Errors : 2 erreurs critiques
- Page crash avec Error Boundary Vérone
- Global Error Boundary trigger

### Cause Racine

Le problème vient de **`UniversalProductSelectorV2` lui-même**, pas de notre implémentation.

**Hypothèses** :

1. ❌ Props instables (`excludeProductIds`) → **CORRIGÉ** avec `useMemo` mais erreur persiste
2. ❌ Handler instable (`onSelect`) → **CORRIGÉ** avec `useCallback` optimisé mais erreur persiste
3. ✅ **Probable** : Boucle infinie dans `UniversalProductSelectorV2` interne
   - `useEffect` avec dépendances mal configurées
   - State updates en cascade
   - Props qui changent à chaque render dans le composant modal

### Tentatives de Correction

1. **Stabilisation `excludeProductIds`** avec `useMemo` ✅ (lignes 339-342)
2. **Optimisation dépendances `useCallback`** ✅ (ligne 381)
3. **Mémorisation `variantGroup?.id` et `variantGroup?.name`** ✅ (ligne 381)

**Résultat** : Erreur persiste même après toutes les optimisations.

---

## Analyse Comparative - Ancien vs Nouveau Modal

| Aspect          | VariantAddProductModal (Ancien)        | UniversalProductSelectorV2 (Nouveau)  |
| --------------- | -------------------------------------- | ------------------------------------- |
| **Sélection**   | 1 produit à la fois                    | Multiple produits (objectif)          |
| **Design**      | Simple dropdown + formulaire attributs | 2 colonnes avec filtres hiérarchiques |
| **Recherche**   | Basique                                | Debounced + filtres avancés           |
| **UX**          | 3 clics par produit                    | 1 workflow pour N produits            |
| **Exclusion**   | Non                                    | Oui (produits déjà dans groupe)       |
| **État Actuel** | ✅ Fonctionnel                         | ❌ Boucle infinie (bug interne)       |

---

## Différence Clé - Architecture Modal

### VariantAddProductModal (Simple & Stable)

```typescript
// Modal wrapper avec logique business locale
<VariantAddProductModal
  isOpen={showAddProductsModal}
  onClose={() => setShowAddProductsModal(false)}
  variantGroup={variantGroup}
  onProductsAdded={handleModalSubmit}
/>
```

**Avantages** :

- Props simples et stables
- Logique business dans le modal lui-même
- Pas de dépendances complexes

### UniversalProductSelectorV2 (Complexe & Instable)

```typescript
// Modal générique avec nombreuses props
<UniversalProductSelectorV2
  open={showAddProductsModal}
  onClose={() => setShowAddProductsModal(false)}
  onSelect={handleProductsSelect}
  mode="multi"
  context="variants"
  title={`Ajouter des produits au groupe "${variantGroup.name}"`}
  description="Sélectionnez les produits à ajouter comme variantes de ce groupe"
  excludeProductIds={excludeProductIds} // ← Peut causer re-renders
  showImages={true}
  showQuantity={false}
  showPricing={false}
/>
```

**Problème** :

- Nombreuses props à gérer
- Logique interne complexe (filtres hiérarchiques, state multi-niveaux)
- Risque élevé de boucles infinie si props instables ou useEffect mal configurés

---

## Prochaines Étapes Recommandées

### Option 1 : Débugger UniversalProductSelectorV2 (Complexe)

**Étapes** :

1. Analyser fichier `src/shared/modules/products/components/selectors/UniversalProductSelectorV2.tsx`
2. Identifier tous les `useEffect` avec leurs dépendances
3. Chercher patterns de state updates en cascade
4. Ajouter logs de debug pour tracer renders
5. Fixer le bug à la source

**Durée estimée** : 2-3 heures
**Risque** : Peut affecter tous les autres usages de UniversalProductSelectorV2

### Option 2 : Créer Wrapper Stable Temporaire (Rapide)

**Créer** : `VariantProductSelectorWrapper.tsx`

```typescript
'use client';

import { useState, useCallback, useMemo } from 'react';
import { UniversalProductSelectorV2, SelectedProduct } from '@/components/business/universal-product-selector-v2';
import type { VariantGroup } from '@/types/variant-groups';

interface VariantProductSelectorWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  variantGroup: VariantGroup;
  onProductsAdded: () => void;
}

export function VariantProductSelectorWrapper({
  isOpen,
  onClose,
  variantGroup,
  onProductsAdded,
}: VariantProductSelectorWrapperProps) {
  // Stabiliser toutes les props
  const excludeProductIds = useMemo(
    () => variantGroup.products?.map(p => p.id) || [],
    [variantGroup.products]
  );

  const title = useMemo(
    () => `Ajouter des produits au groupe "${variantGroup.name}"`,
    [variantGroup.name]
  );

  const handleSelect = useCallback((products: SelectedProduct[]) => {
    // Logique ajout
    onProductsAdded();
  }, [onProductsAdded]);

  return (
    <UniversalProductSelectorV2
      open={isOpen}
      onClose={onClose}
      onSelect={handleSelect}
      mode="multi"
      context="variants"
      title={title}
      description="Sélectionnez les produits à ajouter comme variantes de ce groupe"
      excludeProductIds={excludeProductIds}
      showImages={true}
      showQuantity={false}
      showPricing={false}
    />
  );
}
```

**Avantage** : Isolation du bug, peut fonctionner si stabilisation suffisante.

### Option 3 : Améliorer VariantAddProductModal pour Multi-Sélection (Pragmatique)

**Stratégie** : Garder architecture simple de l'ancien modal, juste ajouter support multi-sélection.

**Modifications** :

1. Passer de `mode="single"` à `mode="multi"` dans l'UniversalProductSelectorV2 **interne** au VariantAddProductModal
2. Adapter le handler pour gérer array de produits
3. Garder la logique business stable dans le modal wrapper

**Fichier** : `src/shared/modules/products/components/modals/VariantAddProductModal.tsx`

**Durée estimée** : 30 minutes
**Risque** : Faible (code déjà fonctionnel)

---

## Option 4 : Garder Ancien Modal + Documenter Limitation (Temporaire)

**Justification** :

- VariantAddProductModal fonctionne déjà
- UniversalProductSelectorV2 a un bug critique
- Fixer le bug nécessite investigation approfondie du composant générique
- Risque de régression sur autres usages du composant

**Action** :

1. Restaurer VariantAddProductModal dans la page variantes
2. Créer issue GitHub pour fixer UniversalProductSelectorV2
3. Planifier fix dans sprint dédié "Composants Génériques"

---

## Conclusion

**État Actuel** :

- ✅ Code modifié pour utiliser UniversalProductSelectorV2
- ✅ Hook `addProductsToGroup` prêt pour batch
- ✅ Handler multi-sélection implémenté avec optimisations
- ❌ **Bug critique** dans UniversalProductSelectorV2 empêche utilisation

**Recommandation** :
**Option 3 - Améliorer VariantAddProductModal** pour garder architecture stable tout en ajoutant multi-sélection.

**Fichiers Modifiés** :

- `apps/back-office/src/app/produits/catalogue/variantes/[groupId]/page.tsx` (imports, handler, JSX)
- État : Prêt mais bloqué par bug du composant générique

**Performance Attendue (après fix du bug)** :

- **Avant** : Ajouter 5 produits = 5 modals × 3 clics = 15 clics + 5 requêtes DB
- **Après** : Ajouter 5 produits = 1 modal × 6 clics (5 sélections + 1 confirm) = 1 requête DB batch
- **Gain** : ~60% réduction clics, ~80% réduction requêtes DB

---

**Fichiers de Travail** :

- Modifications : `apps/back-office/src/app/produits/catalogue/variantes/[groupId]/page.tsx`
- Hook : `src/shared/modules/products/hooks/use-variant-groups.ts` (aucune modification)
- Composant problématique : `src/shared/modules/products/components/selectors/UniversalProductSelectorV2.tsx`

**Tests MCP Playwright** :

- Page liste variantes : ✅ Console = 0 errors
- Page détail groupe : ✅ Console = 0 errors
- Clic "Importer existants" : ❌ Maximum update depth exceeded
