# @verone/kpi

Documentation KPI et configuration YAML pour le monorepo Vérone.

## 📦 Contenu

### Types

- `KPIConfig` - Interface configuration KPI
- `kpiRegistry` - Registry des KPI disponibles

## 🚀 Usage

### Installation

Ce package est local au monorepo, géré via npm workspaces.

### Import

```typescript
import { KPIConfig, kpiRegistry } from '@verone/kpi';
```

### Exemple

```typescript
import { KPIConfig } from '@verone/kpi';

const customKPI: KPIConfig = {
  id: 'total-users',
  name: 'Utilisateurs Total',
  description: 'Nombre total utilisateurs actifs',
  category: 'users',
  query: 'SELECT COUNT(*) FROM users WHERE is_active = true',
  format: 'number',
  threshold: {
    warning: 50,
    critical: 100,
  },
};
```

## 📋 Catégories KPI

- `users` - Métriques utilisateurs
- `organisations` - Métriques organisations (clients, fournisseurs, partenaires)
- `catalogue` - Métriques catalogue produits
- `stocks` - Métriques stock et mouvements
- `orders` - Métriques commandes
- `finance` - Métriques financières

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

- Tous les types sont exportés depuis `src/index.ts`
- TypeScript strict mode activé
- KPI documentés avec interfaces typées
- Catégorisation par module métier

## 🔗 Dépendances

### DevDependencies

- `typescript` ^5.3.3 - TypeScript compiler

## 📚 Documentation

- KPI documentation : `docs/metrics/`
- Migration plan : `docs/monorepo/migration-plan.md`
