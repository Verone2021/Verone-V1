# @verone/types

Types TypeScript partagés pour le monorepo Vérone (Supabase + Business Logic).

## 📦 Contenu

### Types Supabase

- `supabase.ts` - Types générés depuis le schéma Supabase
- `database.ts` - Extensions et helpers pour types database

### Types Business

- `collections.ts` - Types pour collections produits
- `variant-groups.ts` - Types pour groupes de variantes
- `variant-attributes-types.ts` - Attributs de variantes (couleur, matériau, etc.)
- `reception-shipment.ts` - Types pour réceptions et expéditions
- `room-types.ts` - Types pour pièces (salons, chambres, etc.)
- `business-rules.ts` - Types pour règles métier

## 🚀 Usage

### Installation

Ce package est local au monorepo, géré via npm workspaces.

### Import

```typescript
// Import tous les types
import type { Database, Product, Collection } from '@verone/types';

// Import spécifique depuis un fichier
import type { Database } from '@verone/types/supabase';
```

## 🔧 Scripts

```bash
# Build types
npm run build

# Type check (sans build)
npm run type-check

# Clean dist
npm run clean
```

## 📝 Conventions

- Tous les types sont exportés depuis `src/index.ts`
- Les interfaces de business logic DOIVENT être exportées
- Les types Supabase sont générés automatiquement (ne pas modifier manuellement)

## 🔗 Dépendances

- `typescript` (dev) - Compiler TypeScript

## 📚 Documentation

Voir `docs/monorepo/migration-plan.md` pour le plan de migration complet.
