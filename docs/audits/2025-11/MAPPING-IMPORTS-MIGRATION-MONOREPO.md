# MAPPING IMPORTS - MIGRATION MONOREPO
**Date** : 2025-11-06  
**Objectif** : Guide de remplacement automatique des imports lors migration monorepo

---

## 🔄 TABLEAU DE CORRESPONDANCE IMPORTS

### Composants UI (shadcn/ui)

| Import Actuel | Import Cible Monorepo | Type |
|--------------|----------------------|------|
| `import { Button } from '@/components/ui/button'` | `import { Button } from '@verone/shared/components/ui'` | UI |
| `import { Card, CardHeader, CardContent } from '@/components/ui/card'` | `import { Card, CardHeader, CardContent } from '@verone/shared/components/ui'` | UI |
| `import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'` | `import { Dialog, DialogTrigger, DialogContent } from '@verone/shared/components/ui'` | UI |
| `import { Form, FormField, FormItem } from '@/components/ui/form'` | `import { Form, FormField, FormItem } from '@verone/shared/components/ui'` | UI |
| `import { Input } from '@/components/ui/input'` | `import { Input } from '@verone/shared/components/ui'` | UI |
| `import { Select } from '@/components/ui/select'` | `import { Select } from '@verone/shared/components/ui'` | UI |
| `import { Table } from '@/components/ui/table'` | `import { Table } from '@verone/shared/components/ui'` | UI |
| `import { Badge } from '@/components/ui/badge'` | `import { Badge } from '@verone/shared/components/ui'` | UI |
| `import { Checkbox } from '@/components/ui/checkbox'` | `import { Checkbox } from '@verone/shared/components/ui'` | UI |
| `import { Switch } from '@/components/ui/switch'` | `import { Switch } from '@verone/shared/components/ui'` | UI |
| `import { Skeleton } from '@/components/ui/skeleton'` | `import { Skeleton } from '@verone/shared/components/ui'` | UI |
| `import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'` | `import { Tabs, TabsList, TabsTrigger } from '@verone/shared/components/ui'` | UI |
| `import { Tooltip } from '@/components/ui/tooltip'` | `import { Tooltip } from '@verone/shared/components/ui'` | UI |
| `import { Separator } from '@/components/ui/separator'` | `import { Separator } from '@verone/shared/components/ui'` | UI |
| `import { Popover } from '@/components/ui/popover'` | `import { Popover } from '@verone/shared/components/ui'` | UI |
| `import { ScrollArea } from '@/components/ui/scroll-area'` | `import { ScrollArea } from '@verone/shared/components/ui'` | UI |

### Design System

| Import Actuel | Import Cible Monorepo | Type |
|--------------|----------------------|------|
| `import { colors } from '@/lib/design-system'` | `import { colors } from '@verone/shared/design-system'` | Tokens |
| `import { spacing } from '@/lib/design-system'` | `import { spacing } from '@verone/shared/design-system'` | Tokens |
| `import { typography } from '@/lib/design-system'` | `import { typography } from '@verone/shared/design-system'` | Tokens |
| `import { shadows } from '@/lib/design-system'` | `import { shadows } from '@verone/shared/design-system'` | Tokens |
| `import { theme } from '@/lib/design-system'` | `import { theme } from '@verone/shared/design-system'` | Theme |

### Utils

| Import Actuel | Import Cible Monorepo | Type |
|--------------|----------------------|------|
| `import { cn } from '@/lib/utils'` | `import { cn } from '@verone/shared/utils'` | Utils |
| `import { formatPrice } from '@/lib/utils'` | `import { formatPrice } from '@verone/shared/utils'` | Formatter |
| `import { formatDate } from '@/lib/utils'` | `import { formatDate } from '@verone/shared/utils'` | Formatter |
| `import { formatCurrency } from '@/lib/utils'` | `import { formatCurrency } from '@verone/shared/utils'` | Formatter |
| `import { validateEmail } from '@/lib/utils'` | `import { validateEmail } from '@verone/shared/utils'` | Validator |
| `import { generateSlug } from '@/lib/utils'` | `import { generateSlug } from '@verone/shared/utils'` | Utils |
| `import { debounce } from '@/lib/utils'` | `import { debounce } from '@verone/shared/utils'` | Utils |
| `import { calculateDiscountPercentage } from '@/lib/utils'` | `import { calculateDiscountPercentage } from '@verone/shared/utils'` | Pricing |
| `import { formatPrice } from '@/lib/pricing-utils'` | `import { formatPrice } from '@verone/shared/utils'` | Pricing |

### Hooks

| Import Actuel | Import Cible Monorepo | Type |
|--------------|----------------------|------|
| `import { useToast } from '@/hooks/use-toast'` | `import { useToast } from '@verone/shared/hooks'` | Hook UI |
| `import { useInlineEdit } from '@/hooks/use-inline-edit'` | `import { useInlineEdit } from '@verone/shared/hooks'` | Hook UI |
| `import { useSectionLocking } from '@/hooks/use-section-locking'` | `import { useSectionLocking } from '@verone/shared/hooks'` | Hook UI |

### Providers

| Import Actuel | Import Cible Monorepo | Type |
|--------------|----------------------|------|
| `import { ReactQueryProvider } from '@/components/providers/react-query-provider'` | `import { ReactQueryProvider } from '@verone/shared/providers'` | Provider |

---

## 🤖 SCRIPTS DE MIGRATION AUTOMATIQUE

### Script 1: Remplacer imports UI

```bash
#!/bin/bash
# migrate-ui-imports.sh

TARGET_DIR="packages/apps/backoffice/src"

echo "🔄 Migration imports UI shadcn..."

# Remplacer tous les imports @/components/ui/* par @verone/shared/components/ui
find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\''"]@/components/ui/\([^"'\'']*\)["'\''"]\(.*\)|from "@verone/shared/components/ui"\2|g' {} +

echo "✅ Imports UI migrés"
```

### Script 2: Remplacer imports utils

```bash
#!/bin/bash
# migrate-utils-imports.sh

TARGET_DIR="packages/apps/backoffice/src"

echo "🔄 Migration imports utils..."

# Remplacer @/lib/utils
find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\''"]@/lib/utils["'\''"]\(.*\)|from "@verone/shared/utils"\1|g' {} +

# Remplacer @/lib/pricing-utils
find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\''"]@/lib/pricing-utils["'\''"]\(.*\)|from "@verone/shared/utils"\1|g' {} +

echo "✅ Imports utils migrés"
```

### Script 3: Remplacer imports design system

```bash
#!/bin/bash
# migrate-design-system-imports.sh

TARGET_DIR="packages/apps/backoffice/src"

echo "🔄 Migration imports design system..."

# Remplacer @/lib/design-system
find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\''"]@/lib/design-system["'\''"]\(.*\)|from "@verone/shared/design-system"\1|g' {} +

echo "✅ Imports design system migrés"
```

### Script 4: Remplacer imports hooks

```bash
#!/bin/bash
# migrate-hooks-imports.sh

TARGET_DIR="packages/apps/backoffice/src"

echo "🔄 Migration imports hooks..."

# Remplacer use-toast
find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\''"]@/hooks/use-toast["'\''"]\(.*\)|from "@verone/shared/hooks"\1|g' {} +

# Remplacer use-inline-edit
find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\''"]@/hooks/use-inline-edit["'\''"]\(.*\)|from "@verone/shared/hooks"\1|g' {} +

# Remplacer use-section-locking
find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\''"]@/hooks/use-section-locking["'\''"]\(.*\)|from "@verone/shared/hooks"\1|g' {} +

echo "✅ Imports hooks migrés"
```

### Script 5: Remplacer imports providers

```bash
#!/bin/bash
# migrate-providers-imports.sh

TARGET_DIR="packages/apps/backoffice/src"

echo "🔄 Migration imports providers..."

# Remplacer @/components/providers/*
find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\''"]@/components/providers/react-query-provider["'\''"]\(.*\)|from "@verone/shared/providers"\1|g' {} +

echo "✅ Imports providers migrés"
```

### Script Master: Tout migrer

```bash
#!/bin/bash
# migrate-all-imports.sh

echo "🚀 Migration complète des imports vers monorepo"
echo "=============================================="
echo ""

# Exécuter tous les scripts
./migrate-ui-imports.sh
./migrate-utils-imports.sh
./migrate-design-system-imports.sh
./migrate-hooks-imports.sh
./migrate-providers-imports.sh

echo ""
echo "✅ Migration complète terminée"
echo ""
echo "📊 Statistiques :"
echo "  - $(grep -r '@verone/shared' packages/apps/backoffice/src | wc -l) imports migrés"
echo ""
echo "⚠️  Actions manuelles nécessaires :"
echo "  1. Vérifier imports business components (si migrés vers shared)"
echo "  2. Tester build : pnpm build"
echo "  3. Tester console errors : pnpm dev + Browser test"
```

---

## 🔍 VALIDATION POST-MIGRATION

### Checklist Validation

- [ ] **Aucun import `@/components/ui/*` restant dans back-office**
  ```bash
  grep -r "@/components/ui/" packages/apps/backoffice/src
  # Doit retourner 0 résultats
  ```

- [ ] **Aucun import `@/lib/utils` restant**
  ```bash
  grep -r "@/lib/utils" packages/apps/backoffice/src
  # Doit retourner 0 résultats
  ```

- [ ] **Aucun import `@/lib/design-system` restant**
  ```bash
  grep -r "@/lib/design-system" packages/apps/backoffice/src
  # Doit retourner 0 résultats
  ```

- [ ] **Tous imports `@verone/shared` fonctionnels**
  ```bash
  cd packages/apps/backoffice
  pnpm type-check
  # Doit retourner 0 erreurs
  ```

- [ ] **Build successful**
  ```bash
  cd packages/apps/backoffice
  pnpm build
  # Doit compiler sans erreurs
  ```

- [ ] **Console 0 errors (RÈGLE SACRÉE)**
  ```bash
  pnpm dev
  # Ouvrir browser → Console → 0 errors
  ```

---

## 📊 STATISTIQUES IMPORTS

### Occurrences actuelles (avant migration)

| Pattern Import | Occurrences | Fichiers Impactés |
|----------------|-------------|-------------------|
| `@/components/ui/*` | ~368 | ~100 fichiers |
| `@/lib/utils` | ~103 | ~100 fichiers |
| `@/lib/design-system` | ~50 | ~30 fichiers |
| `@/hooks/use-toast` | ~80 | ~60 fichiers |
| `@/components/providers/*` | ~15 | ~10 fichiers |
| **TOTAL** | **~616** | **~200 fichiers** |

### Impact migration

- **Fichiers à modifier** : ~200 fichiers
- **Lignes imports à remplacer** : ~616 lignes
- **Temps estimé (manuel)** : ~8 heures
- **Temps estimé (script automatique)** : ~5 minutes
- **Gain de temps** : **96%** 🚀

---

## ⚠️ CAS SPÉCIAUX À TRAITER MANUELLEMENT

### 1. Imports Composants Business Partagés

**Si migré vers shared** :
```typescript
// Avant
import { StockStatusBadge } from '@/components/business/stock-status-badge'

// Après
import { StockStatusBadge } from '@verone/shared/components/business'
```

**Pattern à chercher** :
```bash
grep -r "@/components/business/" packages/apps/backoffice/src
```

### 2. Imports relatifs dans composants migrés

**Avant (dans back-office)** :
```typescript
// src/components/business/product-card.tsx
import { Badge } from '@/components/ui/badge'
```

**Après (si migré vers shared)** :
```typescript
// packages/shared/components/business/product-card.tsx
import { Badge } from '../ui/badge'
// OU
import { Badge } from '@verone/shared/components/ui'
```

### 3. Re-exports

**Créer barrel exports dans shared** :

`packages/shared/index.ts` :
```typescript
// Re-export tout depuis shared
export * from './components/ui'
export * from './components/business'
export * from './design-system'
export * from './hooks'
export * from './utils'
export * from './providers'
```

**Usage simplifié** :
```typescript
// Au lieu de
import { Button } from '@verone/shared/components/ui'
import { formatPrice } from '@verone/shared/utils'

// Possibilité de faire
import { Button, formatPrice } from '@verone/shared'
```

---

## 🧪 TESTS POST-MIGRATION

### Test 1: Compilation TypeScript

```bash
cd packages/apps/backoffice
pnpm type-check
```

**Attendu** : 0 erreurs TypeScript

### Test 2: Build Production

```bash
cd packages/apps/backoffice
pnpm build
```

**Attendu** : Build successful

### Test 3: Runtime (Console Errors)

```bash
pnpm dev
# Ouvrir http://localhost:3000
# F12 → Console
```

**Attendu** : 0 errors, 0 warnings

### Test 4: Tests E2E Critiques

```bash
pnpm test:e2e:critical
```

**Attendu** : 20/20 tests passent

---

## 📝 RAPPORT MIGRATION

**Template rapport à remplir après migration** :

```markdown
# RAPPORT MIGRATION IMPORTS - [DATE]

## Statistiques

- **Fichiers modifiés** : X
- **Imports remplacés** : X
- **Temps migration** : X minutes
- **Méthode** : Script automatique / Manuel

## Validation

- [x] Type check : 0 erreurs
- [x] Build : Successful
- [x] Console errors : 0
- [x] Tests E2E : 20/20

## Problèmes rencontrés

- [si applicable]

## Actions post-migration

- [ ] Supprimer anciens fichiers src/lib/utils.ts, src/components/ui/*
- [ ] Mettre à jour .gitignore
- [ ] Commit migration

## Notes

- [observations, recommandations]
```

---

**Prochaines étapes** :
1. Exécuter scripts migration par phase
2. Valider chaque phase (type-check, build, console)
3. Remplir rapport migration

**Date** : 2025-11-06  
**Auteur** : Claude Code
