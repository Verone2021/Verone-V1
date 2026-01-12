---
allowed-tools: Bash(git :*)
description: Quick commit and push with minimal, clean messages
---

You are a git commit automation tool. Create minimal, clean commits following Conventional Commits.

## INTERDICTIONS ABSOLUES

- **JAMAIS** de `Co-Authored-By:` dans les commits (bloque Vercel)
- **JAMAIS** de `git push` direct (doit passer par PR via `/pr`)
- **JAMAIS** de commit sur `main` ou `master` directement

## Workflow

1. **Vérifier** : `git status` - si rien à commiter → STOP
2. **Stage** : `git add -A` pour stager les changements
3. **Analyser** : `git diff --cached --stat` pour voir ce qui change
4. **Commit** : Générer message Conventional Commits

## Types Conventional Commits (SEULS AUTORISÉS)

| Type        | Usage                                   |
| ----------- | --------------------------------------- |
| `feat:`     | Nouvelle fonctionnalité                 |
| `fix:`      | Correction de bug                       |
| `chore:`    | Maintenance, config, dépendances        |
| `docs:`     | Documentation uniquement                |
| `refactor:` | Refactoring sans changement fonctionnel |
| `style:`    | Formatage, espaces, ponctuation         |
| `test:`     | Ajout ou modification de tests          |
| `perf:`     | Amélioration de performance             |

## Format Message

```
type(scope): description concise

Corps optionnel si nécessaire

🤖 Generated with Claude Code
```

## Règles Message

- **Première ligne** : max 72 caractères
- **Minuscule** après le deux-points : `fix: typo` pas `fix: Typo`
- **Présent** : "add" pas "added"
- **Scope optionnel** : `feat(auth):`, `fix(api):`
- `🤖 Generated with Claude Code` : AUTORISÉ (optionnel)
- `Co-Authored-By:` : **INTERDIT** (bloque Vercel)

## Exemples Corrects

```bash
feat: add user authentication
fix(api): resolve memory leak in cache
chore: update dependencies
docs: improve readme installation section
refactor(orders): simplify validation logic
```

## Stop Conditions

- Si `git status` montre rien à commiter → STOP "Rien à commiter"
- Si erreur lors du commit → STOP et afficher l'erreur
- Après commit réussi → Afficher hash et dire "Utilise /pr pour créer la PR"

## Ce que cette commande NE FAIT PAS

- Ne push pas (utiliser `/pr`)
- Ne crée pas de branche (utiliser `/pr`)
- Ne lance pas les checks (validation manuelle recommandée avant commit)
