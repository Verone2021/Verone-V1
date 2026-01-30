# Strategie Git & Pull Requests

Documentation detaillee du workflow Git pour le projet Verone.

---

## Trunk-Based Development (TBD)

**Principe** : Short-lived feature branches, integration rapide.

**Reference** : [Trunk-based Development](https://trunkbaseddevelopment.com/continuous-review/)

---

## Workflow Standard

### 1. Creer Feature Branch

```bash
git checkout -b feat/APP-DOMAIN-NNN-description
# Exemples:
# - feat/BO-PARAMS-003-settings-menu
# - fix/LM-ORD-042-validation-bug
```

### 2. Commits Frequents (Save Points)

```bash
# Commits petits et atomiques
git add .
git commit -m "[BO-PARAMS-003] step 1: add settings icon"
git push

git commit -m "[BO-PARAMS-003] step 2: create submenu"
git push

git commit -m "[BO-PARAMS-003] step 3: add tests"
git push

# Chaque push = backup + CI check
```

**Avantages** :

- Backup continu sur GitHub
- CI valide chaque etape
- Facile de revenir en arriere
- Historique clair des etapes

### 3. UNE PR a la Fin (Tous les Commits)

```bash
# Quand feature complete :
gh pr create \
  --title "[BO-PARAMS-003] feat: add settings menu with tests" \
  --body "
## Summary
- Added settings icon to sidebar
- Created submenu with 4 items
- Added comprehensive Playwright tests

## Test Plan
- [x] Type-check passes
- [x] Build succeeds
- [x] E2E tests pass
- [x] Manual testing on localhost:3000

## Commits
- step 1: add settings icon
- step 2: create submenu
- step 3: add tests
"
```

**Regle d'or** : 1 feature = 1 branche = N commits = **1 PR**

---

## Format de Commit Requis

```
[APP-DOMAIN-NNN] type: description courte

Details optionnels...
```

**Exemples** :

- `[LM-ORD-009] feat: refonte workflow order form`
- `[BO-DASH-001] fix: cache invalidation`
- `[NO-TASK] chore: update dependencies`

**Validation automatique** : Hook PreToolUse bloque si format invalide

---

## Revue de PR

**Delai cible** : < 1 heure (idealement quelques minutes)

**Checklist automatique** :

- [ ] CI passe (tests, build, type-check)
- [ ] Pas de conflits
- [ ] Format commits respecte
- [ ] Tests ajoutes si nouvelle feature

**Checklist humaine** :

- [ ] Code review (logique, securite)
- [ ] Validation fonctionnelle
- [ ] Approbation deploiement si prod

---

## Merge Strategy

```bash
# Pour feature branches (User merge apres validation)
gh pr merge 123 --squash  # Squash commits en 1

# Pour hotfix critique (apres validation)
gh pr merge 124 --merge --admin  # Preserve commits
```

**Jamais de force push sur main** : Protege en production

---

## Branches

| Branche  | Usage         |
| -------- | ------------- |
| `main`   | Production    |
| `feat/*` | Features      |
| `fix/*`  | Bug fixes     |
| `docs/*` | Documentation |

---

## Task Management (.tasks/)

### Structure

```
.tasks/
├── LM-ORD-009.md        # 1 fichier = 1 task
├── BO-DASH-001.md
├── INDEX.md             # Genere auto (gitignored)
└── TEMPLATE.md          # Template
```

### Creer nouvelle task

```bash
cp .tasks/TEMPLATE.md .tasks/LM-ORD-XXX.md
# Editer frontmatter YAML
# git add .tasks/LM-ORD-XXX.md
```

### Generer index

```bash
.tasks/generate-index.sh
cat .tasks/INDEX.md
```

---

## References

- [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Trunk-based Development](https://trunkbaseddevelopment.com/continuous-review/)
