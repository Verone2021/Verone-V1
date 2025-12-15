# PR PLAN - Nettoyage Repository

**Date** : 2025-12-15
**Objectif** : Résoudre toutes les contradictions identifiées par l'audit

---

## PRIORITÉS

| Niveau | Description                   | Deadline       |
| ------ | ----------------------------- | -------------- |
| P0     | Bloque production/déploiement | Immédiat       |
| P1     | Cause confusion majeure       | Cette semaine  |
| P2     | Best practices / hygiène      | Sprint suivant |

---

## PR #1 : Script repo-audit + reports/ ✅ FAIT

**Priorité** : P1 (Outillage)
**Status** : ✅ Complété

**Scope** :

- `scripts/repo-audit.sh` (détection contradictions)
- `reports/README.md`
- `reports/AUDIT-REPO-2025-12-15.md`

**Fichiers** :

```
+ scripts/repo-audit.sh
+ reports/README.md
+ reports/AUDIT-REPO-2025-12-15.md
+ reports/repo-audit-report.md (généré)
```

**Why** : Outillage pour détection future
**Rollback** : `git revert`
**Verify** : `./scripts/repo-audit.sh` retourne exit 0

---

## PR #2 : Fix CLAUDE.md (Branch Strategy)

**Priorité** : P0 (Confusion critique)
**Status** : 🔜 À faire

**Scope** :

- Corriger section "Branch Strategy" : `main` = Production (pas `production-stable`)
- Supprimer références à `production-stable` comme branche de déploiement
- Aligner avec `docs/BRANCHING.md`

**Fichiers** :

```
M CLAUDE.md
```

**Changements spécifiques** :

```diff
- production-stable  → Production Vercel (auto-deploy)
- main              → Staging/Development (tests)
+ main              → Production Vercel (auto-deploy)
+ production        → Legacy (gelée, lecture seule)
```

**Why** : Éviter déploiement sur mauvaise branche
**Rollback** : `git revert <sha>`
**Verify** : `grep -c "production-stable.*Production" CLAUDE.md` retourne 0

---

## PR #3 : Fix senior-stabilization-protocol.md (Co-Authored-By)

**Priorité** : P0 (Bloque Vercel)
**Status** : 🔜 À faire

**Scope** :

- Supprimer `Co-Authored-By: Claude` de la commande exemple
- Garder `🤖 Generated with Claude Code` (autorisé)

**Fichiers** :

```
M .claude/commands/senior-stabilization-protocol.md
```

**Changements spécifiques** :

```diff
  git commit -m "fix(core): [Description du fix]

  🤖 Generated with Claude Code
- Co-Authored-By: Claude <noreply@anthropic.com>"
+ "
```

**Why** : Email invalide bloque Vercel
**Rollback** : `git revert <sha>`
**Verify** : `grep -c "Co-Authored-By.*Claude" .claude/commands/` retourne 0

---

## PR #4 : Archiver mémoires obsolètes

**Priorité** : P1 (Hygiène)
**Status** : 🔜 À faire

**Scope** :

- Supprimer mémoire `vercel-manual-deployment-only` ✅ (déjà fait)
- Archiver `vercel-deployment-status-2025-10-20.md`
- Archiver `vercel-deployment-success-2025-10-20.md`

**Fichiers** :

```
D .serena/memories/vercel-deployment-status-2025-10-20.md
D .serena/memories/vercel-deployment-success-2025-10-20.md
```

**Why** : Éviter consultation de mémoires obsolètes
**Rollback** : Recréer via `write_memory`
**Verify** : `./scripts/repo-audit.sh` ne signale plus M-02

---

## PR #5 : Créer docs/README.md (Index Canon)

**Priorité** : P1 (Navigation)
**Status** : 🔜 À faire

**Scope** :

- Créer index central des docs
- Pointer vers les 3 docs canon
- Lister les catégories de documentation

**Fichiers** :

```
+ docs/README.md
```

**Contenu** :

```markdown
# Documentation Vérone

## Documents Canon (Source de Vérité)

| Sujet           | Document                                                         | Status |
| --------------- | ---------------------------------------------------------------- | ------ |
| Déploiement     | [DEPLOYMENT.md](./DEPLOYMENT.md)                                 | ACTIVE |
| Branches        | [BRANCHING.md](./BRANCHING.md)                                   | ACTIVE |
| GitHub Rulesets | [governance/GITHUB-RULESETS.md](./governance/GITHUB-RULESETS.md) | ACTIVE |

## Catégories

- `architecture/` - Architecture système, composants
- `database/` - Schema, migrations, RLS
- `business-rules/` - Règles métier (93 dossiers)
- `guides/` - Guides développement
- `audit/` - Rapports d'audit
```

**Why** : Point d'entrée unique pour trouver la vérité
**Rollback** : `git revert <sha>`
**Verify** : Fichier existe et liens fonctionnent

---

## PR #6 : Lifecycle headers sur docs canon

**Priorité** : P2 (Best practices)
**Status** : 🔜 À faire

**Scope** :

- Ajouter en-têtes lifecycle aux 3 docs canon

**Fichiers** :

```
M docs/DEPLOYMENT.md
M docs/BRANCHING.md
M docs/governance/GITHUB-RULESETS.md
```

**Format header** :

```yaml
---
status: ACTIVE
canonical: true
last_verified: 2025-12-15
owner: Romeo Dos Santos
---
```

**Why** : Distinguer clairement docs actives vs obsolètes
**Rollback** : `git revert <sha>`
**Verify** : `grep -l "status: ACTIVE" docs/*.md` retourne 3 fichiers

---

## PR #7 : Mettre à jour update-docs.md

**Priorité** : P2 (Maintenance)
**Status** : 🔜 À faire

**Scope** :

- Actualiser liste des mémoires Serena
- Supprimer références aux mémoires supprimées
- Ajouter nouvelles mémoires Dec 2025

**Fichiers** :

```
M .claude/commands/update-docs.md
```

**Why** : Éviter référence à mémoires inexistantes
**Rollback** : `git revert <sha>`
**Verify** : Liste correspond à `mcp__serena__list_memories`

---

## PR #8 : CI docs hygiene (optionnel)

**Priorité** : P2 (Automatisation)
**Status** : 🔜 Optionnel

**Scope** :

- Créer workflow GitHub Actions pour lint docs
- Vérifier liens morts
- Vérifier structure Markdown

**Fichiers** :

```
+ .github/workflows/docs-lint.yml
```

**Contenu exemple** :

```yaml
name: Docs Lint
on:
  pull_request:
    paths: ['docs/**', '*.md']
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: DavidAnson/markdownlint-cli2-action@v18
        with:
          globs: '**/*.md'
```

**Why** : Prévenir dérive future
**Rollback** : Supprimer le fichier workflow
**Verify** : Workflow s'exécute sur PR avec fichiers .md

---

## SÉQUENCE RECOMMANDÉE

```
Semaine 1 (P0 - Urgents)
├── PR #2 : Fix CLAUDE.md branch strategy
└── PR #3 : Fix Co-Authored-By

Semaine 2 (P1 - Important)
├── PR #4 : Archiver mémoires obsolètes
├── PR #5 : Créer docs/README.md
└── PR #7 : Update update-docs.md

Semaine 3 (P2 - Nice to have)
├── PR #6 : Lifecycle headers
└── PR #8 : CI docs lint
```

---

## RISQUES & MITIGATIONS

| PR  | Risque                      | Mitigation                     |
| --- | --------------------------- | ------------------------------ |
| #2  | Confusion si pas communiqué | Annoncer changement à l'équipe |
| #3  | Aucun                       | Changement cosmétique          |
| #4  | Perte info                  | Mémoires sont dans Git history |
| #5  | Maintenance                 | Automatiser via CI             |
| #8  | Faux positifs lint          | Config permissive au début     |

---

## CHECKLIST VALIDATION FINALE

Après toutes les PRs :

- [ ] `./scripts/repo-audit.sh` retourne 0 contradictions critiques
- [ ] CLAUDE.md aligné avec docs canon
- [ ] Aucun Co-Authored-By Claude dans le repo
- [ ] docs/README.md existe et pointe vers canons
- [ ] Mémoires obsolètes archivées
- [ ] (Optionnel) CI docs lint en place

---

**Estimé** : 2-3 semaines pour toutes les PRs
**Owner** : À assigner
