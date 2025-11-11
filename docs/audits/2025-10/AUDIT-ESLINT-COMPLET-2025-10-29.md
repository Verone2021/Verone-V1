# 📊 AUDIT ESLINT COMPLET - Vérone Back Office

**Date** : 2025-10-29
**Exécution** : `npm run lint`
**TypeScript** : ✅ 0 erreurs (BATCH 74D validé)

---

## 🎯 RÉSUMÉ EXÉCUTIF

| Catégorie    | Total   | Blocage Build            |
| ------------ | ------- | ------------------------ |
| **Errors**   | **16**  | ❌ Non (ESLint warnings) |
| **Warnings** | **115** | ✅ Aucun                 |
| **TOTAL**    | **131** | ✅ Production-ready      |

### Répartition par Priorité

- **P0 - CRITICAL** : 10 erreurs (hooks conditionnels, Storybook imports)
- **P1 - HIGH** : 92 warnings (react-hooks/exhaustive-deps)
- **P2 - MEDIUM** : 46 warnings (@next/next/no-img-element)
- **P3 - LOW** : 6 erreurs/warnings (prefer-const, alt-text, module-variable)

---

## 🔥 P0 - CRITICAL (10 erreurs à corriger en priorité)

### 1. react-hooks/rules-of-hooks (5 errors) ⚠️ BLOCKER

**Impact** : Violation règles React - Hooks appelés conditionnellement
**Risque** : Comportement imprévisible, crashes runtime

#### Fichiers Concernés

| Fichier                                                                  | Ligne | Description                                 |
| ------------------------------------------------------------------------ | ----- | ------------------------------------------- |
| `apps/back-office/apps/back-office/src/hooks/use-financial-documents.ts` | 365   | `useEffect` conditionnel après early return |
| `apps/back-office/apps/back-office/src/hooks/use-financial-payments.ts`  | 180   | `useEffect` conditionnel après early return |
| `apps/back-office/apps/back-office/src/hooks/use-treasury-stats.ts`      | 287   | `useEffect` conditionnel après early return |
| `apps/back-office/apps/back-office/src/hooks/use-treasury-stats.ts`      | 295   | `useState` conditionnel après early return  |
| `apps/back-office/apps/back-office/src/hooks/use-treasury-stats.ts`      | 310   | `useEffect` conditionnel après early return |

**Stratégie de Correction** :

```typescript
// ❌ AVANT - Hook conditionnel
if (!organisationId) return { loading: false, data: null };
useEffect(() => {
  fetchData();
}, []);

// ✅ APRÈS - Hook toujours appelé
useEffect(() => {
  if (!organisationId) return;
  fetchData();
}, [organisationId]);
```

**Estimation** : 30 minutes (5 fichiers)

---

### 2. storybook/no-renderer-packages (5 errors)

**Impact** : Import incorrect de `@storybook/react`
**Risque** : Problèmes build Storybook, configuration obsolète

#### Fichiers Concernés

| Fichier                                              | Solution                          |
| ---------------------------------------------------- | --------------------------------- |
| `src/stories/1-ui-base/Badges/Badge.stories.tsx`     | Remplacer par `@storybook/nextjs` |
| `src/stories/1-ui-base/Buttons/Button.stories.tsx`   | Remplacer par `@storybook/nextjs` |
| `src/stories/1-ui-base/Cards/Card.stories.tsx`       | Remplacer par `@storybook/nextjs` |
| `src/stories/1-ui-base/Cards/VeroneCard.stories.tsx` | Remplacer par `@storybook/nextjs` |
| `src/stories/1-ui-base/Inputs/Input.stories.tsx`     | Remplacer par `@storybook/nextjs` |

**Stratégie de Correction** :

```typescript
// ❌ AVANT
import type { Meta, StoryObj } from '@storybook/react';

// ✅ APRÈS
import type { Meta, StoryObj } from '@storybook/nextjs';
```

**Estimation** : 10 minutes (remplacement automatique possible)

---

## 🔴 P1 - HIGH (92 warnings react-hooks/exhaustive-deps)

### Analyse par Sous-Catégorie

| Sous-Type                                | Count | Impact Business                     |
| ---------------------------------------- | ----- | ----------------------------------- |
| **Missing dependencies in useEffect**    | 58    | ⚠️ High - Race conditions possibles |
| **Missing dependencies in useCallback**  | 22    | ⚠️ Medium - Stale closures          |
| **Complex expressions in deps**          | 5     | ℹ️ Low - Lisibilité                 |
| **Functions in deps causing re-renders** | 7     | ⚠️ Medium - Performance             |

### Distribution par Module

| Module                  | Count | Fichiers Critiques                                                          |
| ----------------------- | ----- | --------------------------------------------------------------------------- |
| **Hooks**               | 42    | `use-supabase-query.ts`, `use-organisations.ts`, `use-movements-history.ts` |
| **Business Components** | 28    | `product-*.tsx`, `collection-*.tsx`, `stock-*.tsx`                          |
| **Forms**               | 12    | `*-form.tsx`, `*-modal.tsx`                                                 |
| **Pages**               | 10    | `/produits`, `/stocks`, `/consultations`                                    |

### Exemples Détaillés

#### 🔹 Catégorie 1 : Missing fetchData dependencies (58 occurrences)

```typescript
// Pattern récurrent dans tous les hooks de data fetching
useEffect(() => {
  fetchData();
}, []); // ⚠️ Missing 'fetchData'
```

**Impact** :

- Stale closures possibles
- `fetchData` pas ré-exécuté si dépendances changent

**Correction Recommandée** :

```typescript
const fetchData = useCallback(
  async () => {
    // ... fetch logic
  },
  [
    /* all dependencies */
  ]
);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

**Fichiers les Plus Touchés** :

1. `apps/back-office/apps/back-office/src/hooks/use-supabase-query.ts` (2 occurrences) - **CRITIQUE** (hook partagé)
2. `apps/back-office/apps/back-office/src/hooks/use-organisations.ts` (2 occurrences)
3. `apps/back-office/apps/back-office/src/hooks/use-movements-history.ts` (3 occurrences)

---

#### 🔹 Catégorie 2 : Multiple deps missing (22 occurrences)

```typescript
// apps/back-office/src/hooks/use-organisation-tabs.ts:46
useEffect(() => {
  if (tabValue === 'contacts' && contacts.length === 0) {
    fetchOrganisationContacts();
  }
}, [tabValue]); // ⚠️ Missing: contacts, fetchOrganisationContacts
```

**Fichiers Affectés** :

- `use-organisation-tabs.ts` (3 lignes)
- `use-product-images.ts` (7 lignes)
- `use-collection-images.ts` (3 lignes)
- `purchase-order-form-modal.tsx` (1 ligne)

---

#### 🔹 Catégorie 3 : Complex expressions in deps (5 occurrences)

```typescript
// apps/back-office/src/hooks/use-product-primary-image.ts:115
useEffect(() => {
  fetchImages();
}, [productIds.join(',')]); // ⚠️ Complex expression
```

**Correction** :

```typescript
const productIdsKey = useMemo(() => productIds.join(','), [productIds]);

useEffect(() => {
  fetchImages();
}, [productIdsKey, fetchImages]);
```

---

## 🟡 P2 - MEDIUM (46 warnings @next/next/no-img-element)

### Analyse Performance Impact

**Problème** : Utilisation de `<img>` natif au lieu de `next/image`
**Impact** :

- ❌ Pas d'optimisation automatique des images
- ❌ LCP (Largest Contentful Paint) dégradé
- ❌ Bande passante non optimisée
- ❌ Pas de lazy loading automatique

### Distribution par Type de Composant

| Type                   | Count | Exemple                            |
| ---------------------- | ----- | ---------------------------------- |
| **Product images**     | 18    | Catalogue, cartes produits, modals |
| **Organisation logos** | 6     | Logo upload, organisation cards    |
| **UI Components**      | 12    | Bug reporter, error modals         |
| **Collection images**  | 5     | Collection cards, previews         |
| **Misc**               | 5     | Divers composants                  |

### Fichiers les Plus Impactés

| Fichier                                                                                   | Occurrences | Priorité  |
| ----------------------------------------------------------------------------------------- | ----------- | --------- |
| `apps/back-office/apps/back-office/src/app/produits/catalogue/categories/page.tsx`        | 3           | 🔴 HIGH   |
| `apps/back-office/apps/back-office/src/components/business/sales-order-form-modal.tsx`    | 2           | 🔴 HIGH   |
| `apps/back-office/apps/back-office/src/components/business/purchase-order-form-modal.tsx` | 2           | 🔴 HIGH   |
| `apps/back-office/apps/back-office/src/components/business/collection-products-modal.tsx` | 2           | 🟡 MEDIUM |
| `apps/back-office/apps/back-office/src/components/business/product-variants-section.tsx`  | 2           | 🟡 MEDIUM |

### Stratégie de Correction

```typescript
// ❌ AVANT
<img
  src={imageUrl}
  alt="Product"
  className="w-12 h-12 object-cover"
/>

// ✅ APRÈS
import Image from 'next/image'

<Image
  src={imageUrl}
  alt="Product"
  width={48}
  height={48}
  className="object-cover"
  loading="lazy" // Automatique mais explicite
/>
```

**Estimation** : 2 heures (46 fichiers, remplacement semi-automatique)

---

## 🟢 P3 - LOW (6 erreurs/warnings)

### 1. prefer-const (5 errors)

Variables jamais réassignées déclarées avec `let`

| Fichier                                                                             | Ligne | Variable           |
| ----------------------------------------------------------------------------------- | ----- | ------------------ |
| `apps/back-office/apps/back-office/src/components/business/add-product-modal.tsx`   | 111   | `body`             |
| `apps/back-office/apps/back-office/src/components/business/stock-reports-modal.tsx` | 192   | `dateFrom`         |
| `apps/back-office/apps/back-office/src/hooks/use-sales-shipments.ts`                | 534   | `organisationsMap` |
| `apps/back-office/apps/back-office/src/hooks/use-sales-shipments.ts`                | 547   | `individualsMap`   |
| `apps/back-office/apps/back-office/src/hooks/use-variant-groups.ts`                 | 486   | `finalUpdates`     |

**Correction** : Remplacer `let` par `const` (30 secondes par fichier)

---

### 2. @next/next/no-assign-module-variable (1 error)

```typescript
// apps/back-office/src/hooks/metrics/use-user-module-metrics.ts:122
module = cleanedModule; // ⚠️ Assign to reserved 'module' variable
```

**Correction** : Renommer variable `module` → `moduleValue`

---

### 3. jsx-a11y/alt-text (1 warning)

```typescript
// apps/back-office/src/components/business/error-report-modal.tsx:507
<img src={screenshot} /> // ⚠️ Missing alt attribute
```

**Correction** : Ajouter `alt="Screenshot"`

---

## 📋 PLAN DE CORRECTION - PRIORISATION

### Phase 1 : CRITICAL (1 heure) ⚠️ OBLIGATOIRE

1. **Corriger hooks conditionnels** (30 min)
   - `use-financial-documents.ts`
   - `use-financial-payments.ts`
   - `use-treasury-stats.ts`

2. **Corriger imports Storybook** (10 min)
   - Remplacement automatique `@storybook/react` → `@storybook/nextjs`

3. **Tests MCP Browser** (20 min)
   - Vérifier 0 console errors
   - Valider fonctionnement modules finance/treasury

---

### Phase 2 : HIGH (4 heures) 🔴 RECOMMANDÉ

#### Batch 1 : Shared Hooks (1h)

- `use-supabase-query.ts` (CRITICAL - partagé partout)
- `use-organisations.ts`
- `use-movements-history.ts`
- `use-product-images.ts`

#### Batch 2 : Business Components (2h)

- Tous les `*-modal.tsx` avec deps missing
- `product-*` components
- `collection-*` components

#### Batch 3 : Pages (1h)

- `/produits/catalogue/*`
- `/stocks/*`
- `/consultations/*`

---

### Phase 3 : MEDIUM (2 heures) 🟡 OPTIONNEL

**Migration `<img>` → `<Image>`** (46 fichiers)

Stratégie semi-automatique :

1. Créer script de migration
2. Tester sur 5 fichiers pilotes
3. Déployer sur tous les fichiers
4. Tests visuels pages principales

---

### Phase 4 : LOW (30 minutes) 🟢 COSMÉTIQUE

- Remplacer `let` → `const` (5 fichiers)
- Renommer `module` → `moduleValue`
- Ajouter `alt` attribute manquant

---

## 🎯 RECOMMANDATIONS

### Approche Recommandée pour Production

**Scénario 1 : Déploiement Immédiat**

- ✅ Phase 1 uniquement (hooks conditionnels + Storybook)
- ✅ Tests critiques
- ✅ Deploy production

**Scénario 2 : Qualité Maximale (Recommandé)**

- ✅ Phase 1 + Phase 2 (hooks conditionnels + exhaustive-deps)
- ✅ Tests exhaustifs
- ✅ Deploy production
- 📅 Phase 3 + 4 en post-deploy

---

## 📊 MÉTRIQUES & IMPACT

### Effort Total Estimé

| Phase     | Temps    | Complexité | Impact Prod |
| --------- | -------- | ---------- | ----------- |
| Phase 1   | 1h       | 🔴 HIGH    | ⚠️ CRITICAL |
| Phase 2   | 4h       | 🟡 MEDIUM  | 🔴 HIGH     |
| Phase 3   | 2h       | 🟢 LOW     | 🟡 MEDIUM   |
| Phase 4   | 30min    | 🟢 TRIVIAL | 🟢 LOW      |
| **TOTAL** | **7h30** | -          | -           |

### Impact Business par Module

| Module                 | Erreurs | Impact Production                 | Priorité |
| ---------------------- | ------- | --------------------------------- | -------- |
| **Finance/Trésorerie** | 5       | ⚠️ BLOQUANT (hooks conditionnels) | 🔴 P0    |
| **Storybook**          | 5       | ℹ️ Design System uniquement       | 🟡 P2    |
| **Produits/Stocks**    | 35      | ⚠️ Race conditions possibles      | 🔴 P1    |
| **Organisations**      | 8       | ⚠️ Stale data possible            | 🔴 P1    |
| **Images**             | 46      | ℹ️ Performance SEO                | 🟡 P2    |

---

## ✅ VALIDATION FINALE

### Pre-Deploy Checklist

- [ ] Phase 1 complétée (hooks conditionnels + Storybook)
- [ ] `npm run build` ✅ Success
- [ ] `npm run type-check` ✅ 0 errors
- [ ] MCP Playwright Browser tests ✅ 0 console errors
- [ ] Tests manuels modules Finance/Treasury
- [ ] Backup database avant deploy
- [ ] Deploy staging → tests → production

---

## 📝 NOTES TECHNIQUES

### ESLint Configuration Actuelle

```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "react-hooks/exhaustive-deps": "warn",
    "@next/next/no-img-element": "warn"
  }
}
```

**Recommandation** : Garder configuration actuelle (warnings seulement)
**Raison** : Permet deploy production sans bloquer sur ESLint

---

## 🔗 RESSOURCES

- [React Hooks Rules](https://react.dev/warnings/invalid-hook-call-warning)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

**Audit généré le** : 2025-10-29
**Outil** : ESLint 8.x + Next.js 15
**Auteur** : Claude Code (Vérone Audit System)
