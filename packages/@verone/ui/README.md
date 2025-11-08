# @verone/ui

Composants UI et Design System pour le monorepo Vérone (shadcn/ui + Radix UI + Design System V2).

## 📦 Contenu

### Design System

- `tokens/` - Design tokens (couleurs, spacing, typography, shadows)
- `themes/` - Thèmes (light, dark)
- `utils.ts` - Utilitaires (cn pour class merging)

### Composants UI

- `components/stock/` - Composants spécialisés Stock
  - `ChannelBadge` - Badge canal de vente
  - `ChannelFilter` - Filtre multi-canaux
  - `StockKPICard` - Carte KPI stock
  - `StockMovementCard` - Carte mouvement stock

## 🚀 Usage

### Installation

Ce package est local au monorepo, géré via npm workspaces.

### Import Composants

```typescript
// Import composants stock
import { ChannelBadge, StockKPICard } from '@verone/ui';

// Import tokens et thèmes
import { colors, spacing } from '@verone/ui/tokens';
import { lightTheme } from '@verone/ui/themes';

// Import utilitaire cn
import { cn } from '@verone/ui';
```

### Utilisation

```typescript
import { ChannelBadge } from '@verone/ui';

export function MyComponent() {
  return (
    <ChannelBadge
      channel="b2b_pro"
      variant="default"
    />
  );
}
```

## 🎨 Design System V2

Le Design System V2 est basé sur :

- **shadcn/ui** - Composants accessibles avec Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Design Tokens** - Variables centralisées (couleurs, spacing, etc.)

### Tokens Disponibles

```typescript
import { colors, spacing, typography, shadows } from '@verone/ui/tokens';

// Couleurs
colors.primary.main; // '#2563eb'
colors.success.main; // '#10b981'

// Spacing
spacing.xs; // '0.25rem'
spacing.md; // '1rem'

// Typography
typography.fontSize.base; // '1rem'
typography.fontWeight.medium; // '500'
```

## 🔧 Scripts

```bash
# Build components
npm run build

# Type check
npm run type-check

# Clean dist
npm run clean

# Storybook (à venir)
npm run storybook
npm run build-storybook
```

## 📝 Conventions

- Tous les composants DOIVENT être exportés depuis `src/index.ts`
- Les composants utilisent TypeScript strict
- Props DOIVENT être typées avec des interfaces
- Utiliser `cn()` pour merge className (pattern shadcn/ui)

## 🔗 Dépendances

### Peer Dependencies

- `react` ^18.3.1
- `react-dom` ^18.3.1

### Dependencies

- `@radix-ui/*` - Composants accessibles headless
- `class-variance-authority` - Variants management
- `clsx` + `tailwind-merge` - Class merging
- `lucide-react` - Icônes

## 📚 Documentation

- Design System V2 : `docs/architecture/design-system.md`
- Migration plan : `docs/monorepo/migration-plan.md`
