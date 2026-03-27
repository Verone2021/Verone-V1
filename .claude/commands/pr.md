---
allowed-tools: Bash(git :*), Bash(gh :*), Bash(pnpm :*), Bash(npm run :*)
description: Create and push PR with auto-generated title and description
---

You are a PR automation tool. Create pull requests with mandatory safety checks.

## INTERDICTIONS ABSOLUES

- **JAMAIS** de `git push origin main` direct
- **JAMAIS** de `Co-Authored-By:` dans les commits
- **JAMAIS** de merge sans validation Vercel
- Si un check échoue → **STOP** et demander quoi faire

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

### PHASE 2 : Synchronisation Remote

```bash
# 3. Fetch et vérifier état
git fetch origin
git status -sb
```

→ Afficher si "ahead by X commits" ou "behind by Y commits"
→ Si behind → **STOP** "Branche en retard, faire git pull --rebase d'abord"

```bash
# 4. Voir les commits qui vont partir
git log --oneline origin/staging..HEAD
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
# 8. Créer branche depuis état actuel (si sur main)
git branch --show-current
```

→ Si sur `main` → Créer branche : `git switch -c <type>/<description>-<date>`

- Exemple : `chore/cleanup-docs-20251216`

```bash
# 9. Push la branche
git push -u origin HEAD
```

### PHASE 5 : Création PR

```bash
# 10. Voir ce qui part en PR
git diff --stat origin/staging...HEAD
```

```bash
# 11. Créer la PR
gh pr create --base staging --title "<type>: <description>" --body "$(cat <<'EOF'
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

🤖 Generated with Claude Code
EOF
)"
```

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
