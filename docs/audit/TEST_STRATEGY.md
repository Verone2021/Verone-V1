# TEST_STRATEGY.md - Stratégie de Tests

**Date** : 2025-12-15
**Scope** : Vérone V1 Monorepo
**Mode** : READ-ONLY Audit (faits uniquement)

---

## 1. Ce qui est en place (Prouvé)

### Infrastructure de Tests

| Type           | Fichier/Script                               | Status    | Preuve                        |
| -------------- | -------------------------------------------- | --------- | ----------------------------- |
| Unit tests     | `npm run test` (Vitest)                      | Configuré | `package.json` script présent |
| Type checking  | `npm run type-check`                         | Actif     | Pre-commit hook               |
| Linting        | `npm run lint`                               | Actif     | Pre-commit hook               |
| E2E Playwright | `playwright.config.ts`                       | Configuré | Fichier existe                |
| Console check  | `scripts/monitoring/check-console-errors.ts` | Pre-push  | Issue #22 (timeout)           |

### Fichiers de Tests Existants

**Preuve** : `find . -name "*.test.ts" -o -name "*.spec.ts" | grep -v node_modules`

```
./tests/database/stock-alerts-migrations.spec.ts
./tests/components/button-unified.spec.ts
./tests/e2e/stocks/alertes-workflow.spec.ts
./tests/e2e/stocks/quick-purchase-modal.spec.ts
./tests/e2e/stocks/dashboard.spec.ts
./tests/e2e/stocks/mouvements.spec.ts
./tests/e2e/stocks/inventaire.spec.ts
./tests/e2e/stocks/alertes-card.spec.ts
./tests/e2e/stocks/alertes-performance.spec.ts
```

**Total** : 9 fichiers de tests identifiés.

### Scripts Monitoring Existants

**Preuve** : `ls scripts/monitoring/`

| Script                           | Purpose                             |
| -------------------------------- | ----------------------------------- |
| `auth-setup.ts`                  | Setup authentification tests        |
| `check-console-errors.ts`        | Vérifie erreurs console (11KB)      |
| `test-all-pages.mjs`             | Test toutes les pages (8KB)         |
| `test-receptions-expeditions.sh` | Tests réceptions/expéditions (18KB) |

### Hooks Husky

**Preuve** : Fichiers `.husky/`

| Hook       | Commandes                                                | Status                    |
| ---------- | -------------------------------------------------------- | ------------------------- |
| pre-commit | `npm run type-check`, `npx lint-staged`                  | Actif                     |
| pre-push   | `npx ts-node scripts/monitoring/check-console-errors.ts` | Problématique (Issue #22) |

---

## 2. Ce qui a été testé (Session 2025-12-15)

### Test Playwright MCP (READ-ONLY)

| Page             | URL                               | Résultat | Erreurs Console |
| ---------------- | --------------------------------- | -------- | --------------- |
| Homepage LinkMe  | `http://localhost:3002/`          | OK       | 0               |
| Dashboard LinkMe | `http://localhost:3002/dashboard` | OK       | 0               |
| Catalogue LinkMe | `http://localhost:3002/catalogue` | OK       | 0               |

### Données Existantes Confirmées

| Élément            | Valeur                        |
| ------------------ | ----------------------------- |
| Utilisateur        | Admin Pokawa (Admin Enseigne) |
| Produits catalogue | 3 (1 sur mesure + 2 généraux) |
| Commandes mois     | 3                             |
| CA mensuel         | 698.20 € HT                   |

---

## 3. Procédure de Régression Manuelle

### Prérequis

- Serveur LinkMe démarré : `npm run dev --filter=@verone/linkme`
- Utilisateur avec session active

### Parcours 1 : Navigation LinkMe

1. Accéder à `http://localhost:3002`
2. Vérifier homepage charge sans erreur
3. Cliquer "Se connecter" → `/login`
4. Si session existe : redirection automatique vers `/dashboard`
5. Vérifier dashboard affiche KPIs (commissions, CA)
6. Naviguer vers `/catalogue`
7. Vérifier produits affichés (existants, pas de seed)

### Parcours 2 : Catalogue

1. Sur `/catalogue`, vérifier :
   - Section "Produits sur mesure" (si applicable)
   - Section "Catalogue général"
   - Nombre de produits affiché
2. Utiliser recherche/filtres
3. Vérifier aucune erreur console (DevTools → Console)

### Parcours 3 : Sélection

1. Naviguer vers `/ma-selection`
2. Vérifier liste sélections existantes
3. NON CONFIRMÉ : Création nouvelle sélection (non testé)

---

## 4. Comment Lancer les Tests Existants

### Tests Unitaires (Vitest)

```bash
npm run test
# ou avec coverage
npm run test:coverage
```

**Status** : NON CONFIRMÉ (pas de preuve d'exécution récente)

### Tests E2E (Playwright)

```bash
npx playwright test
# ou un fichier spécifique
npx playwright test tests/e2e/stocks/dashboard.spec.ts
```

**Status** : NON CONFIRMÉ (pas de preuve d'exécution récente)

### Check Console Errors

```bash
npx ts-node scripts/monitoring/check-console-errors.ts
```

**Status** : PROBLÉMATIQUE - Timeout sur routes dashboard (Issue #22)

---

## 5. Problèmes Identifiés

### Issue #22 : Pre-push Hook Timeout

**Symptôme** : Le hook pre-push timeout sur les routes dashboard.

**Cause probable** : `check-console-errors.ts` attend `networkidle` sur des pages avec refresh automatique.

**Recommandation** : Déplacer en CI (nightly ou PR) au lieu de pre-push.

---

## 6. Ce qui n'est PAS confirmé

| Élément                             | Status       |
| ----------------------------------- | ------------ |
| Coverage actuel des tests unitaires | NON CONFIRMÉ |
| Exécution récente des tests E2E     | NON CONFIRMÉ |
| Tests d'intégration API routes      | NON CONFIRMÉ |
| Tests Back-office (hors stocks)     | NON CONFIRMÉ |

---

**Dernière mise à jour** : 2025-12-15 14:45 UTC+1
