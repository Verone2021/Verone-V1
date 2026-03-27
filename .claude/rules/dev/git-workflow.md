# Git Workflow

## Feature Branch (OBLIGATOIRE)

```bash
git checkout staging && git pull
git checkout -b feat/APP-DOMAIN-NNN-description
# Travailler, commit, push
git push -u origin feat/APP-DOMAIN-NNN-description
# PR via /pr (jamais manuellement)
```

## Format Commit

`[APP-DOMAIN-NNN] type: description` — ex: `[LM-ORD-009] feat: refonte workflow`

## INTERDIT

- Travailler sur `main` ou `staging` directement
- `git push origin main` (bloque par GitHub)
- `--no-verify` sur commit/push
- `git add .` sans verifier ce qui est stage

## Avant Chaque Commit

1. `git diff --staged` — verifier les fichiers
2. `pnpm --filter @verone/[app] type-check` — zero erreurs
3. ESLint sur fichiers modifies — zero erreurs sur nouveau code
4. Commit seulement si tout passe

## Apres Merge staging → main

Rebase staging sur main immediatement :

```bash
git checkout staging && git rebase origin/main && git push --force-with-lease
```
