# 🏗️ MONOREPO CONTEXT - Vérone Back Office

**Chargement** : Uniquement si travail architecture monorepo, migration progressive

---

## 🎯 QUAND MIGRER VERS MONOREPO ?

**Après Phase 1 - Critères** :

- ✅ Phase 1 déployée en production stable
- ✅ Tous modules core validés (auth, catalogue, commandes, stock)
- ✅ Storybook complet avec tous composants documentés
- ✅ KPI centralisés en YAML
- ✅ Zéro erreur console sur tous workflows

**Phase prévue** : Q2 2026 (Phase 4)

---

## 💡 POURQUOI MONOREPO ?

- **Partage code** : Packages communs (ui, types, kpi, config)
- **Build optimisé** : Nx/Turborepo - Build uniquement code modifié
- **Versioning cohérent** : Toutes dépendances alignées
- **DX améliorée** : Générateurs de code, scripts communs
- **Scalabilité** : Ajouter apps/services facilement

---

## 🏗️ ARCHITECTURE CIBLE

```
apps/
  ├── api/          # Backend NestJS
  │   ├── src/
  │   │   ├── modules/
  │   │   │   ├── auth/
  │   │   │   ├── catalogue/
  │   │   │   ├── orders/
  │   │   │   └── stock/
  │   │   └── database/
  │   └── package.json
  └── web/          # Frontend Next.js
      ├── app/
      ├── components/
      └── package.json

packages/
  ├── ui/           # Design system Storybook
  ├── kpi/          # KPI YAML + hooks
  ├── types/        # DTO communs API ↔ Web
  ├── config/       # ESLint, Prettier, TS
  └── utils/        # Helpers communs

tools/
  ├── scripts/      # Audit, migration, seeds
  └── generators/   # Plop templates

docs/             # Documentation (inchangée)
supabase/         # Migrations DB (inchangée)
```

---

## 🔧 OUTILS MONOREPO

**Choix recommandé** : **Turborepo** (simple, performant)

```bash
# Installation
npx create-turbo@latest

# Configuration turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Alternative** : **Nx** (plus features, plus complexe)

---

## 📋 MIGRATION PROGRESSIVE (PAS DE BIG BANG)

### Étape 1 : Créer structure monorepo vide

```bash
# Initialiser Turborepo
npx create-turbo@latest verone-monorepo

# Structure créée :
verone-monorepo/
├── apps/
├── packages/
├── turbo.json
└── package.json
```

### Étape 2 : Migrer `packages/ui` (composants + Storybook)

```bash
# Déplacer composants ui-v2/
mv src/components/ui-v2 packages/ui/src/components

# Déplacer stories
mv src/stories packages/ui/stories

# Ajouter package.json
# packages/ui/package.json
{
  "name": "@verone/ui",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

### Étape 3 : Migrer `packages/types`

```typescript
// packages/types/src/index.ts
export * from './organisation'
export * from './product'
export * from './order'
// ... tous types DTO communs
```

### Étape 4 : Créer `apps/web` (Next.js existant)

```bash
# Déplacer application Next.js
mv src apps/web/src
mv app apps/web/app

# Mise à jour imports
# AVANT : import { Button } from '@/components/ui-v2/button'
# APRÈS : import { Button } from '@verone/ui'
```

### Étape 5 : Créer `apps/api` (nouveau NestJS)

```bash
# Initialiser NestJS
cd apps/api
nest new api --skip-git

# Structure modules
apps/api/src/modules/
├── auth/
├── catalogue/
├── orders/
└── stock/
```

### Étape 6 : Migrer API Routes Next.js → NestJS endpoints

**Module par module, avec feature flags** :

```typescript
// apps/web/.env.local
USE_NESTJS_API=false  # Phase 1 : Next.js API Routes
USE_NESTJS_API=true   # Phase 2 : NestJS endpoints

// apps/web/lib/api-client.ts
const API_BASE = process.env.USE_NESTJS_API
  ? 'http://localhost:4000/api'  // NestJS
  : '/api'                        // Next.js API Routes
```

### Étape 7 : Cleanup ancien code

```bash
# Supprimer Next.js API Routes après migration complète
rm -rf apps/web/app/api

# Supprimer composants dupliqués
rm -rf apps/web/src/components/ui-v2
```

---

## 🚀 COMMANDES MONOREPO

```bash
# Dev simultané (tous apps)
turbo dev

# Dev spécifique
turbo dev --filter=@verone/web
turbo dev --filter=@verone/api

# Build tous packages
turbo build

# Build sélectif (uniquement modifiés)
turbo build --filter=[main]

# Tests tous packages
turbo test

# Lint
turbo lint

# Format
turbo format
```

---

## 📦 EXEMPLE PACKAGE PARTAGÉ

**packages/utils/src/format-currency.ts** :

```typescript
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount)
}
```

**Usage dans web et api** :

```typescript
// apps/web/src/components/price-display.tsx
import { formatCurrency } from '@verone/utils'

export function PriceDisplay({ amount }: { amount: number }) {
  return <span>{formatCurrency(amount)}</span>
}

// apps/api/src/modules/orders/orders.service.ts
import { formatCurrency } from '@verone/utils'

export class OrdersService {
  formatOrderTotal(order: Order): string {
    return formatCurrency(order.total_amount)
  }
}
```

---

## 🎯 BÉNÉFICES MONOREPO

**Performance** :
- Build incrémental (uniquement packages modifiés)
- Cache distribué entre builds
- Parallélisation tasks

**Qualité** :
- Types partagés (source unique vérité)
- Lint/format/tests uniformes
- Composants UI réutilisables garantis

**DX** :
- Hot reload cross-packages
- Jump-to-definition cross-workspace
- Refactoring safe (rename propagé)

---

## 🎯 ROADMAP MIGRATION

**Q4 2025 (Phase 1)** : Stabilisation monolithe Next.js
**Q1 2026 (Phase 2-3)** : Préparation architecture (packages/)
**Q2 2026 (Phase 4)** : Migration monorepo progressive
**Q3 2026 (Phase 5)** : Cleanup + optimisations

---

**Plan détaillé** : `docs/monorepo/migration-plan.md`

**Dernière mise à jour** : 2025-10-23
**Mainteneur** : Romeo Dos Santos
