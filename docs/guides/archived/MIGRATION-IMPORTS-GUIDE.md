# 🔄 Guide Migration Imports Monorepo - VAGUE 4

**Date** : 2025-11-08  
**Objectif** : Remplacer 763 imports `@/components`, `@/shared`, `@/lib` → `@verone/*`  
**Durée estimée** : 3h30

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Table de Correspondance](#table-de-correspondance)
3. [Méthode Automatisée (Recommandé)](#méthode-automatisée-recommandé)
4. [Méthode Manuelle (Fallback)](#méthode-manuelle-fallback)
5. [Validation Post-Migration](#validation-post-migration)
6. [Troubleshooting](#troubleshooting)

---

## ✅ PRÉREQUIS

### 1. VAGUE 3 Terminée

- [ ] Package `@verone/integrations` créé
- [ ] 65 fichiers `apps/back-office/src/lib/` migrés vers packages @verone
- [ ] Build successful : `npm run build`
- [ ] Type-check OK : `npm run type-check`

### 2. Environnement

```bash
# Installer glob (si pas déjà installé)
npm install --save-dev glob

# Vérifier version Node
node --version  # >= 18.x recommandé

# Créer branche dédiée
git checkout -b feat/vague-4-migration-imports
```

### 3. Backup

```bash
# Commit actuel comme point de restauration
git add .
git commit -m "chore: Backup avant VAGUE 4 migration imports"
```

---

## 📊 TABLE DE CORRESPONDANCE

### Imports UI Components

| ❌ AVANT                                          | ✅ APRÈS                              |
| ------------------------------------------------- | ------------------------------------- |
| `import { Button } from '@/components/ui/button'` | `import { Button } from '@verone/ui'` |
| `import { Card } from '@/components/ui/card'`     | `import { Card } from '@verone/ui'`   |
| `import { Input } from '@/components/ui/input'`   | `import { Input } from '@verone/ui'`  |
| `import { Badge } from '@/components/ui/badge'`   | `import { Badge } from '@verone/ui'`  |

**Impact** : 267 occurrences

### Imports Business Modules

| ❌ AVANT                                                                         | ✅ APRÈS                                                   |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `import { useProducts } from '@/shared/modules/products/hooks'`                  | `import { useProducts } from '@verone/products'`           |
| `import { ProductCard } from '@/shared/modules/products/components/ProductCard'` | `import { ProductCard } from '@verone/products'`           |
| `import { useCategories } from '@/shared/modules/categories/hooks'`              | `import { useCategories } from '@verone/categories'`       |
| `import { useOrganisations } from '@/shared/modules/organisations/hooks'`        | `import { useOrganisations } from '@verone/organisations'` |
| `import { useToast } from '@/shared/modules/common/hooks'`                       | `import { useToast } from '@verone/common'`                |

**Mapping complet** :

- `@/shared/modules/admin` → `@verone/admin`
- `@/shared/modules/categories` → `@verone/categories`
- `@/shared/modules/channels` → `@verone/channels`
- `@/shared/modules/collections` → `@verone/collections`
- `@/shared/modules/common` → `@verone/common`
- `@/shared/modules/consultations` → `@verone/consultations`
- `@/shared/modules/customers` → `@verone/customers`
- `@/shared/modules/dashboard` → `@verone/dashboard`
- `@/shared/modules/finance` → `@verone/finance`
- `@/shared/modules/logistics` → `@verone/logistics`
- `@/shared/modules/notifications` → `@verone/notifications`
- `@/shared/modules/orders` → `@verone/orders`
- `@/shared/modules/organisations` → `@verone/organisations`
- `@/shared/modules/products` → `@verone/products`
- `@/shared/modules/stock` → `@verone/stock`
- `@/shared/modules/suppliers` → `@verone/suppliers`
- `@/shared/modules/testing` → `@verone/testing`
- `@/shared/modules/ui` → `@verone/ui-business`

**Impact** : 382 occurrences (259 app + 123 components)

### Imports Lib Utils

| ❌ AVANT                                               | ✅ APRÈS                                                |
| ------------------------------------------------------ | ------------------------------------------------------- |
| `import { cn } from '@/lib/utils'`                     | `import { cn } from '@verone/utils'`                    |
| `import { createClient } from '@/lib/supabase/client'` | `import { createClient } from '@verone/utils/supabase'` |
| `import { colors } from '@/lib/design-system'`         | `import { colors } from '@verone/ui/tokens'`            |
| `import { logger } from '@/lib/logger'`                | `import { logger } from '@verone/utils'`                |

**Mapping complet** :

- `@/lib/utils` → `@verone/utils`
- `@/lib/supabase/*` → `@verone/utils/supabase`
- `@/lib/design-system/*` → `@verone/ui/tokens`
- `@/lib/analytics/*` → `@verone/utils/analytics`
- `@/lib/monitoring/*` → `@verone/utils/monitoring`
- `@/lib/upload/*` → `@verone/utils/upload`
- `@/lib/validation/*` → `@verone/utils/validation`

**Impact** : 110 occurrences (78 app + 32 components)

### Imports Integrations (Post-VAGUE 3)

| ❌ AVANT                                                       | ✅ APRÈS                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `import { AbbyClient } from '@/lib/abby'`                      | `import { AbbyClient } from '@verone/integrations/abby'`                      |
| `import { GoogleMerchantClient } from '@/lib/google-merchant'` | `import { GoogleMerchantClient } from '@verone/integrations/google-merchant'` |
| `import { QontoClient } from '@/lib/qonto'`                    | `import { QontoClient } from '@verone/integrations/qonto'`                    |

**Impact** : 7 occurrences (6 Google Merchant + 1 Abby)

---

## 🤖 MÉTHODE AUTOMATISÉE (Recommandé)

### Étape 1 : Dry-Run (Preview)

```bash
# Prévisualiser changements SANS modifier fichiers
node scripts/migrate-imports-monorepo.js --dry-run

# Output attendu :
# 📊 MIGRATION STATISTICS
# Mode: 🔍 DRY RUN (preview only)
# Files processed: 326
# Files modified: 180-200
# Total replacements: 750-770
```

**Vérifications** :

- Nombre fichiers processed ≈ 326 (117 app + 205 components + 4 hooks)
- Nombre replacements ≈ 763
- Aucune erreur dans la section "Errors"

### Étape 2 : Exécution Réelle

```bash
# Appliquer changements
node scripts/migrate-imports-monorepo.js

# Mode verbose (debug)
node scripts/migrate-imports-monorepo.js --verbose
```

**Output attendu** :

```
🚀 Starting import migration...

✓ apps/back-office/src/app/canaux-vente/page.tsx (12 changes)
✓ apps/back-office/src/app/produits/catalogue/page.tsx (8 changes)
...

📊 MIGRATION STATISTICS
Mode: ✏️  WRITE MODE
Files processed: 326
Files modified: 185
Total replacements: 763

Replacements by pattern:
  - UI components: 267
  - Business modules: 382
  - Core utils: 78
  - Design system: 24
  - ...

✅ Migration complete! Remember to:
   1. Run: npm run type-check
   2. Run: npm run build
   3. Test critical pages manually
   4. Commit changes with descriptive message
```

### Étape 3 : Validation Type-Check

```bash
# Type-check immédiat
npm run type-check 2>&1 | tee type-check-post-vague4.log

# Résultat attendu : 0 erreurs
# Si erreurs → Voir section Troubleshooting
```

### Étape 4 : Build Validation

```bash
# Build complet
npm run build 2>&1 | tee build-post-vague4.log

# Résultat attendu : Build successful
# Durée : <25s (cible <20s)
```

---

## 🖐️ MÉTHODE MANUELLE (Fallback)

Si script automatisé échoue, utiliser VSCode Find & Replace avec regex.

### Pattern 1 - UI Components

**VSCode Find & Replace** :

```
Find (Regex): from ['"]@/components/ui/[^'"]+['"]
Replace: from '@verone/ui'

Files to include: apps/back-office/src/app/**/*.tsx, apps/back-office/src/components/**/*.tsx
```

**Consolidation imports multiples** (manuel) :

```typescript
// AVANT (plusieurs imports)
import { Button } from '@verone/ui';
import { Card } from '@verone/ui';
import { Input } from '@verone/ui';

// APRÈS (consolidé)
import { Button, Card, Input } from '@verone/ui';
```

### Pattern 2 - Business Modules

**Étape 1** : Admin

```
Find (Regex): from ['"]@/shared/modules/admin/[^'"]+['"]
Replace: from '@verone/admin'
```

**Étape 2** : Categories

```
Find (Regex): from ['"]@/shared/modules/categories/[^'"]+['"]
Replace: from '@verone/categories'
```

**Répéter pour** : channels, collections, common, consultations, customers, dashboard, finance, logistics, notifications, orders, organisations, products, stock, suppliers, testing, ui

### Pattern 3 - Lib Utils

**Étape 1** : Utils core

```
Find (Regex): from ['"]@/lib/utils['"]
Replace: from '@verone/utils'
```

**Étape 2** : Supabase

```
Find (Regex): from ['"]@/lib/supabase/[^'"]+['"]
Replace: from '@verone/utils/supabase'
```

**Étape 3** : Design System

```
Find (Regex): from ['"]@/lib/design-system/[^'"]+['"]
Replace: from '@verone/ui/tokens'
```

**Répéter pour** : analytics, monitoring, upload, validation

### Pattern 4 - Integrations

```
Find: from ['"]@/lib/abby/[^'"]+['"]
Replace: from '@verone/integrations/abby'

Find: from ['"]@/lib/google-merchant/[^'"]+['"]
Replace: from '@verone/integrations/google-merchant'

Find: from ['"]@/lib/qonto/[^'"]+['"]
Replace: from '@verone/integrations/qonto'
```

---

## ✅ VALIDATION POST-MIGRATION

### Checklist Automatisée

```bash
# 1. Vérifier aucun import ancien restant
echo "=== Checking @/shared/modules imports ==="
grep -r "from '@/shared/modules" src/ --include="*.ts" --include="*.tsx" | wc -l
# Résultat attendu : 0

echo "=== Checking @/lib imports (sauf middleware/auth) ==="
grep -r "from '@/lib" src/app src/components --include="*.ts" --include="*.tsx" | \
  grep -v "middleware" | grep -v "auth" | wc -l
# Résultat attendu : 0 (ou très faible si Option B VAGUE 3)

echo "=== Checking @/components/ui imports ==="
grep -r "from '@/components/ui" src/ --include="*.ts" --include="*.tsx" | wc -l
# Résultat attendu : 0

echo "=== Counting @verone imports ==="
grep -r "from '@verone/" src/ --include="*.ts" --include="*.tsx" | wc -l
# Résultat attendu : 750-800+

# 2. Type-check
npm run type-check

# 3. Build
npm run build

# 4. Lint
npm run lint
```

### Tests Manuels Critiques (15-20 fichiers)

**Pages prioritaires** :

```
✓ apps/back-office/src/app/page.tsx (Dashboard)
✓ apps/back-office/src/app/login/page.tsx
✓ apps/back-office/src/app/produits/catalogue/page.tsx
✓ apps/back-office/src/app/canaux-vente/google-merchant/page.tsx
✓ apps/back-office/src/app/commandes/clients/page.tsx
✓ apps/back-office/src/app/stocks/mouvements/page.tsx
✓ apps/back-office/src/app/admin/users/page.tsx
```

**Composants critiques** :

```
✓ apps/back-office/src/components/layout/app-sidebar.tsx
✓ apps/back-office/src/components/business/product-card-v2.tsx
✓ apps/back-office/src/components/business/universal-product-selector-v2.tsx
```

**Procédure test manuel** :

1. Ouvrir fichier dans VSCode
2. Vérifier imports en haut : tous `@verone/*` ?
3. Vérifier IntelliSense fonctionne (Ctrl+Space sur imports)
4. Aucune ligne rouge TypeScript ?

### Tests MCP Browser (Console Errors)

```typescript
// RÈGLE SACRÉE : 0 console errors

mcp__playwright__browser_navigate('http://localhost:3000');
mcp__playwright__browser_console_messages();
// Résultat attendu : [] (aucune erreur)

mcp__playwright__browser_navigate('http://localhost:3000/produits/catalogue');
mcp__playwright__browser_console_messages();
// Résultat attendu : [] (aucune erreur)

// Répéter pour 5-10 pages critiques
```

---

## 🐛 TROUBLESHOOTING

### Erreur 1 : Type-check échoue après migration

**Symptôme** :

```
error TS2307: Cannot find module '@verone/products' or its corresponding type declarations.
```

**Causes possibles** :

1. Package @verone/products pas buildé
2. tsconfig.json paths pas à jour

**Solution** :

```bash
# 1. Rebuild tous packages
npm run build

# 2. Vérifier tsconfig.json paths
cat tsconfig.json | grep "@verone/products"
# Doit contenir : "@verone/products": ["./packages/@verone/products/src"]

# 3. Restart TS Server VSCode
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Erreur 2 : Module not found runtime

**Symptôme** :

```
Error: Cannot find module '@verone/utils'
```

**Cause** : Cache Next.js obsolète

**Solution** :

```bash
# Clean cache Next.js
rm -rf .next
npm run dev
```

### Erreur 3 : Imports non consolidés (pas bloquant)

**Symptôme** :

```typescript
// Plusieurs imports du même package
import { Button } from '@verone/ui';
import { Card } from '@verone/ui';
import { Input } from '@verone/ui';
```

**Solution** : Consolidation manuelle (optionnelle)

```typescript
import { Button, Card, Input } from '@verone/ui';
```

**Outil automatisé** (optionnel) :

```bash
# Installer organize-imports-cli
npm install -g organize-imports-cli

# Exécuter sur tous fichiers
organize-imports-cli src/**/*.tsx
```

### Erreur 4 : Circular dependency warning

**Symptôme** :

```
Circular dependency detected:
  @verone/products -> @verone/common -> @verone/products
```

**Cause** : Import croisé entre packages

**Solution** :

1. Identifier la chaîne complète : `npm run build --verbose`
2. Refactoriser pour déplacer code partagé vers `@verone/common` ou `@verone/utils`
3. Éviter imports directs cross-packages

**Best practice** :

- Packages business (`@verone/products`, etc.) peuvent importer `@verone/common`, `@verone/utils`, `@verone/types`
- `@verone/common` ne doit PAS importer packages business
- Si besoin, créer nouveau package `@verone/shared-business`

### Erreur 5 : Import path not found (VSCode)

**Symptôme** : Ligne rouge sous import `@verone/*` dans VSCode

**Cause** : TS Server pas à jour ou cache

**Solution** :

```bash
# 1. Restart TS Server
Cmd+Shift+P → "TypeScript: Restart TS Server"

# 2. Rebuild workspace
Cmd+Shift+P → "Developer: Reload Window"

# 3. Si persiste, vérifier symlinks (npm workspaces)
ls -la node_modules/@verone
# Doit contenir symlinks vers packages/@verone/*
```

---

## 📊 CHECKLIST FINALE VAGUE 4

### Avant Commit

- [ ] Script migration exécuté avec succès
- [ ] 0 imports `@/shared/modules` restants
- [ ] 0 imports `@/components/ui` restants (sauf exceptions)
- [ ] 0 imports `@/lib` restants (sauf middleware/auth si applicable)
- [ ] 750+ imports `@verone/*` présents
- [ ] `npm run type-check` → 0 erreurs
- [ ] `npm run build` → Success
- [ ] `npm run lint` → 0 erreurs critiques
- [ ] Tests manuels 15-20 fichiers critiques OK
- [ ] Tests MCP Browser → 0 console errors

### Commit Message

```bash
git add .
git commit -m "$(cat <<'EOF'
feat(monorepo): VAGUE 4 - Migration imports massif (763 imports)

Remplacement complet imports @/components, @/shared, @/lib → @verone/*

Détails :
- UI components (267) : @/components/ui/* → @verone/ui
- Business modules (382) : @/shared/modules/* → @verone/* (18 packages)
- Lib utils (110) : @/lib/* → @verone/utils, @verone/integrations
- Total fichiers modifiés : 185-200
- Total imports migrés : 763

Validation :
✅ Type-check : 0 erreurs
✅ Build : Success (<25s)
✅ Lint : 0 erreurs critiques
✅ Tests manuels : 20 fichiers critiques OK
✅ MCP Browser : 0 console errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Après Commit

- [ ] Push sur branche feature
- [ ] Créer PR si workflow collaboratif
- [ ] Documenter breaking changes éventuels
- [ ] Préparer VAGUE 5 (cleanup)

---

## 📈 MÉTRIQUES DE SUCCÈS

| Métrique                 | Avant VAGUE 4 | Après VAGUE 4 | ✅  |
| ------------------------ | ------------- | ------------- | --- |
| Imports @verone/\*       | 88            | 750-800+      | ✅  |
| Imports @/shared/modules | 382           | 0             | ✅  |
| Imports @/components/ui  | 267           | 0             | ✅  |
| Imports @/lib            | 110           | 0-5           | ✅  |
| Erreurs TypeScript       | 0             | 0             | ✅  |
| Build time               | <25s          | <25s          | ✅  |
| Console errors           | 0             | 0             | ✅  |

---

**Date création** : 2025-11-08  
**Auteur** : Claude Code  
**Version** : 1.0.0  
**Statut** : Prêt pour exécution VAGUE 4

**Prochaine étape** : VAGUE 5 - Cleanup & Validation finale
