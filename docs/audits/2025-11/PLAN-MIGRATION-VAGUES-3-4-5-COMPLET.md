# 📋 PLAN MIGRATION MONOREPO - VAGUES 3, 4, 5

**Date** : 2025-11-08  
**Objectif** : Finaliser migration monorepo de 95% → 100%  
**État actuel** : ✅ VAGUE 1 + VAGUE 2 terminées (18 packages, 411 fichiers, 0 erreurs TS)

---

## 📊 ÉTAT DES LIEUX COMPLET

### ✅ VAGUE 1 - Terminée
- **Package** : `@verone/ui`
- **Contenu** : 51 composants shadcn/ui + Design System V2
- **Statut** : ✅ 100% migré, 0 erreurs TS

### ✅ VAGUE 2 - Terminée
- **Packages** : 18 packages business
  - @verone/admin
  - @verone/categories
  - @verone/channels
  - @verone/collections
  - @verone/common
  - @verone/consultations
  - @verone/customers
  - @verone/dashboard
  - @verone/finance
  - @verone/logistics
  - @verone/notifications
  - @verone/orders
  - @verone/organisations
  - @verone/products
  - @verone/stock
  - @verone/suppliers
  - @verone/testing
  - @verone/ui-business
- **Contenu** : 411 fichiers TypeScript
- **Source** : Migration complète de `src/shared/modules/`
- **Statut** : ✅ 100% migré, 0 erreurs TS

### 📈 PROGRESSION MIGRATION
```
VAGUE 1 : UI        ███████████████████████████████ 100%
VAGUE 2 : Business  ███████████████████████████████ 100%
VAGUE 3 : Lib       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
VAGUE 4 : Imports   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
VAGUE 5 : Cleanup   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
─────────────────────────────────────────────────────
GLOBAL              ███████████████████████░░░░░░░░  95%
```

---

## 🎯 VAGUE 3 - MIGRATION LIB SPÉCIALISÉS

### 📁 Inventaire src/lib/
- **Total fichiers TypeScript** : 65 fichiers
- **Structure actuelle** :
  ```
  src/lib/
  ├── Fichiers racine (11)
  │   ├── deployed-modules.ts
  │   ├── excel-utils.ts
  │   ├── feature-flags.ts
  │   ├── logger.ts
  │   ├── pdf-utils.ts
  │   ├── pricing-utils.ts
  │   ├── product-status-utils.ts
  │   ├── sku-generator.ts
  │   ├── stock-history.ts
  │   ├── theme-v2.ts
  │   └── utils.ts
  └── Dossiers (54)
      ├── abby/ (6 fichiers)
      ├── analytics/ (2 fichiers)
      ├── auth/ (1 fichier)
      ├── business-rules/ (1 fichier)
      ├── design-system/ (11 fichiers)
      ├── export/ (1 fichier)
      ├── google-merchant/ (7 fichiers)
      ├── mcp/ (1 fichier)
      ├── middleware/ (2 fichiers)
      ├── monitoring/ (2 fichiers)
      ├── qonto/ (4 fichiers)
      ├── reports/ (1 fichier)
      ├── security/ (1 fichier)
      ├── stock/ (1 fichier)
      ├── supabase/ (3 fichiers)
      ├── testing/ (1 fichier)
      ├── upload/ (4 fichiers)
      ├── utils/ (1 fichier)
      ├── validation/ (2 fichiers)
      └── validators/ (1 fichier)
  ```

### 🗂️ CLASSIFICATION PAR DESTINATION

#### 📦 CATÉGORIE 1 - Supabase & Database (8 fichiers)
**Destination** : `@verone/utils/supabase`

| Fichier | Destination |
|---------|-------------|
| `supabase/client.ts` | `@verone/utils/supabase/client.ts` |
| `supabase/server.ts` | `@verone/utils/supabase/server.ts` |
| `supabase/types.ts` | `@verone/utils/supabase/types.ts` |
| `utils/organisation-helpers.ts` | `@verone/organisations/utils/helpers.ts` |
| `stock/movement-mappers.ts` | `@verone/stock/utils/movement-mappers.ts` |
| `validators/order-status-validator.ts` | `@verone/orders/validators/order-status.ts` |

**Impact imports estimé** : 40-50 fichiers à mettre à jour

---

#### 🎨 CATÉGORIE 2 - Design System & UI (12 fichiers)
**Destination** : `@verone/ui/tokens` + `@verone/ui/themes`

| Fichier | Destination |
|---------|-------------|
| `design-system/tokens/colors.ts` | `@verone/ui/tokens/colors.ts` |
| `design-system/tokens/spacing.ts` | `@verone/ui/tokens/spacing.ts` |
| `design-system/tokens/typography.ts` | `@verone/ui/tokens/typography.ts` |
| `design-system/tokens/shadows.ts` | `@verone/ui/tokens/shadows.ts` |
| `design-system/themes/light.ts` | `@verone/ui/themes/light.ts` |
| `design-system/themes/dark.ts` | `@verone/ui/themes/dark.ts` |
| `design-system/utils/index.ts` | `@verone/ui/utils/design-system.ts` |
| `theme-v2.ts` | `@verone/ui/themes/theme-v2.ts` |

**Impact imports estimé** : 24 fichiers (déjà identifiés `from '@/lib/design-system'`)

---

#### 💼 CATÉGORIE 3 - Utils Métier (18 fichiers)
**Destination** : Packages business appropriés

**Sous-catégorie 3.1 - Pricing (1 fichier)**
| Fichier | Destination |
|---------|-------------|
| `pricing-utils.ts` | `@verone/finance/utils/pricing.ts` |

**Sous-catégorie 3.2 - Products (2 fichiers)**
| Fichier | Destination |
|---------|-------------|
| `product-status-utils.ts` | `@verone/products/utils/product-status.ts` |
| `sku-generator.ts` | `@verone/products/utils/sku-generator.ts` |

**Sous-catégorie 3.3 - Stock (1 fichier)**
| Fichier | Destination |
|---------|-------------|
| `stock-history.ts` | `@verone/stock/utils/stock-history.ts` |

**Sous-catégorie 3.4 - Export (3 fichiers)**
| Fichier | Destination |
|---------|-------------|
| `excel-utils.ts` | `@verone/utils/export/excel.ts` |
| `pdf-utils.ts` | `@verone/utils/export/pdf.ts` |
| `export/csv.ts` | `@verone/utils/export/csv.ts` |

**Sous-catégorie 3.5 - Integrations (17 fichiers) → NOUVEAUX PACKAGES**

**Package** : `@verone/integrations` (nouveau)

```
packages/@verone/integrations/
├── abby/ (6 fichiers)
│   ├── client.ts
│   ├── sync-processor.ts
│   ├── types.ts
│   ├── errors.ts
│   ├── webhook-validator.ts
│   └── index.ts
├── google-merchant/ (7 fichiers)
│   ├── auth.ts
│   ├── client.ts
│   ├── config.ts
│   ├── excel-transformer.ts
│   ├── product-mapper.ts
│   ├── sync-client.ts
│   └── transformer.ts
└── qonto/ (4 fichiers)
    ├── client.ts
    ├── errors.ts
    ├── types.ts
    └── index.ts
```

**Impact imports estimé** :
- Abby : 1 fichier
- Google Merchant : 6 fichiers
- Qonto : 0 fichiers actuellement

---

#### 🛠️ CATÉGORIE 4 - Core Utils (9 fichiers)
**Destination** : `@verone/utils` (étendre package existant)

| Fichier | Destination |
|---------|-------------|
| `utils.ts` | `@verone/utils/core.ts` (fusionner avec cn.ts existant) |
| `logger.ts` | `@verone/utils/logger.ts` |
| `feature-flags.ts` | `@verone/utils/feature-flags.ts` |
| `deployed-modules.ts` | `@verone/utils/deployed-modules.ts` |
| `analytics/gdpr-analytics.ts` | `@verone/utils/analytics/gdpr.ts` |
| `analytics/privacy.ts` | `@verone/utils/analytics/privacy.ts` |
| `monitoring/console-error-tracker.ts` | `@verone/utils/monitoring/console-error-tracker.ts` |
| `monitoring/mcp-error-checker.ts` | `@verone/utils/monitoring/mcp-error-checker.ts` |
| `business-rules/naming-rules.ts` | `@verone/utils/business-rules/naming-rules.ts` |

**Impact imports estimé** : 0 fichiers (utils.ts déjà utilisé via `@verone/utils`)

---

#### 🏗️ CATÉGORIE 5 - Infrastructure (11 fichiers)
**Destination** : `@verone/utils` (ou rester en `src/lib/` selon criticité)

**Option A - Migration complète vers @verone/utils**
| Fichier | Destination |
|---------|-------------|
| `auth/session-config.ts` | `@verone/utils/auth/session-config.ts` |
| `middleware/api-security.ts` | `@verone/utils/middleware/api-security.ts` |
| `middleware/logging.ts` | `@verone/utils/middleware/logging.ts` |
| `security/headers.ts` | `@verone/utils/security/headers.ts` |
| `mcp/playwright-integration.ts` | `@verone/utils/mcp/playwright-integration.ts` |
| `testing/critical-tests-2025.ts` | `@verone/testing/critical-tests-2025.ts` |
| `upload/image-optimization.ts` | `@verone/utils/upload/image-optimization.ts` |
| `upload/supabase-utils.ts` | `@verone/utils/upload/supabase-utils.ts` |
| `upload/upload-performance-monitor.ts` | `@verone/utils/upload/performance-monitor.ts` |
| `upload/validation.ts` | `@verone/utils/upload/validation.ts` |

**Option B - Garder en src/lib/** (recommandé pour middleware/auth critiques Next.js)
- `middleware/*` → Rester en `src/lib/middleware/`
- `auth/session-config.ts` → Rester en `src/lib/auth/`
- Autres fichiers → Migrer vers `@verone/utils`

**Recommandation** : Option B (éviter complexité config Next.js middleware)

**Impact imports estimé** : 0-5 fichiers

---

#### ✅ CATÉGORIE 6 - Validation (3 fichiers)
**Destination** : `@verone/utils/validation`

| Fichier | Destination |
|---------|-------------|
| `validation/form-security.ts` | `@verone/utils/validation/form-security.ts` |
| `validation/profile-validation.ts` | `@verone/utils/validation/profile-validation.ts` |
| `reports/export-aging-report.ts` | `@verone/finance/utils/export-aging-report.ts` |

**Impact imports estimé** : 2-5 fichiers

---

#### 🎯 CATÉGORIE 7 - Actions (1 fichier)
**Destination** : `@verone/admin`

| Fichier | Destination |
|---------|-------------|
| `lib/actions/user-management.ts` | `@verone/admin/actions/user-management.ts` |

**Impact imports estimé** : 1-2 fichiers

---

### 📊 RÉCAPITULATIF VAGUE 3

| Catégorie | Fichiers | Destination | Impact Imports |
|-----------|----------|-------------|----------------|
| Supabase & DB | 8 | @verone/utils/supabase + packages business | 40-50 |
| Design System | 12 | @verone/ui | 24 |
| Utils Métier | 18 | Packages business + @verone/integrations | 10-15 |
| Core Utils | 9 | @verone/utils | 0-5 |
| Infrastructure | 11 | @verone/utils + src/lib (partiel) | 0-5 |
| Validation | 3 | @verone/utils/validation | 2-5 |
| Actions | 1 | @verone/admin | 1-2 |
| **TOTAL** | **65** | **7 destinations** | **77-106** |

### 🆕 NOUVEAUX PACKAGES À CRÉER

#### Package : `@verone/integrations`
```json
{
  "name": "@verone/integrations",
  "version": "1.0.0",
  "description": "Intégrations externes (Abby, Google Merchant, Qonto) pour Vérone CRM/ERP",
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./abby": "./src/abby/index.ts",
    "./google-merchant": "./src/google-merchant/index.ts",
    "./qonto": "./src/qonto/index.ts"
  }
}
```

**Contenu** : 17 fichiers (abby 6 + google-merchant 7 + qonto 4)

### ⏱️ ESTIMATION DURÉE VAGUE 3

| Phase | Durée | Détails |
|-------|-------|---------|
| **1. Création package @verone/integrations** | 20min | Structure + package.json + tsconfig.json |
| **2. Migration Supabase (8 fichiers)** | 40min | Déplacer + mettre à jour exports |
| **3. Migration Design System (12 fichiers)** | 30min | Déplacer vers @verone/ui/tokens |
| **4. Migration Utils Métier (18 fichiers)** | 1h | Répartition dans packages appropriés |
| **5. Migration Core Utils (9 fichiers)** | 30min | Extension @verone/utils |
| **6. Migration Infrastructure (11 fichiers)** | 40min | Décision Option A/B + migration |
| **7. Migration Validation (3 fichiers)** | 15min | @verone/utils/validation |
| **8. Migration Actions (1 fichier)** | 10min | @verone/admin/actions |
| **9. Build validation** | 15min | npm run build (tous packages) |
| **10. Tests** | 20min | Type-check + imports |
| **TOTAL VAGUE 3** | **4h** | **65 fichiers → 7 destinations** |

---

## 🔄 VAGUE 4 - UPDATE IMPORTS MASSIF

### 📊 INVENTAIRE IMPORTS ACTUELS

#### Source : `src/app/` (117 fichiers)
| Pattern Import | Occurrences | Destination Cible |
|----------------|-------------|-------------------|
| `from '@/components/ui/*'` | 267 | `from '@verone/ui'` |
| `from '@/shared/modules/*'` | 259 | `from '@verone/*'` (18 packages) |
| `from '@/lib/*'` | 78 | `from '@verone/utils'` ou packages appropriés |
| `from '@verone/*'` | 35 | ✅ Déjà migrés |
| **TOTAL à migrer** | **604** | - |

#### Source : `src/components/` (205 fichiers)
| Pattern Import | Occurrences | Destination Cible |
|----------------|-------------|-------------------|
| `from '@/lib/*'` | 32 | `from '@verone/utils'` ou packages |
| `from '@/shared/modules/*'` | 123 | `from '@verone/*'` |
| `from '@verone/*'` | 53 | ✅ Déjà migrés |
| **TOTAL à migrer** | **155** | - |

#### Source : `src/hooks/` (4 fichiers)
| Pattern Import | Occurrences | Destination Cible |
|----------------|-------------|-------------------|
| `from '@/hooks/*'` | 4 | `from '@verone/common/hooks'` |

### 📋 PATTERNS DE REMPLACEMENT

#### Pattern 1 : Composants UI
```typescript
// AVANT
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// APRÈS
import { Button, Card } from '@verone/ui'
```

**Impact** : 267 occurrences dans `src/app/`

#### Pattern 2 : Modules Business
```typescript
// AVANT
import { useProducts } from '@/shared/modules/products/hooks'
import { ProductCard } from '@/shared/modules/products/components/ProductCard'

// APRÈS
import { useProducts, ProductCard } from '@verone/products'
```

**Impact** : 382 occurrences (259 app + 123 components)

#### Pattern 3 : Lib Utils
```typescript
// AVANT
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// APRÈS
import { cn } from '@verone/utils'
import { createClient } from '@verone/utils/supabase'
```

**Impact** : 110 occurrences (78 app + 32 components)

#### Pattern 4 : Design System
```typescript
// AVANT
import { colors } from '@/lib/design-system'

// APRÈS
import { colors } from '@verone/ui/tokens'
```

**Impact** : 24 occurrences

### 🛠️ STRATÉGIE DE REMPLACEMENT

#### Option A - Remplacement Manuel Assisté (Recommandé)
**Outil** : Script Node.js avec AST parsing (jscodeshift)

```javascript
// scripts/migrate-imports.js
const patterns = [
  {
    from: /from ['"]@\/components\/ui\/([^'"]+)['"]/g,
    to: "from '@verone/ui'",
    consolidate: true // Grouper imports multiples
  },
  {
    from: /from ['"]@\/shared\/modules\/([^\/]+)\/([^'"]+)['"]/g,
    to: (match, module, path) => `from '@verone/${module}'`
  },
  {
    from: /from ['"]@\/lib\/utils['"]/g,
    to: "from '@verone/utils'"
  }
  // ... autres patterns
]
```

**Avantages** :
- Contrôle total sur transformations
- Consolidation imports automatique
- Validation imports après remplacement

**Durée estimée** : 1h (script) + 2h (exécution + validation)

#### Option B - Recherche/Remplacement VSCode Batch
**Outil** : VSCode Find & Replace avec regex

**Avantages** :
- Rapide pour patterns simples
- Pas de tooling supplémentaire

**Inconvénients** :
- Pas de consolidation automatique
- Risque erreurs sur imports multiples

**Durée estimée** : 3-4h (manuel)

**Recommandation** : Option A (script automatisé)

### 📊 RÉCAPITULATIF VAGUE 4

| Source | Fichiers | Imports à migrer | Stratégie |
|--------|----------|------------------|-----------|
| `src/app/` | 117 | 604 | Script jscodeshift |
| `src/components/` | 205 | 155 | Script jscodeshift |
| `src/hooks/` | 4 | 4 | Manuel (seulement 4) |
| **TOTAL** | **326** | **763** | - |

### ⏱️ ESTIMATION DURÉE VAGUE 4

| Phase | Durée | Détails |
|-------|-------|---------|
| **1. Script jscodeshift** | 1h | Écrire patterns transformation |
| **2. Tests script (dry-run)** | 30min | Vérifier output sur échantillon |
| **3. Exécution script src/app** | 15min | 117 fichiers, 604 imports |
| **4. Exécution script src/components** | 15min | 205 fichiers, 155 imports |
| **5. Migration manuelle src/hooks** | 10min | 4 fichiers seulement |
| **6. Validation imports** | 30min | Type-check + build |
| **7. Tests manuels** | 30min | Vérifier 10-15 fichiers critiques |
| **8. Corrections erreurs** | 30min | Fix edge cases |
| **TOTAL VAGUE 4** | **3h30** | **326 fichiers, 763 imports** |

---

## 🧹 VAGUE 5 - VALIDATION & CLEANUP

### 📁 FICHIERS OBSOLÈTES À SUPPRIMER

#### Dossier : `src/shared/modules/` (411 fichiers)
**Action** : Suppression complète après validation VAGUE 4

**Vérification préalable** :
```bash
# Vérifier aucun import restant vers @/shared/modules
grep -r "from '@/shared/modules" src/app src/components
# Résultat attendu : 0 occurrences
```

**Commande suppression** :
```bash
rm -rf src/shared/modules/
```

**Gain espace** : ~4.3 MB

#### Dossier : `src/lib/` (65 fichiers)
**Action** : Suppression partielle (garder middleware + auth si Option B VAGUE 3)

**Option A (migration complète)** :
```bash
rm -rf src/lib/
```

**Option B (garder infrastructure)** :
```bash
# Garder seulement
src/lib/middleware/
src/lib/auth/
# Supprimer le reste
```

**Gain espace estimé** : ~500 KB - 1 MB

#### Fichiers `src/types/` obsolètes
**Action** : Consolider dans `@verone/types`

Fichiers à évaluer :
- `database-old.ts` (180 KB) → Supprimer (obsolète)
- `supabase-generated.ts` (vide) → Supprimer
- `supabase-new.ts` (vide) → Supprimer
- `variant-groups.ts` → Migrer vers `@verone/products/types`
- `collections.ts` → Migrer vers `@verone/collections/types`

**Gain espace estimé** : ~200 KB

### 🧪 TESTS À METTRE À JOUR

#### Tests unitaires (si existants)
**Localisation** : `src/**/*.test.ts`, `src/**/*.spec.ts`

**Patterns à mettre à jour** :
```typescript
// AVANT
import { useProducts } from '@/shared/modules/products/hooks'

// APRÈS
import { useProducts } from '@verone/products'
```

**Commande recherche** :
```bash
find src -name "*.test.ts" -o -name "*.spec.ts"
```

#### Tests E2E Playwright (si applicable)
**Localisation** : `tests/`, `e2e/`

**Action** : Vérifier imports helpers/utils

### 📚 DOCUMENTATION À CRÉER

#### 1. Guide Migration Imports
**Fichier** : `docs/guides/MIGRATION-IMPORTS-GUIDE.md`

**Contenu** :
- Table correspondance ancien → nouveau imports
- Exemples avant/après
- Troubleshooting erreurs communes

#### 2. README Packages
**Fichiers** :
- `packages/@verone/integrations/README.md` (nouveau)
- Mettre à jour READMEs existants avec nouvelles exports

#### 3. Architecture Documentation
**Fichier** : `docs/architecture/MONOREPO-STRUCTURE.md`

**Contenu** :
- Structure complète packages @verone
- Graphe dépendances
- Guidelines ajout nouveaux packages

### ✅ VÉRIFICATIONS FINALES

#### Checklist Build & Types
- [ ] `npm run type-check` → 0 erreurs
- [ ] `npm run build` → Success tous packages
- [ ] `npm run lint` → 0 erreurs critiques
- [ ] Vérifier `tsconfig.json` → Tous paths @verone/* configurés

#### Checklist Imports
- [ ] Aucun import `@/shared/modules` restant
- [ ] Aucun import `@/lib` (sauf middleware/auth si Option B)
- [ ] Tous imports `@verone/*` résolus correctement

#### Checklist Cleanup
- [ ] `src/shared/modules/` supprimé
- [ ] `src/lib/` nettoyé (partiel ou complet)
- [ ] Fichiers obsolètes `src/types/` supprimés
- [ ] `node_modules` propres (pas de packages orphelins)

#### Checklist Documentation
- [ ] Guide migration imports créé
- [ ] READMEs packages à jour
- [ ] Architecture monorepo documentée

### 📊 RÉCAPITULATIF VAGUE 5

| Tâche | Fichiers impactés | Gain espace |
|-------|-------------------|-------------|
| Supprimer `src/shared/modules/` | 411 | ~4.3 MB |
| Cleanup `src/lib/` | 50-65 | ~0.5-1 MB |
| Cleanup `src/types/` | 3-5 | ~200 KB |
| Mettre à jour tests | 10-20 | - |
| Créer documentation | 3 nouveaux fichiers | - |
| **TOTAL** | **474-501** | **~5 MB** |

### ⏱️ ESTIMATION DURÉE VAGUE 5

| Phase | Durée | Détails |
|-------|-------|---------|
| **1. Validation imports (script)** | 15min | grep récursif @/shared, @/lib |
| **2. Suppression src/shared/modules** | 5min | rm -rf + commit |
| **3. Cleanup src/lib** | 15min | Décision Option A/B + suppression |
| **4. Cleanup src/types** | 15min | Migrer 2-3 fichiers + supprimer obsolètes |
| **5. Mise à jour tests** | 30min | Si tests existants |
| **6. Documentation** | 1h | 3 fichiers Markdown |
| **7. Vérifications finales** | 30min | Build + type-check + lint |
| **8. Tests manuels complets** | 45min | Vérifier 15-20 pages critiques |
| **TOTAL VAGUE 5** | **3h15** | **Cleanup + Documentation + Validation** |

---

## 📈 RÉCAPITULATIF GLOBAL VAGUES 3-4-5

### 📊 Tableau Synthèse

| Vague | Objectif | Fichiers | Imports | Durée | Complexité |
|-------|----------|----------|---------|-------|------------|
| **VAGUE 3** | Migration src/lib/ | 65 | 77-106 | 4h | 🟡 Moyenne |
| **VAGUE 4** | Update imports massif | 326 | 763 | 3h30 | 🟠 Élevée |
| **VAGUE 5** | Cleanup + Validation | 474-501 | - | 3h15 | 🟢 Faible |
| **TOTAL** | **Finalisation 95%→100%** | **865-892** | **840-869** | **10h45** | - |

### 📅 PLANNING RECOMMANDÉ

#### Jour 1 (4h)
- ✅ VAGUE 3 : Migration complète src/lib/ (65 fichiers)
- ✅ Validation build + tests

#### Jour 2 (4h)
- ✅ VAGUE 4 : Développement script jscodeshift (1h)
- ✅ VAGUE 4 : Exécution migration imports (1h30)
- ✅ VAGUE 4 : Validation + corrections (1h30)

#### Jour 3 (3h15)
- ✅ VAGUE 5 : Cleanup fichiers obsolètes (35min)
- ✅ VAGUE 5 : Documentation (1h)
- ✅ VAGUE 5 : Vérifications finales + tests (1h15)

**Total** : 3 jours (11h15 avec buffer)

### 🎯 OBJECTIFS VAGUE 3-4-5

| Objectif | Métrique Avant | Métrique Après |
|----------|----------------|----------------|
| **Migration monorepo** | 95% | 100% ✅ |
| **Imports @verone/** | 88 | 763+ ✅ |
| **Packages @verone** | 20 | 21 (@verone/integrations) ✅ |
| **Fichiers src/shared** | 411 | 0 ✅ |
| **Fichiers src/lib** | 65 | 0-11 (Option A/B) ✅ |
| **Erreurs TypeScript** | 0 | 0 ✅ |

### 🚨 RISQUES & MITIGATIONS

#### Risque 1 - Erreurs TypeScript post-migration VAGUE 3
**Impact** : 🔴 Élevé  
**Probabilité** : 🟡 Moyenne  
**Mitigation** :
- Type-check après chaque catégorie migrée
- Build validation incrémentale
- Rollback Git si échec

#### Risque 2 - Imports cassés post-VAGUE 4
**Impact** : 🔴 Élevé  
**Probabilité** : 🟡 Moyenne  
**Mitigation** :
- Script jscodeshift avec dry-run MANDATORY
- Tests manuels sur 15-20 fichiers critiques
- Git branch dédiée pour VAGUE 4

#### Risque 3 - Régression fonctionnelle
**Impact** : 🔴 Critique  
**Probabilité** : 🟢 Faible  
**Mitigation** :
- Tests MCP Browser AVANT et APRÈS chaque vague
- Console errors = 0 tolerance
- Smoke tests post-migration

#### Risque 4 - Overhead maintenance monorepo
**Impact** : 🟡 Moyen  
**Probabilité** : 🟢 Faible  
**Mitigation** :
- Documentation architecture exhaustive
- READMEs à jour pour chaque package
- Guidelines ajout nouveaux packages

---

## 📋 CHECKLIST EXÉCUTION GLOBALE

### VAGUE 3 - Migration Lib (4h)
- [ ] Créer package `@verone/integrations`
- [ ] Migrer Supabase (8 fichiers) → @verone/utils/supabase
- [ ] Migrer Design System (12 fichiers) → @verone/ui/tokens
- [ ] Migrer Utils Métier (18 fichiers) → packages appropriés
- [ ] Migrer Core Utils (9 fichiers) → @verone/utils
- [ ] Décision Infrastructure Option A/B
- [ ] Migrer Infrastructure (11 fichiers)
- [ ] Migrer Validation (3 fichiers)
- [ ] Migrer Actions (1 fichier)
- [ ] Build validation (`npm run build`)
- [ ] Type-check (`npm run type-check`)
- [ ] Tests MCP Browser

### VAGUE 4 - Update Imports (3h30)
- [ ] Développer script jscodeshift
- [ ] Dry-run script sur échantillon
- [ ] Exécuter script src/app (117 fichiers)
- [ ] Exécuter script src/components (205 fichiers)
- [ ] Migration manuelle src/hooks (4 fichiers)
- [ ] Validation imports (grep @/shared, @/lib)
- [ ] Type-check + build
- [ ] Tests manuels 15-20 fichiers critiques
- [ ] Corrections erreurs edge cases

### VAGUE 5 - Cleanup & Validation (3h15)
- [ ] Validation finale imports (0 @/shared, 0 @/lib)
- [ ] Supprimer `src/shared/modules/` (411 fichiers)
- [ ] Cleanup `src/lib/` (Option A ou B)
- [ ] Cleanup `src/types/` (fichiers obsolètes)
- [ ] Mettre à jour tests (si applicable)
- [ ] Créer `MIGRATION-IMPORTS-GUIDE.md`
- [ ] Créer `@verone/integrations/README.md`
- [ ] Mettre à jour `MONOREPO-STRUCTURE.md`
- [ ] Build final + type-check + lint
- [ ] Tests manuels complets (20 pages)
- [ ] Smoke tests production

---

## 🎉 CRITÈRES DE SUCCÈS

### Critères Techniques
- ✅ Migration monorepo : **100%**
- ✅ Erreurs TypeScript : **0**
- ✅ Build time : **< 25s** (cible < 20s)
- ✅ Imports @verone : **763+**
- ✅ Packages @verone : **21**
- ✅ Console errors : **0** (tolérance zéro)

### Critères Organisationnels
- ✅ Documentation migration complète
- ✅ READMEs packages à jour
- ✅ Architecture monorepo documentée
- ✅ Guidelines ajout packages
- ✅ Cleanup src/shared + src/lib effectué

### Critères Qualité
- ✅ Tests MCP Browser passent
- ✅ Aucune régression fonctionnelle
- ✅ Performance maintenue (<2s dashboard, <3s pages)
- ✅ Code review validation (si applicable)

---

**Date création** : 2025-11-08  
**Auteur** : Claude Code (Analyse exhaustive)  
**Statut** : ⏳ Plan détaillé prêt pour exécution  
**Prochaine étape** : Validation plan avec utilisateur → Lancement VAGUE 3

---

## 🔗 ANNEXES

### Script jscodeshift (VAGUE 4)
```javascript
// scripts/migrate-imports.js
// Voir fichier complet dans docs/guides/MIGRATION-IMPORTS-GUIDE.md
```

### Patterns Regex VSCode (Fallback VAGUE 4)
```regex
// Pattern 1 - UI Components
Find: from ['"]@/components/ui/([^'"]+)['"]
Replace: from '@verone/ui'

// Pattern 2 - Business Modules
Find: from ['"]@/shared/modules/([^/]+)/([^'"]+)['"]
Replace: from '@verone/$1'

// Pattern 3 - Lib Utils
Find: from ['"]@/lib/utils['"]
Replace: from '@verone/utils'
```

### Commandes Utiles
```bash
# Vérifier imports restants @/shared
grep -r "from '@/shared" src/ --include="*.ts" --include="*.tsx"

# Vérifier imports restants @/lib
grep -r "from '@/lib" src/ --include="*.ts" --include="*.tsx"

# Compter imports @verone actuels
grep -r "from '@verone/" src/ --include="*.ts" --include="*.tsx" | wc -l

# Build tous packages
npm run build

# Type-check strict
npm run type-check
```
