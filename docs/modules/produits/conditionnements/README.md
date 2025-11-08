# Conditionnements Produits

**Module** : Produits → Conditionnements (Packages)
**Status** : ✅ PRODUCTION READY
**Date Validation** : 2025-10-27

---

## 📊 Vue d'Ensemble

Le module **Conditionnements** (packages) permet de proposer un produit en différentes quantités avec des prix adaptés.

**Use cases** :

- Vente à l'unité : 1 chaise = 50€
- Pack de 4 : 4 chaises = 180€ (-10%)
- Pack de 6 : 6 chaises = 252€ (-16%)

**Business rules** :

- 1 produit = plusieurs packages possibles
- 1 package par défaut obligatoire (type='single')
- Pricing automatique ou manuel par package

---

## ✅ Features Validées

### Types Packages

- ✅ **Single** : À l'unité (obligatoire, par défaut)
- ✅ **Pack** : Lot groupé (ex: pack de 4)
- ✅ **Bulk** : Vrac/gros volume (ex: carton de 24)
- ✅ **Custom** : Conditionnement sur mesure

### Pricing Modes

- ✅ **Mode 1 : Prix unitaire spécifique**
  - Champ `unit_price_ht` défini
  - Prix total = `unit_price_ht × base_quantity`
  - Ex: Pack 6 = 45€/unité → 270€ total

- ✅ **Mode 2 : Remise sur prix de base**
  - Champ `discount_rate` défini (0-1)
  - Prix total = `base_price × base_quantity × (1 - discount_rate)`
  - Ex: Pack 6 à -15% = 50€ × 6 × 0.85 = 255€

### Affichage

- ✅ **Cards packages** : Grille avec prix par package
- ✅ **Indicateurs remise** : Badge "Jusqu'à -15%"
- ✅ **Meilleure valeur** : Highlight package le plus avantageux

---

## 📁 Database

### Table `product_packages`

```sql
CREATE TABLE product_packages (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(50),  -- 'single' | 'pack' | 'bulk' | 'custom'
  base_quantity INTEGER NOT NULL,
  unit VARCHAR(50) NOT NULL,
  unit_price_ht DECIMAL(10, 2),       -- Prix unitaire spécifique (Mode 1)
  discount_rate DECIMAL(3, 2),        -- Taux remise 0-1 (Mode 2)
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Contraintes** :

- 1 seul package `is_default=true` par produit
- Au moins 1 package `type='single'` par produit
- `base_quantity > 0`
- `unit_price_ht` OU `discount_rate` (pas les deux)

---

## 🎯 Hook Principal

### `useProductPackages(options)`

Hook gestion packages avec calculs automatiques.

```typescript
interface UseProductPackagesOptions {
  productId: string;
  autoFetch?: boolean;
}

function useProductPackages(options: UseProductPackagesOptions): {
  // Data
  packages: ProductPackage[];
  defaultPackage: ProductPackage | null;
  singlePackage: ProductPackage | null;
  totalPackages: number;
  hasMultiplePackages: boolean;
  hasDiscounts: boolean;
  maxDiscount: number;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  fetchPackages: () => Promise<void>;
  calculatePackagePrice: (basePrice: number, package: ProductPackage) => number;

  // Helpers Business
  getPackagesByType: (type: PackageType) => ProductPackage[];
  getBestValuePackage: (basePrice: number) => ProductPackage | null;
  getDiscountLabel: (package: ProductPackage) => string | null;

  // Stats
  isValidPackageSystem: boolean;
};
```

---

## 🔄 Workflow Création Packages

```
1. Page produit détail
2. Section "Conditionnements"
3. Clic "Ajouter conditionnement"
4. Formulaire :
   • Type (single/pack/bulk)
   • Quantité de base (4, 6, 12, etc.)
   • Unité (unités, pièces, carton)
   • Mode pricing :
     ├─ Prix unitaire HT (45€)
     └─ OU Remise % (15%)
   • Par défaut ? (si type=single)
5. INSERT product_packages
6. Refresh liste packages
```

### Exemple Code

```typescript
const handleCreatePackage = async () => {
  const packageData = {
    product_id: productId,
    type: 'pack',
    base_quantity: 6,
    unit: 'unités',
    discount_rate: 0.15, // 15% remise
    is_default: false,
    is_active: true,
  };

  await supabase.from('product_packages').insert([packageData]);

  toast.success('✅ Conditionnement créé');
  refetch();
};
```

---

## 💰 Calcul Prix Package

### Mode 1 : Prix Unitaire Spécifique

```typescript
// Si unit_price_ht défini
packagePrice = unit_price_ht × base_quantity

// Exemple
unit_price_ht = 45€
base_quantity = 6
packagePrice = 45 × 6 = 270€
```

### Mode 2 : Remise sur Prix de Base

```typescript
// Si discount_rate défini
grossPrice = base_price × base_quantity
netPrice = grossPrice × (1 - discount_rate)

// Exemple
base_price = 50€
base_quantity = 6
discount_rate = 0.15 (15%)
grossPrice = 50 × 6 = 300€
netPrice = 300 × 0.85 = 255€
```

### Exemple Hook

```typescript
const { packages, calculatePackagePrice, getBestValuePackage } =
  useProductPackages({ productId });

const basePrice = 50; // Prix unitaire de base

packages.forEach(pkg => {
  const price = calculatePackagePrice(basePrice, pkg);
  const pricePerUnit = price / pkg.base_quantity;
  console.log(
    `Package ${pkg.base_quantity}x : ${price}€ (${pricePerUnit}€/unité)`
  );
});

const bestValue = getBestValuePackage(basePrice);
console.log('Meilleure valeur:', bestValue?.base_quantity, 'x');
```

---

## 🎨 Affichage UI

### Pattern Cards Packages

```typescript
<div className="grid grid-cols-3 gap-4">
  {packages.map(pkg => {
    const price = calculatePackagePrice(basePrice, pkg)
    const pricePerUnit = price / pkg.base_quantity
    const discountLabel = getDiscountLabel(pkg)
    const isBestValue = bestValue?.id === pkg.id

    return (
      <div key={pkg.id} className={cn(
        "card",
        pkg.is_default && "border-primary",
        isBestValue && "ring-2 ring-green-500"
      )}>
        {/* Header */}
        <div className="header">
          <h3>{pkg.base_quantity} {pkg.unit}</h3>
          {pkg.is_default && <Badge>Par défaut</Badge>}
          {isBestValue && <Badge variant="success">Meilleure valeur</Badge>}
        </div>

        {/* Pricing */}
        <div className="pricing">
          <div className="total">{price.toFixed(2)}€</div>
          <div className="per-unit">{pricePerUnit.toFixed(2)}€ / unité</div>
          {discountLabel && (
            <div className="discount text-green-600">{discountLabel}</div>
          )}
        </div>

        {/* Type badge */}
        <Badge variant="outline">{pkg.type}</Badge>
      </div>
    )
  })}
</div>
```

---

## 📊 Validation Business Rules

### Règle 1 : Package Single Obligatoire

```sql
-- Au moins 1 package type='single' avec is_default=true
SELECT COUNT(*) FROM product_packages
WHERE product_id = $1
  AND type = 'single'
  AND is_default = true;
-- DOIT RETOURNER >= 1
```

### Règle 2 : 1 Seul Package Par Défaut

```sql
-- Exactement 1 package is_default=true
SELECT COUNT(*) FROM product_packages
WHERE product_id = $1
  AND is_default = true;
-- DOIT RETOURNER = 1
```

### Hook Helper : `isValidPackageSystem`

```typescript
const { isValidPackageSystem } = useProductPackages({ productId });

// Valide si :
// ✓ Au moins 1 package existe
// ✓ 1 package is_default=true
// ✓ 1 package type='single'

if (!isValidPackageSystem) {
  toast.error('⚠️ Système conditionnements invalide');
}
```

---

## 📚 Ressources

- **Hooks** : `./hooks.md`
- **Database** : `docs/database/tables/product_packages.md`
- **Business Rules** : `docs/business-rules/06-stocks/conditionnements/`

---

**Dernière Mise à Jour** : 2025-10-27
**Mainteneur** : Vérone Dev Team
