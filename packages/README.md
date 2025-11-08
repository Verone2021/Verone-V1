# 📦 Packages - Monorepo npm workspaces

Ce dossier contient la structure **monorepo activée** pour Vérone Back Office.

✅ **IMPORTANT** : Cette architecture est **ACTIVE depuis 2025-11-07**.

---

## 📂 Structure packages/

```
packages/
└── @verone/
    ├── types/        ✅ Types TypeScript partagés (Supabase + Business)
    ├── utils/        ✅ Utilitaires et helpers (cn, formatters, validators)
    ├── kpi/          ✅ Configuration KPI et métriques business
    ├── ui/           ⚠️ Design System + composants (en cours)
    ├── eslint-config/✅ Configuration ESLint partagée
    └── prettier-config/ ✅ Configuration Prettier partagée
```

---

## 🚀 Packages Disponibles

### ✅ @verone/types (v1.0.0)

Types TypeScript partagés pour database et business.

**Usage** :

```typescript
import { Database, Tables } from '@verone/types';
import { Collection, VariantGroup } from '@verone/types';
```

**Contenu** : 8 fichiers types (supabase, collections, variants, etc.)

---

### ✅ @verone/utils (v1.0.0)

Utilitaires et helpers communs.

**Usage** :

```typescript
import { cn, formatPrice, generateSKU } from '@verone/utils';
```

**Contenu** : 18+ fonctions (formatage, génération, validation, performance)

---

### ✅ @verone/kpi (v1.0.0)

Configuration KPI et métriques business.

**Usage** :

```typescript
import { KPIConfig, kpiRegistry } from '@verone/kpi';
```

**Contenu** : Types KPI, registry, 6 catégories (users, orgs, catalogue, stocks, orders, finance)

---

### ⚠️ @verone/ui (v1.0.0)

Design System V2 + composants UI (shadcn/ui + Radix).

**Statut** : Structure créée, build en cours (erreurs imports à fixer)

**Usage prévu** :

```typescript
import { ChannelBadge, StockKPICard } from '@verone/ui';
import { colors, spacing } from '@verone/ui/tokens';
```

**Contenu** : Tokens, thèmes, composants Stock

---

### ✅ @verone/eslint-config (v1.0.0)

Configuration ESLint stricte partagée.

**Usage** :

```json
{
  "extends": "@verone/eslint-config"
}
```

---

### ✅ @verone/prettier-config (v1.0.0)

Configuration Prettier partagée.

**Usage** :

```json
"@verone/prettier-config"
```

---

## 🔧 npm Workspaces

**Configuration activée** dans `package.json` racine :

```json
{
  "workspaces": ["packages/@verone/*"]
}
```

**Symlinks automatiques** :

- `node_modules/@verone/types` → `packages/@verone/types`
- `node_modules/@verone/utils` → `packages/@verone/utils`
- `node_modules/@verone/kpi` → `packages/@verone/kpi`
- `node_modules/@verone/ui` → `packages/@verone/ui`

---

## 📋 Scripts Disponibles

### Build tous les packages

```bash
npm run build:packages
```

### Type check tous les packages

```bash
npm run type-check:packages
```

### Clean tous les packages

```bash
npm run clean:packages
```

### Build package spécifique

```bash
cd packages/@verone/types && npm run build
```

---

## 📖 Documentation

**Récapitulatif création** : [docs/monorepo/PACKAGES-CREATED-2025-11-07.md](../docs/monorepo/PACKAGES-CREATED-2025-11-07.md)
**Plan migration** : [docs/monorepo/migration-plan.md](../docs/monorepo/migration-plan.md)
**Design System V2** : [docs/architecture/design-system.md](../docs/architecture/design-system.md)

---

## 🚧 Statut Actuel

✅ **3/4 packages buildés** (types, utils, kpi)
⚠️ **1/4 package en cours** (ui - imports à fixer)
✅ **npm workspaces activé**
⚠️ **npm install bloqué** (workaround : symlinks manuels)

---

**Activé le** : 2025-11-07
**Mainteneur** : Romeo Dos Santos
