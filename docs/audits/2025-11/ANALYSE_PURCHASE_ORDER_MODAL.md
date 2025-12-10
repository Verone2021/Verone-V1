# ANALYSE COMPLÈTE: PurchaseOrderFormModal - Diagnostic de Non-Fonctionnement

**Date**: 2025-11-25  
**Composant**: PurchaseOrderFormModal (packages/@verone/orders/src/components/modals/PurchaseOrderFormModal.tsx)  
**Status**: Analyse complète - Problèmes identifiés ✅

---

## 1. DONNÉES DE BASE

### Chemin absolu du composant

```
/Users/romeodossantos/verone-back-office-V1/packages/@verone/orders/src/components/modals/PurchaseOrderFormModal.tsx
```

### Fichiers connexes examinés

- **SalesOrderFormModal** : `/packages/@verone/orders/src/components/modals/SalesOrderFormModal.tsx`
- **use-purchase-orders.ts** : `/packages/@verone/orders/src/hooks/use-purchase-orders.ts`
- **use-sales-orders.ts** : `/packages/@verone/orders/src/hooks/use-sales-orders.ts`
- **UniversalProductSelectorV2** : `/packages/@verone/products/src/components/selectors/UniversalProductSelectorV2.tsx`

---

## 2. ARCHITECTURE DU COMPOSANT

### Mode de fonctionnement

Le composant fonctionne en **deux modes distincts** :

#### Mode CRÉATION (isEditMode = false)

```typescript
// Items stockés LOCALEMENT dans state
const [localItems, setLocalItems] = useState<any[]>([]);
const items = isEditMode ? dbItems : localItems; // ← Mode création utilise localItems
```

**Workflow** :

1. Ajouter produits → `handleProductsSelect()` → ajoute à `localItems`
2. Modifier items → `handleUpdateItem()` → modifie `localItems` localement
3. Soumettre → `createOrder()` → envoie tous les items à la base de données

#### Mode ÉDITION (isEditMode = true)

```typescript
// Items récupérés de la base de données
const {
  items: dbItems,
  addItem: addDbItem,
  updateItem: updateDbItem,
  removeItem: removeDbItem,
} = useOrderItems({
  orderId: order?.id,
  orderType: 'purchase',
});

const items = isEditMode ? dbItems : localItems; // ← Mode édition utilise dbItems
```

**Workflow** :

1. Ajouter produits → `handleProductsSelect()` → `addDbItem()` → insertion DB immédiate
2. Modifier items → `handleUpdateItem()` → `updateDbItem()` → update DB immédiate
3. Soumettre → `updateOrder()` → met à jour UNIQUEMENT les métadonnées

---

## 3. FLUX DE SÉLECTION DE PRODUITS - ANALYSE DÉTAILLÉE

### Point d'entrée principal

```typescript
const handleProductsSelect = async (selectedProducts: SelectedProduct[]) => {
  try {
    if (isEditMode) {
      // ❌ PROBLÈME #1 : Mode édition
      for (const product of selectedProducts) {
        const itemData: CreateOrderItemData = {
          product_id: product.id,
          quantity: product.quantity || 1,
          unit_price_ht: product.unit_price || 0,
          discount_percentage: product.discount_percentage || 0,
          eco_tax: 0,
          notes: product.notes || '',
        };
        await addDbItem(itemData);
      }
    } else {
      // ✅ Mode création (fonctionne)
      const newItems = await Promise.all(
        selectedProducts.map(async product => {
          const stockData = await getAvailableStock(product.id);
          return {
            id: `temp-${Date.now()}-${product.id}`,
            product_id: product.id,
            quantity: product.quantity || 1,
            unit_price_ht: product.unit_price || 0,
            discount_percentage: product.discount_percentage || 0,
            eco_tax: 0,
            notes: product.notes || '',
            product: {
              /* ... */
            },
            availableStock: stockData?.stock_available || 0,
          };
        })
      );
      setLocalItems(prev => [...prev, ...newItems]);
    }
    setShowProductSelector(false);
  } catch (error) {
    console.error('❌ Erreur ajout produits:', error);
    toast({
      variant: 'destructive',
      title: 'Erreur',
      description:
        error instanceof Error ? error.message : 'Erreur ajout produits',
    });
  }
};
```

---

## 4. PROBLÈMES IDENTIFIÉS

### ❌ PROBLÈME #1 : Filtre d'exclusion incomplet dans UniversalProductSelectorV2

**Localisation** :

```typescript
// PurchaseOrderFormModal ligne ~290
const excludeProductIds = useMemo(
  () => items.map(item => item.product_id),
  [items]
);

// Utilisé pour passer à UniversalProductSelectorV2
<UniversalProductSelectorV2
  excludeProductIds={excludeProductIds}
  // ...
/>
```

**Le problème** :

- `excludeProductIds` est calculé à partir de `items` (qui = `dbItems` en mode édition)
- ✅ En mode CRÉATION : Fonctionne car `items` = `localItems` actualisé
- ❌ En mode ÉDITION : `items` peut être stale/incomplet si `dbItems` ne sont pas à jour

**Impact concret** :

```
Scénario:
1. Modal édition s'ouvre avec commande existante (PO #123)
2. useOrderItems charge les items (ex: 3 produits)
3. Utilisateur ajoute "Produit A" via modal
4. excludeProductIds se met à jour MAIS peut être asynchrone
5. Si utilisateur clique trop vite, "Produit A" peut être ajouté en double
```

---

### ❌ PROBLÈME #2 : Pas d'enrichissement des produits en mode création

**Localisation** :

```typescript
// Mode création - ligne ~294
const newItems = await Promise.all(
  selectedProducts.map(async product => {
    const stockData = await getAvailableStock(product.id);

    return {
      // ...
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku || '',
        primary_image_url: product.product_images?.[0]?.public_url,
        stock_quantity: product.stock_real, // ⚠️ Source: UniversalProductSelectorV2
      },
      availableStock: stockData?.stock_available || 0,
    };
  })
);
```

**Comparaison avec SalesOrderFormModal** :

```typescript
// SalesOrderFormModal - Même problème
const newItem: OrderItem = {
  // ...
  product: {
    id: product.id,
    name: product.name,
    sku: product.sku || '',
    primary_image_url: product.product_images?.[0]?.public_url,
    stock_quantity: product.stock_real, // ⚠️ Source: UniversalProductSelectorV2
    eco_tax_default: 0,
  },
};
```

**Détail du problème** :

- `product.stock_real` vient de UniversalProductSelectorV2
- UniversalProductSelectorV2 charge depuis la table `products` UNIQUEMENT le champ `stock_real`
- ❌ Ne charge PAS `stock_forecasted_in`, `stock_forecasted_out`
- ❌ Impossible de calculer `stock_available` côté client

**Vérification dans UniversalProductSelectorV2** (ligne ~149) :

```typescript
const fetchProducts = async () => {
  let query = supabase.from('products').select(`
      id,
      name,
      sku,
      product_status,
      creation_mode,
      sourcing_type,
      supplier_id,
      subcategory_id,
      stock_real,  // ✅ Chargé
      created_at,
      updated_at,
      // ❌ MANQUENT:
      // - stock_forecasted_in
      // - stock_forecasted_out
      // - Autres champs prévisionnel
      product_images!left ( ... ),
      // ...
    `);
};
```

**Impact** :

- Affichage stock incorrect dans les modales ajout produits
- Les calculs prévisionnel ne sont pas possibles
- Les alertes stock insuffisant ne s'affichent pas correctement

---

### ❌ PROBLÈME #3 : Pas de chargement du produit enrichi en mode édition

**Localisation** :

```typescript
// Mode édition - ligne ~279
for (const product of selectedProducts) {
  const itemData: CreateOrderItemData = {
    product_id: product.id,
    quantity: product.quantity || 1,
    unit_price_ht: product.unit_price || 0,
    discount_percentage: product.discount_percentage || 0,
    eco_tax: 0,
    notes: product.notes || '',
  };
  await addDbItem(itemData); // ← Ajoute directement sans enrichissement
}
```

**Problème** :

- En mode édition, les produits ne sont pas enrichis avec les données du serveur
- Les images, SKU, noms ne sont pas vérifiés
- Le hook `useOrderItems` va chercher les données complètes automatiquement, mais :
  - ⚠️ C'est asynchrone
  - ⚠️ Pas de validation client avant insertion

**Comparaison avec mode création** :

```typescript
// Mode création enrichit les produits AVANT ajout local
const newItems = await Promise.all(
  selectedProducts.map(async product => {
    // ... enrichissement complet ...
    return { ...produitAvecToutesDonnees };
  })
);
setLocalItems(prev => [...prev, ...newItems]);
```

---

### ❌ PROBLÈME #4 : Pas de feedback utilisateur lors du blocage de l'édition

**Localisation** :

```typescript
// Règle métier - ligne ~142
const isBlocked = useMemo(() => {
  if (!isEditMode) return false;
  return order.status === 'received' || order.status === 'cancelled';
}, [isEditMode, order]);

// Alert affiché - ligne ~438
{isBlocked && order && (
  <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-sm text-red-800 font-medium">
      ⚠️ Édition bloquée : Cette commande est{' '}
      {order.status === 'received' ? 'reçue' : 'annulée'}
    </p>
  </div>
)}
```

**Problème détecté** :

- ✅ L'alerte s'affiche correctement
- ✅ Les boutons sont désactivés
- ❌ MAIS : Les conditions de paiement en mode édition ne sont PAS rendues correctement

**Détail** - Section conditions de paiement (ligne ~493) :

```typescript
{/* Conditions de paiement READ-ONLY (héritées de l'organisation) */}
<div className="space-y-2 col-span-2">
  <Label>Conditions de paiement</Label>
  {paymentTerms ? (
    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-green-600 font-medium mb-1">
            💳 CONDITIONS NÉGOCIÉES
          </div>
          <div className="text-sm font-semibold text-green-800">
            {paymentTermsOptions.find(
              opt => opt.value === paymentTerms
            )?.label || paymentTerms}
          </div>
        </div>
      </div>
      // ...
    </div>
  ) : (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
      <p className="text-sm text-gray-500">
        {selectedSupplier
          ? 'Aucune condition définie pour ce fournisseur'
          : 'Sélectionnez un fournisseur pour afficher les conditions'}
      </p>
    </div>
  )}
</div>
```

**Problème** : `paymentTerms` peut être une string arbitraire, pas forcément dans `paymentTermsOptions`

---

### ❌ PROBLÈME #5 : Chargement des items en mode édition insuffisant

**Localisation** :

```typescript
const {
  items: dbItems,
  loading: itemsLoading,
  addItem: addDbItem,
  updateItem: updateDbItem,
  removeItem: removeDbItem,
  refetch: refetchItems,
} = useOrderItems({
  orderId: order?.id, // ← Undefined en mode création !
  orderType: 'purchase',
});
```

**Problème** :

- ❌ En mode CRÉATION : `orderId` est undefined → `useOrderItems` ne charge rien
- ❓ Qu'est-ce qu'elle charge alors ?

**Besoin de voir** : Implementation de `useOrderItems` (non fourni dans l'analyse)

---

### ❌ PROBLÈME #6 : Type casting unsafe dans la soumission

**Localisation** :

```typescript
// Mode édition - ligne ~376
await updateOrder(order.id, {
  supplier_id: selectedSupplierId,
  expected_delivery_date: expectedDeliveryDate || undefined,
  payment_terms: paymentTerms || undefined,
  delivery_address: deliveryAddress || undefined,
  notes: notes || undefined,
  eco_tax_vat_rate: ecoTaxVatRate,
} as any); // ← TYPE CAST DANGEREUX !
```

**Problème** :

- Le type `UpdatePurchaseOrderData` est incomplet selon le commentaire
- Le cast `as any` masque les erreurs de type

---

## 5. COMPARAISON AVEC SalesOrderFormModal

| Aspect                      | PurchaseOrderFormModal    | SalesOrderFormModal                |                                  Différence |
| --------------------------- | ------------------------- | ---------------------------------- | ------------------------------------------: |
| **Mode création**           | ✅ Items locaux           | ✅ Items locaux                    |                                   Identique |
| **Mode édition**            | ⚠️ DB items via hook      | ⚠️ Items chargés au mount          |            SalesOrderFormModal charge mieux |
| **Enrichissement produits** | ❌ Incomplet mode édition | ❌ Incomplet aussi                 |                               Même problème |
| **Confirmation modal**      | ❌ Non                    | ✅ Oui (AlertDialog)               |          SalesOrderFormModal a meilleure UX |
| **Stock checks**            | ❌ Non                    | ✅ Oui (checkAllStockAvailability) |      SalesOrderFormModal est plus rigoureux |
| **Validation transitions**  | ❌ Non                    | ✅ Oui (FSM)                       | SalesOrderFormModal utilise Machine à états |

**Principale différence** :
SalesOrderFormModal a une architecture plus robuste avec :

- Chargement d'ordre complet au mount
- Validation des transitions via FSM
- Vérification stock avant soumission
- Modal de confirmation avec AlertDialog

---

## 6. PROBLÈMES DE LOGIQUE MÉTIER

### ❌ PROBLÈME #7 : Stock prévisionnel non géré en mode création

**Attendu** :

- Créer une commande fournisseur → Impact `stock_forecasted_in`
- Vérifier disponibilité avant création

**Actuel** :

```typescript
// Aucun appel à checkStockAvailability
// Aucun calcul de prévisionnel

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedSupplierId) {
    toast({
      variant: 'destructive',
      title: 'Fournisseur requis',
      description: 'Veuillez sélectionner un fournisseur',
    });
    return;
  }

  if (!isEditMode && items.length === 0) {
    toast({
      variant: 'destructive',
      title: 'Articles requis',
      description: 'Ajoutez au moins un article à la commande',
    });
    return;
  }

  // Soumission directe sans confirmation
  await handleSubmitConfirmed();
};
```

**Comparaison avec SalesOrderFormModal** :

```typescript
// SalesOrderFormModal a ceci :
const createOrder = useCallback(
  async (data: CreateSalesOrderData, autoReserve = false) => {
    setLoading(true);
    try {
      // 1. Vérifier la disponibilité du stock (sans bloquer)
      const stockCheck = await checkStockAvailability(data.items);
      const unavailableItems = stockCheck.filter(item => !item.is_available);

      if (unavailableItems.length > 0) {
        const itemNames = await Promise.all( /* ... */ );
        console.warn('⚠️ Commande avec stock insuffisant:', itemNames);
        toast({
          title: '⚠️ Attention Stock',
          description: `Stock insuffisant pour ${itemNames.length} produit(s)...`,
        });
      }
      // ... puis création de la commande ...
    }
  }
);
```

---

### ❌ PROBLÈME #8 : Pas de validation des conditions de paiement

**Actuel** :

```typescript
const [paymentTerms, setPaymentTerms] = useState(order?.payment_terms || '');

// Aucune validation que c'est un enum valide
// Aucune vérification que c'est dans paymentTermsOptions
```

**Expected** :

```typescript
type PaymentTermsEnum = 'PREPAID' | 'NET_30' | 'NET_60' | 'NET_90';
const [paymentTerms, setPaymentTerms] = useState<PaymentTermsEnum | null>(null);
```

---

## 7. RÉSUMÉ DES POINTS CRITIQUES

### 🔴 BLOCAGES MAJEURS

1. **UniversalProductSelectorV2 ne charge pas le stock prévisionnel**
   - Impact: Impossible de faire des calculs stock corrects
   - Affecte: Tous les modales d'ajout de produits

2. **Mode édition manque d'enrichissement des produits**
   - Impact: Les données de produits ne sont pas vérifiées avant insertion
   - Affecte: Intégrité des données

3. **Pas de vérification stock avant création commande**
   - Impact: Possible créer commandes avec stock impossible
   - Affecte: Gestion d'inventaire

### 🟡 PROBLÈMES MINEURS

4. Filtre d'exclusion peut être asynchrone (race condition possible)
5. Type casting `as any` masque erreurs TypeScript
6. Pas de modal de confirmation en mode création (UX)
7. Conditions paiement ne sont pas validées enum

---

## 8. FICHIERS À CONSULTER POUR CONTINUATION

**Critiques** :

- `/packages/@verone/products/src/hooks/use-sourcing-products.ts` - Voir comment il charge stock complet
- `/packages/@verone/orders/src/hooks/use-order-items.ts` - Voir logic du chargement des items
- `/apps/back-office/src/actions/purchase-orders.ts` - Voir si server action existe

**Contextuels** :

- `/packages/@verone/stock/src/hooks/use-stock-movements.ts` - Voir getAvailableStock
- `/docs/business-rules/` - Voir règles métier stock

---

## 9. NOTES POUR RÉPARATION

### Priorité HAUTE

```typescript
// Ajouter à UniversalProductSelectorV2
const query = supabase.from('products').select(`
    id,
    name,
    sku,
    product_status,
    creation_mode,
    sourcing_type,
    supplier_id,
    subcategory_id,
    stock_real,
    stock_forecasted_in,      // ← AJOUTER
    stock_forecasted_out,       // ← AJOUTER
    created_at,
    updated_at,
    // ...
  `);
```

### Priorité MOYENNE

```typescript
// Enrichir mode édition comme mode création
// Implémenter vérification stock en mode création (comme SalesOrderFormModal)
// Ajouter modal de confirmation (comme SalesOrderFormModal)
```

### Priorité BASSE

```typescript
// Améliorer types (remove `as any`)
// Ajouter validation conditions de paiement
// Améliorer UX filtres exclusion
```

---

## CONCLUSION

Le composant PurchaseOrderFormModal fonctionne pour les cas simples mais a **8 problèmes identifiés** de critères à haute à basse priorité. Le problème le plus impactant est le **manque de données stock prévisionnel dans UniversalProductSelectorV2**.

Pour une réparation complète :

1. ✅ Charger `stock_forecasted_in` et `stock_forecasted_out` dans UniversalProductSelectorV2
2. ✅ Enrichir produits en mode édition (comme mode création)
3. ✅ Ajouter vérification stock avant création (comme SalesOrderFormModal)
4. ✅ Améliorer types TypeScript (remove `as any` casts)
