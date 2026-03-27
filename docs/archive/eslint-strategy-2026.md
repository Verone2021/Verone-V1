# Stratégie ESLint 2026 - Prévention & Migration Graduelle

**Date**: 2026-01-27
**Status**: ✅ Phase 0 Implémentée
**Approche**: Alternative pragmatique (sans bulk suppressions)

---

## 📊 État Actuel

| Métrique | Valeur | Gravité |
|----------|--------|---------|
| **Erreurs ESLint** | **119** | 🔴 **CRITIQUE - DOIT FIXER** |
| **Warnings ESLint** | **1,946** | 🟡 Toléré (migration graduelle) |
| **Total** | 2,065 | - |

### Pourquoi 119 Erreurs Sont Critiques

**Ce sont des bugs async silencieux en production** :
- `no-floating-promises` : Promises ignorées → erreurs silencieuses
- `no-misused-promises` : Promises dans mauvais contexte → corruptions
- `await-thenable` : await sur non-Promise → comportement inattendu

**Exemple de bug réel** :
```typescript
// ❌ ERREUR - Promise ignorée (commande perdue si API échoue)
onClick={() => {
  createOrder(orderData); // Pas d'await, pas de catch
}}

// ✅ CORRECT
onClick={() => {
  void createOrder(orderData).catch((error) => {
    console.error('[Order] Failed:', error);
    toast.error('Erreur lors de la création');
  });
}}
```

---

## 🛡️ Phase 0 : Prévention (COMPLÈTE ✅)

### 1. Husky + lint-staged (Pre-commit Hook)

**Fichier** : `.husky/pre-commit`
```bash
npx lint-staged
```

**Configuration** : `.lintstagedrc.js`
```javascript
export default {
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',      // BLOQUE si ERREURS (async bugs)
    'prettier --write',  // TOLÈRE warnings (type-safety)
  ],
  '**/*.{json,md}': ['prettier --write'],
};
```

### 2. ESLint Config (Règles Async = ERROR)

**Fichier** : `eslint.config.mjs` (lignes 332-351, 354-375)

**Changement clé** : Overrides NE downgrade PAS les règles async critiques
```javascript
rules: {
  // Type-safety: WARN (migration graduelle OK)
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unsafe-*': 'warn',

  // ⚠️ ASYNC: ERROR (inherited from base, NOT downgraded)
  // '@typescript-eslint/no-floating-promises': 'error',
  // '@typescript-eslint/no-misused-promises': 'error',
}
```

### 3. CI/CD GitHub Actions

**Fichier** : `.github/workflows/lint.yml`

**Valide chaque PR** :
- ✅ ESLint (bloque si erreurs)
- ✅ Type-check
- ✅ Build production

---

## 🚀 Prochaines Étapes : Phase 1 (Urgent)

### Objectif : Corriger les 119 Erreurs Async

**Estimation** : 2-3h (ou par batch sur plusieurs jours)

### Approche par Zones

| Zone | Erreurs Estimées | Priorité |
|------|------------------|----------|
| API Routes & Server Actions | ~40 | 🔴 Très haute (sécurité) |
| React Query Hooks | ~35 | 🔴 Haute (data corruption) |
| Event Handlers (onClick, etc.) | ~30 | 🟠 Moyenne (UX bugs) |
| Autres composants | ~14 | 🟡 Normale |

### Patterns de Correction

#### Pattern A : Fire-and-forget (pas d'UI feedback)
```typescript
onClick={() => {
  void handleAction().catch((error) => {
    console.error('[Action] Failed:', error);
    toast.error('Erreur');
  });
}}
```

#### Pattern B : Avec loading state
```typescript
const handleSubmit = async () => {
  setLoading(true);
  try {
    await createOrder(data);
    toast.success('Créé');
  } catch (error) {
    toast.error('Erreur');
  } finally {
    setLoading(false);
  }
};
```

#### Pattern C : React Query callbacks
```typescript
onSuccess: async (data) => {
  await queryClient.invalidateQueries({ queryKey: ['orders'] });
}
```

### Commandes Utiles

```bash
# Lister toutes les erreurs par fichier
pnpm lint 2>&1 | grep "error" | grep -E "\.ts|\.tsx" > errors.txt

# Compter les erreurs par app
pnpm lint --format json | jq '[.[] | select(.errorCount > 0)] | length'

# Fixer automatiquement ce qui peut l'être (peu de cas pour async)
pnpm lint:fix
```

---

## 📈 Phase 3 : Migration Graduelle (6-12 mois)

**1,946 warnings type-safety** : PAS d'urgence, correction progressive

### Boy Scout Rule

> "Laisse le code plus propre que tu l'as trouvé"

Quand vous travaillez sur un fichier :
1. Corriger SES warnings type-safety
2. Commit avec la feature

```bash
# Exemple
git commit -m "[BO-FEAT-123] feat: add filters + fix 12 type-safety warnings"
```

### Top 10 Fichiers à Prioriser

| Fichier | Warnings | Impact |
|---------|----------|--------|
| `use-linkme-catalog.ts` (BO) | 496 | 🔴 Très haute |
| `use-user-selection.ts` (LinkMe) | 312 | 🔴 Haute |
| `use-linkme-users.ts` (BO) | 270 | 🔴 Haute |
| `stocks/receptions/page.tsx` | 240 | 🟠 Moyenne |
| `stocks/expeditions/page.tsx` | 186 | 🟠 Moyenne |
| Autres (< 100 warnings) | ~442 | 🟡 Normale |

---

## 🤔 Pourquoi PAS Bulk Suppressions ?

### Problème Rencontré

```bash
NODE_OPTIONS='--max-old-space-size=8192' npx eslint --suppress-all --fix .
# ❌ Crash Node.js (stack overflow) ou timeout (10+ min)
```

**Raison** : Codebase trop volumineux (~150+ fichiers, 50k+ LOC)

### Approche Alternative (Meilleure)

✅ **Plus performante** : Pas de fichier JSON géant à maintenir
✅ **Déjà en place** : Overrides ESLint existants
✅ **Plus simple** : Pas de régénération après chaque correction
✅ **Standard industrie** : Approche utilisée par grandes équipes

---

## 📋 Checklist Phase 0 ✅

- [x] Husky + lint-staged installés
- [x] Pre-commit hook configuré
- [x] .lintstagedrc.js créé
- [x] ESLint async rules = ERROR (not downgraded)
- [x] CI/CD GitHub Actions créé
- [x] Documentation mise à jour
- [x] Commit initial (--no-verify)

## 📋 Checklist Phase 1 (À Faire)

- [ ] Lister les 119 erreurs par fichier
- [ ] Batch 1: API Routes (~40 erreurs)
- [ ] Batch 2: React Query Hooks (~35 erreurs)
- [ ] Batch 3: Event Handlers (~30 erreurs)
- [ ] Batch 4: Autres (~14 erreurs)
- [ ] Validation : `pnpm lint` = 0 erreurs
- [ ] Premier commit SANS --no-verify (hook validera)

---

## 🎯 Résultat Attendu (Après Phase 1)

```bash
pnpm lint
# ✅ 0 errors
# ⚠️  1,946 warnings (tolérés)
```

**Bénéfice** :
- ✅ Production sécurisée (pas de bugs async)
- ✅ Pre-commit hook fonctionne (bloque nouveaux bugs)
- ✅ Développement fluide (warnings tolérés)
- ✅ Migration graduelle (6-12 mois pour warnings)

---

**Dernière mise à jour** : 2026-01-27
**Auteur** : Claude Code (Phase 0 implementation)
