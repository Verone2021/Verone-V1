---
allowed-tools: Bash(git :*), Bash(gh :*), Bash(pnpm :*), Bash(npm run :*)
description: Create and push PR with auto-generated title and description
---

You are a PR automation tool. Create pull requests with mandatory safety checks.

## INTERDICTIONS ABSOLUES

- **JAMAIS** de `git push origin main` direct
- **JAMAIS** de `Co-Authored-By:` dans les commits
- **JAMAIS** de merge sans validation Vercel
- **JAMAIS** de PR vers main (toujours `--base staging`)
- **JAMAIS** `git push --force` nu — toujours `--force-with-lease`
- **JAMAIS** `gh pr merge --admin` pour bypasser un check fail
- Si un check échoue → **STOP** et corriger avant de continuer

## RÉFÉRENCE OBLIGATOIRE

- `.claude/rules/no-worktree-solo.md` — workflow solo, JAMAIS `git worktree add`
- `.claude/rules/branch-strategy.md` — checklist 4 questions avant nouvelle branche

## Workflow Complet

### PHASE 1 : Vérification État Local

```bash
# 1. Vérifier que le repo est clean
git status --porcelain
```

→ Si output non vide (fichiers non commités) → **STOP** "Fichiers non commités, utilise /commit d'abord"

```bash
# 2. Vérifier fichiers parasites trackés
git ls-files | grep -E '\.(swp|swo)$|\.DS_Store|tests/reports/|\.playwright-mcp/'
```

→ Si fichiers trouvés → **STOP** "Fichiers parasites détectés, ajouter au .gitignore et git rm --cached"

### PHASE 2 : Synchronisation Remote (Rebase précoce)

```bash
# 3. Vérifier les autres PRs ouvertes (visibilité)
gh pr list --state open --base staging --json number,title,headRefName
```

→ Si une autre PR ouverte couvre le même sujet → commit dessus plutôt qu'une nouvelle (cf. `branch-strategy.md`)

```bash
# 4. Fetch et rebase sur staging à jour
git fetch origin staging
git rebase origin/staging
```

→ Si conflit : résoudre avant push (5 min vs 30 min plus tard)
→ Après rebase, push avec `--force-with-lease`

```bash
# 5. Vérifier l'état
git status -sb
```

```bash
# 6. Voir les commits qui vont partir
git log --oneline origin/staging..HEAD
```

```bash
# 7. Voir les fichiers touchés (pour la section "Fichiers touchés" du body PR)
git diff --stat origin/staging...HEAD
```

### PHASE 3 : Gate Checks (OBLIGATOIRE)

```bash
# 5. Type-check
pnpm run type-check
```

→ Si erreur → **STOP** + afficher les erreurs TypeScript

```bash
# 6. Lint
pnpm run lint
```

→ Si erreur → **STOP** + afficher les erreurs ESLint

```bash
# 7. Build (au minimum back-office)
pnpm run build
```

→ Si erreur → **STOP** + afficher l'erreur de build

### PHASE 4 : Création Branche et Push

```bash
# 8. Créer branche depuis état actuel (si sur main ou staging)
git branch --show-current
```

→ Si sur `main` ou `staging` → Créer branche : `git switch -c <type>/<description>-<date>`

- Exemple : `chore/cleanup-docs-20261216`

→ **JAMAIS `git worktree add`** — workflow solo, voir `.claude/rules/no-worktree-solo.md`.

```bash
# 9. Push la branche avec --force-with-lease (jamais --force nu)
git push -u --force-with-lease origin HEAD
```

### PHASE 5 : Création PR

```bash
# 10. Voir ce qui part en PR (pour la section "Fichiers touchés")
git diff --stat origin/staging...HEAD
```

```bash
# 11. Créer la PR (DRAFT par défaut — promote ready quand le bloc est complet)
gh pr create --draft --base staging --title "<type>: <description>" --body "$(cat <<'EOF'
## Fichiers touchés
- path/to/file1.ts
- path/to/file2.tsx
- nouveau: path/to/file3.tsx

## Summary
- [changement principal]
- [changements secondaires]

## Checks
- [ ] Type-check: PASSED
- [ ] Lint: PASSED
- [ ] Build: PASSED

## How to Validate
1. Review les fichiers modifiés
2. Attendre le status check Vercel
3. Merge si tout est vert
EOF
)"
```

→ Promouvoir en ready quand le bloc est complet : `gh pr ready <num>` (après ultime rebase + type-check)

### PHASE 6 : Fin

- Afficher le lien de la PR
- **NE PAS MERGER** - Attendre validation humaine + Vercel
- Dire : "PR créée. Attends le status check Vercel avant de merger."

## Types de Branche

| Préfixe     | Usage                   |
| ----------- | ----------------------- |
| `feature/`  | Nouvelle fonctionnalité |
| `fix/`      | Correction de bug       |
| `chore/`    | Maintenance, cleanup    |
| `hotfix/`   | Correction urgente      |
| `refactor/` | Refactoring             |

## Stop Conditions Résumé

| Situation                       | Action                         |
| ------------------------------- | ------------------------------ |
| Fichiers non commités           | STOP → "utilise /commit"       |
| Fichiers parasites (.swp, etc.) | STOP → corriger .gitignore     |
| Branche behind origin/staging   | STOP → "git pull --rebase"     |
| Type-check échoue               | STOP → afficher erreurs TS     |
| Lint échoue                     | STOP → afficher erreurs ESLint |
| Build échoue                    | STOP → afficher erreur build   |
| PR existe déjà                  | Afficher URL existante         |

## Ce que cette commande NE FAIT PAS

- Ne merge pas la PR (attendre Vercel + review)
- Ne force push jamais
- Ne skip pas les checks
