# Scripts et Commandes Disponibles

Documentation complète de tous les scripts et commandes slash utilisables dans le projet Verone Back Office.

---

## 🛠️ Scripts npm (package.json)

### Scripts de Développement

| Commande            | Script                                  | Description                                   |
| ------------------- | --------------------------------------- | --------------------------------------------- |
| `pnpm dev`          | `turbo dev`                             | Lance tous les serveurs dev (ports 3000-3002) |
| `pnpm dev:stop`     | `./scripts/dev-stop.sh`                 | Arrête tous les serveurs dev                  |
| `pnpm dev:clean`    | `./scripts/dev-clean.sh`                | Nettoie caches + redémarre serveurs           |
| `pnpm dev:safe`     | `./scripts/validate-env.sh && pnpm dev` | Valide env + démarre serveurs                 |
| `pnpm env:validate` | `./scripts/validate-env.sh`             | Valide fichiers .env                          |

### Scripts de Build & Validation

| Commande          | Description                              |
| ----------------- | ---------------------------------------- |
| `pnpm build`      | Build production (tous les packages)     |
| `pnpm type-check` | Validation TypeScript (0 erreurs requis) |
| `pnpm lint`       | ESLint sur tout le monorepo              |
| `pnpm lint:fix`   | ESLint auto-fix                          |

### Scripts d'Audit

| Commande                | Script                                     | Description                 |
| ----------------------- | ------------------------------------------ | --------------------------- |
| `pnpm audit:component`  | `./scripts/audit-component-advanced.sh`    | Audit composant shadcn/ui   |
| `pnpm audit:batch`      | `./scripts/audit-all-components.sh`        | Audit tous les composants   |
| `pnpm validate:types`   | `tsx scripts/check-db-type-alignment.ts`   | Vérifie alignement types DB |
| `pnpm check:console`    | `tsx scripts/check-console-errors.ts`      | Détecte erreurs console     |
| `pnpm check:console:ci` | `tsx scripts/check-console-errors.ts --ci` | Version CI (strict)         |

### Scripts de Tests

| Commande               | Description                       |
| ---------------------- | --------------------------------- |
| `pnpm test:e2e`        | Tests E2E LinkMe (Playwright)     |
| `pnpm test:e2e:ui`     | Tests E2E en mode UI (debug)      |
| `pnpm test:e2e:headed` | Tests E2E avec navigateur visible |
| `pnpm test:e2e:report` | Ouvre rapport tests E2E           |

### Scripts Utilitaires

| Commande             | Script                              | Description                    |
| -------------------- | ----------------------------------- | ------------------------------ |
| `pnpm turbo:clean`   | `./scripts/turbo-cleanup.sh`        | Nettoie cache Turbo            |
| `pnpm monitor:start` | `nohup ./scripts/monitor-health.sh` | Lance monitoring santé système |

---

## 🔧 Scripts Shell Disponibles (scripts/)

### Scripts Activement Utilisés

| Script                        | Référencé dans | Usage                     |
| ----------------------------- | -------------- | ------------------------- |
| `dev-stop.sh`                 | package.json   | Arrêter serveurs dev      |
| `dev-clean.sh`                | package.json   | Nettoyer + redémarrer     |
| `validate-env.sh`             | package.json   | Valider fichiers .env     |
| `turbo-cleanup.sh`            | package.json   | Nettoyer cache Turbo      |
| `audit-component-advanced.sh` | package.json   | Audit composant UI        |
| `audit-all-components.sh`     | package.json   | Audit batch composants    |
| `check-db-type-alignment.ts`  | package.json   | Alignement types DB       |
| `check-console-errors.ts`     | package.json   | Détection erreurs console |
| `monitor-health.sh`           | package.json   | Monitoring système        |

### Scripts d'Analyse (Non référencés mais utiles)

| Script                       | Description                       | Quand l'utiliser       |
| ---------------------------- | --------------------------------- | ---------------------- |
| `analyze-async-errors.sh`    | Analyse erreurs async par fichier | Audit ESLint async     |
| `fix-async-errors.sh`        | Fix automatique erreurs async     | Migration async        |
| `generate-linkme-reports.ts` | Génère rapports LinkMe            | Analyse business       |
| `auth-setup.ts`              | Setup auth Supabase               | Configuration initiale |

---

## 📁 Scripts Claude (.claude/scripts/)

### Hooks Système

| Script                       | Type            | Description                          |
| ---------------------------- | --------------- | ------------------------------------ |
| `statusline.sh`              | Hook UI         | Statusline personnalisée Claude Code |
| `task-completed.sh`          | Hook Event      | Actions post-completion task         |
| `validate-critical-files.sh` | Hook Pre-commit | Validation fichiers critiques        |
| `session-token-report.sh`    | Utilitaire      | Rapport usage tokens session         |

---

## 🎯 Commandes Slash (.claude/commands/)

### Commandes Actives

| Commande        | Fichier           | Description                              |
| --------------- | ----------------- | ---------------------------------------- |
| `/db`           | `db.md`           | Outils Supabase (migrations, RLS, types) |
| `/explore`      | `explore.md`      | Exploration codebase (Serena)            |
| `/fix-warnings` | `fix-warnings.md` | Fix ESLint warnings intelligent          |
| `/implement`    | `implement.md`    | Implémentation feature guidée            |
| `/plan`         | `plan.md`         | Création plan d'implémentation           |
| `/pr`           | `pr.md`           | Création Pull Request guidée             |

### Utilisation Commandes Slash

```bash
# Exemple: Explorer structure auth
/explore "authentication flow in middleware"

# Exemple: Fixer warnings ESLint
/fix-warnings

# Exemple: Créer plan implémentation
/plan "add user settings page"

# Exemple: Créer PR
/pr
```

---

## 🤖 Agents Disponibles (.claude/agents/)

### Agents Spécialisés

| Agent                       | Fichier                        | Spécialité                         |
| --------------------------- | ------------------------------ | ---------------------------------- |
| `database-architect`        | `database-architect.md`        | Migrations Supabase, RLS, triggers |
| `frontend-architect`        | `frontend-architect.md`        | Next.js 15, React, UI patterns     |
| `verone-debug-investigator` | `verone-debug-investigator.md` | Debug bugs, erreurs, comportements |
| `verone-orchestrator`       | `verone-orchestrator.md`       | Orchestration tasks complexes      |

### Invocation Agents

Les agents sont invoqués automatiquement par Claude selon le contexte de la tâche. Vous pouvez aussi les invoquer explicitement via Task tool.

---

## 📋 Règles Appliquées (.claude/rules/)

### Règles par Catégorie

| Catégorie    | Fichier                | Contenu                         |
| ------------ | ---------------------- | ------------------------------- |
| **General**  | `general.md`           | Philosophy, workflow, sécurité  |
| **Frontend** | `frontend/nextjs.md`   | Conventions Next.js 15          |
| **Backend**  | `backend/api.md`       | Route handlers, Server Actions  |
| **Database** | `database/supabase.md` | Migrations, RLS, query patterns |
| **Dev**      | `dev/servers.md`       | Gestion serveurs dev            |
| **Dev**      | `dev/git-workflow.md`  | Workflow Git, feature branches  |

---

## 🔍 Utilisation Recommandée

### Workflow Quotidien

1. **Démarrage** : `pnpm dev:safe` (valide env + démarre)
2. **Développement** : Commits fréquents sur feature branch
3. **Avant Commit** : Pre-commit hooks valident automatiquement (ESLint, type-check)
4. **Avant PR** : Pre-push hooks valident automatiquement (ESLint, type-check)
5. **Tests** : `pnpm test:e2e` (si changements UI)

### Debug & Audit

1. **Erreurs Console** : `pnpm check:console`
2. **Types DB** : `pnpm validate:types`
3. **Composants UI** : `pnpm audit:component`

### Nettoyage

1. **Serveurs** : `pnpm dev:stop`
2. **Caches** : `pnpm dev:clean` ou `pnpm turbo:clean`

---

## ⚠️ Scripts Obsolètes (SUPPRIMÉS)

Ces scripts ont été supprimés lors du nettoyage 2026-01-30 :

- ❌ `fix-async-batch3.py` - Fix async obsolète
- ❌ `parse-eslint-errors.py` - Parser obsolète

---

## 📚 Références

- **CLAUDE.md** : Instructions principales
- **AGENTS.md** : Documentation agents détaillée
- **docs/claude/** : Documentation spécifique Claude
- **.claude/commands/** : Définitions commandes slash
- **.claude/rules/** : Règles comportement

---

## 🧪 Documentation Tests & Validation

### Test Workflow ESLint (NOUVEAU 2026-02-01)

**Objectif** : Valider que Claude suit le workflow fix-warnings.md avant correction massive des 2666 warnings.

| Fichier                              | Usage                                 | Temps  |
| ------------------------------------ | ------------------------------------- | ------ |
| `INDEX-ESLINT-TEST.md`               | ⭐ Navigation complète                | 2 min  |
| `QUICKSTART-TEST-ESLINT.md`          | Guide rapide démarrage                | 2 min  |
| `PROMPT-TEST-ESLINT.txt`             | Prompt copier-coller (test 1 fichier) | 30 sec |
| `PROMPT-CONTINUE-ESLINT.txt`         | Prompt après test validé              | 30 sec |
| `REPONSES-7-QUESTIONS-ESLINT.md`     | FAQ rapide                            | 5 min  |
| `eslint-test-workflow-validation.md` | Documentation complète                | 15 min |

**Démarrage rapide** :

```bash
# Lire guide
cat docs/claude/QUICKSTART-TEST-ESLINT.md

# Copier prompt
cat docs/claude/PROMPT-TEST-ESLINT.txt
# → Coller dans Claude

# Vérifier résultat (après 20-30 min)
pnpm --filter @verone/back-office eslint --quiet <file.tsx>
```

**Questions couvertes** :

1. ✅ Quel prompt exact ?
2. ✅ Claude va établir un plan ?
3. ✅ Claude va consulter MCP Context7 ?
4. ✅ Claude va utiliser MCP Serena ?
5. ✅ Claude va lire CLAUDE.md ?
6. ✅ Claude va suivre le workflow (1 fichier complet) ?
7. ✅ Peut-on tester avant 2666 warnings ?

**Garanties** : Workflow 5 phases (Discovery → Analysis → Planning → Implementation → Validation)

**Temps attendu** : 1-2 jours (50 fichiers × 20 min) vs 4-5 jours (approche ad-hoc)

---

**Dernière mise à jour** : 2026-02-01 (Ajout documentation test ESLint)
