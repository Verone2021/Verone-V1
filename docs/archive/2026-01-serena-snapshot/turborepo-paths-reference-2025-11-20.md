# Turborepo Phase 4 - Référence Chemins (2025-11-20)

**Date création** : 2025-11-20
**Contexte** : Migration Phase 4 Turborepo (3 apps + 25 packages)
**Objectif** : Source de vérité pour chemins absolus et relatifs - Anti-hallucination

---

## ✅ CHEMINS CORRECTS (Phase 4 Turborepo)

### Applications

**Back Office (CRM/ERP)** :

```typescript
apps/back-office/src/app/          // Pages Next.js (App Router)
apps/back-office/src/components/   // Composants spécifiques back-office
apps/back-office/src/lib/           // Utilitaires back-office
apps/back-office/src/types/         // Types TypeScript (supabase.ts)
```

**Site Internet (E-commerce)** :

```typescript
apps/site-internet/src/app/         // Pages e-commerce public
apps/site-internet/src/components/  // Composants site public
```

**LinkMe (Commissions Apporteurs)** :

```typescript
apps/linkme/src/app/                // Pages système commissions
apps/linkme/src/components/         // Composants LinkMe
```

### Packages Partagés (@verone/\*)

**Design System** :

```typescript
packages/@verone/ui/src/components/         // 54 composants UI (Button, Card, etc.)
packages/@verone/ui/src/lib/design-system/  // Tokens, themes, utils
packages/@verone/ui/src/themes/             // theme-v2.ts (gradients modernes)
```

**Business Logic** :

```typescript
packages/@verone/products/src/      // Composants & hooks produits
packages/@verone/orders/src/        // Composants commandes
packages/@verone/stock/src/         // Composants stock & alertes
packages/@verone/customers/src/     // Composants clients
```

**Types & Utils** :

```typescript
packages/@verone/types/src/         // Types partagés (Database, etc.)
packages/@verone/utils/src/lib/     // Utilitaires (cn, formatPrice, etc.)
packages/@verone/testing/src/       // Helpers tests
```

### Imports Corrects (Exemples)

```typescript
// ✅ Design System
import { Button, Card, Dialog } from '@verone/ui';

// ✅ Composants Business
import { ProductCard, ProductThumbnail } from '@verone/products';
import { StockAlertCard } from '@verone/stock';
import { QuickPurchaseOrderModal } from '@verone/orders';

// ✅ Types
import type { Database } from '@verone/types';

// ✅ Utils
import { cn, formatPrice } from '@verone/utils';
```

### Documentation & Configuration

```typescript
docs/                               // Documentation projet
docs/architecture/                  // Architecture, composants
docs/architecture/COMPOSANTS-CATALOGUE.md  // 86 composants référencés
docs/audits/2025-11/               // Rapports audits novembre

supabase/migrations/                // Migrations SQL
supabase/seed.sql                   // Données test

.claude/                            // Configuration MCP
.claude/settings.json               // Permissions & hooks
.claude/contexts/                   // Contextes spécialisés

.serena/                            // Mémoires Serena
.serena/memories/                   // Fichiers mémoire
```

---

## ❌ CHEMINS OBSOLÈTES (Phase 1-3 - N'EXISTENT PLUS)

**ATTENTION** : Ces chemins ont été **SUPPRIMÉS** lors de la migration Phase 4 Turborepo (2025-11-19).

```typescript
// ❌ PHASE 1-3 OBSOLÈTE
src/app/                            // → apps/back-office/src/app/
src/components/                     // → packages/@verone/ui/src/components/
src/lib/                            // → packages/@verone/utils/src/lib/
src/lib/design-system/              // → packages/@verone/ui/src/lib/design-system/
src/lib/theme-v2.ts                 // → packages/@verone/ui/src/themes/theme-v2.ts
src/components/ui-v2/               // → packages/@verone/ui/src/components/
src/shared/modules/                 // → packages/@verone/* (éclaté par domaine)
```

**Vérification** :

```bash
# Le dossier src/ à la racine N'EXISTE PLUS
find /Users/romeodossantos/verone-back-office-V1 -maxdepth 1 -name "src" -type d
# Résultat : (vide) ✅
```

---

## 🔧 COMMANDES ESSENTIELLES (Phase 4)

### Supabase Types Generation

```bash
# ✅ CORRECT (Phase 4)
supabase gen types typescript --local > apps/back-office/src/types/supabase.ts

# ❌ OBSOLÈTE (Phase 1-3)
supabase gen types typescript --local > src/types/supabase.ts
```

### Build & Validation

```bash
# Build (depuis racine monorepo)
npm run build                       # Build toutes apps + packages
npm run build:back-office          # Build back-office seulement

# Type-check
npm run type-check                 # Vérifier TypeScript strict

# Dev
npm run dev                         # Tous services (Turborepo --parallel)
```

### Imports Package Local

```bash
# Depuis apps/back-office/package.json
"dependencies": {
  "@verone/ui": "workspace:*",      # Version Turborepo workspace
  "@verone/products": "workspace:*",
  "@verone/types": "workspace:*"
}
```

---

## 📋 RÈGLES VALIDATION CHEMINS

**AVANT d'utiliser un chemin** :

1. ✅ **Vérifier existence réelle** :

   ```bash
   ls -la [chemin]
   ```

2. ✅ **Préférer chemins relatifs packages** :

   ```typescript
   // ✅ Bon
   import { Button } from '@verone/ui';

   // ❌ Mauvais (chemin absolu fragile)
   import { Button } from '../../../packages/@verone/ui/src/components/button';
   ```

3. ✅ **Consulter catalogue composants** :

   ```bash
   Read('docs/architecture/COMPOSANTS-CATALOGUE.md')
   ```

4. ✅ **Tester import compile** :
   ```bash
   npm run type-check
   ```

---

## 🎯 ANTI-HALLUCINATION WORKFLOW

**Si erreur "fichier introuvable"** :

1. ❌ **NE PAS** chercher dans `src/` (n'existe plus)
2. ✅ **Chercher** dans `apps/back-office/src/` ou `packages/@verone/*/src/`
3. ✅ **Valider** avec `ls -la [chemin]`
4. ✅ **Référencer** cette mémoire pour chemins corrects

**Si besoin créer nouveau composant** :

1. ✅ **Consulter** `COMPOSANTS-CATALOGUE.md` (existe déjà ?)
2. ✅ **Identifier** package cible (`@verone/ui`, `@verone/products`, etc.)
3. ✅ **Créer** dans `packages/@verone/[package]/src/`
4. ✅ **Exporter** dans `packages/@verone/[package]/src/index.ts`

---

## 📊 STATISTIQUES ARCHITECTURE

**Applications** : 3

- back-office (Port 3000)
- site-internet (Port 3001)
- linkme (Port 3002)

**Packages partagés** : 25

- @verone/ui (Design System - 54 composants)
- @verone/products (Composants produits)
- @verone/orders (Composants commandes)
- @verone/stock (Composants stock)
- @verone/customers (Composants clients)
- @verone/types (Types partagés)
- @verone/utils (Utilitaires)
- ... (18 autres packages)

**Composants UI documentés** : 86
**Tables database** : 78
**Triggers automatiques** : 158
**RLS policies** : 239

---

## 🔗 RÉFÉRENCES

**Documentation Phase 4** :

- `CLAUDE.md` (lignes 38-85) - Règles chemins Turborepo
- `docs/architecture/COMPOSANTS-CATALOGUE.md` - Catalogue composants
- `docs/architecture/AUDIT-MIGRATION-TURBOREPO.md` - Audit migration
- `.claude/contexts/monorepo.md` - Context architecture

**Mémoires Serena actualisées** :

- `auth-multi-canal-phase1-phase2-complete-2025-11-19.md` (Phase 4)
- `purchase-orders-validated-workflow-2025-11-19.md` (Phase 4)
- `turborepo-paths-reference-2025-11-20.md` (cette mémoire)

---

**Dernière validation** : 2025-11-20
**Mainteneur** : Romeo Dos Santos
**Version** : 1.0.0 (Phase 4 Turborepo)

**Prochaine révision** : 2026-02-20 (Audit trimestriel Q1)
