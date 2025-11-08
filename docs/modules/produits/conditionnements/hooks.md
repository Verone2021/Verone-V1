# Hooks Conditionnements - Documentation

**Module** : Produits → Conditionnements
**Date** : 2025-10-27

---

## 📋 Hook Principal

### `useProductPackages(options)`

Hook complet gestion packages avec calculs business automatiques.

### Signature Complète

```typescript
interface UseProductPackagesOptions {
  productId: string;
  autoFetch?: boolean;
}

type PackageType = 'single' | 'pack' | 'bulk' | 'custom';

interface ProductPackage {
  id: string;
  product_id: string;
  type: PackageType;
  base_quantity: number;
  unit: string;
  unit_price_ht?: number;
  discount_rate?: number;
  is_default: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function useProductPackages(options: UseProductPackagesOptions): {
  // 📊 Data
  packages: ProductPackage[];
  defaultPackage: ProductPackage | null;
  singlePackage: ProductPackage | null;

  // 🔄 State
  loading: boolean;
  error: string | null;

  // 🎬 Actions
  fetchPackages: () => Promise<void>;
  calculatePackagePrice: (basePrice: number, pkg: ProductPackage) => number;

  // 🛠️ Helpers Business
  getPackagesByType: (type: PackageType) => ProductPackage[];
  getPackPackages: () => ProductPackage[];
  getBulkPackages: () => ProductPackage[];
  getBestValuePackage: (basePrice: number) => ProductPackage | null;
  getDiscountLabel: (pkg: ProductPackage) => string | null;

  // 📈 Stats
  totalPackages: number;
  hasMultiplePackages: boolean;
  hasDiscounts: boolean;
  maxDiscount: number;
  isValidPackageSystem: boolean;
};
```

---

## 💰 Fonction Clé : `calculatePackagePrice()`

Calcule le prix total d'un package selon les business rules.

### Algorithme

```typescript
function calculatePackagePrice(basePrice: number, pkg: ProductPackage): number {
  // Mode 1 : Prix unitaire spécifique défini
  if (pkg.unit_price_ht && pkg.unit_price_ht > 0) {
    return pkg.unit_price_ht * pkg.base_quantity;
  }

  // Mode 2 : Prix de base avec remise
  const grossPrice = basePrice * pkg.base_quantity;
  const discount = pkg.discount_rate || 0;
  const netPrice = grossPrice * (1 - discount);

  return Math.round(netPrice * 100) / 100; // Arrondi 2 décimales
}
```

### Exemples

```typescript
const basePrice = 50; // Prix unitaire de base

// Package 1 : Mode Prix Spécifique
const pack1 = {
  base_quantity: 6,
  unit_price_ht: 45,
};
calculatePackagePrice(basePrice, pack1);
// = 45 × 6 = 270€

// Package 2 : Mode Remise
const pack2 = {
  base_quantity: 6,
  discount_rate: 0.15, // 15%
};
calculatePackagePrice(basePrice, pack2);
// = 50 × 6 × (1 - 0.15)
// = 300 × 0.85
// = 255€
```

---

## 🏆 Helper : `getBestValuePackage()`

Retourne le package avec le meilleur prix unitaire.

### Algorithme

```typescript
function getBestValuePackage(basePrice: number): ProductPackage | null {
  if (packages.length === 0) return null;

  return packages.reduce((best, current) => {
    const currentPricePerUnit =
      calculatePackagePrice(basePrice, current) / current.base_quantity;
    const bestPricePerUnit =
      calculatePackagePrice(basePrice, best) / best.base_quantity;

    return currentPricePerUnit < bestPricePerUnit ? current : best;
  });
}
```

### Exemple

```typescript
const { getBestValuePackage } = useProductPackages({ productId });

const bestValue = getBestValuePackage(50);
// Retourne le package avec le prix/unité le plus bas

console.log('Meilleure valeur:', bestValue.base_quantity, 'x');
console.log(
  'Prix unitaire:',
  calculatePackagePrice(50, bestValue) / bestValue.base_quantity,
  '€'
);
```

---

## 🏷️ Helper : `getDiscountLabel()`

Génère un label UX pour afficher la remise.

### Algorithme

```typescript
function getDiscountLabel(pkg: ProductPackage): string | null {
  const discount = pkg.discount_rate;
  if (!discount || discount === 0) return null;

  return `Jusqu'à -${Math.round(discount * 100)}%`;
}
```

### Exemples

```typescript
getDiscountLabel({ discount_rate: 0.15 });
// "Jusqu'à -15%"

getDiscountLabel({ discount_rate: 0.25 });
// "Jusqu'à -25%"

getDiscountLabel({ discount_rate: 0 });
// null
```

---

## ✅ Helper : `isValidPackageSystem`

Valide que le système de packages respecte les business rules.

### Règles de Validation

```typescript
// Règle 1 : Au moins 1 package existe
packages.length > 0;

// Règle 2 : 1 package par défaut
packages.some(pkg => pkg.is_default);

// Règle 3 : 1 package type='single'
packages.some(pkg => pkg.type === 'single');

// isValidPackageSystem = true si les 3 règles OK
```

### Exemple

```typescript
const { isValidPackageSystem } = useProductPackages({ productId });

if (!isValidPackageSystem) {
  toast.error('⚠️ Configuration packages invalide');
  // Bloquer l'ajout au panier
  return;
}
```

---

## 🎯 Exemple Complet

```typescript
import { useProductPackages } from '@/hooks/use-product-packages'

export default function ProductPackagesSection({ productId, basePrice }: {
  productId: string
  basePrice: number
}) {
  const {
    packages,
    loading,
    calculatePackagePrice,
    getBestValuePackage,
    getDiscountLabel,
    isValidPackageSystem
  } = useProductPackages({
    productId,
    autoFetch: true
  })

  const bestValue = getBestValuePackage(basePrice)

  if (loading) return <LoadingSpinner />

  if (!isValidPackageSystem) {
    return <Alert variant="destructive">Configuration packages invalide</Alert>
  }

  return (
    <div>
      <h2>Conditionnements Disponibles</h2>

      <div className="grid grid-cols-3 gap-4">
        {packages.map(pkg => {
          const totalPrice = calculatePackagePrice(basePrice, pkg)
          const pricePerUnit = totalPrice / pkg.base_quantity
          const discountLabel = getDiscountLabel(pkg)
          const isBestValue = bestValue?.id === pkg.id

          return (
            <div
              key={pkg.id}
              className={cn(
                "card",
                pkg.is_default && "border-primary",
                isBestValue && "ring-2 ring-green-500"
              )}
            >
              {/* Header */}
              <div className="header">
                <h3>{pkg.base_quantity} {pkg.unit}</h3>
                {pkg.is_default && <Badge>Par défaut</Badge>}
                {isBestValue && <Badge variant="success">Meilleure valeur</Badge>}
              </div>

              {/* Pricing */}
              <div className="pricing">
                <div className="total text-2xl font-bold">
                  {totalPrice.toFixed(2)}€
                </div>
                <div className="per-unit text-sm text-gray-500">
                  {pricePerUnit.toFixed(2)}€ / unité
                </div>
                {discountLabel && (
                  <div className="discount text-green-600 font-semibold">
                    {discountLabel}
                  </div>
                )}
              </div>

              {/* Type */}
              <Badge variant="outline">{pkg.type}</Badge>

              {/* Actions */}
              <button
                onClick={() => addToCart(productId, pkg.id, 1)}
                className="btn-primary mt-4"
              >
                Ajouter au panier
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## 📚 Ressources

- **README Conditionnements** : `./README.md`
- **Database** : `docs/database/tables/product_packages.md`
- **Business Rules** : `docs/business-rules/06-stocks/conditionnements/`

---

**Dernière Mise à Jour** : 2025-10-27
