# Audit UniversalProductSelectorV2 - État des Lieux Complet

**Date** : 2025-11-07
**Auditeur** : Vérone Debugger
**Contexte** : Rapport utilisateur - Modal UniversalProductSelectorV2 (2 colonnes) ne fonctionne NULLE PART
**Scope** : 8 pages analysées (Collections, Variantes, Commandes Clients, Commandes Fournisseurs)

---

## 📊 RÉSUMÉ EXÉCUTIF

| Page                                                           | Import | JSX | Handler | Catégorie | Statut                   | Priorité |
| -------------------------------------------------------------- | ------ | --- | ------- | --------- | ------------------------ | -------- |
| Collections (liste) `/produits/catalogue/collections`          | ✅     | ✅  | ❌ TODO | **B**     | Non connecté             | P1       |
| Collections (détail) `/produits/catalogue/collections/[id]`    | ✅     | ✅  | ❌ TODO | **B**     | Non connecté             | P1       |
| Variantes (liste) `/produits/catalogue/variantes`              | ❌     | ❌  | ❌      | **A**     | ABSENT                   | P0       |
| Variantes (détail) `/produits/catalogue/variantes/[id]`        | ❌     | ❌  | ❌      | **A**     | ABSENT                   | P0       |
| Commandes Clients (liste) `/commandes/clients`                 | ❌     | ❌  | ❌      | **A**     | ABSENT                   | P0       |
| Commandes Clients (détail) `/commandes/clients/[id]`           | ❌     | N/A | N/A     | **D**     | N/A (pas de page détail) | N/A      |
| Commandes Fournisseurs (liste) `/commandes/fournisseurs`       | ❌     | ❌  | ❌      | **A**     | ABSENT                   | P0       |
| Commandes Fournisseurs (détail) `/commandes/fournisseurs/[id]` | ❌     | N/A | N/A     | **D**     | N/A (pas de page détail) | N/A      |

### Synthèse Urgence

- **❌ 2 pages Catégorie B (Non connecté)** : Collections liste + détail → Handler vide
- **❌ 4 pages Catégorie A (ABSENT)** : Variantes + Commandes → Modal totalement absent
- **✅ 2 pages N/A** : Pages détail commandes utilisent modals dédiés (pas besoin UniversalProductSelectorV2)

**CONCLUSION** : **6 pages sur 8 nécessitent intervention** (2 handlers à implémenter + 4 modals à ajouter)

---

## 🔍 DÉTAILS PAR PAGE

### 1. Collections - Liste (`/produits/catalogue/collections/page.tsx`)

**Import** : ✅

```typescript
// Ligne 31-33
import {
  UniversalProductSelectorV2,
  SelectedProduct,
} from '@/components/business/universal-product-selector-v2';
```

**Utilisation JSX** : ✅

```typescript
// Ligne 746-759
<UniversalProductSelectorV2
  open={showProductsModal}
  onClose={() => setShowProductsModal(false)}
  onSelect={async (products: SelectedProduct[]) => {
    // TODO: Implémenter ajout/retrait produits dans collection
    console.log('Produits sélectionnés:', products);
    await refetch();
  }}
  mode="multi"
  context="collections"
  selectedProducts={[]}
  showQuantity={false}
  showImages={true}
/>
```

**Handler** : ❌ TODO (ligne 750)

```typescript
❌ Handler vide
❌ Pas de logique ajout produits à collection
❌ Juste console.log puis refetch
```

**Diagnostic** : **Catégorie B - Modal présent mais NON CONNECTÉ**

**Action requise** : Implémenter handler `onSelect` avec logique métier

**Code à ajouter** :

```typescript
// 1. Vérifier que le hook useCollections expose addProductsToCollection()
// Dans src/shared/modules/collections/hooks/use-collections.ts

// 2. Remplacer handler ligne 749-753 par :
onSelect={async (products: SelectedProduct[]) => {
  if (!managingProductsCollection) {
    console.warn('Aucune collection sélectionnée pour ajout produits');
    return;
  }

  try {
    // Appel hook pour ajouter produits à collection
    await addProductsToCollection(
      managingProductsCollection.id,
      products.map(p => p.id)
    );

    toast({
      title: 'Produits ajoutés',
      description: `${products.length} produit(s) ajouté(s) à la collection`,
    });

    await refetch(); // Rafraîchir liste collections
    setShowProductsModal(false);
  } catch (error) {
    console.error('Erreur ajout produits:', error);
    toast({
      title: 'Erreur',
      description: 'Impossible d\'ajouter les produits',
      variant: 'destructive',
    });
  }
}}
```

**Fichiers à modifier** :

- `src/app/produits/catalogue/collections/page.tsx` (handler ligne 749)
- `src/shared/modules/collections/hooks/use-collections.ts` (ajouter méthode `addProductsToCollection` si manquante)

**Tests requis** :

1. Clic bouton "Produits" (carte collection) → Modal s'ouvre
2. Sélectionner 2-3 produits
3. Confirmer
4. Produits ajoutés visibles dans carte collection
5. Console = 0 errors
6. Refetch automatique fonctionne

---

### 2. Collections - Détail (`/produits/catalogue/collections/[collectionId]/page.tsx`)

**Import** : ✅

```typescript
// Ligne 33-35
import {
  UniversalProductSelectorV2,
  SelectedProduct,
} from '@/components/business/universal-product-selector-v2';
```

**Utilisation JSX** : ✅

```typescript
// Ligne 1220-1237
<UniversalProductSelectorV2
  open={showManageProductsModal}
  onClose={() => {
    setShowManageProductsModal(false);
    refetch();
  }}
  onSelect={async (products: SelectedProduct[]) => {
    // TODO: Implémenter ajout/retrait produits dans collection
    console.log('Produits sélectionnés:', products);
    await refetch();
  }}
  mode="multi"
  context="collections"
  selectedProducts={[]}
  showQuantity={false}
  showImages={true}
/>
```

**Handler** : ❌ TODO (ligne 1227)

**Diagnostic** : **Catégorie B - Modal présent mais NON CONNECTÉ**

**Action requise** : IDENTIQUE à Collections liste (même code à ajouter)

**Code à ajouter** :

```typescript
onSelect={async (products: SelectedProduct[]) => {
  if (!collection) {
    console.warn('Collection non chargée');
    return;
  }

  try {
    await addProductsToCollection(
      collection.id,
      products.map(p => p.id)
    );

    toast({
      title: 'Produits ajoutés',
      description: `${products.length} produit(s) ajouté(s) à la collection`,
    });

    await refetch();
    setShowManageProductsModal(false);
  } catch (error) {
    console.error('Erreur ajout produits:', error);
    toast({
      title: 'Erreur',
      description: 'Impossible d\'ajouter les produits',
      variant: 'destructive',
    });
  }
}}
```

**Fichiers à modifier** :

- `src/app/produits/catalogue/collections/[collectionId]/page.tsx` (handler ligne 1226)

**Tests requis** : Identiques Collections liste

---

### 3. Variantes - Liste (`/produits/catalogue/variantes/page.tsx`)

**Import** : ❌ ABSENT
**JSX** : ❌ ABSENT
**Handler** : ❌ ABSENT

**Diagnostic** : **Catégorie A - Modal TOTALEMENT ABSENT**

**Analyse code existant** :

```typescript
// Ligne 31 : Modal actuel VariantAddProductModal (OLD - un seul produit à la fois)
import { VariantAddProductModal } from '@/shared/modules/products/components/modals/VariantAddProductModal';

// Ligne 337 : Bouton "Ajouter" déclenche VariantAddProductModal
<ButtonV2
  size="sm"
  variant="outline"
  onClick={() => handleAddProducts(group)}
  icon={Plus}
  className="w-full"
  title="Ajouter des produits"
>
  Ajouter
</ButtonV2>

// Ligne 664-681 : Modal VariantAddProductModal (OLD)
<VariantAddProductModal
  isOpen={showAddProductsModal}
  onClose={() => {
    setShowAddProductsModal(false);
    setSelectedGroupForProducts(null);
  }}
  group={selectedGroupForProducts}
  onSubmit={async (data) => {
    refetch();
    toast({
      title: 'Produits ajoutés',
      description: 'Les produits ont été ajoutés au groupe avec succès',
    });
  }}
/>
```

**Action requise** : REMPLACER VariantAddProductModal par UniversalProductSelectorV2

**Code à ajouter** :

1. **Import** (ligne 31 - ajouter après VariantAddProductModal) :

```typescript
import {
  UniversalProductSelectorV2,
  SelectedProduct,
} from '@/components/business/universal-product-selector-v2';
```

2. **Remplacer modal** (ligne 664-681) :

```typescript
{/* Modal ajout produits - V2 Universel (multi-sélection) */}
{showAddProductsModal && selectedGroupForProducts && (
  <UniversalProductSelectorV2
    open={showAddProductsModal}
    onClose={() => {
      setShowAddProductsModal(false);
      setSelectedGroupForProducts(null);
    }}
    onSelect={async (products: SelectedProduct[]) => {
      if (!selectedGroupForProducts) {
        console.warn('Aucun groupe sélectionné');
        return;
      }

      try {
        // Ajouter tous les produits sélectionnés au groupe
        for (const product of products) {
          // Appel hook addProductToVariantGroup (à vérifier dans use-variant-groups.ts)
          await addProductToVariantGroup(
            product.id,
            selectedGroupForProducts.id
          );
        }

        toast({
          title: 'Produits ajoutés',
          description: `${products.length} produit(s) ajouté(s) au groupe`,
        });

        refetch();
        setShowAddProductsModal(false);
        setSelectedGroupForProducts(null);
      } catch (error) {
        console.error('Erreur ajout produits:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible d\'ajouter les produits',
          variant: 'destructive',
        });
      }
    }}
    mode="multi"
    context="variant_groups"
    selectedProducts={[]}
    showQuantity={false}
    showImages={true}
  />
)}
```

**Fichiers à modifier** :

- `src/app/produits/catalogue/variantes/page.tsx` (import + modal ligne 664-681)
- `src/shared/modules/products/hooks/use-variant-groups.ts` (vérifier méthode `addProductToVariantGroup`)

**Tests requis** :

1. Clic bouton "Ajouter" (carte groupe variante) → Modal V2 s'ouvre
2. Sélectionner 2-3 produits
3. Confirmer
4. Produits ajoutés visibles dans carte groupe
5. Console = 0 errors

---

### 4. Variantes - Détail Groupe (`/produits/catalogue/variantes/[groupId]/page.tsx`)

**Statut** : ❌ FICHIER N'EXISTE PAS

**Diagnostic** : **Catégorie A - Page détail variante groupe inexistante**

**Action requise** : CRÉER page détail groupe variante (FUTUR - hors scope actuel)

**Note** : La page liste variantes gère déjà toutes les actions (ajouter produits, éditer, supprimer). Page détail serait bonus pour affichage complet produits du groupe.

**Fichier à créer** :

- `src/app/produits/catalogue/variantes/[groupId]/page.tsx`

**Tests requis** : N/A (page non existante)

---

### 5. Commandes Clients - Liste (`/commandes/clients/page.tsx`)

**Import** : ❌ ABSENT
**JSX** : ❌ ABSENT
**Handler** : ❌ ABSENT

**Diagnostic** : **Catégorie A - Modal TOTALEMENT ABSENT**

**Analyse code existant** :

```typescript
// Ligne 14 : Modal actuel SalesOrderFormModal (création/édition commande)
import { SalesOrderFormModal } from '@/shared/modules/orders/components/modals/SalesOrderFormModal';

// Ligne 411-414 : Bouton création commande déclenche SalesOrderFormModal
<SalesOrderFormModal onSuccess={() => {
  fetchOrders()
  fetchStats()
}} />

// Ligne 762-779 : Modal édition commande (mode edit)
<SalesOrderFormModal
  mode="edit"
  orderId={editingOrderId}
  open={showEditModal}
  onOpenChange={(value) => {
    setShowEditModal(value)
    if (!value) {
      setEditingOrderId(null)
    }
  }}
  onSuccess={() => {
    setShowEditModal(false)
    setEditingOrderId(null)
    fetchOrders()
    fetchStats()
  }}
/>
```

**Action requise** : INTÉGRER UniversalProductSelectorV2 dans SalesOrderFormModal

**Note Importante** : UniversalProductSelectorV2 doit être utilisé DANS le formulaire SalesOrderFormModal (pas directement dans page.tsx)

**Code à ajouter** :

**Fichier** : `src/shared/modules/orders/components/modals/SalesOrderFormModal.tsx`

1. **Import** :

```typescript
import {
  UniversalProductSelectorV2,
  SelectedProduct,
} from '@/components/business/universal-product-selector-v2';
```

2. **État** :

```typescript
const [showProductSelector, setShowProductSelector] = useState(false);
const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
```

3. **Ajout JSX** (dans formulaire section produits) :

```typescript
{/* Bouton Ajouter produits */}
<ButtonV2
  type="button"
  variant="outline"
  onClick={() => setShowProductSelector(true)}
>
  <Plus className="h-4 w-4 mr-2" />
  Ajouter des produits
</ButtonV2>

{/* Modal sélection produits */}
<UniversalProductSelectorV2
  open={showProductSelector}
  onClose={() => setShowProductSelector(false)}
  onSelect={(products: SelectedProduct[]) => {
    setSelectedProducts(products);
    setShowProductSelector(false);

    // Ajouter produits au formulaire commande
    products.forEach(product => {
      // Logique ajout ligne commande (à implémenter selon structure formulaire)
      addOrderLine({
        product_id: product.id,
        quantity: product.quantity || 1,
        unit_price_ht: product.price || 0,
      });
    });
  }}
  mode="multi"
  context="sales_orders"
  selectedProducts={selectedProducts}
  showQuantity={true}
  showImages={true}
/>
```

**Fichiers à modifier** :

- `src/shared/modules/orders/components/modals/SalesOrderFormModal.tsx` (intégrer modal)
- `src/app/commandes/clients/page.tsx` (AUCUN CHANGEMENT - modal déjà utilisé)

**Tests requis** :

1. Clic bouton "Nouvelle commande" → Modal SalesOrderFormModal s'ouvre
2. Clic bouton "Ajouter des produits" → UniversalProductSelectorV2 s'ouvre
3. Sélectionner 2-3 produits avec quantités
4. Confirmer
5. Produits ajoutés aux lignes commande
6. Console = 0 errors

---

### 6. Commandes Clients - Détail (`/commandes/clients/[orderId]/page.tsx`)

**Statut** : ❌ FICHIER N'EXISTE PAS (mais modal détail existe)

**Diagnostic** : **Catégorie D - FONCTIONNEL via modal**

**Analyse code existant** :

```typescript
// Ligne 15 : Modal détail commande OrderDetailModal
import { OrderDetailModal } from '@/shared/modules/orders/components/modals/OrderDetailModal';

// Ligne 750-759 : Modal détail commande
<OrderDetailModal
  order={selectedOrder}
  open={showOrderDetail}
  onClose={() => setShowOrderDetail(false)}
  onUpdate={() => {
    fetchOrders()
    fetchStats()
  }}
/>
```

**Action requise** : AUCUNE (modal OrderDetailModal gère déjà affichage détail)

**Note** : Si besoin ajouter/modifier produits depuis détail commande, intégrer UniversalProductSelectorV2 dans OrderDetailModal (similaire SalesOrderFormModal)

**Tests requis** : N/A

---

### 7. Commandes Fournisseurs - Liste (`/commandes/fournisseurs/page.tsx`)

**Import** : ❌ ABSENT
**JSX** : ❌ ABSENT
**Handler** : ❌ ABSENT

**Diagnostic** : **Catégorie A - Modal TOTALEMENT ABSENT**

**Action requise** : IDENTIQUE Commandes Clients → Intégrer UniversalProductSelectorV2 dans PurchaseOrderFormModal

**Code à ajouter** :

**Fichier** : `src/shared/modules/orders/components/modals/PurchaseOrderFormModal.tsx`

1. **Import** :

```typescript
import {
  UniversalProductSelectorV2,
  SelectedProduct,
} from '@/components/business/universal-product-selector-v2';
```

2. **État** :

```typescript
const [showProductSelector, setShowProductSelector] = useState(false);
const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
```

3. **Ajout JSX** (dans formulaire section produits) :

```typescript
{/* Bouton Ajouter produits */}
<ButtonV2
  type="button"
  variant="outline"
  onClick={() => setShowProductSelector(true)}
>
  <Plus className="h-4 w-4 mr-2" />
  Ajouter des produits
</ButtonV2>

{/* Modal sélection produits */}
<UniversalProductSelectorV2
  open={showProductSelector}
  onClose={() => setShowProductSelector(false)}
  onSelect={(products: SelectedProduct[]) => {
    setSelectedProducts(products);
    setShowProductSelector(false);

    // Ajouter produits au formulaire commande
    products.forEach(product => {
      addOrderLine({
        product_id: product.id,
        quantity: product.quantity || 1,
        unit_price_ht: product.price || 0,
      });
    });
  }}
  mode="multi"
  context="purchase_orders"
  selectedProducts={selectedProducts}
  showQuantity={true}
  showImages={true}
/>
```

**Fichiers à modifier** :

- `src/shared/modules/orders/components/modals/PurchaseOrderFormModal.tsx` (intégrer modal)
- `src/app/commandes/fournisseurs/page.tsx` (AUCUN CHANGEMENT - modal déjà utilisé)

**Tests requis** : Identiques Commandes Clients

---

### 8. Commandes Fournisseurs - Détail (`/commandes/fournisseurs/[orderId]/page.tsx`)

**Statut** : ❌ FICHIER N'EXISTE PAS (mais modal détail existe)

**Diagnostic** : **Catégorie D - FONCTIONNEL via modal**

**Analyse code existant** :

```typescript
// Ligne 54 : Modal détail commande PurchaseOrderDetailModal
import { PurchaseOrderDetailModal } from '@/shared/modules/orders/components/modals/PurchaseOrderDetailModal';

// Ligne 757-767 : Modal détail commande
<PurchaseOrderDetailModal
  order={selectedOrder}
  open={showOrderDetail}
  onClose={() => {
    setShowOrderDetail(false);
    setSelectedOrder(null);
  }}
  onUpdate={() => {
    fetchOrders();
  }}
/>
```

**Action requise** : AUCUNE (modal PurchaseOrderDetailModal gère déjà affichage détail)

**Tests requis** : N/A

---

## 📦 DÉPENDANCES & FICHIERS SOURCE

### Fichiers Source Validés ✅

```bash
# Modal principal (1182 lignes)
src/shared/modules/products/components/selectors/UniversalProductSelectorV2.tsx
-rw-r--r--@ 36K Nov  6 08:31

# Wrapper backward compatibility
src/components/business/universal-product-selector-v2.tsx
-rw-r--r--@ 257B Nov  6 09:08

# Export barrel
src/shared/modules/products/components/selectors/index.ts
export { UniversalProductSelectorV2 } from './UniversalProductSelectorV2';

# Dépendance ProductThumbnail
src/shared/modules/products/components/images/ProductThumbnail.tsx
-rw-r--r--@ 2.4K Nov  6 08:32
```

### Hooks Internes Modal

```typescript
// Internes au fichier UniversalProductSelectorV2.tsx (pas d'import requis)
-useHierarchicalFilters - useProductSearch;
```

### UI Components (shadcn/ui)

```typescript
// Tous présents
-src / components / ui / dialog.tsx -
  src / components / ui / button.tsx -
  src / components / ui / scroll -
  area.tsx -
  src / components / ui / badge.tsx;
```

**Statut Dépendances** : ✅ TOUTES DISPONIBLES

---

## 🎯 PLAN D'ACTION DÉTAILLÉ

### BATCH 1 : Collections (Catégorie B - Handler vides) - 30 minutes

**Priorité** : P1 (Rapide - juste handler)

**Étapes** :

1. Vérifier hook `useCollections` expose `addProductsToCollection(collectionId, productIds[])`
2. Si méthode manquante → Créer dans `src/shared/modules/collections/hooks/use-collections.ts`
3. Implémenter handler Collections liste (ligne 749)
4. Implémenter handler Collections détail (ligne 1226)
5. Tests MCP Playwright (console = 0 errors)
6. Commit

**Fichiers** :

- `src/shared/modules/collections/hooks/use-collections.ts` (méthode addProductsToCollection)
- `src/app/produits/catalogue/collections/page.tsx` (handler ligne 749)
- `src/app/produits/catalogue/collections/[collectionId]/page.tsx` (handler ligne 1226)

**Tests** :

```typescript
// MCP Playwright
await page.goto('http://localhost:3000/produits/catalogue/collections');
await page.click('button:has-text("Produits")').first();
await page.waitForSelector('[role="dialog"]'); // Modal ouvert
const errors = await page.console.messages().filter(m => m.type() === 'error');
expect(errors.length).toBe(0);
```

---

### BATCH 2 : Variantes (Catégorie A - Modal absent) - 45 minutes

**Priorité** : P0 (Modal complet à intégrer)

**Étapes** :

1. Ajouter import UniversalProductSelectorV2 dans `variantes/page.tsx`
2. Remplacer VariantAddProductModal par UniversalProductSelectorV2
3. Implémenter handler `onSelect` avec logique ajout multi-produits
4. Vérifier hook `useVariantGroups` expose `addProductToVariantGroup(productId, groupId)`
5. Tests MCP Playwright
6. Commit

**Fichiers** :

- `src/app/produits/catalogue/variantes/page.tsx` (import + modal ligne 664-681)
- `src/shared/modules/products/hooks/use-variant-groups.ts` (méthode addProductToVariantGroup)

**Tests** :

```typescript
await page.goto('http://localhost:3000/produits/catalogue/variantes');
await page.click('button:has-text("Ajouter")').first();
await page.waitForSelector('[role="dialog"]');
await page.click('[data-testid="product-checkbox"]').first();
await page.click('[data-testid="product-checkbox"]').nth(1);
await page.click('button:has-text("Confirmer")');
const errors = await page.console.messages().filter(m => m.type() === 'error');
expect(errors.length).toBe(0);
```

---

### BATCH 3 : Commandes Clients (Catégorie A - Modal dans formulaire) - 60 minutes

**Priorité** : P0 (Intégration dans modal existant)

**Étapes** :

1. Ouvrir `SalesOrderFormModal.tsx`
2. Ajouter import UniversalProductSelectorV2
3. Ajouter état `showProductSelector`
4. Ajouter bouton "Ajouter des produits" dans section produits formulaire
5. Intégrer UniversalProductSelectorV2 avec handler `onSelect`
6. Lier produits sélectionnés aux lignes commande (formulaire)
7. Tests MCP Playwright
8. Commit

**Fichiers** :

- `src/shared/modules/orders/components/modals/SalesOrderFormModal.tsx`

**Tests** :

```typescript
await page.goto('http://localhost:3000/commandes/clients');
await page.click('button:has-text("Nouvelle commande")');
await page.waitForSelector('[role="dialog"]'); // Modal SalesOrderFormModal
await page.click('button:has-text("Ajouter des produits")');
await page.waitForSelector('[role="dialog"]'); // Modal UniversalProductSelectorV2
await page.click('[data-testid="product-checkbox"]').first();
await page.click('button:has-text("Confirmer")');
// Vérifier ligne commande ajoutée
const orderLines = await page.locator('[data-testid="order-line"]').count();
expect(orderLines).toBeGreaterThan(0);
```

---

### BATCH 4 : Commandes Fournisseurs (Catégorie A - Modal dans formulaire) - 60 minutes

**Priorité** : P0 (Intégration dans modal existant)

**Étapes** : IDENTIQUES BATCH 3 (Commandes Clients)

**Fichiers** :

- `src/shared/modules/orders/components/modals/PurchaseOrderFormModal.tsx`

**Tests** : Identiques BATCH 3 (URL `/commandes/fournisseurs`)

---

## 📊 ESTIMATION TOTALE

| Batch     | Pages                            | Durée    | Priorité | Complexité |
| --------- | -------------------------------- | -------- | -------- | ---------- |
| BATCH 1   | Collections (2 pages)            | 30 min   | P1       | Faible     |
| BATCH 2   | Variantes (1 page)               | 45 min   | P0       | Moyenne    |
| BATCH 3   | Commandes Clients (1 modal)      | 60 min   | P0       | Haute      |
| BATCH 4   | Commandes Fournisseurs (1 modal) | 60 min   | P0       | Haute      |
| **TOTAL** | **6 interventions**              | **3h15** | -        | -          |

---

## 🚨 RISQUES IDENTIFIÉS

### Risque 1 : Méthodes hooks manquantes

**Hooks à vérifier** :

- `useCollections` : `addProductsToCollection(collectionId, productIds[])`
- `useVariantGroups` : `addProductToVariantGroup(productId, groupId)`
- `useSalesOrders` : `addOrderLine(orderData)` (dans formulaire)
- `usePurchaseOrders` : `addOrderLine(orderData)` (dans formulaire)

**Mitigation** : Créer méthodes si manquantes (15 min par méthode)

---

### Risque 2 : Formulaires commandes structure complexe

**Problème** : SalesOrderFormModal/PurchaseOrderFormModal utilisent react-hook-form avec structure state complexe

**Mitigation** :

- Analyser structure formulaire existante
- Adapter logique `addOrderLine` selon structure (array lignes commande)
- Tests approfondis validation formulaire

---

### Risque 3 : Produits déjà sélectionnés (duplicates)

**Problème** : Éviter ajout produits déjà dans collection/groupe/commande

**Mitigation** :

- Passer prop `selectedProducts` à UniversalProductSelectorV2 avec IDs produits déjà sélectionnés
- Modal désactive produits déjà présents

**Code** :

```typescript
<UniversalProductSelectorV2
  selectedProducts={collection.products?.map(p => ({ id: p.id, quantity: 1 })) || []}
  // ...
/>
```

---

## ✅ TESTS VALIDATION (Checklist Complète)

### Collections - Liste

- [ ] Clic bouton "Produits" (carte collection) → Modal s'ouvre
- [ ] Sélectionner 2-3 produits
- [ ] Confirmer
- [ ] Produits ajoutés visibles dans carte collection
- [ ] Console = 0 errors
- [ ] Refetch automatique fonctionne

### Collections - Détail

- [ ] Clic bouton "Ajouter des produits" → Modal s'ouvre
- [ ] Sélectionner 2-3 produits
- [ ] Confirmer
- [ ] Produits ajoutés visibles dans grille produits
- [ ] Console = 0 errors

### Variantes - Liste

- [ ] Clic bouton "Ajouter" (carte groupe) → Modal V2 s'ouvre
- [ ] Sélectionner 2-3 produits
- [ ] Confirmer
- [ ] Produits ajoutés visibles dans carte groupe
- [ ] Console = 0 errors

### Commandes Clients

- [ ] Clic "Nouvelle commande" → Modal formulaire s'ouvre
- [ ] Clic "Ajouter des produits" → Modal V2 s'ouvre
- [ ] Sélectionner 2-3 produits avec quantités
- [ ] Confirmer
- [ ] Produits ajoutés aux lignes commande
- [ ] Console = 0 errors
- [ ] Calcul totaux HT/TTC automatique

### Commandes Fournisseurs

- [ ] Tests identiques Commandes Clients

---

## 📁 FICHIERS À MODIFIER (Récapitulatif)

```
src/
├── app/
│   ├── produits/
│   │   └── catalogue/
│   │       ├── collections/
│   │       │   ├── page.tsx                     [BATCH 1] Handler ligne 749
│   │       │   └── [collectionId]/
│   │       │       └── page.tsx                 [BATCH 1] Handler ligne 1226
│   │       └── variantes/
│   │           └── page.tsx                     [BATCH 2] Import + Modal ligne 664-681
│   └── commandes/
│       ├── clients/
│       │   └── page.tsx                         [AUCUN CHANGEMENT]
│       └── fournisseurs/
│           └── page.tsx                         [AUCUN CHANGEMENT]
└── shared/
    └── modules/
        ├── collections/
        │   └── hooks/
        │       └── use-collections.ts           [BATCH 1] Méthode addProductsToCollection
        ├── products/
        │   └── hooks/
        │       └── use-variant-groups.ts        [BATCH 2] Méthode addProductToVariantGroup
        └── orders/
            └── components/
                └── modals/
                    ├── SalesOrderFormModal.tsx   [BATCH 3] Intégration UniversalProductSelectorV2
                    └── PurchaseOrderFormModal.tsx [BATCH 4] Intégration UniversalProductSelectorV2
```

**Total fichiers** : 8 fichiers

---

## 🎯 PROCHAINES ÉTAPES

1. **Validation utilisateur** : Confirmer priorités BATCH 1→2→3→4
2. **Démarrage BATCH 1** : Collections (30 min - rapide win)
3. **Tests validation** : MCP Playwright console = 0 errors
4. **Commit BATCH 1** : `feat(collections): Connect UniversalProductSelectorV2 handlers - Batch 1/4`
5. **Répéter BATCH 2→3→4**

---

## 📋 CONCLUSION

**État actuel** : 6 pages sur 8 nécessitent intervention (2 handlers TODO + 4 modals absents)

**Effort estimé** : 3h15 (4 batches séquentiels)

**Impact utilisateur** : CRITIQUE (fonctionnalité clé multi-sélection produits bloquée partout)

**Recommandation** : Démarrer IMMÉDIATEMENT BATCH 1 (Collections - 30 min - rapide win) puis enchaîner BATCH 2→3→4.

---

**Audit réalisé le** : 2025-11-07
**Rapport validé** : Vérone Debugger
