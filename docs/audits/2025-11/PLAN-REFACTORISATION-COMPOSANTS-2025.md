# Plan de Refactorisation Composants UI - Migration Progressive

**Date** : 2025-11-07
**Auteur** : verone-design-expert agent
**Timeline globale** : 6-9 semaines
**Approche** : Migration par vagues sans breaking changes
**Objectif** : Réduire duplications de 7-8 à 0 + Storybook 100%

---

## Executive Summary

🎯 **Stratégie** : Migration progressive par vagues (P0 → P1 → P2) avec coexistence anciens/nouveaux composants

📊 **Impact** : 73+ fichiers migrés, -30% bundle size, 100% Storybook coverage

⏱️ **Timeline** : 6-9 semaines (2 semaines Vague 1, 3 semaines Vague 2, 3-4 semaines Vague 3)

✅ **Principe** : Backward compatibility maintenue, tests automatisés, deprecation warnings

---

## Table des Matières

1. [Stratégie Générale](#stratégie-générale)
2. [Vague 1 - P0 Critiques (Semaines 1-2)](#vague-1---p0-critiques-semaines-1-2)
3. [Vague 2 - P1 Haute Priorité (Semaines 3-5)](#vague-2---p1-haute-priorité-semaines-3-5)
4. [Vague 3 - P2 Moyenne Priorité (Semaines 6-9)](#vague-3---p2-moyenne-priorité-semaines-6-9)
5. [Métriques Succès](#métriques-succès)
6. [Rollback Strategy](#rollback-strategy)

---

## Stratégie Générale

### Principes Migration

```
┌────────────────────────────────────────────────────────────┐
│  MIGRATION SANS BREAKING CHANGES - 5 PRINCIPES CLÉS       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. ✅ COEXISTENCE                                         │
│     Anciens et nouveaux composants coexistent             │
│     pendant période transition (2-4 semaines)             │
│                                                            │
│  2. ✅ BACKWARD COMPATIBILITY                              │
│     Props mapping automatique si incompatibilité          │
│     Deprecation warnings (console.warn) sans crash        │
│                                                            │
│  3. ✅ TESTS VALIDATION                                    │
│     Tests E2E before/after migration                      │
│     Screenshots comparaison (Chromatic)                   │
│     Console = 0 errors (MCP Playwright)                   │
│                                                            │
│  4. ✅ CODEMODS AUTOMATISÉS                                │
│     Scripts transformation code (jscodeshift)             │
│     Dry-run validation avant apply                        │
│     Git diff review manuel après                          │
│                                                            │
│  5. ✅ DOCUMENTATION PROGRESSIVE                           │
│     Storybook stories créées AVANT migration              │
│     Migration guide pour chaque composant                 │
│     Changelog détaillé (props deprecated, nouvelles)      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Workflow Migration Type

```bash
# Pour chaque composant migré :

1. ✅ Créer nouveau composant unifié
   - src/components/ui/button.tsx (nouveau)
   - Tests unitaires (button.test.tsx)
   - Story Storybook (button.stories.tsx)

2. ✅ Ajouter deprecation warnings anciens composants
   - console.warn('ActionButton deprecated, use Button variant="default"')
   - Lien vers migration guide

3. ✅ Créer codemod transformation
   - scripts/codemods/migrate-button.ts
   - Dry-run : npm run codemod:button -- --dry
   - Apply : npm run codemod:button

4. ✅ Tests validation
   - npm run type-check (0 erreurs)
   - npm run build (success)
   - npm run test (Playwright E2E)
   - MCP Browser : Console = 0 errors

5. ✅ Migration fichiers
   - Batch 10-15 fichiers par commit
   - Review git diff manuel
   - Commit structuré

6. ✅ Cleanup après validation
   - Supprimer anciens composants (ActionButton, etc.)
   - Supprimer deprecation warnings
   - Update docs
```

---

## Vague 1 - P0 Critiques (Semaines 1-2)

### Objectifs

**Priorité CRITIQUE** : Réduire duplications bloquantes + documenter composants essentiels

1. ✅ **Unifier Button** (4→1) : 62 fichiers migrés
2. ✅ **Unifier KPI Cards** (3-4→1) : 11 fichiers migrés
3. ✅ **Consolider design tokens** (2→1 source unique)
4. ✅ **Storybook P0** : 15 composants critiques documentés

### Timeline Détaillée (10 jours ouvrés)

| Jour | Tâche | Deliverable | Validation |
|------|-------|-------------|------------|
| **J1** | Créer Button unifié | `button.tsx` + tests + story | Build success, Storybook render |
| **J2** | Scripts codemods Button | `migrate-button.ts` | Dry-run 62 fichiers OK |
| **J3-4** | Migration Button (62 fichiers) | Commits par batch 15 fichiers | Type-check 0 errors, console 0 errors |
| **J5** | Créer KPICard unifié | `kpi-card.tsx` + tests + story | Build success |
| **J6** | Scripts codemods KPI | `migrate-kpi-card.ts` | Dry-run 11 fichiers OK |
| **J7** | Migration KPI Cards (11 fichiers) | Commit batch | Validation complète |
| **J8** | Consolider design tokens | `design-system/tokens/index.ts` | Exports unifiés, docs |
| **J9** | Storybook P0 (15 stories) | Select, Combobox, Dialog, Form, etc. | 15 stories published |
| **J10** | Tests final + cleanup | Supprimer ActionButton, ModernActionButton, etc. | Console 0 errors, build success |

---

### 1. Unifier Button (4→1)

#### Fichiers Impactés (62 fichiers)

**Répartition par type** :

| Type Button | Fichiers | Transformation |
|-------------|----------|----------------|
| **ActionButton** | 30 | → Button variant="default" + icon |
| **ModernActionButton** | 20 | → Button variant="gradient" ou "glass" |
| **StandardModifyButton** | 12 | → Button variant="outline" size="sm" |
| **Button** (déjà OK) | Reste | Aucune migration nécessaire |

**Liste exhaustive** (exemples) :

```
src/app/dashboard/page.tsx
src/app/produits/catalogue/page.tsx
src/app/contacts-organisations/customers/page.tsx
src/components/business/product-card-v2.tsx
src/components/business/organisation-list-view.tsx
src/shared/modules/dashboard/components/...
[... 57 autres fichiers - voir audit complet]
```

#### Script Codemod Button

**Fichier** : `scripts/codemods/migrate-button.ts`

```typescript
/**
 * Codemod : Unifier tous boutons vers Button unifié
 *
 * Transformations :
 * - ActionButton → Button variant="default" + icon
 * - ModernActionButton → Button variant="gradient"|"glass"
 * - StandardModifyButton → Button variant="outline" size="sm"
 *
 * Usage :
 *   npm run codemod:button -- --dry           # Dry-run (preview)
 *   npm run codemod:button                     # Apply changes
 *   npm run codemod:button -- src/app/dashboard  # Specific dir
 */

import { API, FileInfo, Options } from 'jscodeshift'

export default function transformer(file: FileInfo, api: API, options: Options) {
  const j = api.jscodeshift
  const root = j(file.source)
  let hasChanges = false

  // 1. Transform ActionButton → Button
  root
    .find(j.JSXElement, {
      openingElement: { name: { name: 'ActionButton' } }
    })
    .forEach(path => {
      const { attributes } = path.value.openingElement

      // Extract props
      const labelProp = attributes?.find(attr => attr.name?.name === 'label')
      const iconProp = attributes?.find(attr => attr.name?.name === 'icon')
      const variantProp = attributes?.find(attr => attr.name?.name === 'variant')
      const otherProps = attributes?.filter(
        attr => !['label', 'icon', 'variant'].includes(attr.name?.name)
      )

      // Map variant : primary → default, danger → destructive
      const variantMap = {
        'primary': 'default',
        'secondary': 'secondary',
        'danger': 'destructive'
      }
      const variantValue = variantProp?.value?.value || 'primary'
      const newVariant = variantMap[variantValue] || 'default'

      // Create new Button element
      path.value.openingElement.name.name = 'Button'
      path.value.closingElement.name.name = 'Button'

      // Update props
      path.value.openingElement.attributes = [
        j.jsxAttribute(
          j.jsxIdentifier('variant'),
          j.stringLiteral(newVariant)
        ),
        ...(iconProp ? [
          j.jsxAttribute(
            j.jsxIdentifier('icon'),
            iconProp.value
          )
        ] : []),
        ...otherProps
      ]

      // Set children from label prop
      if (labelProp) {
        path.value.children = [j.jsxText(labelProp.value.value)]
      }

      hasChanges = true
    })

  // 2. Transform ModernActionButton → Button
  root
    .find(j.JSXElement, {
      openingElement: { name: { name: 'ModernActionButton' } }
    })
    .forEach(path => {
      const { attributes } = path.value.openingElement

      const variantProp = attributes?.find(attr => attr.name?.name === 'variant')
      const variantValue = variantProp?.value?.value || 'gradient'

      // Modern variants déjà supportés dans Button unifié
      path.value.openingElement.name.name = 'Button'
      path.value.closingElement.name.name = 'Button'

      // Keep variant as-is (gradient, glass déjà dans Button)

      hasChanges = true
    })

  // 3. Transform StandardModifyButton → Button
  root
    .find(j.JSXElement, {
      openingElement: { name: { name: 'StandardModifyButton' } }
    })
    .forEach(path => {
      path.value.openingElement.name.name = 'Button'
      path.value.closingElement.name.name = 'Button'

      // Add default props
      path.value.openingElement.attributes = [
        j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('outline')),
        j.jsxAttribute(j.jsxIdentifier('size'), j.stringLiteral('sm')),
        ...(path.value.openingElement.attributes || [])
      ]

      // Set default children if empty
      if (!path.value.children || path.value.children.length === 0) {
        path.value.children = [j.jsxText('Modifier')]
      }

      hasChanges = true
    })

  // 4. Update imports
  if (hasChanges) {
    // Remove old imports
    root
      .find(j.ImportDeclaration)
      .filter(path => {
        const specifiers = path.value.specifiers || []
        return specifiers.some(spec =>
          ['ActionButton', 'ModernActionButton', 'StandardModifyButton'].includes(
            spec.local?.name
          )
        )
      })
      .remove()

    // Add Button import if not exists
    const hasButtonImport = root
      .find(j.ImportDeclaration, {
        source: { value: '@/components/ui/button' }
      })
      .length > 0

    if (!hasButtonImport) {
      const firstImport = root.find(j.ImportDeclaration).at(0)
      if (firstImport.length) {
        firstImport.insertBefore(
          j.importDeclaration(
            [j.importSpecifier(j.identifier('Button'))],
            j.stringLiteral('@/components/ui/button')
          )
        )
      }
    }
  }

  return hasChanges ? root.toSource({ quote: 'single' }) : null
}
```

**Commandes** :

```bash
# Dry-run (preview changes)
npm run codemod:button -- --dry

# Apply to all files
npm run codemod:button

# Apply to specific directory
npm run codemod:button -- src/app/dashboard

# package.json script
{
  "scripts": {
    "codemod:button": "jscodeshift -t scripts/codemods/migrate-button.ts src"
  }
}
```

---

### 2. Unifier KPI Cards (3-4→1)

#### Fichiers Impactés (11 fichiers)

```
src/app/dashboard/page.tsx           # CompactKpiCard (×4), ElegantKpiCard (×2)
src/app/stocks/page.tsx              # CompactKpiCard (×3)
src/app/finance/page.tsx             # MediumKpiCard (×2)
src/shared/modules/dashboard/...     # KPICard (modules)
[... 7 autres fichiers]
```

#### Script Codemod KPI

**Fichier** : `scripts/codemods/migrate-kpi-card.ts`

```typescript
export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const root = j(file.source)
  let hasChanges = false

  // Transform CompactKpiCard → KPICard variant="compact"
  root
    .find(j.JSXElement, {
      openingElement: { name: { name: 'CompactKpiCard' } }
    })
    .forEach(path => {
      path.value.openingElement.name.name = 'KPICard'
      path.value.closingElement.name.name = 'KPICard'

      // Add variant prop
      path.value.openingElement.attributes.unshift(
        j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('compact'))
      )

      hasChanges = true
    })

  // Transform ElegantKpiCard → KPICard variant="elegant"
  root
    .find(j.JSXElement, {
      openingElement: { name: { name: 'ElegantKpiCard' } }
    })
    .forEach(path => {
      const { attributes } = path.value.openingElement

      path.value.openingElement.name.name = 'KPICard'
      path.value.closingElement.name.name = 'KPICard'

      // Map subtitle → description
      const subtitleProp = attributes?.find(attr => attr.name?.name === 'subtitle')
      if (subtitleProp) {
        subtitleProp.name.name = 'description'
      }

      // Remove gradient prop (intégré dans variant="elegant")
      path.value.openingElement.attributes = attributes?.filter(
        attr => attr.name?.name !== 'gradient'
      )

      // Add variant
      path.value.openingElement.attributes.unshift(
        j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('elegant'))
      )

      hasChanges = true
    })

  // Transform MediumKpiCard → KPICard variant="detailed"
  root
    .find(j.JSXElement, {
      openingElement: { name: { name: 'MediumKpiCard' } }
    })
    .forEach(path => {
      path.value.openingElement.name.name = 'KPICard'
      path.value.closingElement.name.name = 'KPICard'

      path.value.openingElement.attributes.unshift(
        j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('detailed'))
      )

      hasChanges = true
    })

  // Update imports
  if (hasChanges) {
    root
      .find(j.ImportDeclaration)
      .filter(path => {
        const specifiers = path.value.specifiers || []
        return specifiers.some(spec =>
          ['CompactKpiCard', 'ElegantKpiCard', 'MediumKpiCard'].includes(
            spec.local?.name
          )
        )
      })
      .remove()

    // Add KPICard import
    const hasKPICardImport = root
      .find(j.ImportDeclaration, {
        source: { value: '@/components/ui/kpi-card' }
      })
      .length > 0

    if (!hasKPICardImport) {
      const firstImport = root.find(j.ImportDeclaration).at(0)
      if (firstImport.length) {
        firstImport.insertBefore(
          j.importDeclaration(
            [j.importSpecifier(j.identifier('KPICard'))],
            j.stringLiteral('@/components/ui/kpi-card')
          )
        )
      }
    }
  }

  return hasChanges ? root.toSource({ quote: 'single' }) : null
}
```

---

### 3. Consolider Design Tokens

**Avant** (2 sources fragmentées) :

```
src/lib/theme-v2.ts                   # Source primaire
src/lib/design-system/tokens/         # Source secondaire (incomplet)
```

**Après** (1 source unique) :

```
src/lib/design-system/tokens/
├── index.ts          # ✅ Export centralisé
├── colors.ts         # ✅ Semantic colors HSL
├── spacing.ts        # ✅ Scale 4-64px
├── typography.ts     # ✅ Scale xs-2xl
├── shadows.ts        # ✅ 5 levels
└── radius.ts         # ✅ Scale sm-full
```

**Migration** :

```bash
# J8 : Consolider tokens
1. Copier tokens de theme-v2.ts → design-system/tokens/*.ts
2. Update tailwind.config.js → import depuis design-system/tokens
3. Update composants UI → utiliser tokens consolidés
4. Deprecate theme-v2.ts avec warning
5. Tests : build + visual regression
```

---

### 4. Storybook P0 (15 composants)

**Composants critiques à documenter** :

| # | Composant | Variants | Priority |
|---|-----------|----------|----------|
| 1 | **Button** (déjà fait) | 7 variants × 4 sizes | P0 ✅ |
| 2 | **Select** | Standard, with search, multi-select | P0 |
| 3 | **Combobox** | Standard, with categories | P0 |
| 4 | **Dialog** (déjà fait) | Standard, alert | P0 ✅ |
| 5 | **Popover** | Standard, with arrow | P0 |
| 6 | **DropdownMenu** | Standard, with icons, nested | P0 |
| 7 | **Checkbox** | Checked, unchecked, indeterminate | P0 |
| 8 | **Radio** | Single, group | P0 |
| 9 | **Switch** | On, off, disabled | P0 |
| 10 | **FormField** | With label, error, help text | P0 |
| 11 | **Tabs** | Horizontal, vertical | P0 |
| 12 | **Accordion** | Single, multiple | P0 |
| 13 | **Alert** | Default, destructive, success | P0 |
| 14 | **Tooltip** | Top, right, bottom, left | P0 |
| 15 | **Skeleton** | Text, card, button | P0 |

**Template story standard** (exemple Select) :

```typescript
// src/components/ui/select.stories.tsx

import type { Meta, StoryObj } from '@storybook/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <label className="text-sm font-medium">Label</label>
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

// ... autres variants
```

---

### Tests Validation Vague 1

**Checklist obligatoire** :

```bash
# 1. Type Check
npm run type-check
# ✅ Expected: 0 errors

# 2. Build
npm run build
# ✅ Expected: Build successful

# 3. Console Errors (MCP Playwright)
# Test pages impactées : Dashboard, Produits, Organisations
mcp__playwright__browser_navigate("http://localhost:3000/dashboard")
mcp__playwright__browser_console_messages()
# ✅ Expected: 0 errors

mcp__playwright__browser_navigate("http://localhost:3000/produits/catalogue")
mcp__playwright__browser_console_messages()
# ✅ Expected: 0 errors

# 4. Storybook Build
npm run build-storybook
# ✅ Expected: 15 stories built

# 5. Visual Regression (Chromatic)
npm run chromatic
# ✅ Expected: 0 visual changes (or accepted)
```

---

### Métriques Succès Vague 1

| Métrique | Baseline | Target Vague 1 | Actual |
|----------|----------|----------------|--------|
| **Duplications critiques** | 7-8 | 2-3 | _[À mesurer]_ |
| **Fichiers migrés** | 0 | 73 | _[À mesurer]_ |
| **Bundle size UI** | 45kb | 38kb (-15%) | _[À mesurer]_ |
| **Storybook coverage** | 9.8% | 30% (15/51) | _[À mesurer]_ |
| **Design tokens sources** | 2 | 1 | _[À mesurer]_ |
| **Type errors** | _[Current]_ | 0 | _[À mesurer]_ |
| **Console errors** | _[Current]_ | 0 | _[À mesurer]_ |

---

## Vague 2 - P1 Haute Priorité (Semaines 3-5)

### Objectifs

1. ✅ **Atomic Design structure complète** (atoms/, molecules/, organisms/)
2. ✅ **Unifier Badges** (5+→1 avec variants métier)
3. ✅ **Unifier Combobox/Filtres** (3→1 composition)
4. ✅ **Storybook 60% coverage** (31/51 composants)

### Timeline (3 semaines = 15 jours ouvrés)

| Semaine | Tâches | Deliverables |
|---------|--------|--------------|
| **S3** | Restructure Atomic Design + Badge unifié | Folders atoms/molecules/organisms + badge.tsx |
| **S4** | Combobox composition + Storybook 20 stories | Combobox patterns + 20 stories |
| **S5** | Migration business components + validation | Patterns composition standardisés |

---

### Actions Détaillées

#### 1. Atomic Design Structure

**Reorganisation folders** :

```bash
# AVANT
src/components/ui/
├── button.tsx
├── badge.tsx
├── card.tsx
├── dialog.tsx
├── [... 47 autres composants flat]

# APRÈS
src/components/ui/
├── atoms/
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── Input.tsx
│   ├── Label.tsx
│   ├── Checkbox.tsx
│   └── [... 20 atoms total]
├── molecules/
│   ├── Card.tsx
│   ├── KPICard.tsx
│   ├── Alert.tsx
│   ├── FormField.tsx
│   └── [... 22 molecules total]
└── organisms/
    ├── Table.tsx
    ├── DataTable.tsx
    ├── Tabs.tsx
    ├── CommandPalette.tsx
    └── [... 18 organisms total]
```

**Migration script** :

```bash
# scripts/reorganize-atomic-design.sh

#!/bin/bash

# Create folders
mkdir -p src/components/ui/atoms
mkdir -p src/components/ui/molecules
mkdir -p src/components/ui/organisms

# Move atoms (25 composants)
mv src/components/ui/button.tsx src/components/ui/atoms/Button.tsx
mv src/components/ui/badge.tsx src/components/ui/atoms/Badge.tsx
# [... autres atoms]

# Move molecules (22 composants)
mv src/components/ui/card.tsx src/components/ui/molecules/Card.tsx
mv src/components/ui/kpi-card.tsx src/components/ui/molecules/KPICard.tsx
# [... autres molecules]

# Move organisms (18 composants)
mv src/components/ui/table.tsx src/components/ui/organisms/Table.tsx
# [... autres organisms]

# Update barrel exports
cat > src/components/ui/atoms/index.ts <<EOF
export * from './Button'
export * from './Badge'
// [... autres exports]
EOF

# Update imports project-wide
npm run codemod:update-imports
```

---

#### 2. Badge Unifié avec Variants Métier

**Unifier 5+ badges spécialisés** :

```
CustomerBadge
SupplierBadge
SupplierCategoryBadge
SupplierSegmentBadge
DataStatusBadge
StockStatusBadge
RoleBadge
```

**Solution** : Badge base + mapping data

```typescript
// AVANT : 7 composants séparés
<CustomerBadge type="professional" />
<SupplierBadge verified />
<StockStatusBadge status="in_stock" />

// APRÈS : Badge unifié + data mapping
<Badge variant="customer">Client Pro</Badge>
<Badge variant="supplier">Fournisseur Vérifié</Badge>
<Badge variant="success">En stock</Badge>

// Ou avec helper functions
function getOrganisationBadge(org: Organisation) {
  const variant = org.type === 'customer' ? 'customer' : 'supplier'
  return <Badge variant={variant}>{org.name}</Badge>
}

function getStockStatusBadge(status: StockStatus) {
  const variantMap = {
    in_stock: 'success',
    low_stock: 'warning',
    out_of_stock: 'destructive',
  }
  return <Badge variant={variantMap[status]}>{statusLabel}</Badge>
}
```

---

#### 3. Combobox Composition Pattern

**Unifier 3 variantes** :

```
Combobox (base)
CategoryFilterCombobox
FilterCombobox
```

**Solution** : Composition pattern

```typescript
// Base Combobox générique
<Combobox
  options={items}
  value={selected}
  onChange={setSelected}
  placeholder="Sélectionner..."
  searchPlaceholder="Rechercher..."
  renderOption={(item) => <div>{item.label}</div>}  // Customisable
/>

// Spécialisations via composition
function CategoryFilterCombobox({ categories, value, onChange }: Props) {
  return (
    <Combobox
      options={categories}
      value={value}
      onChange={onChange}
      placeholder="Filtrer par catégorie"
      searchPlaceholder="Rechercher catégorie..."
      renderOption={(category) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{category.count}</Badge>
          <span>{category.name}</span>
        </div>
      )}
    />
  )
}
```

---

#### 4. Storybook 60% Coverage (31/51 composants)

**20 stories supplémentaires à créer** :

- AlertDialog, Breadcrumb, Calendar, Command
- Collapsible, ContextMenu, HoverCard, MenuBar
- NavigationMenu, Pagination, ResizablePanel
- ScrollArea, Separator, Slider, Sonner
- Table, Toast, Toggle, ToggleGroup

**Timeline** : ~1.5 stories/jour × 15 jours = 22 stories

---

### Métriques Succès Vague 2

| Métrique | Après Vague 1 | Target Vague 2 | Actual |
|----------|---------------|----------------|--------|
| **Duplications** | 2-3 | 0-1 | _[À mesurer]_ |
| **Storybook coverage** | 30% | 60% (31/51) | _[À mesurer]_ |
| **Atomic Design** | 0% | 100% structuré | _[À mesurer]_ |
| **Badge variants** | 7 composants | 1 composant | _[À mesurer]_ |

---

## Vague 3 - P2 Moyenne Priorité (Semaines 6-9)

### Objectifs

1. ✅ **Refactorisation business components** (patterns composition)
2. ✅ **Tests visuels Chromatic** (regression testing CI/CD)
3. ✅ **Performance optimizations** (bundle size, React.memo)
4. ✅ **Storybook 100% coverage** (51/51)
5. ✅ **Documentation complète** Design System V2

### Timeline (3-4 semaines = 15-20 jours ouvrés)

| Semaine | Tâches | Deliverables |
|---------|--------|--------------|
| **S6** | Business components patterns + Chromatic | EditSection, FormModal patterns standardisés |
| **S7** | Performance optimizations + bundle analysis | -30% bundle size, React.memo selective |
| **S8** | Storybook 100% + visual tests | 51/51 stories + Chromatic CI |
| **S9** | Documentation finale + guides | Guide Design System V2 complet |

---

### Actions Détaillées

#### 1. Business Components Patterns

**Identifier patterns répétés** :

| Pattern | Occurrences | Solution |
|---------|-------------|----------|
| **EditSection** | 15+ composants | Composant générique EditSection |
| **FormModal** | 10+ composants | Hook useFormModal + pattern |
| **Selector** | 8+ composants | Composant Selector polymorphic |

**Exemple : EditSection Pattern**

```typescript
// AVANT : 15 composants similaires
// ContactEditSection, AddressEditSection, SupplierEditSection, etc.

// APRÈS : Composant générique
interface EditSectionProps {
  title: string
  description?: string
  fields: FieldConfig[]
  onSave: (data: any) => Promise<void>
  initialData?: any
}

function EditSection({ title, description, fields, onSave, initialData }: EditSectionProps) {
  const form = useForm({ defaultValues: initialData })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            {fields.map(field => (
              <FormField key={field.name} {...field} />
            ))}
            <Button type="submit" loading={form.formState.isSubmitting}>
              Enregistrer
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Usage
<EditSection
  title="Modifier le contact"
  fields={[
    { name: 'name', label: 'Nom', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    // ...
  ]}
  onSave={handleSave}
  initialData={contact}
/>
```

---

#### 2. Chromatic Visual Testing

**Configuration CI/CD** :

```yaml
# .github/workflows/chromatic.yml

name: Chromatic Visual Tests

on:
  pull_request:
    branches: [main, production-stable]
  push:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for Chromatic

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true
          autoAcceptChanges: main  # Auto-accept sur main branch
```

**Bénéfices** :
- ✅ Détection automatique regressions visuelles
- ✅ Review UI changes dans PR
- ✅ Historique snapshots visuels

---

#### 3. Performance Optimizations

**Actions** :

| Optimization | Before | Target | Method |
|--------------|--------|--------|--------|
| **Bundle size UI** | 45kb | 32kb (-30%) | Tree-shaking, code splitting |
| **React.memo** | 0 composants | 10-15 composants | Selective memoization |
| **Lazy loading** | Eager | Lazy routes | React.lazy() |

**Exemple : React.memo selective**

```typescript
// Composants render intensifs → memo
export const KPICard = React.memo(function KPICard({ ... }: KPICardProps) {
  // ...
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.value === nextProps.value &&
         prevProps.change === nextProps.change
})

// Composants simples → pas de memo
export function Badge({ ... }: BadgeProps) {
  // Pas besoin memo (render léger)
}
```

---

#### 4. Storybook 100% + Documentation

**Derniers 20 composants** :

```
AspectRatio, Avatar, Code, Container
DataTable (advanced), DatePicker, Divider
DrawerDialog, EmptyState, ErrorBoundary
FileUpload, Grid, Heading, Link
List, Sheet, Spinner, Text
Typography, VisuallyHidden
```

**Documentation** :

```
docs/design-system/
├── README.md                    # ✅ Vision globale
├── getting-started.md           # ✅ Quick start
├── principles.md                # ✅ Design principles
├── components/
│   ├── button.md                # ✅ Props, exemples, do's & don'ts
│   ├── kpi-card.md
│   ├── [... 51 composants]
├── tokens/
│   ├── colors.md                # ✅ Color system
│   ├── spacing.md
│   ├── typography.md
├── patterns/
│   ├── composition.md           # ✅ Compound components, polymorphic
│   ├── forms.md                 # ✅ Form patterns
│   └── layouts.md               # ✅ Layout patterns
└── migration-guide.md           # ✅ Migration depuis anciens composants
```

---

### Métriques Succès Vague 3

| Métrique | Après Vague 2 | Target Final | Actual |
|----------|---------------|--------------|--------|
| **Duplications** | 0-1 | 0 | _[À mesurer]_ |
| **Storybook coverage** | 60% | 100% (51/51) | _[À mesurer]_ |
| **Bundle size** | 38kb | 32kb (-30% total) | _[À mesurer]_ |
| **Performance** | - | <100ms render/composant | _[À mesurer]_ |
| **A11y WCAG AA** | ~75% | 100% | _[À mesurer]_ |
| **Documentation** | Partielle | Complète | _[À mesurer]_ |

---

## Métriques Succès Globales

### KPIs Projet

| Métrique | Baseline (J0) | Vague 1 (S2) | Vague 2 (S5) | Final (S9) |
|----------|---------------|--------------|--------------|------------|
| **Duplications critiques** | 7-8 | 2-3 (-60%) | 0-1 (-90%) | 0 (-100%) |
| **Fichiers migrés** | 0 | 73 | 100+ | 150+ |
| **Composants maintenus** | 305+ | 280 (-8%) | 250 (-18%) | 220 (-28%) |
| **Storybook coverage** | 9.8% (5/51) | 30% (15/51) | 60% (31/51) | 100% (51/51) |
| **Bundle size UI** | 45kb | 38kb (-15%) | 34kb (-25%) | 32kb (-30%) |
| **Design tokens sources** | 2 | 1 | 1 | 1 |
| **Conformité WCAG AA** | ~75% | 85% | 95% | 100% |
| **Type errors** | _[Current]_ | 0 | 0 | 0 |
| **Console errors** | _[Current]_ | 0 | 0 | 0 |
| **Performance (LCP dashboard)** | _[Current]_ | <2s | <2s | <1.5s |

---

## Rollback Strategy

### Procédure Rollback Vague

**Si problème critique détecté** (console errors, build failed, regression majeure) :

```bash
# 1. Identifier commit problématique
git log --oneline -10

# 2. Revert commit(s)
git revert <commit-hash>

# 3. Tests validation
npm run type-check
npm run build
npm run test

# 4. Si tests OK → Push revert
git push origin <branch>

# 5. Communication équipe
# Slack/GitHub issue : Rollback Vague X effectué, raison, actions correctives

# 6. Fix root cause dans branch séparée
git checkout -b fix/migration-vague-X
# [... corrections]
git push origin fix/migration-vague-X

# 7. Re-test + Re-deploy
# PR review + validation
```

### Backup Strategy

**Avant chaque vague** :

```bash
# 1. Créer backup branch
git checkout -b backup/vague-1-start
git push origin backup/vague-1-start

# 2. Tag version
git tag -a v1.0-pre-vague-1 -m "Backup avant Vague 1"
git push origin v1.0-pre-vague-1

# 3. Database backup (si applicable)
# [... backup Supabase]

# 4. Screenshot baseline (Chromatic)
npm run chromatic -- --only-changed=false
```

---

### Checklist Validation Post-Migration

**Après CHAQUE vague** :

```bash
✅ 1. Type Check
npm run type-check
# Expected: 0 errors

✅ 2. Build
npm run build
# Expected: Success

✅ 3. Lint
npm run lint
# Expected: 0 errors (warnings OK)

✅ 4. Tests E2E
npm run test:e2e
# Expected: All tests pass

✅ 5. Console Errors (MCP Playwright)
# Tester toutes pages impactées
mcp__playwright__browser_navigate("http://localhost:3000/dashboard")
mcp__playwright__browser_console_messages()
# Expected: 0 errors

✅ 6. Visual Regression (Chromatic)
npm run chromatic
# Expected: 0 regressions (ou acceptées)

✅ 7. Storybook Build
npm run build-storybook
# Expected: Success, all stories render

✅ 8. Bundle Size Analysis
npm run analyze
# Expected: Size targets respectés

✅ 9. Accessibility Audit
npm run a11y:check
# Expected: 100% WCAG AA (ou progress vs baseline)

✅ 10. Performance (Lighthouse)
npm run lighthouse
# Expected: LCP <2s, CLS <0.1
```

---

**Fin Plan de Refactorisation**

**Prochaine étape** : Consulter `GUIDE-DESIGN-SYSTEM-V2.md` pour documentation usage composants et bonnes pratiques contribution.
