# Scripts - Verone Monorepo

**Date** : 2025-12-13
**Organisation** : Classification par catégorie avec archive historique

---

## Structure

```
scripts/
├── repo-doctor.sh          # Diagnostic principal santé repo
├── _archive/               # Scripts one-time archivés (par mois)
├── maintenance/            # Utilitaires build/cleanup
├── monitoring/             # Tests et vérifications runtime
├── security/               # RLS, scans sécurité
├── seeds/                  # Données seed SQL
├── users/                  # Gestion utilisateurs
└── validation/             # Hooks pre-commit (Husky)
```

---

## Scripts Principaux

### `repo-doctor.sh` (Racine)

Script de diagnostic santé du repository. **READ-ONLY**, aucune modification.

```bash
./scripts/repo-doctor.sh
```

**Vérifie** :

- Tokens environnement (DOIT être vide - OAuth keychain)
- Authentification GitHub CLI
- Branche courante et conventions nommage
- Commits non poussés
- Changements non commités
- Branches locales à nettoyer
- Branches remote
- Scan anti-secrets (fichiers trackés)
- .env.example (placeholders uniquement)

---

## Catégories

### `/maintenance` - Utilitaires Build & Cleanup

| Script                          | Description                     | Usage                                                    |
| ------------------------------- | ------------------------------- | -------------------------------------------------------- |
| `build-clean.sh`                | Nettoie cache et rebuild        | `./scripts/maintenance/build-clean.sh`                   |
| `start-dev-clean.sh`            | Dev avec cleanup préalable      | `./scripts/maintenance/start-dev-clean.sh`               |
| `cluster-ts-errors.js`          | Groupe erreurs TypeScript       | `node scripts/maintenance/cluster-ts-errors.js`          |
| `generate-types-no-docker.js`   | Types Supabase sans Docker      | `node scripts/maintenance/generate-types-no-docker.js`   |
| `fetch-types-from-dashboard.sh` | Récupère types depuis dashboard | `./scripts/maintenance/fetch-types-from-dashboard.sh`    |
| `auto-fix-structure.js`         | Auto-fix structure monorepo     | `node scripts/maintenance/auto-fix-structure.js`         |
| `detailed-products-analysis.js` | Analyse produits DB             | `node scripts/maintenance/detailed-products-analysis.js` |
| `cleanup-database.sql`          | Cleanup DB léger                | Via Supabase SQL Editor                                  |
| `cleanup-database-full.sql`     | Cleanup DB complet              | Via Supabase SQL Editor                                  |
| `cleanup-all-test-data.sql`     | Supprime données test           | Via Supabase SQL Editor                                  |
| `reset-stock-orders.sql`        | Reset stock/orders              | Via Supabase SQL Editor                                  |
| `fix-notifications-unicode.sql` | Fix unicode notifications       | Via Supabase SQL Editor                                  |

### `/monitoring` - Tests & Vérifications Runtime

| Script                           | Description                  | Usage                                                 |
| -------------------------------- | ---------------------------- | ----------------------------------------------------- |
| `check-console-errors.ts`        | Vérifie console errors pages | `npx tsx scripts/monitoring/check-console-errors.ts`  |
| `test-all-pages.mjs`             | Test toutes les pages        | `node scripts/monitoring/test-all-pages.mjs`          |
| `test-receptions-expeditions.sh` | Test réceptions/expéditions  | `./scripts/monitoring/test-receptions-expeditions.sh` |
| `auth-setup.ts`                  | Setup authentification test  | `npx tsx scripts/monitoring/auth-setup.ts`            |

### `/security` - RLS & Scans Sécurité

| Script                     | Description              | Usage                                           |
| -------------------------- | ------------------------ | ----------------------------------------------- |
| `validate-rls-coverage.sh` | Valide couverture RLS    | `./scripts/security/validate-rls-coverage.sh`   |
| `apply-rls-migration.mjs`  | Applique migration RLS   | `node scripts/security/apply-rls-migration.mjs` |
| `test-rls-isolation.sql`   | Test isolation RLS       | Via Supabase SQL Editor                         |
| `scan-console-logs.sh`     | Scan console.log oubliés | `./scripts/security/scan-console-logs.sh`       |

### `/validation` - Hooks Pre-commit (Husky)

| Script                        | Description                 | Appelé par       |
| ----------------------------- | --------------------------- | ---------------- |
| `check-db-type-alignment.ts`  | Vérifie alignement types DB | Husky pre-commit |
| `check-duplicate-hooks.ts`    | Détecte hooks dupliqués     | Husky pre-commit |
| `check-naming-consistency.ts` | Vérifie conventions nommage | Husky pre-commit |

> **Note** : Ces scripts sont exécutés automatiquement par Husky. Voir `validation/README.md`.

### `/users` - Gestion Utilisateurs

| Script                    | Description               | Usage                                           |
| ------------------------- | ------------------------- | ----------------------------------------------- |
| `create-user.js`          | Crée utilisateur Supabase | `node scripts/users/create-user.js`             |
| `setup-test-crud-user.ts` | Setup user test CRUD      | `npx tsx scripts/users/setup-test-crud-user.ts` |

### `/seeds` - Données Seed SQL

| Script                                | Description                  |
| ------------------------------------- | ---------------------------- |
| `create-owner-user.sql`               | Crée utilisateur owner       |
| `seed-test-data.sql`                  | Données test initiales       |
| `refonte-workflows-organisations.sql` | Seed workflows organisations |

> **Attention** : Ne jamais exécuter seeds en production sans validation explicite.

---

## Archive

### `/_archive/2025-11` - Scripts One-Time (Novembre 2025)

Scripts de migration et fixes ponctuels archivés après usage. Conservés pour référence historique.

**Contenu** :

- Migrations DB ponctuelles (`apply-*.mjs`)
- Fixes imports Turborepo (`fix-*.sh`)
- Scripts Google Merchant (`*-google-merchant-*.sql`)
- Investigations (`investigate-*.mjs`, `check-*.mjs`)
- Migrations données (`step2-*.mjs`, `step3-*.mjs`)

> **Ne pas réutiliser** sans analyse préalable - contexte spécifique à la migration Turborepo Nov 2025.

---

## Bonnes Pratiques

1. **Nouveaux scripts** : Placer dans la catégorie appropriée
2. **Scripts one-time** : Archiver après usage dans `_archive/YYYY-MM/`
3. **Scripts SQL** : Préférer exécution via Supabase SQL Editor (audit trail)
4. **Scripts critiques** : Toujours tester en local avant production
5. **Documentation** : Mettre à jour ce README après ajout/modification

---

**Dernière mise à jour** : 2025-12-13
