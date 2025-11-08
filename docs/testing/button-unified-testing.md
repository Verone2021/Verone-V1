# ButtonUnified - Guide de Testing

**Date** : 2025-11-08
**Stratégie** : Tests E2E Playwright (workaround Component Testing)
**Coverage** : 11 tests critiques - 100% variants, sizes, states, interactions

---

## 🎯 Objectif

Valider le bon fonctionnement de **ButtonUnified** (composant générique Design System V2) avec des tests E2E robustes dans un vrai navigateur.

---

## 🚀 Quick Start

### Lancer les tests

```bash
# Tests ButtonUnified (11 tests)
npm run test:button

# Mode UI interactif (debug visuel)
npm run test:button:ui

# Mode debug pas-à-pas
npm run test:button:debug
```

### Vérifier la page de test manuellement

```bash
# 1. Lancer dev server
npm run dev

# 2. Ouvrir navigateur
open http://localhost:3001/test-components/button-unified
```

---

## 📊 Tests Coverage

### 11 Tests Critiques

| # | Test | Description | Couvre |
|---|------|-------------|--------|
| 1 | **All variants** | 8 variants visibles et fonctionnels | default, destructive, outline, secondary, ghost, link, gradient, glass |
| 2 | **All sizes** | 6 sizes avec tailles relatives correctes | xs, sm, md, lg, xl, icon |
| 3 | **Icon positions** | Icônes positionnées correctement | left, right, none |
| 4 | **Loading state** | Spinner visible + bouton disabled | loading={true} |
| 5 | **Disabled state** | Bouton non-clickable | disabled={true} |
| 6 | **Click handler** | onClick déclenché correctement | Compteur incrémenté |
| 7 | **Keyboard navigation** | Tab + Enter/Space fonctionnent | Focus + activation clavier |
| 8 | **Accessibility** | aria-label pour icon-only buttons | WCAG 2.2 AA |
| 9 | **Focus states** | Focus ring visible, disabled non-focusable | Focus management |
| 10 | **Console errors = 0** | RÈGLE SACRÉE : Aucune erreur console | Production-ready |
| 11 | **Combinations** | Variants + sizes + icons combinés | Real-world usage |

---

## 🏗️ Architecture Testing

### Approche : Playwright E2E sur Page Dédiée

**Pourquoi pas Playwright Component Testing ?**

- ❌ `@playwright/experimental-ct-react` incompatible avec monorepo actuel
- ❌ Erreur "Invalid Version" lors installation (conflit npm workspaces)
- ✅ **Solution** : Page Next.js dédiée `/test-components/button-unified`

**Avantages de cette approche** :

- ✅ Tests dans **vrai navigateur** (Chrome/Firefox/Safari)
- ✅ Tests **environnement réel** Next.js (SSR, App Router, Tailwind CSS)
- ✅ **Console error tracking** intégré (RÈGLE SACRÉE)
- ✅ **Screenshots automatiques** en cas d'échec
- ✅ Pas de dépendance supplémentaire (utilise Playwright existant)

---

## 📁 Fichiers Concernés

```
src/app/test-components/button-unified/
└── page.tsx                         # Page test Next.js (29 boutons)

tests/components/
└── button-unified.spec.ts           # 11 tests Playwright E2E

package.json                         # Scripts npm
└── test:button                      # Lancer tests
└── test:button:ui                   # Mode UI
└── test:button:debug                # Mode debug

docs/testing/
└── button-unified-testing.md        # Ce fichier
```

---

## 🔧 Comment Écrire des Tests

### Pattern Standard

```typescript
test('should [behavior description]', async ({ page }) => {
  // 1. Setup console error tracking (OBLIGATOIRE)
  const errors = setupConsoleErrorTracking(page);

  // 2. Naviguer vers page test (déjà fait dans beforeEach)
  // await page.goto('/test-components/button-unified');

  // 3. Interagir avec composant
  const button = page.locator('[data-testid="button-example"]');
  await expect(button).toBeVisible();
  await button.click();

  // 4. Vérifier résultat
  await expect(button).toContainText('Expected Text');

  // 5. RÈGLE SACRÉE : Vérifier 0 console errors
  expect(errors).toHaveLength(0);
});
```

### Sélecteurs Recommandés

**Priorité 1** : `data-testid` (sémantique, stable)

```typescript
// ✅ RECOMMANDÉ
page.locator('[data-testid="button-default"]');
```

**Priorité 2** : Rôle ARIA (accessibilité)

```typescript
// ✅ BON (accessibilité)
page.getByRole('button', { name: 'Enregistrer' });
```

**❌ ÉVITER** : Classes CSS (fragiles, changent avec design)

```typescript
// ❌ ÉVITER
page.locator('.bg-primary.text-white');
```

---

## 🧪 Exemples de Tests

### Test 1: Vérifier Variant

```typescript
test('should render destructive variant', async ({ page }) => {
  const errors = setupConsoleErrorTracking(page);

  const button = page.locator('[data-testid="button-destructive"]');

  // Visible
  await expect(button).toBeVisible();

  // Contient texte
  await expect(button).toContainText('Destructive');

  // Icon présent
  await expect(button.locator('svg')).toBeVisible();

  // Console clean
  expect(errors).toHaveLength(0);
});
```

### Test 2: Vérifier Interaction

```typescript
test('should increment counter on click', async ({ page }) => {
  const errors = setupConsoleErrorTracking(page);

  const button = page.locator('[data-testid="button-click-test"]');
  const counter = page.locator('[data-testid="click-counter"]');

  // Compteur initial
  const before = await counter.textContent();

  // Click
  await button.click();

  // Compteur incrémenté
  const after = await counter.textContent();
  expect(parseInt(after!)).toBe(parseInt(before!) + 1);

  // Console clean
  expect(errors).toHaveLength(0);
});
```

### Test 3: Vérifier Loading State

```typescript
test('should show spinner when loading', async ({ page }) => {
  const errors = setupConsoleErrorTracking(page);

  const button = page.locator('[data-testid="button-loading"]');

  // Déclencher loading
  await button.click();

  // Spinner visible
  await expect(button.locator('svg.animate-spin')).toBeVisible();

  // Bouton disabled
  await expect(button).toBeDisabled();

  // Console clean
  expect(errors).toHaveLength(0);
});
```

---

## 🚨 Règles d'Or

### RÈGLE SACRÉE : 0 Console Errors

**TOUJOURS vérifier console = 0 errors dans CHAQUE test**.

```typescript
// Setup au début de chaque test
const errors = setupConsoleErrorTracking(page);

// Assert à la fin
expect(errors).toHaveLength(0);
```

**Pourquoi c'est critique** :

- ❌ 1 erreur console = Régression potentielle production
- ❌ Erreurs masquées = Bugs découverts tard
- ✅ 0 erreur = Qualité production garantie

### Autres Règles

1. **beforeEach** : Naviguer vers page test + attendre `networkidle`
2. **data-testid** : Utiliser sélecteurs sémantiques stables
3. **Assertions multiples** : Visible + Texte + Interaction
4. **Screenshots** : Automatiques en cas d'échec (Playwright)
5. **Timeout** : 5s par assertion (config globale)

---

## 📈 Métriques de Qualité

### Résultats Attendus

```bash
npm run test:button

Running 11 tests using 1 worker
  ✓  1 ButtonUnified Component › should render all 8 variants correctly (2s)
  ✓  2 ButtonUnified Component › should render all 6 sizes correctly (1s)
  ✓  3 ButtonUnified Component › should display icons in correct positions (1s)
  ✓  4 ButtonUnified Component › should show spinner when loading (3s)
  ✓  5 ButtonUnified Component › should not be clickable when disabled (1s)
  ✓  6 ButtonUnified Component › should trigger onClick handler (1s)
  ✓  7 ButtonUnified Component › should support keyboard navigation (2s)
  ✓  8 ButtonUnified Component › should have aria-label for icon-only buttons (1s)
  ✓  9 ButtonUnified Component › should show focus ring when focused (1s)
  ✓ 10 ButtonUnified Component › should have ZERO console errors on page load (2s)
  ✓ 11 ButtonUnified Component › should render complex combinations correctly (1s)

  11 passed (18s)
```

### SLOs (Service Level Objectives)

- ✅ **Success rate** : 100% (11/11 tests passent)
- ✅ **Execution time** : <30s (actuellement ~18s)
- ✅ **Console errors** : 0 (tolérance zéro)
- ✅ **Coverage** : 100% variants, sizes, states

---

## 🔄 CI/CD Integration

### Workflow GitHub Actions (optionnel - Phase 2)

```yaml
# .github/workflows/pr-validation.yml
jobs:
  component-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:button
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-button
          path: playwright-report/
```

---

## 🐛 Troubleshooting

### Erreur : "Page not found /test-components/button-unified"

**Solution** :

```bash
# Vérifier dev server actif
npm run dev

# Vérifier fichier existe
ls -la src/app/test-components/button-unified/page.tsx
```

### Erreur : "Timeout waiting for locator"

**Solution** :

```typescript
// Augmenter timeout spécifique
await expect(button).toBeVisible({ timeout: 10000 }); // 10s
```

### Erreur : Console errors détectés

**Solution** :

1. Lancer page manuellement : `http://localhost:3001/test-components/button-unified`
2. Ouvrir DevTools (F12) → Console tab
3. Identifier erreur source
4. Corriger erreur dans ButtonUnified
5. Re-lancer tests

### Tests flaky (passent 1 fois / 2)

**Solution** :

```typescript
// Attendre state stable avant assert
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500); // Dernier recours
```

---

## 📚 Ressources

### Documentation Playwright

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Console Messages](https://playwright.dev/docs/api/class-consolemessage)

### Documentation Vérone

- [ButtonUnified Component](/src/components/ui/button-unified.tsx)
- [ButtonUnified Stories](/src/components/ui/button-unified.stories.tsx)
- [Playwright Config](/playwright.config.ts)
- [Testing Guide Global](/docs/guides/testing-guide.md)

---

## 🚀 Next Steps

### Phase 2 : Extension Coverage

**Composants à tester** :

- [ ] `Dialog` component
- [ ] `Select` component
- [ ] `Form` components (Input, Checkbox, Radio)
- [ ] `Modal` components (critical business logic)

**Pattern réutilisable** :

1. Créer page test dédiée `/test-components/[component-name]`
2. Créer spec E2E `tests/components/[component-name].spec.ts`
3. Ajouter script npm `test:[component-name]`
4. Documenter dans `docs/testing/`

### Phase 3 : Migration vers Component Testing

**Quand monorepo stable** :

- ✅ Résoudre conflit npm workspaces
- ✅ Installer `@playwright/experimental-ct-react`
- ✅ Migrer tests E2E → Component Testing
- ✅ Supprimer pages `/test-components/*`

---

**Auteur** : Claude Code
**Date création** : 2025-11-08
**Dernière mise à jour** : 2025-11-08
**Version** : 1.0.0
