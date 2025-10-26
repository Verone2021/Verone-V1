# Business Rules — Conditionnements & Packages V1

> **Version** : 1.0 MVP  
> **Statut** : Spécifications Business  
> **Scope** : Système flexible conditionnements produits

## 🎯 Contexte Business

### **Problématique Vérone**
Le secteur décoration/mobilier nécessite une gestion flexible des conditionnements :
- **Unités** : Vente à l'unité (tabouret, luminaire)
- **Packs** : Lots prédéfinis (pack 4 chaises, set vaisselle)
- **Vrac/Palettes** : Volumes importants avec dégressif
- **Sur-mesure** : Conditionnements spéciaux client

### **Objectifs Business V1**
1. **Flexibilité** : Adaptation tous types de produits
2. **Dégressivité** : Tarifs préférentiels volumes
3. **MOQ** : Gestion quantités minimales
4. **Feeds** : Export correct vers Meta/Google
5. **UX** : Interface intuitive back-office

## 🏗️ Architecture Conditionnements

### **Types de Conditionnements**

#### **Single (Unité) — Par Défaut**
```yaml
type: "single"
usage: "Vente à l'unité standard"
exemples:
  - "1 Tabouret Romeo"
  - "1 Luminaire Suspension"
  - "1 Vase Décoratif"

regles:
  - base_quantity: 1
  - is_default: true (toujours)
  - min_order_quantity: 1 (généralement)
  - Pas de discount_rate
```

#### **Pack (Multi-unités) — Lots Fixes**
```yaml
type: "pack"
usage: "Lots prédéfinis avec économies"
exemples:
  - "Pack 4 Chaises Dining"
  - "Set 6 Verres Collection"
  - "Lot 3 Coussins Assortis"

regles:
  - base_quantity: 2-20 (typique)
  - discount_rate: 5-20% (dégressif)
  - min_order_quantity: 1 pack
  - Prix calculé automatiquement ou fixe
```

#### **Bulk (Vrac/Palette) — Volumes**
```yaml
type: "bulk"
usage: "Grosses quantités professionnelles"
exemples:
  - "Palette 50 Tabourets"
  - "Carton 100 Accessoires"
  - "Container 500 Unités"

regles:
  - base_quantity: 20+ (volumes)
  - discount_rate: 15-40% (très dégressif)
  - min_order_quantity: 1 palette/carton
  - Tarifs négociés Pro
```

#### **Custom (Sur-mesure) — Spéciaux**
```yaml
type: "custom"
usage: "Conditionnements clients spécifiques"
exemples:
  - "Assortiment Projet Hôtel"
  - "Kit Installation Complète"
  - "Bundle Personnalisé"

regles:
  - base_quantity: variable
  - Prix négocié/calculé
  - MOQ selon accord client
  - Validation manuelle requise
```

## 💰 Règles Tarifaires

### **Calcul Prix Packages**

#### **Mode Automatique (Recommandé)**
```typescript
// Prix package = (Prix unitaire × Quantité × (1 - Remise))
function calculatePackagePrice(product: Product, package: ProductPackage): number {
  const basePrice = product.price_ht;
  const quantity = package.base_quantity;
  const discount = package.discount_rate || 0;
  
  // Prix brut package
  const grossPrice = basePrice * quantity;
  
  // Application remise
  const netPrice = grossPrice * (1 - discount);
  
  return Math.round(netPrice * 100) / 100; // Arrondi 2 décimales
}

// Exemples
const tabouret = { price_ht: 75.00 };
const pack4 = { base_quantity: 4, discount_rate: 0.10 };
// Résultat: 75.00 × 4 × (1 - 0.10) = 270.00€ HT
```

#### **Mode Manuel (Cas Spéciaux)**
```typescript
// Prix fixe défini manuellement
interface ProductPackage {
  unit_price_ht?: number;  // Prix unitaire spécifique
  // Si défini, ignore price_ht du produit parent
}

// Exemple : prix négocié palette
const palettePack = {
  base_quantity: 50,
  unit_price_ht: 65.00,  // Au lieu de 75.00
  // Prix total: 65.00 × 50 = 3,250.00€ HT
};
```

### **Remises Dégressives Standards**

| Type Package | Quantité | Remise Typique | Usage |
|--------------|----------|----------------|-------|
| **Single** | 1 | 0% | Prix catalogue |
| **Pack Mini** | 2-4 | 5-10% | Particuliers |
| **Pack Standard** | 5-12 | 10-15% | Petits Pro |
| **Bulk** | 20-50 | 15-25% | Grossistes |
| **Palette** | 50+ | 25-40% | Grands comptes |

### **MOQ (Minimum Order Quantity)**

#### **Règles par Type**
```typescript
// MOQ recommandés par secteur
const MOQ_DEFAULTS = {
  mobilier_lourd: {      // Canapés, armoires
    single: 1,
    pack: 1,
    bulk: 1             // Palette entière obligatoire
  },
  mobilier_leger: {      // Chaises, tabourets
    single: 1,
    pack: 1,  
    bulk: 2             // Min 2 palettes
  },
  accessoires: {         // Déco, luminaires
    single: 2,           // Min 2 pièces
    pack: 1,
    bulk: 5             // Min 5 cartons
  },
  consommables: {        // Bougies, textiles
    single: 5,
    pack: 2,
    bulk: 10
  }
};
```

#### **Logique MOQ Business**
- **B2C** : MOQ faibles (1-2 unités max)
- **B2B Détail** : MOQ modérés (2-5 unités)
- **B2B Grossiste** : MOQ élevés (palette/carton complet)
- **Export** : MOQ container selon destination

## 🎨 UX Back-Office

### **Interface Gestion Packages**

#### **Écran Principal Produit**
```typescript
// Section "Conditionnements" dans fiche produit
interface PackageFormSection {
  // Package par défaut (toujours Single)
  default_package: {
    display: "Unité - 75.00€ HT";
    editable: false;  // Seulement MOQ modifiable
  };
  
  // Packages additionnels
  additional_packages: PackageForm[];
  
  // Actions
  actions: {
    add_pack: () => void;
    add_bulk: () => void; 
    add_custom: () => void;
  };
}
```

#### **Formulaire Package**
```typescript
interface PackageForm {
  // Obligatoire
  name: string;              // "Pack 4 chaises"
  type: PackageType;         // select: pack, bulk, custom
  base_quantity: number;     // input number
  
  // Pricing (exclusif)
  pricing_mode: 'automatic' | 'manual';
  discount_rate?: number;    // % si automatic
  unit_price_ht?: number;    // € si manual
  
  // Configuration
  min_order_quantity: number; // MOQ ce package
  is_active: boolean;        // Checkbox disponible
  
  // Optionnel
  description?: string;      // Détails package
}
```

### **Validation Rules UX**

#### **Contraintes Obligatoires**
```typescript
const PACKAGE_VALIDATION = {
  name: {
    required: true,
    maxLength: 100,
    unique: true // Par produit
  },
  
  base_quantity: {
    min: 1,
    max: 9999,
    step: 1
  },
  
  discount_rate: {
    min: 0,
    max: 0.50,    // Max 50% remise
    step: 0.01    // Précision 1%
  },
  
  min_order_quantity: {
    min: 1,
    max: base_quantity // Pas plus que la quantité package
  }
};
```

#### **Business Logic Validation**
```typescript
// Vérifications métier
function validatePackage(package: PackageForm, product: Product): ValidationResult {
  const errors: string[] = [];
  
  // Prix cohérent
  if (package.pricing_mode === 'manual' && package.unit_price_ht) {
    if (package.unit_price_ht >= product.price_ht) {
      errors.push("Prix package ne peut être supérieur au prix unitaire");
    }
  }
  
  // Remise cohérente  
  if (package.discount_rate && package.discount_rate > 0.40) {
    errors.push("Remise supérieure à 40% nécessite validation Owner");
  }
  
  // MOQ logique
  if (package.type === 'bulk' && package.min_order_quantity < 2) {
    errors.push("Package Bulk nécessite MOQ minimum 2");
  }
  
  return { isValid: errors.length === 0, errors };
}
```

## 📤 Impact Exports Feeds

### **Export Google Merchant**

#### **Gestion Package Default**
```typescript
// Seul le package par défaut (single) exporté vers Google
function generateGoogleFeed(product: Product): GoogleFeedItem {
  const defaultPackage = product.packages.find(p => p.is_default);
  
  return {
    id: product.sku,
    title: product.name,
    price: `${calculatePrice(product, defaultPackage)} EUR`,
    availability: mapStatus(product.status),
    // ... autres champs Google
  };
}
```

#### **Remises dans Custom Labels**
```typescript
// Indication packages disponibles en custom labels
function generateCustomLabels(product: Product): string[] {
  const labels = [];
  
  // Label remises disponibles
  const maxDiscount = Math.max(...product.packages.map(p => p.discount_rate || 0));
  if (maxDiscount > 0) {
    labels.push(`Jusqu'à -${Math.round(maxDiscount * 100)}%`);
  }
  
  // Label packages multiples
  if (product.packages.length > 1) {
    labels.push("Conditionnements multiples");
  }
  
  return labels;
}
```

### **Export Facebook Meta**

#### **Variantes Packages**
```typescript
// Chaque package = variant Facebook avec item_group_id
function generateFacebookFeed(product: Product): FacebookFeedItem[] {
  return product.packages
    .filter(p => p.is_active)
    .map(package => ({
      id: `${product.sku}-${package.type}-${package.base_quantity}`,
      title: `${product.name} - ${package.name}`,
      price: `${calculatePrice(product, package)} EUR`,
      item_group_id: product.sku, // Grouper les variants
      quantity_to_sell_on_facebook: package.min_order_quantity,
      // ... autres champs Facebook
    }));
}
```

## 🔄 Migrations & Évolutions

### **V1 → V2 : Fonctionnalités Avancées**

#### **Packages Dynamiques**
```typescript
// V2: Calcul automatique selon volume commande
interface DynamicPackage {
  tier_rules: {
    min_quantity: number;
    discount_rate: number;
  }[];
}

// Exemple: Remise progressive automatique
const dynamicRules = [
  { min_quantity: 1, discount_rate: 0.00 },   // 1-4: prix normal
  { min_quantity: 5, discount_rate: 0.10 },   // 5-19: -10%
  { min_quantity: 20, discount_rate: 0.20 },  // 20-49: -20%
  { min_quantity: 50, discount_rate: 0.30 }   // 50+: -30%
];
```

#### **Packages Temporaires**
```typescript
// V2: Promotions package limitées dans le temps
interface TemporaryPackage extends ProductPackage {
  valid_from: DateTime;
  valid_until: DateTime;
  promotion_name: string;  // "Soldes Été 2024"
}
```

### **Data Migration V1**
```sql
-- Création packages par défaut pour produits existants
INSERT INTO product_packages (product_id, name, type, base_quantity, is_default, is_active, min_order_quantity)
SELECT 
  id as product_id,
  'Unité' as name,
  'single' as type,
  1 as base_quantity,
  true as is_default,
  true as is_active,
  1 as min_order_quantity
FROM products 
WHERE id NOT IN (SELECT DISTINCT product_id FROM product_packages);
```

Cette architecture packages assure flexibilité maximale tout en préservant simplicité d'usage pour MVP V1.