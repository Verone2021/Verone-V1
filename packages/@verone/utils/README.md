# @verone/utils

Utilitaires et helpers partagés pour le monorepo Vérone.

## 📦 Contenu

### Utilitaire CSS

- `cn()` - Class name utility (clsx + tailwind-merge)

### Formatage

- `formatPrice()` - Formate prix en euros avec devise
- `formatPriceFromCents()` - Convertit centimes → euros formatés
- `formatWeight()` - Formate poids (kg ou g selon valeur)
- `formatDimensions()` - Formate dimensions (L × W × H)
- `formatCurrency()` - Formate montant avec devise
- `formatDate()` - Formate date (locale française)
- `formatDateShort()` - Formate date courte (15/03/2024)

### Génération

- `generateSKU()` - Génère SKU automatique format Vérone
- `generateSlug()` - Génère slug URL-friendly

### Validation

- `validateSKU()` - Valide format SKU Vérone
- `validateEmail()` - Valide format email

### Calculs Business

- `calculateDiscountPercentage()` - Calcule % remise
- `applyDiscount()` - Applique remise à un prix

### Performance

- `checkSLOCompliance()` - Valide performance SLO
- `debounce()` - Debounce function pour optimisation

### Configuration

- `statusConfig` - Configuration statuts produits (in_stock, out_of_stock, etc.)

## 🚀 Usage

### Installation

Ce package est local au monorepo, géré via npm workspaces.

### Import

```typescript
// Import fonction cn
import { cn } from '@verone/utils';

// Import utilitaires formatage
import { formatPrice, formatWeight } from '@verone/utils';

// Import validation
import { validateSKU, validateEmail } from '@verone/utils';
```

### Exemples

```typescript
import {
  cn,
  formatPrice,
  generateSKU,
  checkSLOCompliance,
} from '@verone/utils';

// Merge class names
const className = cn('text-base', isActive && 'font-bold');

// Formater prix
const priceDisplay = formatPrice(149.9); // "149,90 €"
const priceFromCents = formatPriceFromCents(14990); // "149,90 €"

// Générer SKU
const sku = generateSKU('mobilier', 'IKEA'); // "VER-MOB-IKE-123"

// Vérifier SLO performance
const startTime = Date.now();
// ... opération
const { isCompliant, duration } = checkSLOCompliance(startTime, 'dashboard');
if (!isCompliant) {
  console.warn(`Dashboard trop lent: ${duration}ms`);
}
```

## 🔧 Scripts

```bash
# Build package
npm run build

# Type check
npm run type-check

# Clean dist
npm run clean
```

## 📝 Conventions

- Toutes les fonctions sont exportées depuis `src/index.ts`
- TypeScript strict mode activé
- Fonctions documentées avec JSDoc
- Formats français par défaut (devise EUR, locale fr-FR)

## 🔗 Dépendances

### Dependencies

- `clsx` ^2.1.0 - Class name utility
- `tailwind-merge` ^2.2.1 - Merge Tailwind classes

### DevDependencies

- `typescript` ^5.3.3 - TypeScript compiler

## 📚 Documentation

- Migration plan : `docs/monorepo/migration-plan.md`
- Business rules : `docs/business-rules/`
